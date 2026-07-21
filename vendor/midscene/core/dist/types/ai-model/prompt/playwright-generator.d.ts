import type { StreamingAIResponse, StreamingCodeGenerationOptions } from '../../types';
import type { IModelConfig } from '@midscene/shared/env';
import { type ModelRuntime } from '../models';
import { type ChromeRecordedEvent, type EventCounts, type EventSummary, type InputDescription, type ProcessedEvent, createEventCounts, createMessageContent, extractInputDescriptions, filterEventsByType, getScreenshotsForLLM, prepareEventSummary, processEventsForLLM, validateEvents } from './recorder-generation-common';
export interface PlaywrightGenerationOptions {
    testName?: string;
    includeScreenshots?: boolean;
    includeTimestamps?: boolean;
    maxScreenshots?: number;
    description?: string;
    viewportSize?: {
        width: number;
        height: number;
    };
    waitForNetworkIdle?: boolean;
    waitForNetworkIdleTimeout?: number;
}
export type { ChromeRecordedEvent, EventCounts, InputDescription, ProcessedEvent, EventSummary, };
export { getScreenshotsForLLM, filterEventsByType, createEventCounts, extractInputDescriptions, processEventsForLLM, prepareEventSummary, createMessageContent, validateEvents, };
/**
 * Generates Playwright test code from recorded events
 */
export declare const generatePlaywrightTest: (events: ChromeRecordedEvent[], options: PlaywrightGenerationOptions, model: IModelConfig | ModelRuntime) => Promise<string>;
/**
 * Generates Playwright test code from recorded events with streaming support
 */
export declare const generatePlaywrightTestStream: (events: ChromeRecordedEvent[], options: PlaywrightGenerationOptions & StreamingCodeGenerationOptions, model: IModelConfig | ModelRuntime) => Promise<StreamingAIResponse>;
