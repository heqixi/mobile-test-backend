export type MidsceneRecorderEventType = 'click' | 'drag' | 'scroll' | 'input' | 'navigation' | 'setViewport' | 'keydown';
export type MidsceneRecorderSourceKind = 'studio-preview' | 'unsupported' | (string & {});
export type MidsceneRecorderPlatformId = 'web' | 'android' | 'ios' | 'computer' | 'harmony' | (string & {});
export interface MidsceneRecorderElementRect {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
}
export interface MidsceneRecorderPageInfo {
    width: number;
    height: number;
}
/**
 * A screenshot stored outside the recording event payload.
 *
 * Recorder events are persisted in the Studio renderer. Keeping full data
 * URLs there makes long recordings retain every screenshot in the renderer
 * heap, so screenshot bytes live in the Playground run directory instead.
 */
export interface MidsceneRecorderScreenshotAssetRef {
    id: string;
    mimeType: string;
    bytes: number;
}
export interface MidsceneRecorderEvent {
    type: MidsceneRecorderEventType;
    source?: MidsceneRecorderSourceKind;
    actionType?: string;
    rawPayload?: Record<string, unknown>;
    url?: string;
    title?: string;
    value?: string;
    elementRect?: MidsceneRecorderElementRect;
    pageInfo: MidsceneRecorderPageInfo;
    screenshotBefore?: string;
    screenshotAfter?: string;
    /** The single screenshot retained for AI description and Markdown export. */
    screenshotAsset?: MidsceneRecorderScreenshotAssetRef;
    semantic?: MidsceneRecorderSemantic;
    elementDescription?: string;
    descriptionLoading?: boolean;
    screenshotWithBox?: string;
    timestamp: number;
    hashId: string;
    mergedHashIds?: string[];
}
export type MidsceneRecorderSemanticSource = 'aiDescribe' | 'recorderAI' | 'heuristic';
export type MidsceneRecorderSemanticStatus = 'pending' | 'ready' | 'failed';
export type MidsceneRecorderSemanticConfidence = 'high' | 'medium' | 'low';
export interface MidsceneRecorderSemanticAiDescribe {
    verifyPrompt: boolean;
    verifyPassed?: boolean;
    deepLocate?: boolean;
    centerDistance?: number;
    expectedCenter?: [number, number];
    actualCenter?: [number, number];
    annotatedScreenshotPath?: string;
}
export interface MidsceneRecorderSemantic {
    source: MidsceneRecorderSemanticSource;
    status: MidsceneRecorderSemanticStatus;
    elementDescription?: string;
    replayInstruction?: string;
    actionSummary?: string;
    confidence?: MidsceneRecorderSemanticConfidence;
    error?: string;
    aiDescribe?: MidsceneRecorderSemanticAiDescribe;
    fallbackFrom?: MidsceneRecorderSemantic;
}
export interface MidsceneRecorderSemanticAction {
    type: MidsceneRecorderEventType;
    actionType?: string;
    value?: string;
    url?: string;
    scrollDestinationDescription?: string;
}
export interface MidsceneRecorderTarget {
    platformId: MidsceneRecorderPlatformId;
    deviceId?: string;
    label?: string;
    values: Record<string, string | number | boolean>;
}
export interface MidsceneRecorderGeneratedCode {
    markdown?: string;
    yaml?: string;
    playwright?: string;
    updatedAt?: number;
}
export interface MidsceneRecorderMarkdownScreenshotAsset {
    eventIndex: number;
    eventHashId: string;
    eventType: MidsceneRecorderEventType;
    relativePath: string;
    dataUrl: string;
    base64Data: string;
    mimeType: string;
}
export interface MidsceneRecorderMarkdownScreenshotOptions {
    baseDir?: string;
    maxScreenshots?: number;
}
export declare const DEFAULT_MIDSCENE_RECORDER_MARKDOWN_MAX_SCREENSHOTS = 20;
export declare function getMidsceneRecorderSemantic(event: Pick<MidsceneRecorderEvent, 'semantic'>): MidsceneRecorderSemantic | undefined;
export declare function buildMidsceneRecorderReplayInstruction(event: MidsceneRecorderSemanticAction, elementDescription: string): string;
export declare function buildMidsceneRecorderActionSummary(event: MidsceneRecorderSemanticAction, elementDescription: string): string;
export declare function getMidsceneRecorderEventDescription(event: MidsceneRecorderEvent): string;
export declare function getMidsceneRecorderScreenshotsForLLM(events: MidsceneRecorderEvent[], maxScreenshots?: number): string[];
export declare function sanitizeMidsceneRecorderFileName(value: string): string;
export declare function createMidsceneRecorderMarkdownScreenshotAssets(events: MidsceneRecorderEvent[], options?: MidsceneRecorderMarkdownScreenshotOptions): MidsceneRecorderMarkdownScreenshotAsset[];
export declare function stringifyMidsceneRecorderTargetBlock(target: MidsceneRecorderTarget): string;
