import { MIDSCENE_LANGFUSE_DEBUG, MIDSCENE_LANGSMITH_DEBUG, globalConfigManager } from "@midscene/shared/env";
import { getDebug } from "@midscene/shared/logger";
import { assert, ifInBrowser } from "@midscene/shared/utils";
import openai_0 from "openai";
import { callAIWithCodexAppServer, isCodexAppServerProvider } from "./codex-app-server.mjs";
import { formatOpenAIAPIErrorDetails, wrapOpenAICompatibleFetch } from "./openai-error.mjs";
import { buildRequestAbortSignal, isHardTimeoutError, resolveEffectiveTimeoutMs, restoreHardTimeoutError } from "./request-timeout.mjs";
import { callAiAndParseWithRetry } from "./semantic-retry.mjs";
import { extractJSONFromCodeBlock, parseModelResponseJson } from "./json.mjs";
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
    const warnClient = getDebug('ai:call', {
        console: true
    });
    const debugProxy = getDebug('ai:call:proxy');
    const warnProxy = getDebug('ai:call:proxy', {
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
        if (ifInBrowser) warnProxy('HTTP proxy is configured but not supported in browser environment');
        else {
            const moduleName = 'undici';
            const { ProxyAgent } = await import(moduleName);
            proxyAgent = new ProxyAgent({
                uri: httpProxy
            });
        }
    } else if (socksProxy) {
        debugProxy('using socks proxy', sanitizeProxyUrl(socksProxy));
        if (ifInBrowser) warnProxy('SOCKS proxy is configured but not supported in browser environment');
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
    const effectiveTimeoutMs = resolveEffectiveTimeoutMs({
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
        fetch: wrapOpenAICompatibleFetch(openAIErrorResponseContext),
        maxRetries: 0,
        ...null !== effectiveTimeoutMs ? {
            timeout: effectiveTimeoutMs
        } : {},
        dangerouslyAllowBrowser: true
    };
    const baseOpenAI = new openai_0(openAIOptions);
    let openai = baseOpenAI;
    if (openai && globalConfigManager.getEnvConfigInBoolean(MIDSCENE_LANGSMITH_DEBUG)) {
        if (ifInBrowser) throw new Error('langsmith is not supported in browser');
        warnClient('DEBUGGING MODE: langsmith wrapper enabled');
        const langsmithModule = 'langsmith/wrappers';
        const { wrapOpenAI } = await import(langsmithModule);
        openai = wrapOpenAI(openai);
    }
    if (openai && globalConfigManager.getEnvConfigInBoolean(MIDSCENE_LANGFUSE_DEBUG)) {
        if (ifInBrowser) throw new Error('langfuse is not supported in browser');
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
    if (isCodexAppServerProvider(modelConfig.openaiBaseURL)) {
        const codexResult = await callAIWithCodexAppServer(messages, modelConfig, {
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
    const effectiveTimeoutMs = resolveEffectiveTimeoutMs(modelConfig);
    const extraBody = modelConfig.extraBody;
    const debugCall = getDebug('ai:call');
    const warnCall = getDebug('ai:call', {
        console: true
    });
    const debugProfileStats = getDebug('ai:profile:stats');
    const debugProfileDetail = getDebug('ai:profile:detail');
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
            const { signal: streamSignal, cleanup: cleanupStreamSignal } = buildRequestAbortSignal(effectiveTimeoutMs, options?.abortSignal);
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
                throw restoreHardTimeoutError(toError(error), streamSignal);
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
                const { signal: attemptSignal, cleanup: cleanupAttemptSignal } = buildRequestAbortSignal(effectiveTimeoutMs, options?.abortSignal);
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
                    lastError = restoreHardTimeoutError(toError(error), attemptSignal);
                    attemptErrors.push({
                        attempt,
                        error: lastError
                    });
                    const wasHardTimeout = isHardTimeoutError(lastError);
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
                assert(lastError, 'AI model request failed without recording an attempt error');
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
        const newError = new Error(`failed to call ${isStreaming ? 'streaming ' : ''}AI model service (${modelName}): ${e.message}${formatOpenAIAPIErrorDetails(e, openAIErrorResponseContext)}\nTrouble shooting: https://midscenejs.com/model-provider.html`, {
            cause: e
        });
        throw newError;
    }
}
async function callAIWithObjectResponse(messages, modelRuntime, options) {
    const { config: modelConfig, adapter } = modelRuntime;
    return callAiAndParseWithRetry({
        callAi: ()=>callAI(messages, modelRuntime, {
                abortSignal: options?.abortSignal,
                expectedJsonObjectResponse: true
            }),
        parseResponse: (response)=>{
            assert(response, 'empty response');
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
export { AIResponseParseError, INTERNAL_CALL_ID_FIELD, callAI, callAIWithObjectResponse, callAIWithStringResponse, createChatClient, extractJSONFromCodeBlock, parseModelResponseJson };

//# sourceMappingURL=index.mjs.map