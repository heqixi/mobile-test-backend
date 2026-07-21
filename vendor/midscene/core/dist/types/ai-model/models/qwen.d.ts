import type { ChatCompletionCallContext, ChatCompletionParamsResult, ModelAdapterDefinition } from '../model-adapter/types';
import { type LocateResultValue, type PixelBbox } from '../shared/model-locate-result';
declare function parseQwen25RawLocateValue(input: unknown): LocateResultValue;
declare function normalizeQwen25ResultToPixelBbox(result: LocateResultValue): PixelBbox;
export declare const qwenAdapters: {
    'qwen2.5-vl': {
        chatCompletion: {
            unsupportedUserConfig: ("reasoningEnabled" | "reasoningEffort" | "reasoningBudget")[];
            buildChatCompletionParams: (input: ChatCompletionCallContext) => ChatCompletionParamsResult;
        };
        imagePreprocess: {
            padBlockSize: number;
        };
        locate: {
            resultAdapter: {
                coordinates: {
                    readonly shape: "bbox";
                    readonly order: "xy";
                };
                parseRawLocateValue: typeof parseQwen25RawLocateValue;
                mapLocateResultToPixelBbox: typeof normalizeQwen25ResultToPixelBbox;
            };
        };
    };
    'qwen3-vl': ModelAdapterDefinition;
    qwen3: ModelAdapterDefinition;
    'qwen3.5': ModelAdapterDefinition;
    'qwen3.6': ModelAdapterDefinition;
};
export {};
