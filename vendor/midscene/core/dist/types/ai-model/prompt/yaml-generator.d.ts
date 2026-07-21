import type { StreamingAIResponse, StreamingCodeGenerationOptions } from '../../types';
import type { IModelConfig } from '@midscene/shared/env';
import { type ModelRuntime } from '../models';
import { type ChromeRecordedEvent, type EventCounts, type EventSummary, type FilteredEvents, type InputDescription, type ProcessedEvent, type RecorderGenerationContext, type RecorderGenerationInput, type RecorderGenerationOptions, createEventCounts, createMessageContent, extractInputDescriptions, filterEventsByType, getScreenshotsForLLM, prepareEventSummary, prepareRecorderGenerationContext, processEventsForLLM, validateEvents } from './recorder-generation-common';
export type YamlGenerationOptions = RecorderGenerationOptions;
export type RecorderYamlGenerationInput = RecorderGenerationInput;
export type { ChromeRecordedEvent, EventCounts, EventSummary, FilteredEvents, InputDescription, ProcessedEvent, RecorderGenerationContext, };
export { createEventCounts, createMessageContent, extractInputDescriptions, filterEventsByType, getScreenshotsForLLM, prepareEventSummary, prepareRecorderGenerationContext, processEventsForLLM, validateEvents, };
export declare const generateRecorderYamlTest: (input: RecorderYamlGenerationInput, model: IModelConfig | ModelRuntime) => Promise<string>;
export declare const generateRecorderYamlTestStream: (input: RecorderYamlGenerationInput, options: StreamingCodeGenerationOptions, model: IModelConfig | ModelRuntime) => Promise<StreamingAIResponse>;
/**
 * Generates YAML test configuration from recorded events using AI
 */
export declare const generateYamlTest: (events: ChromeRecordedEvent[], options: YamlGenerationOptions, model: IModelConfig | ModelRuntime) => Promise<string>;
/**
 * Generates YAML test configuration from recorded events using AI with streaming support
 */
export declare const generateYamlTestStream: (events: ChromeRecordedEvent[], options: YamlGenerationOptions & StreamingCodeGenerationOptions, model: IModelConfig | ModelRuntime) => Promise<StreamingAIResponse>;
