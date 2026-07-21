"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    default: ()=>Service
});
const errors_js_namespaceObject = require("../ai-model/errors.js");
const inspect_js_namespaceObject = require("../ai-model/inspect.js");
const describe_js_namespaceObject = require("../ai-model/prompt/describe.js");
const index_js_namespaceObject = require("../ai-model/service-caller/index.js");
const external_types_js_namespaceObject = require("../types.js");
const img_namespaceObject = require("@midscene/shared/img");
const logger_namespaceObject = require("@midscene/shared/logger");
const utils_namespaceObject = require("@midscene/shared/utils");
const external_utils_js_namespaceObject = require("./utils.js");
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
const debug = (0, logger_namespaceObject.getDebug)('ai:service');
class Service {
    async locate(query, opt, modelRuntime, abortSignal) {
        const { config: modelConfig } = modelRuntime;
        const queryPrompt = 'string' == typeof query ? query : query.prompt;
        (0, utils_namespaceObject.assert)(queryPrompt, 'query is required for locate');
        (0, utils_namespaceObject.assert)('object' == typeof query, 'query should be an object for locate');
        if (!modelConfig.modelFamily) throw new Error(errors_js_namespaceObject.defaultModelFamilyRequiredForLocateMessage);
        const context = opt?.context || await this.contextRetrieverFn();
        const searchArea = await this.resolveLocateSearchArea({
            query,
            queryPrompt,
            opt,
            context,
            modelRuntime,
            abortSignal
        });
        const startTime = Date.now();
        const { parseResult, rect, rawResponse, rawChoiceMessage, usage, reasoning_content } = await (0, inspect_js_namespaceObject.AiLocateElement)({
            context,
            targetElementDescription: queryPrompt,
            searchConfig: searchArea.config,
            modelRuntime,
            abortSignal
        });
        const timeCost = Date.now() - startTime;
        const taskInfo = {
            ...this.taskInfo ? this.taskInfo : {},
            durationMs: timeCost,
            rawResponse,
            rawChoiceMessage,
            formatResponse: parseResult,
            usage,
            searchArea: searchArea.trace.sourceRect,
            searchAreaRawResponse: searchArea.trace.rawResponse,
            searchAreaRawChoiceMessage: searchArea.trace.rawChoiceMessage,
            searchAreaUsage: searchArea.trace.usage,
            reasoning_content
        };
        let errorLog;
        if (parseResult.errors?.length) errorLog = `failed to locate element: \n${parseResult.errors.join('\n')}`;
        const dumpData = {
            type: 'locate',
            userQuery: {
                element: queryPrompt
            },
            matchedRect: rect,
            data: null,
            taskInfo,
            deepLocate: !!searchArea.trace.sourceRect,
            error: errorLog
        };
        const element = parseResult.element;
        const dump = (0, external_utils_js_namespaceObject.createServiceDump)({
            ...dumpData,
            matchedElement: element ? [
                element
            ] : []
        });
        if (errorLog) throw new external_types_js_namespaceObject.ServiceError(errorLog, dump);
        if (element) return {
            element: {
                center: element.center,
                rect: element.rect,
                description: element.description
            },
            rect,
            dump
        };
        return {
            element: null,
            rect,
            dump
        };
    }
    async resolveLocateSearchArea(options) {
        const { query, queryPrompt, opt, context, modelRuntime, abortSignal } = options;
        const { adapter } = modelRuntime;
        const hasPlanLocatedElement = !!opt?.planLocatedElement?.rect;
        if (!query.deepLocate) return {
            trace: {}
        };
        if (hasPlanLocatedElement) {
            const config = await (0, inspect_js_namespaceObject.buildSearchAreaConfig)({
                context,
                baseRect: opt.planLocatedElement.rect
            });
            return {
                config,
                trace: {
                    sourceRect: config.sourceRect,
                    rawResponse: JSON.stringify({
                        source: 'plan-located-element',
                        rect: opt.planLocatedElement.rect
                    })
                }
            };
        }
        if (adapter.locate.supportsSearchArea) {
            const searchAreaResponse = await (0, inspect_js_namespaceObject.AiLocateSection)({
                context,
                sectionDescription: queryPrompt,
                modelRuntime,
                abortSignal
            });
            const { searchAreaConfig } = searchAreaResponse;
            (0, utils_namespaceObject.assert)(searchAreaConfig, `cannot find search area for "${queryPrompt}"${searchAreaResponse.error ? `: ${searchAreaResponse.error}` : ''}`);
            return {
                config: searchAreaConfig,
                trace: {
                    sourceRect: searchAreaConfig.sourceRect,
                    rawResponse: searchAreaResponse.rawResponse,
                    rawChoiceMessage: searchAreaResponse.rawChoiceMessage,
                    usage: searchAreaResponse.usage
                }
            };
        }
        const firstPassLocateResult = await (0, inspect_js_namespaceObject.AiLocateElement)({
            context,
            targetElementDescription: queryPrompt,
            modelRuntime,
            abortSignal
        });
        (0, utils_namespaceObject.assert)(firstPassLocateResult.rect, `cannot find search area for "${queryPrompt}"${firstPassLocateResult.parseResult.errors?.length ? `: ${firstPassLocateResult.parseResult.errors.join('\n')}` : ''}`);
        const config = await (0, inspect_js_namespaceObject.buildSearchAreaConfig)({
            context,
            baseRect: firstPassLocateResult.rect
        });
        return {
            config,
            trace: {
                sourceRect: config.sourceRect,
                rawResponse: JSON.stringify({
                    source: 'deep-locate-first-pass',
                    rect: firstPassLocateResult.rect,
                    rawResponse: firstPassLocateResult.rawResponse
                }),
                rawChoiceMessage: firstPassLocateResult.rawChoiceMessage,
                usage: firstPassLocateResult.usage
            }
        };
    }
    async extract(dataDemand, modelRuntime, opt, pageDescription, multimodalPrompt, context, executionOptions) {
        (0, utils_namespaceObject.assert)(context, 'context is required for extract');
        (0, utils_namespaceObject.assert)('object' == typeof dataDemand || 'string' == typeof dataDemand, `dataDemand should be object or string, but get ${typeof dataDemand}`);
        const startTime = Date.now();
        let parseResult;
        let rawResponse;
        let rawChoiceMessage;
        let usage;
        let reasoning_content;
        try {
            const result = await (0, inspect_js_namespaceObject.AiExtractElementInfo)({
                context,
                dataQuery: dataDemand,
                multimodalPrompt,
                extractOption: opt,
                modelRuntime,
                pageDescription,
                abortSignal: executionOptions?.abortSignal
            });
            parseResult = result.parseResult;
            rawResponse = result.rawResponse;
            rawChoiceMessage = result.rawChoiceMessage;
            usage = result.usage;
            reasoning_content = result.reasoning_content;
        } catch (error) {
            if (error instanceof index_js_namespaceObject.AIResponseParseError) {
                const timeCost = Date.now() - startTime;
                const taskInfo = {
                    ...this.taskInfo ? this.taskInfo : {},
                    durationMs: timeCost,
                    rawResponse: error.rawResponse,
                    rawChoiceMessage: error.rawChoiceMessage,
                    usage: error.usage
                };
                const dump = (0, external_utils_js_namespaceObject.createServiceDump)({
                    type: 'extract',
                    userQuery: {
                        dataDemand
                    },
                    data: null,
                    taskInfo,
                    error: error.message
                });
                throw new external_types_js_namespaceObject.ServiceError(error.message, dump);
            }
            throw error;
        }
        const timeCost = Date.now() - startTime;
        const taskInfo = {
            ...this.taskInfo ? this.taskInfo : {},
            durationMs: timeCost,
            rawResponse,
            rawChoiceMessage,
            formatResponse: parseResult,
            usage,
            reasoning_content
        };
        let errorLog;
        if (parseResult.errors?.length) errorLog = `AI response error: \n${parseResult.errors.join('\n')}`;
        const dumpData = {
            type: 'extract',
            userQuery: {
                dataDemand
            },
            data: null,
            taskInfo,
            error: errorLog
        };
        const { data, thought } = parseResult || {};
        const dump = (0, external_utils_js_namespaceObject.createServiceDump)({
            ...dumpData,
            data
        });
        if (errorLog && !data) throw new external_types_js_namespaceObject.ServiceError(errorLog, dump);
        return {
            data,
            thought,
            usage,
            reasoning_content,
            dump
        };
    }
    async describe(target, modelRuntime, opt) {
        (0, utils_namespaceObject.assert)(target, 'target is required for service.describe');
        const context = opt?.context || await this.contextRetrieverFn();
        const { shotSize } = context;
        const screenshotBase64 = context.screenshot.base64;
        (0, utils_namespaceObject.assert)(screenshotBase64, 'screenshot is required for service.describe');
        const systemPrompt = (0, describe_js_namespaceObject.elementDescriberInstruction)();
        const defaultRectSize = 30;
        const targetFromPoint = Array.isArray(target);
        const targetRect = targetFromPoint ? {
            left: Math.floor(target[0] - defaultRectSize / 2),
            top: Math.floor(target[1] - defaultRectSize / 2),
            width: defaultRectSize,
            height: defaultRectSize
        } : target;
        const targetPoint = targetFromPoint ? {
            x: target[0],
            y: target[1]
        } : void 0;
        const usePointMarker = targetFromPoint;
        const imagePayload = usePointMarker ? await (0, img_namespaceObject.compositePointMarkerImg)({
            inputImgBase64: screenshotBase64,
            size: shotSize,
            point: targetPoint
        }) : await (0, img_namespaceObject.compositeElementInfoImg)({
            inputImgBase64: screenshotBase64,
            size: shotSize,
            elementsPositionInfo: [
                {
                    rect: (0, external_utils_js_namespaceObject.getDescribeMarkerRect)(targetRect)
                }
            ],
            borderThickness: (0, external_utils_js_namespaceObject.getDescribeMarkerBorderThickness)(targetRect),
            centerPoint: true
        });
        const shouldDeepDescribe = opt?.deepDescribe;
        let imageContent;
        if (shouldDeepDescribe) {
            const contextAreas = (0, external_utils_js_namespaceObject.getDescribeDeepContextAreas)(targetRect, shotSize);
            const contextImages = await Promise.all(contextAreas.map(async (area)=>{
                debug('describe: cropping deep context area', area);
                const croppedResult = await (0, img_namespaceObject.cropByRect)(screenshotBase64, area.rect);
                const cropSize = {
                    width: croppedResult.width,
                    height: croppedResult.height
                };
                const targetInCrop = (0, external_utils_js_namespaceObject.getRectInCrop)(targetRect, area.rect, cropSize);
                const markedCropPayload = targetFromPoint ? await (0, img_namespaceObject.compositePointMarkerImg)({
                    inputImgBase64: croppedResult.imageBase64,
                    size: cropSize,
                    point: {
                        x: targetPoint.x - area.rect.left,
                        y: targetPoint.y - area.rect.top
                    }
                }) : await (0, img_namespaceObject.compositeElementInfoImg)({
                    inputImgBase64: croppedResult.imageBase64,
                    size: cropSize,
                    elementsPositionInfo: [
                        {
                            rect: (0, external_utils_js_namespaceObject.getDescribeMarkerRect)(targetInCrop)
                        }
                    ],
                    borderThickness: (0, external_utils_js_namespaceObject.getDescribeMarkerBorderThickness)(targetInCrop),
                    centerPoint: true
                });
                const resizeSize = (0, external_utils_js_namespaceObject.getDescribeDeepLocateResizeSize)(croppedResult);
                return {
                    kind: area.kind,
                    imageBase64: resizeSize ? await (0, img_namespaceObject.resizeImgBase64)(markedCropPayload, resizeSize) : markedCropPayload
                };
            }));
            const contextImageContent = contextImages.flatMap((item, index)=>[
                    {
                        type: 'text',
                        text: `Image ${index + 2}: focused detail crop around the target, for reading text, icon shape, and exact local boundaries.`
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: item.imageBase64,
                            detail: 'high'
                        }
                    }
                ]);
            imageContent = [
                {
                    type: 'text',
                    text: 'Use these images together to describe the real UI target marked by the temporary callout. Do not describe the marker itself.'
                },
                {
                    type: 'text',
                    text: 'Image 1: full screenshot overview with the target marker, for page position and ownership context.'
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imagePayload,
                        detail: 'high'
                    }
                },
                ...contextImageContent
            ];
        } else imageContent = [
            {
                type: 'text',
                text: 'Full screenshot with a temporary callout marking the target:'
            },
            {
                type: 'image_url',
                image_url: {
                    url: imagePayload,
                    detail: 'high'
                }
            }
        ];
        const msgs = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: imageContent
            }
        ];
        let res;
        try {
            res = await (0, index_js_namespaceObject.callAIWithObjectResponse)(msgs, modelRuntime);
        } catch (error) {
            const recoveredResponse = (0, external_utils_js_namespaceObject.recoverDescribeResponseFromParseError)(error);
            if (!recoveredResponse) throw error;
            debug("describe: recovered malformed description JSON response");
            return recoveredResponse;
        }
        const { content } = res;
        (0, utils_namespaceObject.assert)(!content.error, `describe failed: ${content.error}`);
        (0, utils_namespaceObject.assert)(content.description, 'failed to describe the element');
        return content;
    }
    constructor(context, opt){
        _define_property(this, "contextRetrieverFn", void 0);
        _define_property(this, "taskInfo", void 0);
        (0, utils_namespaceObject.assert)(context, 'context is required for Service');
        if ('function' == typeof context) this.contextRetrieverFn = context;
        else this.contextRetrieverFn = ()=>Promise.resolve(context);
        if (void 0 !== opt?.taskInfo) this.taskInfo = opt.taskInfo;
    }
}
exports["default"] = __webpack_exports__["default"];
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "default"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=index.js.map