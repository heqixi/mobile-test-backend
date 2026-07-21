import { generateElementByRect } from "@midscene/shared/extractor";
import { cropByRect, scaleImage } from "@midscene/shared/img";
import { getDebug } from "@midscene/shared/logger";
import { assert } from "@midscene/shared/utils";
import { expandSearchArea, multimodalPromptToChatMessages, userPromptToMultimodalPrompt, userPromptToString } from "../common.mjs";
import { extractDataQueryPrompt, parseXMLExtractionResponse, systemPromptToExtract } from "./prompt/extraction.mjs";
import { findElementPrompt, systemPromptToLocateElement } from "./prompt/llm-locator.mjs";
import { sectionLocatorInstruction, systemPromptToLocateSection } from "./prompt/llm-section-locator.mjs";
import { orderSensitiveJudgePrompt, systemPromptToJudgeOrderSensitive } from "./prompt/order-sensitive-judge.mjs";
import { AIResponseParseError, callAI, callAIWithObjectResponse } from "./service-caller/index.mjs";
import { callAiAndParseWithRetry } from "./service-caller/semantic-retry.mjs";
import { prepareModelImage } from "./workflows/image-preprocess.mjs";
import { mergePixelBboxesToRect, pixelBboxToRect } from "./workflows/inspect/locate-result-rect.mjs";
import { mapSearchAreaPixelBboxToOriginalPixelBbox } from "./workflows/inspect/search-area-mapping.mjs";
const debugInspect = getDebug('ai:inspect');
const debugSection = getDebug('ai:section');
function hasLocateResult(input, resultKey) {
    if (!input || 'object' != typeof input) return false;
    const record = input;
    const locateResult = record[resultKey];
    return Array.isArray(locateResult) ? locateResult.length > 0 : void 0 !== locateResult;
}
async function buildSearchAreaConfig(options) {
    const { context, baseRect } = options;
    const scaleRatio = 2;
    const sectionRect = expandSearchArea(baseRect, context.shotSize);
    const croppedResult = await cropByRect(context.screenshot.base64, sectionRect);
    const scaledResult = await scaleImage(croppedResult.imageBase64, scaleRatio);
    return {
        sourceRect: sectionRect,
        image: {
            imageBase64: scaledResult.imageBase64,
            width: scaledResult.width,
            height: scaledResult.height
        },
        mapping: {
            offset: {
                x: sectionRect.left,
                y: sectionRect.top
            },
            scale: scaleRatio
        }
    };
}
async function AiLocateElement(options) {
    const { targetElementDescription, ...locateOptions } = options;
    assert(targetElementDescription, "cannot find the target element description");
    const { context } = locateOptions;
    const locateImage = locateOptions.searchConfig?.image ?? {
        imageBase64: context.screenshot.base64,
        width: context.shotSize.width,
        height: context.shotSize.height
    };
    const referenceImageMessages = 'string' == typeof targetElementDescription ? void 0 : await multimodalPromptToChatMessages(userPromptToMultimodalPrompt(targetElementDescription));
    const locateRequest = {
        elementDescriptionText: userPromptToString(targetElementDescription),
        locateImage,
        referenceImageMessages,
        options: locateOptions
    };
    const locateAdapter = options.modelRuntime.adapter.locate;
    const locateFn = 'custom' === locateAdapter.kind ? locateAdapter.locateFn : genericLocate;
    const locateResponse = await locateFn(targetElementDescription, locateOptions, locateRequest);
    const { locatedPixelBbox, rawResponse, rawChoiceMessage, usage, reasoningContent, errors = [] } = locateResponse;
    const baseLocateResult = {
        rawResponse,
        rawChoiceMessage,
        usage,
        reasoning_content: reasoningContent
    };
    if (!locatedPixelBbox) return {
        rect: void 0,
        parseResult: {
            element: void 0,
            errors
        },
        ...baseLocateResult
    };
    try {
        const rect = pixelBboxToRect(mapSearchAreaPixelBboxToOriginalPixelBbox(locatedPixelBbox, locateOptions.searchConfig?.mapping));
        debugInspect('resRect', rect);
        return {
            rect,
            parseResult: {
                element: generateElementByRect(rect, locateRequest.elementDescriptionText),
                errors: []
            },
            ...baseLocateResult
        };
    } catch (error) {
        const msg = error instanceof Error ? `Failed to parse locate result: ${error.message}` : 'unknown error in locate';
        return {
            rect: void 0,
            parseResult: {
                element: void 0,
                errors: errors.length > 0 ? [
                    ...errors,
                    `(${msg})`
                ] : [
                    msg
                ]
            },
            ...baseLocateResult
        };
    }
}
async function genericLocate(_elementDescription, options, locateRequest) {
    const modelRuntime = options.modelRuntime;
    const { adapter } = modelRuntime;
    assert('standard' === adapter.locate.kind, 'generic locate requires a standard locate adapter');
    const resultAdapter = adapter.locate.resultAdapter;
    const userInstructionPrompt = findElementPrompt(locateRequest.elementDescriptionText);
    const systemPrompt = systemPromptToLocateElement(adapter.locate.resultAdapter.promptSpec);
    const preparedImage = await prepareModelImage({
        imageBase64: locateRequest.locateImage.imageBase64,
        width: locateRequest.locateImage.width,
        height: locateRequest.locateImage.height,
        policy: adapter.imagePreprocess
    });
    const imagePayload = preparedImage.imageBase64;
    const msgs = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: imagePayload,
                        detail: 'high'
                    }
                },
                {
                    type: 'text',
                    text: userInstructionPrompt
                }
            ]
        }
    ];
    if (locateRequest.referenceImageMessages) msgs.push(...locateRequest.referenceImageMessages);
    try {
        return await callAiAndParseWithRetry({
            callAi: ()=>callAIWithObjectResponse(msgs, modelRuntime, {
                    abortSignal: options.abortSignal,
                    jsonParserSource: 'locate',
                    retryTimes: modelRuntime.config.retryCount,
                    retryInterval: modelRuntime.config.retryInterval
                }),
            parseResponse: (response)=>{
                const rawResponse = response.contentString;
                const errors = 'errors' in response.content ? response.content.errors : [];
                if (!hasLocateResult(response.content, resultAdapter.promptSpec.resultKey)) return {
                    rawResponse,
                    rawChoiceMessage: response.rawChoiceMessage,
                    usage: response.usage,
                    reasoningContent: response.reasoning_content,
                    errors: errors
                };
                const locatedPixelBbox = resultAdapter.adaptElementLocateResultToPixelBbox(response.content, {
                    preparedSize: preparedImage.preparedSize,
                    contentSize: preparedImage.contentSize
                });
                return {
                    locatedPixelBbox,
                    rawResponse,
                    rawChoiceMessage: response.rawChoiceMessage,
                    usage: response.usage,
                    reasoningContent: response.reasoning_content,
                    errors: errors
                };
            },
            toParseError: (error, response)=>{
                const parseErrorMessage = error instanceof Error ? `Failed to parse locate result: ${error.message}` : 'unknown error in locate result';
                const modelErrors = 'errors' in response.content ? response.content.errors : void 0;
                const message = modelErrors && modelErrors.length > 0 ? `${modelErrors.join('\n')} (${parseErrorMessage})` : parseErrorMessage;
                return new AIResponseParseError(message, response.contentString, response.usage, response.rawChoiceMessage, response.reasoning_content);
            },
            parseRetryTimes: modelRuntime.config.retryCount,
            parseRetryInterval: modelRuntime.config.retryInterval,
            abortSignal: options.abortSignal,
            onParseRetry: (error)=>{
                debugInspect('retrying locate after coordinate parsing failed: %s', error instanceof Error ? error.message : String(error));
            }
        });
    } catch (callError) {
        if (callError instanceof AIResponseParseError) return {
            rawResponse: callError.rawResponse,
            rawChoiceMessage: callError.rawChoiceMessage,
            usage: callError.usage,
            reasoningContent: callError.reasoningContent,
            errors: [
                callError.message
            ]
        };
        const errorMessage = callError instanceof Error ? callError.message : String(callError);
        return {
            rawResponse: errorMessage,
            errors: [
                `AI call error: ${errorMessage}`
            ]
        };
    }
}
async function AiLocateSection(options) {
    const { context, sectionDescription } = options;
    const modelRuntime = options.modelRuntime;
    const { adapter } = modelRuntime;
    assert('standard' === adapter.locate.kind, 'section locate requires a standard locate adapter');
    const resultAdapter = adapter.locate.resultAdapter;
    const screenshotBase64 = context.screenshot.base64;
    const preparedImage = await prepareModelImage({
        imageBase64: screenshotBase64,
        width: context.shotSize.width,
        height: context.shotSize.height,
        policy: adapter.imagePreprocess
    });
    const systemPrompt = systemPromptToLocateSection(adapter.locate.resultAdapter.promptSpec);
    const sectionLocatorInstructionText = sectionLocatorInstruction(userPromptToString(sectionDescription));
    const msgs = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: preparedImage.imageBase64,
                        detail: 'high'
                    }
                },
                {
                    type: 'text',
                    text: sectionLocatorInstructionText
                }
            ]
        }
    ];
    if ('string' != typeof sectionDescription) {
        const addOns = await multimodalPromptToChatMessages(userPromptToMultimodalPrompt(sectionDescription));
        msgs.push(...addOns);
    }
    let parsedResult;
    try {
        parsedResult = await callAiAndParseWithRetry({
            callAi: ()=>callAIWithObjectResponse(msgs, modelRuntime, {
                    abortSignal: options.abortSignal,
                    jsonParserSource: 'section-locator',
                    retryTimes: modelRuntime.config.retryCount,
                    retryInterval: modelRuntime.config.retryInterval
                }),
            parseResponse: (result)=>{
                const sectionError = result.content.error;
                if (!hasLocateResult(result.content, resultAdapter.promptSpec.resultKey)) return {
                    result,
                    sectionError
                };
                const adaptedResult = resultAdapter.adaptSectionLocateResultToPixelBboxGroup(result.content, {
                    preparedSize: preparedImage.preparedSize,
                    contentSize: preparedImage.contentSize
                });
                const mergedRect = mergePixelBboxesToRect([
                    adaptedResult.target,
                    ...adaptedResult.references ?? []
                ]);
                debugSection('mergedRect %j', mergedRect);
                return {
                    result,
                    sectionError,
                    mergedRect
                };
            },
            toParseError: (error, result)=>{
                const parseErrorMessage = error instanceof Error ? `Failed to parse section locate result: ${error.message}` : 'unknown error in section locate';
                const message = result.content.error ? `${result.content.error} (${parseErrorMessage})` : parseErrorMessage;
                return new AIResponseParseError(message, result.contentString, result.usage, result.rawChoiceMessage, result.reasoning_content);
            },
            parseRetryTimes: modelRuntime.config.retryCount,
            parseRetryInterval: modelRuntime.config.retryInterval,
            abortSignal: options.abortSignal,
            onParseRetry: (error)=>{
                debugSection('retrying section locate after coordinate parsing failed: %s', error instanceof Error ? error.message : String(error));
            }
        });
    } catch (callError) {
        if (callError instanceof AIResponseParseError) return {
            searchAreaConfig: void 0,
            error: callError.message,
            rawResponse: callError.rawResponse,
            rawChoiceMessage: callError.rawChoiceMessage,
            usage: callError.usage
        };
        const errorMessage = callError instanceof Error ? callError.message : String(callError);
        return {
            searchAreaConfig: void 0,
            error: `AI call error: ${errorMessage}`,
            rawResponse: errorMessage
        };
    }
    const { result, sectionError, mergedRect } = parsedResult;
    if (!mergedRect) return {
        searchAreaConfig: void 0,
        error: sectionError,
        rawResponse: result.contentString,
        rawChoiceMessage: result.rawChoiceMessage,
        usage: result.usage
    };
    try {
        const expandedRect = expandSearchArea(mergedRect, context.shotSize);
        const originalWidth = expandedRect.width;
        const originalHeight = expandedRect.height;
        debugSection('expanded sectionRect %j', expandedRect);
        const searchAreaConfig = await buildSearchAreaConfig({
            context,
            baseRect: mergedRect
        });
        debugSection('scaled section image from %dx%d to %dx%d (scale=%d)', originalWidth, originalHeight, searchAreaConfig.image.width, searchAreaConfig.image.height, searchAreaConfig.mapping.scale);
        return {
            searchAreaConfig,
            error: sectionError,
            rawResponse: result.contentString,
            rawChoiceMessage: result.rawChoiceMessage,
            usage: result.usage
        };
    } catch (error) {
        const parseErrorMessage = error instanceof Error ? `Failed to parse section locate result: ${error.message}` : 'unknown error in section locate';
        const errorMessage = sectionError ? `${sectionError} (${parseErrorMessage})` : parseErrorMessage;
        return {
            searchAreaConfig: void 0,
            error: errorMessage,
            rawResponse: result.contentString,
            rawChoiceMessage: result.rawChoiceMessage,
            usage: result.usage
        };
    }
}
async function AiExtractElementInfo(options) {
    const { dataQuery, context, extractOption, multimodalPrompt, modelRuntime } = options;
    const systemPrompt = systemPromptToExtract({
        screenshotIncluded: extractOption?.screenshotIncluded !== false,
        referenceImagesIncluded: !!multimodalPrompt?.images?.length
    });
    const screenshotBase64 = context.screenshot.base64;
    const extractDataPromptText = extractDataQueryPrompt(options.pageDescription || '', dataQuery);
    const userContent = [];
    if (extractOption?.screenshotIncluded !== false) {
        const screenshotSequence = context.screenshotSequence;
        if (screenshotSequence && screenshotSequence.length > 1) {
            userContent.push({
                type: 'text',
                text: `The following ${screenshotSequence.length} images are consecutive screenshots captured over a time window, ordered from earliest to latest (Frame 1 is first, Frame ${screenshotSequence.length} is last). They record what appeared on screen during that window. Some UI elements such as toasts, banners, or transitions may appear only in certain frames and be gone by later ones. Interpret the temporal scope from the statement or question itself: if it asks whether something appeared at any point, inspect the whole sequence; if it asks about the final or current state, use the relevant later frame; if it asks about a change or sequence, compare frames in order. Unless <DATA_DEMAND> explicitly asks for comparison or matching against reference images, base your answer on these screenshots and their contents.`
            });
            screenshotSequence.forEach((frame, index)=>{
                userContent.push({
                    type: 'text',
                    text: `Frame ${index + 1}/${screenshotSequence.length}`
                });
                userContent.push({
                    type: 'image_url',
                    image_url: {
                        url: frame.base64,
                        detail: 'high'
                    }
                });
            });
        } else {
            userContent.push({
                type: 'text',
                text: 'This is the current screenshot to evaluate. Unless <DATA_DEMAND> explicitly asks for comparison or matching against reference images, base your answer on this screenshot and its contents when provided.'
            });
            userContent.push({
                type: 'image_url',
                image_url: {
                    url: screenshotBase64,
                    detail: 'high'
                }
            });
        }
    }
    userContent.push({
        type: 'text',
        text: extractDataPromptText
    });
    const msgs = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: userContent
        }
    ];
    if (multimodalPrompt) {
        const addOns = await multimodalPromptToChatMessages(multimodalPrompt);
        msgs.push(...addOns);
    }
    return callAiAndParseWithRetry({
        callAi: ()=>callAI(msgs, modelRuntime, {
                abortSignal: options.abortSignal
            }),
        parseResponse: (response)=>{
            const { content: rawResponse, usage, reasoning_content, rawChoiceMessage } = response;
            const parseResult = parseXMLExtractionResponse(rawResponse);
            return {
                parseResult,
                rawResponse,
                rawChoiceMessage,
                usage,
                reasoning_content
            };
        },
        toParseError: (parseError, response)=>{
            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
            return new AIResponseParseError(`XML parse error: ${errorMessage}`, response.content, response.usage, response.rawChoiceMessage);
        },
        parseRetryTimes: modelRuntime.config.retryCount,
        parseRetryInterval: modelRuntime.config.retryInterval,
        abortSignal: options.abortSignal,
        onParseRetry: (error)=>{
            debugInspect('retrying insight after XML parsing failed: %s', error instanceof Error ? error.message : String(error));
        }
    });
}
async function AiJudgeOrderSensitive(description, modelRuntime) {
    const systemPrompt = systemPromptToJudgeOrderSensitive();
    const userPrompt = orderSensitiveJudgePrompt(description);
    const msgs = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: userPrompt
        }
    ];
    debugInspect("AiJudgeOrderSensitive: description=%s", description);
    const result = await callAIWithObjectResponse(msgs, modelRuntime, {
        jsonParserSource: 'generic-object'
    });
    return {
        isOrderSensitive: result.content.isOrderSensitive ?? false,
        usage: result.usage
    };
}
export { AiExtractElementInfo, AiJudgeOrderSensitive, AiLocateElement, AiLocateSection, buildSearchAreaConfig, userPromptToString as extraTextFromUserPrompt, genericLocate, multimodalPromptToChatMessages as promptsToChatParam };

//# sourceMappingURL=inspect.mjs.map