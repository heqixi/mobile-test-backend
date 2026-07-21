import type { ChatCompletionCallContext, ChatCompletionParamsResult } from '../model-adapter/types';
export declare const mimoAdapters: {
    'xiaomi-mimo': {
        chatCompletion: {
            unsupportedUserConfig: ("reasoningEffort" | "reasoningBudget")[];
            buildChatCompletionParams: (input: ChatCompletionCallContext) => ChatCompletionParamsResult;
            useReasoningAsContentFallback: true;
        };
    };
};
