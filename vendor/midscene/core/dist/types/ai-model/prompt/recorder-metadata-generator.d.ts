import type { IModelConfig } from '@midscene/shared/env';
import { type MidsceneRecorderEvent, type MidsceneRecorderTarget } from '@midscene/shared/recorder';
export interface RecorderMetadataGenerationInput {
    target: MidsceneRecorderTarget;
    events: MidsceneRecorderEvent[];
    fallbackName?: string;
    maxScreenshots?: number;
}
export interface RecorderGeneratedMetadata {
    title?: string;
    description?: string;
}
export declare function generateRecorderSessionMetadata(input: RecorderMetadataGenerationInput, modelConfig: IModelConfig): Promise<RecorderGeneratedMetadata>;
