import type { LocateResultPromptSpec } from '../shared/model-locate-result';
export declare function systemPromptToLocateSection(promptSpec: LocateResultPromptSpec): string;
export declare const sectionLocatorInstruction: (sectionDescription: string) => string;
