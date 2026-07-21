import { type MidsceneRecorderEvent, type MidsceneRecorderMarkdownScreenshotAsset, type MidsceneRecorderSemantic, type MidsceneRecorderTarget } from '@midscene/shared/recorder';
export interface EventCounts {
    navigation: number;
    click: number;
    input: number;
    scroll: number;
    total: number;
}
export interface InputDescription {
    description: string;
    value: string;
}
export interface ProcessedEvent {
    hashId: string;
    type: string;
    timestamp: number;
    source?: string;
    actionType?: string;
    url?: string;
    title?: string;
    semantic?: MidsceneRecorderSemantic;
    description?: string;
    value?: string;
    typedText?: string;
    inputIndex?: number;
    isSequentialInput?: boolean;
    hasNeighborInput?: boolean;
    previousInputDescription?: string;
    previousActionDescription?: string;
    nextActionDescription?: string;
    neighborInputValues?: string[];
    pageInfo?: any;
    elementRect?: any;
    screenshotPath?: string;
}
export interface EventSummary {
    testName: string;
    startUrl: string;
    eventCounts: EventCounts;
    urls: string[];
    clickDescriptions: string[];
    inputDescriptions: InputDescription[];
    events: ProcessedEvent[];
}
export interface RecorderGenerationContext {
    summary: EventSummary;
    screenshotAssets: MidsceneRecorderMarkdownScreenshotAsset[];
}
export type ChromeRecordedEvent = MidsceneRecorderEvent;
export interface RecorderGenerationOptions {
    testName?: string;
    includeTimestamps?: boolean;
    maxScreenshots?: number;
    description?: string;
    /** Language for human-readable generated content (e.g. 'English', 'Chinese'). Keys and API names are kept as-is. */
    language?: string;
    navigationInfo?: {
        urls?: string[];
        titles?: string[];
        initialViewport?: {
            width?: number;
            height?: number;
        };
    };
}
export interface RecorderGenerationInput extends RecorderGenerationOptions {
    target: MidsceneRecorderTarget;
    events: MidsceneRecorderEvent[];
}
export interface FilteredEvents {
    navigationEvents: ChromeRecordedEvent[];
    clickEvents: ChromeRecordedEvent[];
    inputEvents: ChromeRecordedEvent[];
    scrollEvents: ChromeRecordedEvent[];
}
export declare function compactRecorderSemanticForGeneration(semantic?: MidsceneRecorderSemantic): MidsceneRecorderSemantic | undefined;
export declare const validateEvents: (events: ChromeRecordedEvent[]) => void;
export declare const getScreenshotsForLLM: (events: ChromeRecordedEvent[], maxScreenshots?: number) => string[];
export declare const filterEventsByType: (events: ChromeRecordedEvent[]) => FilteredEvents;
export declare const createEventCounts: (filteredEvents: FilteredEvents, totalEvents: number) => EventCounts;
export declare const extractInputDescriptions: (inputEvents: ChromeRecordedEvent[]) => InputDescription[];
export declare const processEventsForLLM: (events: ChromeRecordedEvent[], screenshotPathByEventHash?: Map<string, string>) => ProcessedEvent[];
export declare const prepareEventSummary: (events: ChromeRecordedEvent[], options?: {
    testName?: string;
    maxScreenshots?: number;
    screenshotPathByEventHash?: Map<string, string>;
}) => EventSummary;
export declare function prepareRecorderGenerationContext(input: RecorderGenerationInput): RecorderGenerationContext;
export declare const createMessageContent: (promptText: string, screenshots?: string[], includeScreenshots?: boolean) => any[];
