import type { ChatCompletionAdapter, ImagePreprocessPolicy, JsonParser, LocateAdapter, ModelAdapter, ModelAdapterDefinition, PlanningAdapter } from './types';
export declare class ResolvedModelAdapter implements ModelAdapter {
    readonly jsonParser: JsonParser;
    readonly chatCompletion: ChatCompletionAdapter;
    readonly imagePreprocess: ImagePreprocessPolicy;
    readonly planning: PlanningAdapter;
    readonly locate: LocateAdapter;
    constructor(config: ModelAdapterDefinition, modelFamily: string);
}
