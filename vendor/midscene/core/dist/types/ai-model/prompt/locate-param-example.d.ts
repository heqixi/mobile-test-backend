import type { LocateResultPromptSpec } from '../shared/model-locate-result';
export declare function formatLocateExampleValue(value: unknown): string;
export declare function locateParamExample(prompt: string, promptSpec?: LocateResultPromptSpec, exampleValue?: unknown): string;
