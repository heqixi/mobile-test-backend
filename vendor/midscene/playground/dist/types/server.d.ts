import type { Server } from 'node:http';
import type { ExecutionDump, ExecutorContext } from '@midscene/core';
import type { Agent as PageAgent } from '@midscene/core/agent';
import express from 'express';
import type { PlaygroundPreviewDescriptor, PlaygroundSessionState, PreparedPlaygroundPlatform } from './platform';
import { type PlaygroundRuntimeInfo } from './runtime-metadata';
import 'dotenv/config';
/** Default `127.0.0.1`. Override via `MIDSCENE_PLAYGROUND_HOST` (e.g. `0.0.0.0`). */
export declare function resolvePlaygroundListenHost(): string;
export declare function resolvePlaygroundBrowserHost(): string;
export declare function buildPlaygroundBrowserUrl(host: string, port: number): string;
/**
 * Recursively serialize a Zod field into a plain object that preserves
 * the `_def` metadata the client relies on (typeName, innerType, values,
 * defaultValue, description, shape, etc.).
 */
export declare function serializeZodField(field: any): any;
/**
 * Thrown when a caller supplies an /interact body that fails validation
 * (missing x/y, missing keyName for KeyboardPress, etc.). Distinct from a
 * downstream device failure so the route handler can map this to HTTP 400.
 */
export declare class InteractParamsValidationError extends Error {
    constructor(message: string);
}
export declare function buildInteractParams(actionType: string, body: Record<string, unknown>): Record<string, unknown>;
export declare function createManualExecutorContext(actionType: string, param: unknown): ExecutorContext;
declare class PlaygroundServer {
    private _app;
    tmpDir: string;
    server?: Server;
    port?: number | null;
    staticPath: string;
    taskExecutionDumps: Record<string, ExecutionDump | null>;
    id: string;
    private readonly reportFiles;
    /**
     * Port for scrcpy server (used by Android playground for screen mirroring)
     * When set, this port is injected into the HTML page as window.SCRCPY_PORT
     */
    scrcpyPort?: number;
    private _initialized;
    private readonly _mjpegHandler;
    private sessionManager?;
    private sessionSetupState;
    private sessionSetupBlockingReason?;
    private currentTaskId;
    private taskAbortControllers;
    private _agentReady;
    private _configDirty;
    private _lastAiConfigSignature;
    private _baseRuntimeState?;
    private _basePreparedMetadata?;
    private _baseExecutionHooks?;
    private _baseSidecars?;
    private _recorderSessionId;
    private _recorderEvents;
    private _recorderPendingTypeOnlyInput;
    private _recorderPendingTypeOnlyInputFlushTimer;
    private _recorderEventQueue;
    private _recorderPendingCaptures;
    private _studioPreviewRecorderLastTargetPoint;
    private _studioPreviewRecorderLastScreenshot;
    private _studioPreviewRecorderLastPageState;
    private _activeConnection;
    private setActiveAgent;
    constructor(agent?: PageAgent | (() => PageAgent) | (() => Promise<PageAgent>), staticPath?: string, id?: string);
    get agent(): PageAgent | null;
    private assertNoActiveSessionForBaseStateUpdate;
    private buildBaseRuntimeState;
    private resetConnectionToBaseState;
    private syncRuntimeState;
    private restoreBaseSessionState;
    setPreparedPlatform(prepared: Pick<PreparedPlaygroundPlatform, 'platformId' | 'title' | 'description' | 'preview' | 'metadata' | 'sessionManager' | 'executionHooks' | 'sidecars'>): void;
    setPreviewDescriptor(preview?: PlaygroundPreviewDescriptor): void;
    setRuntimeMetadata(metadata?: Record<string, unknown>): void;
    getRuntimeInfo(): PlaygroundRuntimeInfo;
    /**
     * Treat a session as connected when either:
     * - we have a live agent, OR
     * - we are mid-recreate (`_agentReady === false`).
     *
     * `recreateAgent` (e.g. via /cancel) nulls `_activeConnection.agent`
     * before the factory swaps in a fresh one. Without this guard the UI
     * sees a brief `connected: false` window and flashes the
     * SessionSetupPanel ("create agent" form) for ~1–2 seconds.
     */
    private isEffectivelyConnected;
    getSessionInfo(): PlaygroundSessionState & {
        setupState: 'required' | 'ready' | 'blocked';
        setupBlockingReason?: string;
    };
    private buildSessionMetadata;
    private startSidecars;
    private stopSidecars;
    private getActiveAgentOrThrow;
    private getRecorderCapabilities;
    private resetRecorderState;
    waitForRecorderIdle(): Promise<void>;
    private waitForQueuedRecorderEvents;
    private canRecordStudioPreviewInteractions;
    private takeRecorderScreenshot;
    private getActivePageInfo;
    private getActivePageUrl;
    private getActivePageTitle;
    private getActiveRecorderPageState;
    private captureRecorderSnapshotBeforeInteract;
    private captureCachedRecorderSnapshotBeforeInteract;
    private startStudioPreviewRecorder;
    private persistStudioPreviewRecorderScreenshot;
    private storeStudioPreviewRecorderEvent;
    private buildStudioPreviewRecorderEvent;
    private enrichStudioPreviewRecorderEventWithAiDescribe;
    private getRecorderAiDescribeScreenshot;
    private queueStudioPreviewRecorderEventAppend;
    private isDeferredTypeOnlyRecorderInput;
    private canCoalesceDeferredTypeOnlyRecorderInput;
    private mergeDeferredTypeOnlyRecorderInput;
    private flushPendingTypeOnlyRecorderInput;
    private schedulePendingTypeOnlyRecorderInputFlush;
    private clearPendingTypeOnlyRecorderInputFlushTimer;
    private getRecorderNavigationPageStateBefore;
    private buildStudioPreviewNavigationStateEvent;
    private recordStudioPreviewNavigationState;
    private queueStudioPreviewRecorderEvent;
    private buildStudioPreviewInitialNavigationEvent;
    private destroyCurrentAgent;
    private destroyCurrentSession;
    private applyCreatedSession;
    private bindActiveSessionNavigationEvents;
    private clearActiveSessionNavigationEvents;
    private getSessionSetupSchema;
    private getSessionTargets;
    /**
     * Get the Express app instance for custom configuration
     *
     * IMPORTANT: Add middleware (like CORS) BEFORE calling launch()
     * The routes are initialized when launch() is called, so middleware
     * added after launch() will not affect the API routes.
     *
     * @example
     * ```typescript
     * import cors from 'cors';
     *
     * const server = new PlaygroundServer(agent);
     *
     * // Add CORS middleware before launch
     * server.app.use(cors({
     *   origin: true,
     *   credentials: true,
     *   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
     * }));
     *
     * await server.launch();
     * ```
     */
    get app(): express.Application;
    /**
     * Initialize Express app with all routes and middleware
     * Called automatically by launch() if not already initialized
     */
    private initializeApp;
    filePathForUuid(uuid: string): string;
    saveContextFile(uuid: string, context: string): string;
    /**
     * Recreate agent instance (for cancellation).
     *
     * `preserveActiveStream`: skip the MJPEG hub reset so the existing
     * preview stream stays connected across the swap. Safe when the
     * agent factory reuses the same underlying page/browser (Studio Web
     * does this on cancel) — otherwise the producer would point at a
     * dead source.
     */
    private recreateAgent;
    private recoverActiveAgentAfterPreviewError;
    private findInteractAction;
    private canRunBrowserChromeInteractAction;
    private runBrowserChromeInteractAction;
    private runInteractAction;
    private registerReportFile;
    private getRegisteredReport;
    /**
     * Setup all API routes
     */
    private setupRoutes;
    /**
     * Setup static file serving routes
     */
    private setupStaticRoutes;
    /**
     * Serve HTML with injected port configuration
     */
    private serveHtmlWithPorts;
    /**
     * Launch the server on specified port
     */
    launch(port?: number): Promise<PlaygroundServer>;
    /**
     * Close the server and clean up resources
     */
    close(): Promise<void>;
}
export default PlaygroundServer;
export { PlaygroundServer };
