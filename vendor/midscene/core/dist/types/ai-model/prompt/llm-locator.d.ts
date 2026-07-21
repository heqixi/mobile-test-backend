import type { LocateResultPromptSpec } from '../shared/model-locate-result';
export declare function systemPromptToLocateElement(promptSpec: LocateResultPromptSpec): string;
export declare const findElementPrompt: (targetElementDescription: string) => string;
