import type { Agent as PageAgent } from '@midscene/core/agent';
import type { MjpegStreamFrame } from '@midscene/core/device';
import { type DebugFunction } from '@midscene/shared/logger';
import type { Request, Response } from 'express';
type ActiveInterface = PageAgent['interface'];
export interface InterfaceMjpegHubOptions {
    /** Time the hub waits for the first producer frame before falling back. */
    initialFrameTimeoutMs: number;
    /** Idle window after the last subscriber leaves before tearing the producer down. */
    idleStopMs: number;
    /** Optional debug logger for hub internals. Defaults to a no-op. */
    debug?: DebugFunction;
}
/**
 * Recovery hook supplied by the server. When the producer fails to start
 * because the underlying page session was closed, the hub asks the server to
 * rebuild the agent and returns the new interface; otherwise the hub gives up
 * and lets `streamRequest` resolve to false.
 */
export type RecoverActiveAgent = (error: unknown) => Promise<ActiveInterface | null>;
/**
 * Writes one MJPEG part to `res`, preferring backpressure-safe writes.
 *
 * Returns `true` when the chunk has been accepted by the socket buffer and
 * `false` when the kernel buffer is full. Callers SHOULD drop frames or wait
 * for `drain` instead of pushing more data when this returns `false`.
 *
 * `frame.data` may either be raw base64 or a `data:image/...;base64,...` URL;
 * the function strips the prefix defensively. New producers should already
 * normalize to bare base64.
 */
export declare function writeMjpegFrame(res: Response, boundary: string, frame: MjpegStreamFrame): boolean;
/**
 * Owns the lifecycle of an in-process MJPEG frame producer (e.g. Chromium
 * CDP `Page.startScreencast`) and fans frames out to all currently connected
 * HTTP MJPEG clients.
 *
 * Why this is its own class:
 * - CDP screencasts are page-scoped, so multiple concurrent producers would
 *   steal frames from each other. Keeping a single producer + N subscribers
 *   here prevents the playground server from accidentally racing against
 *   itself.
 * - Producer creation, idle teardown, recovery after page-session loss and
 *   backpressure handling are all naturally co-located with the producer
 *   state. Moving them out of `PlaygroundServer` keeps that class focused on
 *   HTTP routing.
 */
export declare class InterfaceMjpegHub {
    private readonly opts;
    private producer?;
    private readonly debug;
    constructor(opts: InterfaceMjpegHubOptions);
    /**
     * Streams the active interface's MJPEG frames to `res`. Returns true once
     * the response is committed to streaming, false if the interface has no
     * frame producer or the initial frame never arrived.
     */
    streamRequest(req: Request, res: Response, activeInterface: ActiveInterface, recoverActiveAgent: RecoverActiveAgent): Promise<boolean>;
    /**
     * Tears down the current producer (used when the server replaces an agent
     * out-of-band, e.g. after a recoverable page-session error during /interact).
     */
    stopProducer(): void;
    /**
     * Best-effort shutdown for server.close(). Aborts any active producer and
     * forcibly closes attached subscriber sockets.
     */
    shutdown(): void;
    getLastFrame(): MjpegStreamFrame | undefined;
    private streamRequestInternal;
    private attachSubscriber;
    /**
     * Push the producer's cached frame to a freshly-attached subscriber.
     *
     * Why two writes:
     *
     * Chromium's `<img>` with `multipart/x-mixed-replace` only commits a part
     * to display once it sees the *next* part's boundary delimiter — the
     * boundary is what tells the decoder that the previous part's body is
     * complete. When the CDP screencast is idle (page is past
     * `waitForNetworkIdle`, no animation) the producer only ever pushes one
     * frame: the cached `lastFrame`. With a single write, the browser holds
     * onto the bytes but never paints them (`<img>.naturalWidth === 0`) — a
     * permanent blank canvas while waiting for a frame that never arrives.
     *
     * The duplicate write below is a sentinel: the second part's leading
     * boundary is exactly what unblocks the first part's commit. The second
     * part itself never gets displayed (multipart only ever shows the latest
     * committed part, and any subsequent real CDP frame overrides it), so
     * the cost is one extra frame on the wire per subscriber attach. Without
     * this, Overview → Device re-entry consistently leaves the user staring
     * at white.
     */
    private flushInitialFrame;
    private getOrCreateProducer;
    private stopProducerInternal;
    private releaseSubscriber;
}
/**
 * Convenience constructor that wires up a debug logger derived from the
 * `web:mjpeg` namespace so server logs are consistent with other modules.
 */
export declare function createInterfaceMjpegHub(opts: Omit<InterfaceMjpegHubOptions, 'debug'> & {
    debug?: DebugFunction;
}): InterfaceMjpegHub;
export {};
