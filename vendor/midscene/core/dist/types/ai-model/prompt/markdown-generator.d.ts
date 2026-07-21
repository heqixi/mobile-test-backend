import type { IModelConfig } from '@midscene/shared/env';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { type ModelRuntime } from '../models';
import { type RecorderGenerationInput } from './recorder-generation-common';
export type RecorderMarkdownGenerationInput = RecorderGenerationInput;
export declare function createRecorderMarkdownReplayPrompt(input: RecorderMarkdownGenerationInput): ChatCompletionMessageParam[];
export declare function generateRecorderMarkdownReplay(input: RecorderMarkdownGenerationInput, model: IModelConfig | ModelRuntime): Promise<string>;
export declare function convertRecordLogIntoMarkdown(log: RecorderMarkdownGenerationInput, modelConfig: IModelConfig): Promise<string>;
