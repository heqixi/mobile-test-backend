import type { ChatCompletionCallContext, ChatCompletionParamsResult } from '../model-adapter/types';
import { type LocateResultValue } from '../shared/model-locate-result';
declare function parseKimiRawLocateValue(input: unknown): LocateResultValue;
export declare const kimiAdapters: {
    kimi: {
        chatCompletion: {
            unsupportedUserConfig: ("reasoningEffort" | "reasoningBudget")[];
            buildChatCompletionParams: (input: ChatCompletionCallContext) => ChatCompletionParamsResult;
            useReasoningAsContentFallback: true;
        };
        locate: {
            resultAdapter: {
                coordinates: {
                    readonly shape: "point";
                    readonly order: "xy";
                    readonly normalizedBy: 1;
                };
                parseRawLocateValue: typeof parseKimiRawLocateValue;
            };
        };
    };
};
export {};
