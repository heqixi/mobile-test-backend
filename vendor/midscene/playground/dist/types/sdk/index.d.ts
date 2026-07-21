import type { ConnectivityTestResult, DeviceAction } from '@midscene/core';
import type { TModelConfig } from '@midscene/shared/env';
import type { PlaygroundRecorderCapabilitiesResult, PlaygroundRecorderDescribeResult, PlaygroundRecorderEvent, PlaygroundRecorderEventsResult, PlaygroundRecorderStartResult, PlaygroundSessionSetup, PlaygroundSessionState, PlaygroundSessionTarget } from '../platform';
import type { PlaygroundRuntimeInfo } from '../runtime-metadata';
import type { BeforeActionHook, ExecutionOptions, FormValue, PlaygroundConfig, PlaygroundReportRef, ValidationResult } from '../types';
export type PlaygroundInteractPayload = {
    actionType: string;
} & Record<string, unknown>;
export interface PlaygroundInteractResult {
    ok: boolean;
    error?: string;
}
export type PlaygroundPageRecordedEvent = PlaygroundRecorderEvent;
export type { PlaygroundRecorderCapabilitiesResult, PlaygroundRecorderDescribeResult, PlaygroundRecorderEventsResult, PlaygroundRecorderStartResult, };
export declare class PlaygroundSDK {
    private adapter;
    private beforeActionHook?;
    constructor(config: PlaygroundConfig);
    private createAdapter;
    private runtimeMetadataAdapter;
    executeAction(actionType: string, value: FormValue, options: ExecutionOptions): Promise<unknown>;
    setBeforeActionHook(hook?: BeforeActionHook): void;
    getActionSpace(context?: unknown): Promise<DeviceAction<unknown>[]>;
    validateStructuredParams(value: FormValue, action: DeviceAction<unknown> | undefined): ValidationResult;
    formatErrorMessage(error: any): string;
    createDisplayContent(value: FormValue, needsStructuredParams: boolean, action: DeviceAction<unknown> | undefined): string;
    get id(): string | undefined;
    checkStatus(): Promise<boolean>;
    overrideConfig(aiConfig: any): Promise<void>;
    runConnectivityTest(aiConfig: TModelConfig): Promise<ConnectivityTestResult>;
    getTaskProgress(requestId: string): Promise<{
        executionDump?: any;
    }>;
    cancelTask(requestId: string): Promise<any>;
    onDumpUpdate(callback: (dump: string, executionDump?: any) => void): void;
    onProgressUpdate(callback: (tip: string) => void): void;
    cancelExecution(requestId: string): Promise<{
        dump: any | null;
        reportHTML: string | null;
        report: PlaygroundReportRef | null;
    } | null>;
    getCurrentExecutionData(): Promise<{
        dump: any | null;
        reportHTML: string | null;
        report?: PlaygroundReportRef | null;
    }>;
    getScreenshot(): Promise<{
        screenshot: string;
        timestamp: number;
    } | null>;
    interact(payload: PlaygroundInteractPayload): Promise<PlaygroundInteractResult>;
    startRecorderSession(sessionId: string): Promise<PlaygroundRecorderStartResult>;
    getRecorderCapabilities(): Promise<PlaygroundRecorderCapabilitiesResult>;
    stopRecorderSession(): Promise<PlaygroundInteractResult>;
    getRecorderEvents(since?: number): Promise<PlaygroundRecorderEventsResult>;
    describeRecorderEventAtPoint(event: PlaygroundRecorderEvent): Promise<PlaygroundRecorderDescribeResult>;
    getRecorderScreenshotAsset(assetId: string): Promise<string | null>;
    getRecorderScreenshotAssetUrl(assetId: string): string | null;
    clearRecorderScreenshotAssets(sessionId: string): Promise<void>;
    pruneRecorderScreenshotAssets(sessionId: string, assetIds: string[]): Promise<void>;
    getInterfaceInfo(): Promise<{
        type: string;
        description?: string;
        size?: {
            width: number;
            height: number;
        };
        navigationState?: {
            isLoading: boolean;
        };
        /** Action names exposed by the connected device's actionSpace. */
        actionTypes?: string[];
    } | null>;
    getRuntimeInfo(): Promise<PlaygroundRuntimeInfo | null>;
    getSessionInfo(): Promise<PlaygroundSessionState | null>;
    getSessionSetup(input?: Record<string, unknown>): Promise<PlaygroundSessionSetup | null>;
    listSessionTargets(): Promise<PlaygroundSessionTarget[]>;
    createSession(input?: Record<string, unknown>): Promise<{
        session: PlaygroundSessionState;
        runtimeInfo: PlaygroundRuntimeInfo;
    }>;
    destroySession(): Promise<{
        session: PlaygroundSessionState;
        runtimeInfo: PlaygroundRuntimeInfo;
    }>;
    getServiceMode(): 'In-Browser-Extension' | 'Server';
}
