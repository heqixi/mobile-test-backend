import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pixelBboxToRect } from "../ai-model/workflows/inspect/locate-result-rect.mjs";
import { ScreenshotItem } from "../screenshot-item.mjs";
import { uploadTestInfoToServer } from "../utils.mjs";
import { MIDSCENE_REPORT_QUIET, MIDSCENE_REPORT_TAG_NAME, globalConfigManager } from "@midscene/shared/env";
import { generateElementByRect } from "@midscene/shared/extractor";
import { convertImgBufferToJpeg, createImgBase64ByFormat, imageInfoOfBase64, parseBase64, resizeImgBase64 } from "@midscene/shared/img";
import { getDebug } from "@midscene/shared/logger";
import { assert, ifInBrowser, logMsg, uuid } from "@midscene/shared/utils";
import dayjs from "dayjs";
import { debug as external_task_cache_mjs_debug } from "./task-cache.mjs";
const agentDebug = getDebug('agent');
const screenshotDataUrlPattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i;
const inferBase64ImageFormat = (base64Body)=>{
    if (base64Body.startsWith('iVBORw0KGgo')) return 'png';
    return 'jpeg';
};
const normalizeScreenshotBase64 = (screenshotBase64)=>{
    const trimmedBase64 = screenshotBase64.trim();
    if (screenshotDataUrlPattern.test(trimmedBase64)) return trimmedBase64;
    const base64Body = trimmedBase64.replace(/\s/g, '');
    assert(base64Body, 'screenshotBase64 must include image data');
    return createImgBase64ByFormat(inferBase64ImageFormat(base64Body), base64Body);
};
const legacyScrollTypeMap = {
    once: 'singleAction',
    untilBottom: 'scrollToBottom',
    untilTop: 'scrollToTop',
    untilRight: 'scrollToRight',
    untilLeft: 'scrollToLeft'
};
const normalizeScrollType = (scrollType)=>{
    if (!scrollType) return;
    if (scrollType in legacyScrollTypeMap) return legacyScrollTypeMap[scrollType];
    return scrollType;
};
async function commonContextParser(interfaceInstance, _opt) {
    const debug = getDebug('commonContextParser');
    assert(interfaceInstance, 'interfaceInstance is required');
    debug("Getting interface description");
    const description = interfaceInstance.describe?.() || '';
    debug("Interface description end");
    debug('Uploading test info to server');
    uploadTestInfoToServer({
        testUrl: description,
        serverUrl: _opt.uploadServerUrl
    });
    debug('UploadTestInfoToServer end');
    debug('will get size');
    const interfaceSize = await interfaceInstance.size();
    const { width: logicalWidth, height: logicalHeight } = interfaceSize;
    if (interfaceSize.dpr) console.warn('Warning: return value of interface.size() include a dpr property, which is not expected and ignored. ');
    if (!Number.isFinite(logicalWidth) || !Number.isFinite(logicalHeight)) throw new Error(`Invalid interface size: width and height must be finite numbers. Received width: ${logicalWidth}, height: ${logicalHeight}`);
    if (logicalWidth <= 0 || logicalHeight <= 0) throw new Error(`Invalid interface size: width and height must be positive numbers. Received width: ${logicalWidth}, height: ${logicalHeight}`);
    debug(`size: ${logicalWidth}x${logicalHeight}`);
    const screenshotBase64 = await interfaceInstance.screenshotBase64();
    const screenshotCapturedAt = Date.now();
    assert(screenshotBase64, 'screenshotBase64 is required');
    debug('will get screenshot dimensions');
    const { width: imgWidth, height: imgHeight } = await imageInfoOfBase64(screenshotBase64);
    if (!Number.isFinite(imgWidth) || !Number.isFinite(imgHeight)) throw new Error(`Invalid screenshot dimensions: width and height must be finite numbers. Received width: ${imgWidth}, height: ${imgHeight}`);
    if (imgWidth <= 0 || imgHeight <= 0) throw new Error(`Invalid screenshot dimensions: width and height must be positive numbers. Received width: ${imgWidth}, height: ${imgHeight}`);
    debug('screenshot dimensions', imgWidth, 'x', imgHeight);
    const logicalIsPortrait = logicalWidth < logicalHeight;
    const screenshotIsPortrait = imgWidth < imgHeight;
    let finalLogicalWidth = logicalWidth;
    if (logicalIsPortrait !== screenshotIsPortrait) {
        debug(`Orientation mismatch detected: logical size ${logicalWidth}x${logicalHeight} (${logicalIsPortrait ? 'portrait' : 'landscape'}) vs screenshot ${imgWidth}x${imgHeight} (${screenshotIsPortrait ? 'portrait' : 'landscape'}). Swapping logical dimensions.`);
        finalLogicalWidth = logicalHeight;
    }
    const userShrinkFactor = _opt.screenshotShrinkFactor ?? 1;
    if (!Number.isFinite(userShrinkFactor) || userShrinkFactor < 1) throw new Error(`Invalid screenshotShrinkFactor: must be a finite number >= 1. Received: ${userShrinkFactor}`);
    const dpr = imgWidth / finalLogicalWidth;
    debug('calculated dpr:', dpr);
    const shrunkShotToLogicalRatio = dpr / userShrinkFactor;
    debug('shrunkShotToLogicalRatio', shrunkShotToLogicalRatio);
    if (1 !== userShrinkFactor) {
        const targetWidth = Math.round(imgWidth / userShrinkFactor);
        const targetHeight = Math.round(imgHeight / userShrinkFactor);
        debug(`Applying screenshot shrink factor: ${userShrinkFactor} (physical: ${imgWidth}x${imgHeight} -> target: ${targetWidth}x${targetHeight})`);
        const resizedBase64 = await resizeImgBase64(screenshotBase64, {
            width: targetWidth,
            height: targetHeight
        });
        return {
            shotSize: {
                width: targetWidth,
                height: targetHeight
            },
            deprecatedDpr: dpr,
            screenshot: ScreenshotItem.create(resizedBase64, screenshotCapturedAt),
            shrunkShotToLogicalRatio
        };
    }
    {
        let outputScreenshotBase64 = screenshotBase64;
        const { mimeType, body } = parseBase64(screenshotBase64);
        if ('image/png' === mimeType.toLowerCase()) {
            const jpegBuffer = await convertImgBufferToJpeg(Buffer.from(body, 'base64'), 90);
            outputScreenshotBase64 = createImgBase64ByFormat('jpeg', jpegBuffer.toString('base64'));
        }
        return {
            shotSize: {
                width: imgWidth,
                height: imgHeight
            },
            deprecatedDpr: dpr,
            screenshot: ScreenshotItem.create(outputScreenshotBase64, screenshotCapturedAt),
            shrunkShotToLogicalRatio
        };
    }
}
async function createScreenshotBoundUIContext(screenshotBase64, opt) {
    const normalizedScreenshotBase64 = normalizeScreenshotBase64(screenshotBase64);
    const actualScreenshotSize = await imageInfoOfBase64(normalizedScreenshotBase64);
    if (opt.screenshotSize && (opt.screenshotSize.width !== actualScreenshotSize.width || opt.screenshotSize.height !== actualScreenshotSize.height)) agentDebug('describeElementAtPoint screenshotSize mismatch, use actual size', {
        provided: opt.screenshotSize,
        actual: actualScreenshotSize
    });
    return {
        screenshot: ScreenshotItem.create(normalizedScreenshotBase64, Date.now()),
        shotSize: actualScreenshotSize,
        shrunkShotToLogicalRatio: 1,
        _isFrozen: true
    };
}
function getReportFileName(tag = 'web') {
    const reportTagName = globalConfigManager.getEnvConfigValue(MIDSCENE_REPORT_TAG_NAME);
    const dateTimeInFileName = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const uniqueId = uuid().substring(0, 8);
    return `${reportTagName || tag}-${dateTimeInFileName}-${uniqueId}`;
}
function printReportMsg(filepath) {
    if (globalConfigManager.getEnvConfigInBoolean(MIDSCENE_REPORT_QUIET)) return;
    logMsg(`Midscene - report file updated: ${filepath}`);
}
function normalizeFilePaths(files, options = {}) {
    const { fileExists = existsSync, isInBrowser = ifInBrowser, resolvePath = resolve, wslDistroName = process.env.WSL_DISTRO_NAME, cwd = process.cwd() } = options;
    if (isInBrowser) throw new Error('File chooser is not supported in browser environment');
    return files.map((file)=>{
        const absolutePath = resolvePath(file);
        if (!fileExists(absolutePath)) throw new Error(`File not found: ${file}. Resolved to: ${absolutePath}. Current working directory: ${cwd}`);
        if (!wslDistroName) return absolutePath;
        const wslMount = absolutePath.match(/^\/mnt\/([a-z])\//);
        if (wslMount) return `${wslMount[1].toUpperCase()}:\\${absolutePath.slice(7).replace(/\//g, '\\')}`;
        return `\\\\wsl$\\${wslDistroName}${absolutePath.replace(/\//g, '\\')}`;
    });
}
function isPixelBbox(value) {
    return Array.isArray(value) && 4 === value.length && value.every((item)=>'number' == typeof item && Number.isFinite(item));
}
function ifPlanLocateParamHasLocatedPixelBbox(planLocateParam) {
    return isPixelBbox(planLocateParam.locatedPixelBbox);
}
function matchElementFromPlan(planLocateParam) {
    if (!planLocateParam) return;
    const rect = pixelBboxToRect(planLocateParam.locatedPixelBbox);
    const element = generateElementByRect(rect, 'string' == typeof planLocateParam.prompt ? planLocateParam.prompt : planLocateParam.prompt?.prompt || '');
    return element;
}
async function matchElementFromCache(context, cacheEntry, cachePrompt, cacheable) {
    if (!cacheEntry) return;
    if (false === cacheable) return void external_task_cache_mjs_debug('cache disabled for prompt: %s', cachePrompt);
    if (!context.taskCache?.isCacheResultUsed) return;
    if (!context.interfaceInstance.rectMatchesCacheFeature) return void external_task_cache_mjs_debug('interface does not implement rectMatchesCacheFeature, skip cache');
    try {
        const rect = await context.interfaceInstance.rectMatchesCacheFeature(cacheEntry);
        const element = {
            center: [
                Math.round(rect.left + rect.width / 2),
                Math.round(rect.top + rect.height / 2)
            ],
            rect,
            description: 'string' == typeof cachePrompt ? cachePrompt : cachePrompt.prompt || ''
        };
        external_task_cache_mjs_debug('cache hit, prompt: %s', cachePrompt);
        return element;
    } catch (error) {
        external_task_cache_mjs_debug('rectMatchesCacheFeature error: %s', error);
        return;
    }
}
const getMidsceneVersion = ()=>"1.10.6";
const parsePrompt = (prompt)=>{
    if ('string' == typeof prompt) return {
        textPrompt: prompt,
        multimodalPrompt: void 0
    };
    return {
        textPrompt: prompt.prompt,
        multimodalPrompt: prompt.images ? {
            images: prompt.images,
            convertHttpImage2Base64: !!prompt.convertHttpImage2Base64
        } : void 0
    };
};
const transformLogicalElementToScreenshot = (element, shrunkShotToLogicalRatio)=>{
    if (1 === shrunkShotToLogicalRatio) return element;
    return {
        ...element,
        center: [
            Math.round(element.center[0] * shrunkShotToLogicalRatio),
            Math.round(element.center[1] * shrunkShotToLogicalRatio)
        ],
        rect: {
            ...element.rect,
            left: Math.round(element.rect.left * shrunkShotToLogicalRatio),
            top: Math.round(element.rect.top * shrunkShotToLogicalRatio),
            width: Math.round(element.rect.width * shrunkShotToLogicalRatio),
            height: Math.round(element.rect.height * shrunkShotToLogicalRatio)
        }
    };
};
const transformLogicalRectToScreenshotRect = (rect, shrunkShotToLogicalRatio)=>{
    if (1 === shrunkShotToLogicalRatio) return rect;
    return {
        ...rect,
        left: Math.round(rect.left * shrunkShotToLogicalRatio),
        top: Math.round(rect.top * shrunkShotToLogicalRatio),
        width: Math.round(rect.width * shrunkShotToLogicalRatio),
        height: Math.round(rect.height * shrunkShotToLogicalRatio)
    };
};
export { commonContextParser, createScreenshotBoundUIContext, getMidsceneVersion, getReportFileName, ifPlanLocateParamHasLocatedPixelBbox, isPixelBbox, matchElementFromCache, matchElementFromPlan, normalizeFilePaths, normalizeScrollType, parsePrompt, printReportMsg, transformLogicalElementToScreenshot, transformLogicalRectToScreenshotRect };

//# sourceMappingURL=utils.mjs.map