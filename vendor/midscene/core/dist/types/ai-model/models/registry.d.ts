import type { IModelConfig, TModelFamily } from '@midscene/shared/env';
import type { ModelAdapter, ModelAdapterDefinition, ModelRuntime } from '../model-adapter/types';
export declare const MODEL_ADAPTER_CONFIGS: {
    'xiaomi-mimo': {
        chatCompletion: {
            unsupportedUserConfig: ("reasoningEffort" | "reasoningBudget")[];
            buildChatCompletionParams: (input: import("../model-adapter/types").ChatCompletionCallContext) => import("../model-adapter/types").ChatCompletionParamsResult;
            useReasoningAsContentFallback: true;
        };
    };
    kimi: {
        chatCompletion: {
            unsupportedUserConfig: ("reasoningEffort" | "reasoningBudget")[];
            buildChatCompletionParams: (input: import("../model-adapter/types").ChatCompletionCallContext) => import("../model-adapter/types").ChatCompletionParamsResult;
            useReasoningAsContentFallback: true;
        };
        locate: {
            resultAdapter: {
                coordinates: {
                    readonly shape: "point";
                    readonly order: "xy";
                    readonly normalizedBy: 1;
                };
                parseRawLocateValue: (input: unknown) => import("../shared/model-locate-result").LocateResultValue;
            };
        };
    };
    'gpt-5': {
        chatCompletion: {
            unsupportedUserConfig: "reasoningBudget"[];
            buildChatCompletionParams: (input: import("../model-adapter/types").ChatCompletionCallContext) => import("../model-adapter/types").ChatCompletionParamsResult;
            resolveImageDetail: (input: import("../model-adapter/types").ChatCompletionCallContext) => import("../model-adapter/types").ImageDetail | undefined;
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
    'auto-glm': ModelAdapterDefinition;
    'auto-glm-multilingual': ModelAdapterDefinition;
    'glm-v': {
        chatCompletion: {
            unsupportedUserConfig: ("reasoningEffort" | "reasoningBudget")[];
            buildChatCompletionParams: (input: import("../model-adapter/types").ChatCompletionCallContext) => import("../model-adapter/types").ChatCompletionParamsResult;
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
    'vlm-ui-tars': ModelAdapterDefinition;
    'vlm-ui-tars-doubao': ModelAdapterDefinition;
    'vlm-ui-tars-doubao-1.5': ModelAdapterDefinition;
    gemini: {
        chatCompletion: {
            unsupportedUserConfig: "reasoningBudget"[];
            buildChatCompletionParams: (input: import("../model-adapter/types").ChatCompletionCallContext) => import("../model-adapter/types").ChatCompletionParamsResult;
            messageExtraction: {
                kind: "custom";
                extractContentAndReasoning: (message: (import("../model-adapter/types").ChatCompletionContentSource | (Omit<import("openai/resources/index.mjs").ChatCompletionMessage, "content"> & {
                    content: string | null | (Record<string, unknown> & {
                        text?: string;
                        thought?: boolean;
                    })[];
                    reasoning_content?: string;
                    extra_content?: unknown;
                }) | (Omit<import("openai/resources/index.mjs").ChatCompletionChunk.Choice.Delta, "content"> & {
                    content: string | null | (Record<string, unknown> & {
                        text?: string;
                        thought?: boolean;
                    })[];
                    reasoning_content?: string;
                    extra_content?: unknown;
                })) | undefined) => import("../model-adapter/types").ContentAndReasoning;
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
    'doubao-vision': ModelAdapterDefinition;
    'doubao-seed': ModelAdapterDefinition;
    'qwen2.5-vl': {
        chatCompletion: {
            unsupportedUserConfig: ("reasoningEnabled" | "reasoningEffort" | "reasoningBudget")[];
            buildChatCompletionParams: (input: import("../model-adapter/types").ChatCompletionCallContext) => import("../model-adapter/types").ChatCompletionParamsResult;
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
                parseRawLocateValue: (input: unknown) => import("../shared/model-locate-result").LocateResultValue;
                mapLocateResultToPixelBbox: (result: import("../shared/model-locate-result").LocateResultValue) => import("../shared/model-locate-result").PixelBbox;
            };
        };
    };
    'qwen3-vl': ModelAdapterDefinition;
    qwen3: ModelAdapterDefinition;
    'qwen3.5': ModelAdapterDefinition;
    'qwen3.6': ModelAdapterDefinition;
};
export declare function getModelAdapter(modelFamily?: TModelFamily): ModelAdapter;
export declare function getModelRuntime(config: IModelConfig): ModelRuntime;
