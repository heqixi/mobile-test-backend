import type { ChatCompletionCallContext, ChatCompletionParamsResult } from '../model-adapter/types';
export declare const glmAdapters: {
    'glm-v': {
        chatCompletion: {
            unsupportedUserConfig: ("reasoningEffort" | "reasoningBudget")[];
            buildChatCompletionParams: (input: ChatCompletionCallContext) => ChatCompletionParamsResult;
            useReasoningAsContentFallback: true;
        };
        locate: {
            resultAdapter: {
                coordinates: {
                    shape: "bbox";
                    order: "xy";
                    normalizedBy: number;
                };
            };
        };
    };
};
