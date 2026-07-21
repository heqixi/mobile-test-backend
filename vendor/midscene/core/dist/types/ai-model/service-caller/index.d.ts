import type { AIUsageInfo } from '../../types';
import type { StreamingCallback } from '../../types';
export declare class AIResponseParseError extends Error {
    usage?: AIUsageInfo;
    /**
     * Adapter-extracted content used by Midscene for parsing. This is not the
     * full provider response or choices[0].message.
     */
    rawResponse: string;
    rawChoiceMessage?: unknown;
    reasoningContent?: string;
    constructor(message: string, rawResponse: string, usage?: AIUsageInfo, rawChoiceMessage?: unknown, reasoningContent?: string);
}
import { type IModelConfig, type TModelFamily } from '@midscene/shared/env';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import type { ModelRuntime } from '../models';
import type { AIArgs } from '../types';
import type { JsonParserSource } from './json';
import { type OpenAIErrorResponseContext } from './openai-error';
export { extractJSONFromCodeBlock, parseModelResponseJson, } from './json';
export type { JsonParser } from './json';
/**
 * Internal field name stamped onto every AIUsageInfo shaped by callAI().
 * Used for cross-path dedup when the provider does not return a request_id.
 */
export declare const INTERNAL_CALL_ID_FIELD = "_midscene_call_id";
export declare function createChatClient({ modelConfig, }: {
    modelConfig: IModelConfig;
}): Promise<{
    completion: OpenAI.Chat.Completions;
    modelName: string;
    modelDescription: string;
    modelFamily: TModelFamily | undefined;
    openAIErrorResponseContext: OpenAIErrorResponseContext;
}>;
interface CallAIOptions {
    stream?: boolean;
    onChunk?: StreamingCallback;
    abortSignal?: AbortSignal;
    requiresOriginalImageDetail?: boolean;
    expectedJsonObjectResponse?: boolean;
}
export declare function callAI(messages: ChatCompletionMessageParam[], modelRuntime: ModelRuntime, options?: CallAIOptions): Promise<{
    content: string;
    reasoning_content?: string;
    rawChoiceMessage?: unknown;
    usage?: AIUsageInfo;
    isStreamed: boolean;
}>;
export declare function callAIWithObjectResponse<T>(messages: ChatCompletionMessageParam[], modelRuntime: ModelRuntime, options?: {
    abortSignal?: AbortSignal;
    jsonParserSource?: JsonParserSource;
    retryTimes?: number;
    retryInterval?: number;
}): Promise<{
    content: T;
    contentString: string;
    usage?: AIUsageInfo;
    reasoning_content?: string;
    rawChoiceMessage?: unknown;
}>;
export declare function callAIWithStringResponse(msgs: AIArgs, modelRuntime: ModelRuntime, options?: Pick<CallAIOptions, 'abortSignal' | 'requiresOriginalImageDetail'>): Promise<{
    content: string;
    usage?: AIUsageInfo;
    rawChoiceMessage?: unknown;
}>;
