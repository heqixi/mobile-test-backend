import type OpenAI from 'openai';
import type { ChatCompletionCallContext, ChatCompletionContentSource, ChatCompletionParamsResult, ContentAndReasoning } from '../model-adapter/types';
type GeminiContentPart = Record<string, unknown> & {
    text?: string;
    thought?: boolean;
};
type GeminiContentExtension = {
    content: string | null | GeminiContentPart[];
    reasoning_content?: string;
    extra_content?: unknown;
};
type GeminiContentSource = ChatCompletionContentSource | (Omit<OpenAI.Chat.Completions.ChatCompletionMessage, 'content'> & GeminiContentExtension) | (Omit<OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta, 'content'> & GeminiContentExtension);
export declare const extractGeminiContentAndReasoning: (message: GeminiContentSource | undefined) => ContentAndReasoning;
export declare const geminiAdapters: {
    gemini: {
        chatCompletion: {
            unsupportedUserConfig: "reasoningBudget"[];
            buildChatCompletionParams: (input: ChatCompletionCallContext) => ChatCompletionParamsResult;
            messageExtraction: {
                kind: "custom";
                extractContentAndReasoning: (message: GeminiContentSource | undefined) => ContentAndReasoning;
            };
        };
        locate: {
            resultAdapter: {
                coordinates: {
                    shape: "bbox";
                    order: "yx";
                    normalizedBy: number;
                };
            };
        };
    };
};
export {};
