import type { ChatCompletionCallContext, ChatCompletionParamsResult, ImageDetail } from '../model-adapter/types';
export declare const gptAdapters: {
    'gpt-5': {
        chatCompletion: {
            unsupportedUserConfig: "reasoningBudget"[];
            buildChatCompletionParams: (input: ChatCompletionCallContext) => ChatCompletionParamsResult;
            resolveImageDetail: (input: ChatCompletionCallContext) => ImageDetail | undefined;
        };
        locate: {
            resultAdapter: {
                coordinates: {
                    shape: "bbox";
                    order: "xy";
                };
            };
        };
    };
};
