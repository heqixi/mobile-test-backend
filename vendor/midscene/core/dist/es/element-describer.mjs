import { assert } from "@midscene/shared/utils";
import { createScreenshotBoundUIContext } from "./agent/utils.mjs";
import { buildDetailedLocateParam } from "./yaml/utils.mjs";
const distanceOfTwoPoints = (p1, p2)=>{
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    return Math.round(Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2));
};
const includedInRect = (point, rect)=>{
    const [x, y] = point;
    const { left, top, width, height } = rect;
    return x >= left && x <= left + width && y >= top && y <= top + height;
};
const buildLocateValidatorResult = (expectCenter, located, verifyLocateOption)=>{
    const distance = distanceOfTwoPoints(expectCenter, located.center);
    const included = includedInRect(expectCenter, located.rect);
    const pass = distance <= (verifyLocateOption?.centerDistanceThreshold || 20) || included;
    return {
        pass,
        rect: located.rect,
        center: located.center,
        centerDistance: distance,
        includedInRect: included
    };
};
function assertPositiveSize(size, label) {
    assert(size && Number.isFinite(size.width) && Number.isFinite(size.height) && size.width > 0 && size.height > 0, `${label} must include positive width and height`);
}
const mapPointToScreenshotSpace = (center, screenshotSize, opt)=>{
    const coordinateSpace = opt.coordinateSpace || 'screenshot';
    if ('screenshot' === coordinateSpace) return center;
    assertPositiveSize(opt.logicalSize, 'logicalSize is required when coordinateSpace is logical');
    return [
        center[0] * screenshotSize.width / opt.logicalSize.width,
        center[1] * screenshotSize.height / opt.logicalSize.height
    ];
};
const createScreenshotBoundLocatorContext = async (center, opt)=>{
    const screenshotContext = opt?.screenshotBase64 ? await createScreenshotBoundUIContext(opt.screenshotBase64, opt) : void 0;
    const targetCenter = screenshotContext ? mapPointToScreenshotSpace(center, screenshotContext.shotSize, opt || {}) : center;
    return {
        screenshotContext,
        locateOpt: screenshotContext ? {
            uiContext: screenshotContext
        } : void 0,
        targetCenter
    };
};
async function verifyLocator(runtime, prompt, locateOpt, expectCenter, verifyLocateOption) {
    return locateAndVerify(runtime, prompt, expectCenter, {
        centerDistanceThreshold: verifyLocateOption?.centerDistanceThreshold,
        deepLocate: verifyLocateOption?.deepLocate,
        uiContext: locateOpt?.uiContext
    });
}
function applyLocatorVerifyFn(locatorVerifyFn, input) {
    if (!locatorVerifyFn) return input.verifyResult;
    const customResult = locatorVerifyFn(input);
    if ('boolean' == typeof customResult) return {
        ...input.verifyResult,
        pass: customResult
    };
    return customResult;
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
async function describeElementAtPoint(runtime, center, opt) {
    const { verifyPrompt = true, retryLimit = 3 } = opt || {};
    const { screenshotContext, locateOpt, targetCenter } = await createScreenshotBoundLocatorContext(center, opt);
    let success = false;
    let retryCount = 0;
    let resultPrompt = '';
    const autoRetryDeepDescribe = opt?.deepDescribe === void 0;
    const autoRetryDeepLocate = opt?.deepLocate === void 0;
    let deepDescribe = opt?.deepDescribe || false;
    let deepLocate = opt?.deepLocate || false;
    let verifyResult;
    let lastError;
    let failureStage;
    while(!success && retryCount < retryLimit){
        if (retryCount >= 1 && autoRetryDeepDescribe) deepDescribe = true;
        if (retryCount >= 1 && autoRetryDeepLocate) deepLocate = true;
        const describeModelRuntime = runtime.describeModelRuntime;
        const locateModelRuntime = runtime.locateModelRuntime;
        const retryRuntime = {
            ...runtime,
            describeModelRuntime,
            locateModelRuntime
        };
        const describeOpt = screenshotContext ? {
            deepDescribe,
            context: screenshotContext
        } : {
            deepDescribe
        };
        let text;
        try {
            text = await retryRuntime.service.describe(targetCenter, retryRuntime.describeModelRuntime, describeOpt);
        } catch (error) {
            return {
                prompt: resultPrompt,
                deepLocate,
                deepDescribe,
                verifyResult,
                success: false,
                error: errorMessage(error),
                failureStage: 'describe'
            };
        }
        if (!text.description) return {
            prompt: resultPrompt,
            deepLocate,
            deepDescribe,
            verifyResult,
            success: false,
            error: `failed to describe element at [${targetCenter}]`,
            failureStage: 'describe'
        };
        resultPrompt = text.description;
        if (!verifyPrompt) {
            opt?.onProgress?.({
                prompt: resultPrompt,
                deepDescribe,
                deepLocate
            });
            success = true;
            break;
        }
        try {
            const candidateVerifyResult = await verifyLocator(retryRuntime, resultPrompt, locateOpt, targetCenter, {
                ...opt,
                deepLocate
            });
            verifyResult = applyLocatorVerifyFn(opt?.locatorVerifyFn, {
                prompt: resultPrompt,
                expectCenter: targetCenter,
                retryCount,
                verifyResult: candidateVerifyResult
            });
            opt?.onProgress?.({
                prompt: resultPrompt,
                deepDescribe,
                deepLocate,
                verifyResult
            });
            if (verifyResult.pass) {
                success = true;
                break;
            }
            lastError = void 0;
            failureStage = 'verify';
        } catch (error) {
            lastError = errorMessage(error);
            failureStage = 'verify';
            opt?.onProgress?.({
                prompt: resultPrompt,
                deepDescribe,
                deepLocate
            });
        }
        retryCount++;
    }
    return {
        prompt: resultPrompt,
        deepLocate,
        deepDescribe,
        verifyResult,
        success,
        error: success || !verifyPrompt ? void 0 : lastError || 'describeElementAtPoint verify failed',
        failureStage: success ? void 0 : failureStage
    };
}
async function verifyElementDescriptionAtPoint(runtime, description, center, opt) {
    assert(description?.trim(), "description must not be empty");
    const { locateOpt, targetCenter } = await createScreenshotBoundLocatorContext(center, opt);
    return verifyLocator(runtime, description, locateOpt, targetCenter, opt);
}
async function locateAndVerify(runtime, description, center, opt) {
    assert(description?.trim(), "description must not be empty");
    const { screenshotContext, targetCenter } = await createScreenshotBoundLocatorContext(center, opt);
    const context = opt?.uiContext || screenshotContext;
    const locateParam = buildDetailedLocateParam(description, {
        cacheable: opt?.cacheable,
        deepLocate: opt?.deepLocate,
        xpath: opt?.xpath
    });
    assert(locateParam, 'cannot get locate param for service locate');
    const locateResult = await runtime.service.locate(locateParam, context ? {
        context
    } : {}, runtime.locateModelRuntime, opt?.abortSignal);
    assert(locateResult.element, `Element not found: ${description}`);
    const verifyResult = buildLocateValidatorResult(targetCenter, locateResult.element, opt);
    return verifyResult;
}
export { describeElementAtPoint, verifyElementDescriptionAtPoint, verifyLocator };

//# sourceMappingURL=element-describer.mjs.map