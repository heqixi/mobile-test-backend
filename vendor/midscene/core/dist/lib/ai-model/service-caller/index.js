"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
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
    callAIWithObjectResponse: ()=>callAIWithObjectResponse,
    extractJSONFromCodeBlock: ()=>external_json_js_namespaceObject.extractJSONFromCodeBlock,
    callAI: ()=>callAI,
    parseModelResponseJson: ()=>external_json_js_namespaceObject.parseModelResponseJson,
    createChatClient: ()=>createChatClient,
    AIResponseParseError: ()=>AIResponseParseError,
    INTERNAL_CALL_ID_FIELD: ()=>INTERNAL_CALL_ID_FIELD,
    callAIWithStringResponse: ()=>callAIWithStringResponse
});
const env_namespaceObject = require("@midscene/shared/env");
const logger_namespaceObject = require("@midscene/shared/logger");
const utils_namespaceObject = require("@midscene/shared/utils");
const external_openai_namespaceObject = require("openai");
var external_openai_default = /*#__PURE__*/ __webpack_require__.n(external_openai_namespaceObject);
const external_codex_app_server_js_namespaceObject = require("./codex-app-server.js");
const external_openai_error_js_namespaceObject = require("./openai-error.js");
const external_request_timeout_js_namespaceObject = require("./request-timeout.js");
const external_semantic_retry_js_namespaceObject = require("./semantic-retry.js");
const external_json_js_namespaceObject = require("./json.js");
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
class AIResponseParseError extends Error {
    constructor(message, rawResponse, usage, rawChoiceMessage, reasoningContent){
        super(message), _define_property(this, "usage", void 0), _define_property(this, "rawResponse", void 0), _define_property(this, "rawChoiceMessage", void 0), _define_property(this, "reasoningContent", void 0);
        this.name = 'AIResponseParseError';
        this.rawResponse = rawResponse;
        this.usage = usage;
        this.rawChoiceMessage = rawChoiceMessage;
        this.reasoningContent = reasoningContent;
    }
}
const INTERNAL_CALL_ID_FIELD = '_midscene_call_id';
let internalCallIdCounter = 0;
function nextInternalCallId() {
    internalCallIdCounter += 1;
    return `call_${internalCallIdCounter}`;
}
function stringifyForDebug(value) {
    try {
        return JSON.stringify(value);
    } catch (_error) {
        return String(value);
    }
}
function getLatestSuccessfulResponseRequestId(context) {
    return context.responseRequestIds?.reduce((latestRequestId, response)=>response.ok ? response.requestId : latestRequestId, void 0);
}
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function toError(error) {
    return error instanceof Error ? error : new Error(String(error));
}
function normalizeRetryCount(retryCount) {
    if ('number' != typeof retryCount || !Number.isFinite(retryCount)) return 1;
    return Math.max(0, Math.floor(retryCount));
}
function appendAIRequestFailureSummary(error, attemptErrors, maxAttempts) {
    const failedAttempts = attemptErrors.length;
    const retries = Math.max(0, failedAttempts - 1);
    const retryLabel = 1 === retries ? 'retry' : 'retries';
    const originalMessage = error.message;
    const previousAttemptErrors = attemptErrors.slice(0, -1);
    error.message = `AI model request failed after ${retries} ${retryLabel} (${failedAttempts}/${maxAttempts} attempts). Last error: ${originalMessage}`;
    if (0 === previousAttemptErrors.length) return error;
    const details = previousAttemptErrors.map(({ attempt, error })=>`Attempt ${attempt}: ${getErrorMessage(error)}`).join('\n');
    error.message = `${error.message}\nPrevious AI call attempt errors:\n${details}`;
    return error;
}
async function createChatClient({ modelConfig }) {
    const { socksProxy, httpProxy, modelName, openaiBaseURL, openaiApiKey, openaiExtraConfig, modelDescription, modelFamily, createOpenAIClient, timeout } = modelConfig;
    let proxyAgent;
    const warnClient = (0, logger_namespaceObject.getDebug)('ai:call', {
        console: true
    });
    const debugProxy = (0, logger_namespaceObject.getDebug)('ai:call:proxy');
    const warnProxy = (0, logger_namespaceObject.getDebug)('ai:call:proxy', {
        console: true
    });
    const sanitizeProxyUrl = (url)=>{
        try {
            const parsed = new URL(url);
            if (parsed.username) {
                parsed.password = '****';
                return parsed.href;
            }
            return url;
        } catch  {
            return url;
        }
    };
    if (httpProxy) {
        debugProxy('using http proxy', sanitizeProxyUrl(httpProxy));
        if (utils_namespaceObject.ifInBrowser) warnProxy('HTTP proxy is configured but not supported in browser environment');
        else {
            const moduleName = 'undici';
            const { ProxyAgent } = await import(moduleName);
            proxyAgent = new ProxyAgent({
                uri: httpProxy
            });
        }
    } else if (socksProxy) {
        debugProxy('using socks proxy', sanitizeProxyUrl(socksProxy));
        if (utils_namespaceObject.ifInBrowser) warnProxy('SOCKS proxy is configured but not supported in browser environment');
        else try {
            const moduleName = 'fetch-socks';
            const { socksDispatcher } = await import(moduleName);
            const proxyUrl = new URL(socksProxy);
            if (!proxyUrl.hostname) throw new Error('SOCKS proxy URL must include a valid hostname');
            const port = Number.parseInt(proxyUrl.port, 10);
            if (!proxyUrl.port || Number.isNaN(port)) throw new Error('SOCKS proxy URL must include a valid port');
            const protocol = proxyUrl.protocol.replace(':', '');
            const socksType = 'socks4' === protocol ? 4 : 'socks5' === protocol ? 5 : 5;
            proxyAgent = socksDispatcher({
                type: socksType,
                host: proxyUrl.hostname,
                port,
                ...proxyUrl.username ? {
                    userId: decodeURIComponent(proxyUrl.username),
                    password: decodeURIComponent(proxyUrl.password || '')
                } : {}
            });
            debugProxy('socks proxy configured successfully', {
                type: socksType,
                host: proxyUrl.hostname,
                port: port
            });
        } catch (error) {
            warnProxy('Failed to configure SOCKS proxy:', error);
            throw new Error(`Invalid SOCKS proxy URL: ${socksProxy}. Expected format: socks4://host:port, socks5://host:port, or with authentication: socks5://user:pass@host:port`);
        }
    }
    const effectiveTimeoutMs = (0, external_request_timeout_js_namespaceObject.resolveEffectiveTimeoutMs)({
        timeout
    });
    const openAIErrorResponseContext = {};
    const openAIOptions = {
        baseURL: openaiBaseURL,
        apiKey: openaiApiKey,
        ...proxyAgent ? {
            fetchOptions: {
                dispatcher: proxyAgent
            }
        } : {},
        ...openaiExtraConfig,
        fetch: (0, external_openai_error_js_namespaceObject.wrapOpenAICompatibleFetch)(openAIErrorResponseContext),
        maxRetries: 0,
        ...null !== effectiveTimeoutMs ? {
            timeout: effectiveTimeoutMs
        } : {},
        dangerouslyAllowBrowser: true
    };
    const baseOpenAI = new (external_openai_default())(openAIOptions);
    let openai = baseOpenAI;
    if (openai && env_namespaceObject.globalConfigManager.getEnvConfigInBoolean(env_namespaceObject.MIDSCENE_LANGSMITH_DEBUG)) {
        if (utils_namespaceObject.ifInBrowser) throw new Error('langsmith is not supported in browser');
        warnClient('DEBUGGING MODE: langsmith wrapper enabled');
        const langsmithModule = 'langsmith/wrappers';
        const { wrapOpenAI } = await import(langsmithModule);
        openai = wrapOpenAI(openai);
    }
    if (openai && env_namespaceObject.globalConfigManager.getEnvConfigInBoolean(env_namespaceObject.MIDSCENE_LANGFUSE_DEBUG)) {
        if (utils_namespaceObject.ifInBrowser) throw new Error('langfuse is not supported in browser');
        warnClient('DEBUGGING MODE: langfuse wrapper enabled');
        const langfuseModule = '@langfuse/openai';
        const { observeOpenAI } = await import(langfuseModule);
        openai = observeOpenAI(openai);
    }
    if (createOpenAIClient) {
        const wrappedClient = await createOpenAIClient(baseOpenAI, openAIOptions);
        if (wrappedClient) openai = wrappedClient;
    }
    return {
        completion: openai.chat.completions,
        modelName,
        modelDescription,
        modelFamily,
        openAIErrorResponseContext
    };
}
async function callAI(messages, modelRuntime, options) {
    const { config: modelConfig, adapter } = modelRuntime;
    const internalCallId = nextInternalCallId();
    if ((0, external_codex_app_server_js_namespaceObject.isCodexAppServerProvider)(modelConfig.openaiBaseURL)) {
        const codexResult = await (0, external_codex_app_server_js_namespaceObject.callAIWithCodexAppServer)(messages, modelConfig, {
            stream: options?.stream,
            onChunk: options?.onChunk,
            reasoningEnabled: modelConfig.reasoningEnabled,
            abortSignal: options?.abortSignal
        });
        if (codexResult.usage) {
            codexResult.usage[INTERNAL_CALL_ID_FIELD] = internalCallId;
            if (modelRuntime.onUsage) modelRuntime.onUsage(codexResult.usage);
        }
        return codexResult;
    }
    const { completion, modelName, modelDescription, modelFamily, openAIErrorResponseContext } = await createChatClient({
        modelConfig
    });
    const effectiveTimeoutMs = (0, external_request_timeout_js_namespaceObject.resolveEffectiveTimeoutMs)(modelConfig);
    const extraBody = modelConfig.extraBody;
    const debugCall = (0, logger_namespaceObject.getDebug)('ai:call');
    const warnCall = (0, logger_namespaceObject.getDebug)('ai:call', {
        console: true
    });
    const debugProfileStats = (0, logger_namespaceObject.getDebug)('ai:profile:stats');
    const debugProfileDetail = (0, logger_namespaceObject.getDebug)('ai:profile:detail');
    const startTime = Date.now();
    const isStreaming = options?.stream && options?.onChunk;
    const chatCompletionInput = {
        intent: modelConfig.intent,
        userConfig: {
            temperature: modelConfig.temperature,
            reasoningEnabled: modelConfig.reasoningEnabled,
            reasoningEffort: modelConfig.reasoningEffort,
            reasoningBudget: modelConfig.reasoningBudget,
            responseFormat: modelConfig.responseFormat
        },
        requiresOriginalImageDetail: options?.requiresOriginalImageDetail,
        expectedJsonObjectResponse: options?.expectedJsonObjectResponse
    };
    const { config: adapterChatCompletionParams } = adapter.chatCompletion.buildChatCompletionParams(chatCompletionInput);
    debugCall(`adapter chat completion params: ${stringifyForDebug({
        config: adapterChatCompletionParams
    })}`);
    let content;
    let accumulated = '';
    let accumulatedReasoning = '';
    let rawChoiceMessage;
    let usage;
    let timeCost;
    let requestId;
    let responseModelName;
    let usageReported = false;
    const hasUsableText = (value)=>'string' == typeof value && value.trim().length > 0;
    const resolveContentWithReasoningFallback = (contentValue, reasoningContent)=>{
        if (!hasUsableText(contentValue) && adapter.chatCompletion.useReasoningAsContentFallback && hasUsableText(reasoningContent)) {
            warnCall('empty content from AI model, using reasoning content');
            return reasoningContent;
        }
        return contentValue;
    };
    const buildUsageInfo = (usageData, requestId)=>{
        if (!usageData) return;
        const cachedInputTokens = usageData?.prompt_tokens_details?.cached_tokens;
        return {
            ...usageData,
            prompt_tokens: usageData.prompt_tokens ?? 0,
            completion_tokens: usageData.completion_tokens ?? 0,
            total_tokens: usageData.total_tokens ?? 0,
            cached_input: cachedInputTokens ?? 0,
            time_cost: timeCost ?? 0,
            model_name: modelName,
            model_description: modelDescription,
            response_model_name: responseModelName,
            slot: modelConfig.slot,
            intent: void 0,
            request_id: requestId ?? void 0,
            [INTERNAL_CALL_ID_FIELD]: internalCallId
        };
    };
    const requestConfig = {
        ...adapterChatCompletionParams,
        ...extraBody ?? {}
    };
    const temperature = requestConfig.temperature;
    const imageDetail = adapter.chatCompletion.resolveImageDetail(chatCompletionInput);
    const messagesWithImageDetail = (()=>{
        if (!imageDetail) return messages;
        return messages.map((msg)=>{
            if (!Array.isArray(msg.content)) return msg;
            const content = msg.content.map((part)=>{
                if (part && 'image_url' === part.type && part.image_url?.url) return {
                    ...part,
                    image_url: {
                        ...part.image_url,
                        detail: imageDetail
                    }
                };
                return part;
            });
            return {
                ...msg,
                content
            };
        });
    })();
    try {
        debugCall(`sending ${isStreaming ? 'streaming ' : ''}request to ${modelName}`);
        if (isStreaming) {
            const { signal: streamSignal, cleanup: cleanupStreamSignal } = (0, external_request_timeout_js_namespaceObject.buildRequestAbortSignal)(effectiveTimeoutMs, options?.abortSignal);
            try {
                const stream = await completion.create({
                    model: modelName,
                    messages: messagesWithImageDetail,
                    ...requestConfig,
                    stream: true
                }, {
                    stream: true,
                    signal: streamSignal
                });
                requestId = getLatestSuccessfulResponseRequestId(openAIErrorResponseContext) ?? stream._request_id;
                for await (const chunk of stream){
                    const parsedChunk = adapter.chatCompletion.extractContentAndReasoning(chunk.choices?.[0]?.delta);
                    const content = parsedChunk.content || '';
                    const reasoning_content = parsedChunk.reasoning_content || '';
                    if (chunk.usage) usage = chunk.usage;
                    if (chunk.model) responseModelName = chunk.model;
                    if (content || reasoning_content) {
                        accumulated += content;
                        accumulatedReasoning += reasoning_content;
                        const chunkData = {
                            content,
                            reasoning_content,
                            accumulated,
                            isComplete: false,
                            usage: void 0
                        };
                        options.onChunk(chunkData);
                    }
                    if (chunk.choices?.[0]?.finish_reason) {
                        timeCost = Date.now() - startTime;
                        if (!usage) {
                            const estimatedTokens = Math.max(1, Math.floor(accumulated.length / 4));
                            usage = {
                                prompt_tokens: estimatedTokens,
                                completion_tokens: estimatedTokens,
                                total_tokens: 2 * estimatedTokens
                            };
                        }
                        const finalAccumulated = resolveContentWithReasoningFallback(accumulated, accumulatedReasoning);
                        accumulated = finalAccumulated || '';
                        const finalUsage = buildUsageInfo(usage, requestId);
                        if (finalUsage && modelRuntime.onUsage) {
                            modelRuntime.onUsage(finalUsage);
                            usageReported = true;
                        }
                        const finalChunk = {
                            content: '',
                            accumulated,
                            reasoning_content: '',
                            isComplete: true,
                            usage: finalUsage
                        };
                        options.onChunk(finalChunk);
                        break;
                    }
                }
            } catch (error) {
                throw (0, external_request_timeout_js_namespaceObject.restoreHardTimeoutError)(toError(error), streamSignal);
            } finally{
                cleanupStreamSignal();
            }
            content = accumulated;
            debugProfileStats(`streaming model, ${modelName}, mode, ${modelFamily || 'default'}, cost-ms, ${timeCost}, temperature, ${temperature ?? ''}`);
        } else {
            const retryCount = normalizeRetryCount(modelConfig.retryCount);
            const retryInterval = modelConfig.retryInterval ?? 2000;
            const maxAttempts = retryCount + 1;
            let lastError;
            const attemptErrors = [];
            for(let attempt = 1; attempt <= maxAttempts; attempt++){
                const { signal: attemptSignal, cleanup: cleanupAttemptSignal } = (0, external_request_timeout_js_namespaceObject.buildRequestAbortSignal)(effectiveTimeoutMs, options?.abortSignal);
                try {
                    const result = await completion.create({
                        model: modelName,
                        messages: messagesWithImageDetail,
                        ...requestConfig,
                        stream: false
                    }, {
                        signal: attemptSignal
                    });
                    timeCost = Date.now() - startTime;
                    requestId = getLatestSuccessfulResponseRequestId(openAIErrorResponseContext) ?? result._request_id;
                    debugProfileStats(`model, ${modelName}, mode, ${modelFamily || 'default'}, prompt-tokens, ${result.usage?.prompt_tokens || ''}, completion-tokens, ${result.usage?.completion_tokens || ''}, total-tokens, ${result.usage?.total_tokens || ''}, cost-ms, ${timeCost}, requestId, ${requestId || ''}, temperature, ${temperature ?? ''}`);
                    debugProfileDetail(`model usage detail: ${JSON.stringify(result.usage)}`);
                    if (!result.choices) throw new Error(`invalid response from LLM service: ${JSON.stringify(result)}`);
                    rawChoiceMessage = result.choices[0].message;
                    const parsedMessage = adapter.chatCompletion.extractContentAndReasoning(result.choices[0].message);
                    content = parsedMessage.content;
                    accumulatedReasoning = parsedMessage.reasoning_content;
                    usage = result.usage;
                    responseModelName = result.model;
                    content = resolveContentWithReasoningFallback(content, accumulatedReasoning);
                    if (!hasUsableText(content)) {
                        const errorUsage = buildUsageInfo(usage, requestId);
                        if (errorUsage && modelRuntime.onUsage) modelRuntime.onUsage(errorUsage);
                        throw new AIResponseParseError('empty content from AI model', content || '', errorUsage, rawChoiceMessage);
                    }
                    break;
                } catch (error) {
                    lastError = (0, external_request_timeout_js_namespaceObject.restoreHardTimeoutError)(toError(error), attemptSignal);
                    attemptErrors.push({
                        attempt,
                        error: lastError
                    });
                    const wasHardTimeout = (0, external_request_timeout_js_namespaceObject.isHardTimeoutError)(lastError);
                    if (wasHardTimeout) warnCall(`AI call hit hard timeout (${effectiveTimeoutMs}ms, attempt ${attempt}/${maxAttempts}, model ${modelName}, slot ${modelConfig.slot})`);
                    if (options?.abortSignal?.aborted) break;
                    if (attempt < maxAttempts) {
                        warnCall(`AI call failed (attempt ${attempt}/${maxAttempts}), retrying in ${retryInterval}ms... Error: ${lastError.message}`);
                        await new Promise((resolve)=>setTimeout(resolve, retryInterval));
                    }
                } finally{
                    cleanupAttemptSignal();
                }
            }
            if (!content) {
                (0, utils_namespaceObject.assert)(lastError, 'AI model request failed without recording an attempt error');
                throw appendAIRequestFailureSummary(lastError, attemptErrors, maxAttempts);
            }
        }
        debugCall(`response reasoning content: ${accumulatedReasoning}`);
        debugCall(`response content: ${content}`);
        if (isStreaming && !usage) {
            const estimatedTokens = Math.max(1, Math.floor((content || '').length / 4));
            usage = {
                prompt_tokens: estimatedTokens,
                completion_tokens: estimatedTokens,
                total_tokens: 2 * estimatedTokens
            };
        }
        const finalUsage = buildUsageInfo(usage, requestId);
        if (!usageReported && finalUsage && modelRuntime.onUsage) modelRuntime.onUsage(finalUsage);
        return {
            content: content || '',
            reasoning_content: accumulatedReasoning || void 0,
            rawChoiceMessage,
            usage: finalUsage,
            isStreamed: !!isStreaming
        };
    } catch (e) {
        warnCall('call AI error', e);
        if (e instanceof AIResponseParseError) throw e;
        const newError = new Error(`failed to call ${isStreaming ? 'streaming ' : ''}AI model service (${modelName}): ${e.message}${(0, external_openai_error_js_namespaceObject.formatOpenAIAPIErrorDetails)(e, openAIErrorResponseContext)}\nTrouble shooting: https://midscenejs.com/model-provider.html`, {
            cause: e
        });
        throw newError;
    }
}
async function callAIWithObjectResponse(messages, modelRuntime, options) {
    const { config: modelConfig, adapter } = modelRuntime;
    return (0, external_semantic_retry_js_namespaceObject.callAiAndParseWithRetry)({
        callAi: ()=>callAI(messages, modelRuntime, {
                abortSignal: options?.abortSignal,
                expectedJsonObjectResponse: true
            }),
        parseResponse: (response)=>{
            (0, utils_namespaceObject.assert)(response, 'empty response');
            const jsonContent = adapter.jsonParser(response.content, {
                source: options?.jsonParserSource ?? 'generic-object'
            });
            if (!jsonContent || 'object' != typeof jsonContent) throw new Error(`failed to parse json response from model (${modelConfig.modelName}): ${response.content}`);
            return {
                content: jsonContent,
                contentString: response.content,
                usage: response.usage,
                reasoning_content: response.reasoning_content,
                rawChoiceMessage: response.rawChoiceMessage
            };
        },
        toParseError: (error, response)=>{
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new AIResponseParseError(errorMessage, response.content, response.usage, response.rawChoiceMessage, response.reasoning_content);
        },
        parseRetryTimes: options?.retryTimes ?? modelConfig.retryCount,
        parseRetryInterval: options?.retryInterval ?? modelConfig.retryInterval,
        abortSignal: options?.abortSignal
    });
}
async function callAIWithStringResponse(msgs, modelRuntime, options) {
    const { content, usage, rawChoiceMessage } = await callAI(msgs, modelRuntime, options);
    return {
        content,
        usage,
        rawChoiceMessage
    };
}
exports.AIResponseParseError = __webpack_exports__.AIResponseParseError;
exports.INTERNAL_CALL_ID_FIELD = __webpack_exports__.INTERNAL_CALL_ID_FIELD;
exports.callAI = __webpack_exports__.callAI;
exports.callAIWithObjectResponse = __webpack_exports__.callAIWithObjectResponse;
exports.callAIWithStringResponse = __webpack_exports__.callAIWithStringResponse;
exports.createChatClient = __webpack_exports__.createChatClient;
exports.extractJSONFromCodeBlock = __webpack_exports__.extractJSONFromCodeBlock;
exports.parseModelResponseJson = __webpack_exports__.parseModelResponseJson;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "AIResponseParseError",
    "INTERNAL_CALL_ID_FIELD",
    "callAI",
    "callAIWithObjectResponse",
    "callAIWithStringResponse",
    "createChatClient",
    "extractJSONFromCodeBlock",
    "parseModelResponseJson"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=index.js.map