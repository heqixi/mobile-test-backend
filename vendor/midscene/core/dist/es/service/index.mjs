import { defaultModelFamilyRequiredForLocateMessage } from "../ai-model/errors.mjs";
import { AiExtractElementInfo, AiLocateElement, AiLocateSection, buildSearchAreaConfig } from "../ai-model/inspect.mjs";
import { elementDescriberInstruction } from "../ai-model/prompt/describe.mjs";
import { AIResponseParseError, callAIWithObjectResponse } from "../ai-model/service-caller/index.mjs";
import { ServiceError } from "../types.mjs";
import { compositeElementInfoImg, compositePointMarkerImg, cropByRect, resizeImgBase64 } from "@midscene/shared/img";
import { getDebug } from "@midscene/shared/logger";
import { assert } from "@midscene/shared/utils";
import { createServiceDump, getDescribeDeepContextAreas, getDescribeDeepLocateResizeSize, getDescribeMarkerBorderThickness, getDescribeMarkerRect, getRectInCrop, recoverDescribeResponseFromParseError } from "./utils.mjs";
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
const debug = getDebug('ai:service');
class Service {
    async locate(query, opt, modelRuntime, abortSignal) {
        const { config: modelConfig } = modelRuntime;
        const queryPrompt = 'string' == typeof query ? query : query.prompt;
        assert(queryPrompt, 'query is required for locate');
        assert('object' == typeof query, 'query should be an object for locate');
        if (!modelConfig.modelFamily) throw new Error(defaultModelFamilyRequiredForLocateMessage);
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
        const { parseResult, rect, rawResponse, rawChoiceMessage, usage, reasoning_content } = await AiLocateElement({
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
        const dump = createServiceDump({
            ...dumpData,
            matchedElement: element ? [
                element
            ] : []
        });
        if (errorLog) throw new ServiceError(errorLog, dump);
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
            const config = await buildSearchAreaConfig({
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
            const searchAreaResponse = await AiLocateSection({
                context,
                sectionDescription: queryPrompt,
                modelRuntime,
                abortSignal
            });
            const { searchAreaConfig } = searchAreaResponse;
            assert(searchAreaConfig, `cannot find search area for "${queryPrompt}"${searchAreaResponse.error ? `: ${searchAreaResponse.error}` : ''}`);
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
        const firstPassLocateResult = await AiLocateElement({
            context,
            targetElementDescription: queryPrompt,
            modelRuntime,
            abortSignal
        });
        assert(firstPassLocateResult.rect, `cannot find search area for "${queryPrompt}"${firstPassLocateResult.parseResult.errors?.length ? `: ${firstPassLocateResult.parseResult.errors.join('\n')}` : ''}`);
        const config = await buildSearchAreaConfig({
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
        assert(context, 'context is required for extract');
        assert('object' == typeof dataDemand || 'string' == typeof dataDemand, `dataDemand should be object or string, but get ${typeof dataDemand}`);
        const startTime = Date.now();
        let parseResult;
        let rawResponse;
        let rawChoiceMessage;
        let usage;
        let reasoning_content;
        try {
            const result = await AiExtractElementInfo({
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
            if (error instanceof AIResponseParseError) {
                const timeCost = Date.now() - startTime;
                const taskInfo = {
                    ...this.taskInfo ? this.taskInfo : {},
                    durationMs: timeCost,
                    rawResponse: error.rawResponse,
                    rawChoiceMessage: error.rawChoiceMessage,
                    usage: error.usage
                };
                const dump = createServiceDump({
                    type: 'extract',
                    userQuery: {
                        dataDemand
                    },
                    data: null,
                    taskInfo,
                    error: error.message
                });
                throw new ServiceError(error.message, dump);
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
        const dump = createServiceDump({
            ...dumpData,
            data
        });
        if (errorLog && !data) throw new ServiceError(errorLog, dump);
        return {
            data,
            thought,
            usage,
            reasoning_content,
            dump
        };
    }
    async describe(target, modelRuntime, opt) {
        assert(target, 'target is required for service.describe');
        const context = opt?.context || await this.contextRetrieverFn();
        const { shotSize } = context;
        const screenshotBase64 = context.screenshot.base64;
        assert(screenshotBase64, 'screenshot is required for service.describe');
        const systemPrompt = elementDescriberInstruction();
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
        const imagePayload = usePointMarker ? await compositePointMarkerImg({
            inputImgBase64: screenshotBase64,
            size: shotSize,
            point: targetPoint
        }) : await compositeElementInfoImg({
            inputImgBase64: screenshotBase64,
            size: shotSize,
            elementsPositionInfo: [
                {
                    rect: getDescribeMarkerRect(targetRect)
                }
            ],
            borderThickness: getDescribeMarkerBorderThickness(targetRect),
            centerPoint: true
        });
        const shouldDeepDescribe = opt?.deepDescribe;
        let imageContent;
        if (shouldDeepDescribe) {
            const contextAreas = getDescribeDeepContextAreas(targetRect, shotSize);
            const contextImages = await Promise.all(contextAreas.map(async (area)=>{
                debug('describe: cropping deep context area', area);
                const croppedResult = await cropByRect(screenshotBase64, area.rect);
                const cropSize = {
                    width: croppedResult.width,
                    height: croppedResult.height
                };
                const targetInCrop = getRectInCrop(targetRect, area.rect, cropSize);
                const markedCropPayload = targetFromPoint ? await compositePointMarkerImg({
                    inputImgBase64: croppedResult.imageBase64,
                    size: cropSize,
                    point: {
                        x: targetPoint.x - area.rect.left,
                        y: targetPoint.y - area.rect.top
                    }
                }) : await compositeElementInfoImg({
                    inputImgBase64: croppedResult.imageBase64,
                    size: cropSize,
                    elementsPositionInfo: [
                        {
                            rect: getDescribeMarkerRect(targetInCrop)
                        }
                    ],
                    borderThickness: getDescribeMarkerBorderThickness(targetInCrop),
                    centerPoint: true
                });
                const resizeSize = getDescribeDeepLocateResizeSize(croppedResult);
                return {
                    kind: area.kind,
                    imageBase64: resizeSize ? await resizeImgBase64(markedCropPayload, resizeSize) : markedCropPayload
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
            res = await callAIWithObjectResponse(msgs, modelRuntime);
        } catch (error) {
            const recoveredResponse = recoverDescribeResponseFromParseError(error);
            if (!recoveredResponse) throw error;
            debug("describe: recovered malformed description JSON response");
            return recoveredResponse;
        }
        const { content } = res;
        assert(!content.error, `describe failed: ${content.error}`);
        assert(content.description, 'failed to describe the element');
        return content;
    }
    constructor(context, opt){
        _define_property(this, "contextRetrieverFn", void 0);
        _define_property(this, "taskInfo", void 0);
        assert(context, 'context is required for Service');
        if ('function' == typeof context) this.contextRetrieverFn = context;
        else this.contextRetrieverFn = ()=>Promise.resolve(context);
        if (void 0 !== opt?.taskInfo) this.taskInfo = opt.taskInfo;
    }
}
export { Service as default };

//# sourceMappingURL=index.mjs.map