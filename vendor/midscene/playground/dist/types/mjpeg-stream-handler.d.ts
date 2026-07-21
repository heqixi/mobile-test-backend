import type { Agent as PageAgent } from '@midscene/core/agent';
import type { Request, Response } from 'express';
type ActiveInterface = PageAgent['interface'];
/**
 * Inputs the handler reads on every request, late-bound through callbacks
 * so a single handler instance can survive across device reconnects without
 * the server having to swap it.
 */
export interface MjpegStreamSource {
    /** Native MJPEG URL of the current device, or undefined if it has none. */
    getNativeUrl(): string | undefined;
    /** Active interface, used for in-process MJPEG producers such as CDP screencast. */
    getActiveInterface(): ActiveInterface | null;
    /** Polling fallback. Throws if no agent is connected. */
    takeScreenshot(): Promise<string>;
    /** Returns true when polling fallback can capture screenshots. */
    canTakeScreenshot(): boolean;
    /** Returns false while the agent is being recreated. */
    isAgentReady(): boolean;
    /** Optional recovery hook for page-session loss during preview streaming. */
    recoverFromPreviewError?(error: unknown, reason: string): Promise<ActiveInterface | null>;
}
/**
 * Owns all of the MJPEG streaming logic that used to live inline on
 * `PlaygroundServer`:
 *   - Tries the device's native MJPEG URL (e.g. WDA's `iproxy 9100`).
 *   - Caches a negative probe for {@link NEGATIVE_CACHE_MS} so a transient
 *     unavailable WDA does not lock us into polling forever.
 *   - Falls back to polling `screenshotBase64()` and emitting multipart frames.
 *   - While polling, periodically re-probes the native URL and tears down
 *     the polling socket the moment native comes back, so the client
 *     `<img>` reconnects onto the native stream.
 *
 * State lives on the handler instance, so callers can `reset()` on device
 * reconnect to drop the cached probe result.
 */
export declare class MjpegStreamHandler {
    private readonly source;
    private nativeAvailable;
    private nativeFailedAt;
    private lastPollingFrame?;
    private readonly interfaceMjpegHub;
    constructor(source: MjpegStreamSource);
    /** Drop the cached probe result — call this when the agent reconnects. */
    reset(): void;
    shutdown(): void;
    getLastFrameBase64(): string | undefined;
    serve(req: Request, res: Response): Promise<void>;
    private probeAndProxyNative;
    private probeNativeLiveness;
    private streamPolling;
}
export {};
