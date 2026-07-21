import type { ConnectivityTestResult, DeviceAction, ExecutionDump } from '@midscene/core';
import type { TModelConfig } from '@midscene/shared/env';
import type { PlaygroundRecorderCapabilitiesResult, PlaygroundRecorderDescribeResult, PlaygroundRecorderEvent, PlaygroundRecorderEventsResult, PlaygroundRecorderStartResult, PlaygroundSessionSetup, PlaygroundSessionState, PlaygroundSessionTarget } from '../platform';
import type { PlaygroundRuntimeInfo } from '../runtime-metadata';
import type { ExecutionOptions, FormValue, ValidationResult } from '../types';
import { BasePlaygroundAdapter } from './base';
export declare class RemoteExecutionAdapter extends BasePlaygroundAdapter {
    private serverUrl?;
    private _id?;
    private dumpUpdateCallback?;
    private pollingIntervalId?;
    private resolveReportUrl;
    constructor(serverUrl: string);
    onDumpUpdate(callback: (dump: string, executionDump?: ExecutionDump) => void): void;
    get id(): string | undefined;
    validateParams(value: FormValue, action: DeviceAction<unknown> | undefined): ValidationResult;
    parseStructuredParams(action: DeviceAction<unknown>, params: Record<string, unknown>, options: ExecutionOptions): Promise<unknown[]>;
    formatErrorMessage(error: any): string;
    executeAction(actionType: string, value: FormValue, options: ExecutionOptions): Promise<unknown>;
    private executeViaServer;
    private buildOptionalPayloadParams;
    getActionSpace(context?: unknown): Promise<DeviceAction<unknown>[]>;
    checkStatus(): Promise<boolean>;
    overrideConfig(aiConfig: Record<string, unknown>): Promise<void>;
    runConnectivityTest(aiConfig: TModelConfig): Promise<ConnectivityTestResult>;
    getTaskProgress(requestId: string): Promise<{
        executionDump?: ExecutionDump;
    }>;
    /**
     * Start polling for task progress and invoke dump update callback
     */
    private startProgressPolling;
    /**
     * Stop polling for task progress
     */
    private stopProgressPolling;
    cancelTask(requestId: string): Promise<{
        error?: string;
        success?: boolean;
    }>;
    getScreenshot(): Promise<{
        screenshot: string;
        timestamp: number;
    } | null>;
    interact(payload: {
        actionType: string;
    } & Record<string, unknown>): Promise<{
        ok: boolean;
        error?: string;
    }>;
    startRecorderSession(sessionId: string): Promise<PlaygroundRecorderStartResult>;
    getRecorderCapabilities(): Promise<PlaygroundRecorderCapabilitiesResult>;
    stopRecorderSession(): Promise<{
        ok: boolean;
        error?: string;
    }>;
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
}
