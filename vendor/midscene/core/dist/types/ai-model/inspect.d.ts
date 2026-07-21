import type { AIUsageInfo, Rect, ServiceExtractOption, UIContext } from '../types';
import type { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/index';
import type { TMultimodalPrompt, TUserPrompt } from '../common';
import type { ModelRuntime } from './models';
import type { LocateModelResponse, LocateOptions, LocateRequestContext, LocateResult, SearchAreaConfig } from './workflows/inspect/types';
export type InspectAIArgs = [
    ChatCompletionSystemMessageParam,
    ...ChatCompletionUserMessageParam[]
];
export { userPromptToString as extraTextFromUserPrompt, multimodalPromptToChatMessages as promptsToChatParam, } from '../common';
export declare function buildSearchAreaConfig(options: {
    context: UIContext;
    baseRect: Rect;
}): Promise<SearchAreaConfig>;
export declare function AiLocateElement(options: LocateOptions & {
    targetElementDescription: TUserPrompt;
}): Promise<LocateResult>;
export declare function genericLocate(_elementDescription: TUserPrompt, options: LocateOptions, locateRequest: LocateRequestContext): Promise<LocateModelResponse>;
export declare function AiLocateSection(options: {
    context: UIContext;
    sectionDescription: TUserPrompt;
    modelRuntime: ModelRuntime;
    abortSignal?: AbortSignal;
}): Promise<{
    searchAreaConfig?: SearchAreaConfig;
    error?: string;
    rawResponse: string;
    rawChoiceMessage?: unknown;
    usage?: AIUsageInfo;
}>;
export declare function AiExtractElementInfo<T>(options: {
    dataQuery: string | Record<string, string>;
    multimodalPrompt?: TMultimodalPrompt;
    context: UIContext;
    pageDescription?: string;
    extractOption?: ServiceExtractOption;
    modelRuntime: ModelRuntime;
    abortSignal?: AbortSignal;
}): Promise<{
    parseResult: import("../types").AIDataExtractionResponse<T>;
    rawResponse: string;
    rawChoiceMessage: unknown;
    usage: AIUsageInfo | undefined;
    reasoning_content: string | undefined;
}>;
export declare function AiJudgeOrderSensitive(description: string, modelRuntime: ModelRuntime): Promise<{
    isOrderSensitive: boolean;
    usage?: AIUsageInfo;
}>;
