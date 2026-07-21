import type { TUserPrompt } from '../common';
export type RunMarkdownTransformResult = {
    prompt: TUserPrompt;
    imageCount: number;
};
export declare const markdownToAiActPrompt: (markdown: string, sourcePath?: string) => Promise<RunMarkdownTransformResult>;
