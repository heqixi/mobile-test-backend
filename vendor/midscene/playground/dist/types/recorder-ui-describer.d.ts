import type { Rect } from '@midscene/core';
import type { IModelConfig } from '@midscene/shared/env';
import type { MidsceneRecorderEvent, MidsceneRecorderTarget } from '@midscene/shared/recorder';
export interface DescribeRecorderUIEventInput {
    event: MidsceneRecorderEvent;
    target?: MidsceneRecorderTarget;
}
export interface DescribeRecorderUIEventOptions {
    maxRetries?: number;
    retryDelayMs?: number;
    concurrency?: number;
}
export interface DescribeRecorderUIEventResult {
    event: MidsceneRecorderEvent;
    usedFallback: boolean;
    error?: string;
}
export declare function getRecorderUIEventTargetRect(event: MidsceneRecorderEvent): Rect | null;
export declare function describeRecorderUIEvent(input: DescribeRecorderUIEventInput, modelConfig: IModelConfig, options?: DescribeRecorderUIEventOptions): Promise<DescribeRecorderUIEventResult>;
export declare function describeRecorderUIEvents(inputs: DescribeRecorderUIEventInput[], modelConfig: IModelConfig, options?: DescribeRecorderUIEventOptions): Promise<DescribeRecorderUIEventResult[]>;
