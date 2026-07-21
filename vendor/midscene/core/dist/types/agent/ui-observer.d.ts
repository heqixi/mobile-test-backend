import type { DeviceFrameSource } from '../device';
import type { AgentAssertOpt, ServiceExtractOption, UIContext } from '../types';
export interface UIObserverOption {
    /** Sampling interval between frames in ms. Default 1000, min 200 (5fps). */
    intervalMs?: number;
    /**
     * Maximum number of frames to keep in the buffer. When full the buffer is
     * thinned (change-point frames preserved, static intervals halved) so the
     * whole window keeps temporal coverage. Default 30.
     */
    maxFrames?: number;
    /**
     * Auto-stop the observer after this many ms if stop() was never called.
     * Prevents resource leaks from forgotten observers. Default 5min. Set 0 to
     * disable.
     */
    watchdogMs?: number;
}
interface UIObserverDeps {
    /**
     * Open the device's continuous frame source, if it has one. The observer
     * falls back to plain screenshots when this returns undefined or throws.
     */
    openFrameSource: () => Promise<DeviceFrameSource | undefined>;
    /** Fallback single-frame capture (already a data URL). */
    screenshot: () => Promise<string>;
    /** Capture the final full-quality UIContext (used as the representative). */
    captureRepresentative: () => Promise<UIContext>;
    /** Run an assert against a pre-built multi-frame UIContext. */
    runAssert: (assertion: string, uiContext: UIContext, msg?: string, opt?: AgentAssertOpt & ServiceExtractOption) => Promise<undefined | {
        pass: boolean;
        thought?: string;
        message?: string;
    }>;
    /** Run a boolean query against a pre-built multi-frame UIContext. */
    runBoolean: (prompt: string, uiContext: UIContext, opt?: ServiceExtractOption) => Promise<boolean>;
    /** Called when stop() completes, so the agent can clear its active-observer reference. */
    onStopped?: () => void;
    /** Screenshot shrink factor applied to fallback frames. Default 1 (no shrink). */
    screenshotShrinkFactor?: number;
}
/**
 * Observes the screen over an explicit window so a later assertion can judge
 * everything that happened while other agent calls ran — including transient
 * UI that appears mid-action:
 *
 * ```ts
 * const observer = await agent.startObserving();
 * await agent.aiAct('submit the form');
 * await observer.stop();
 * await observer.aiAssert('a success toast appeared during the process');
 * ```
 *
 * Sampling is deliberately cheap: when the device exposes a continuous frame
 * source (scrcpy on Android, WDA MJPEG on iOS, CDP screencast on web), each
 * tick only grabs an opaque frame handle; any decode cost is paid ONCE at the
 * end, for all buffered frames actually sent to the model. Devices without a
 * frame source fall back to plain screenshots per tick. To avoid missing
 * short-lived transient UI in long observation windows, every buffered frame
 * is sent to the model — control cost via `intervalMs` and `maxFrames`.
 */
export declare class UIObserver {
    private readonly deps;
    private frames;
    private source;
    private usingFallback;
    private stopped;
    private loopPromise;
    private representative;
    private watchdogTimer;
    /** Cross-assertion decode cache: keyed by frame.ref, avoids re-decoding on Android. */
    private decodedCache;
    /** Background pre-decode started in stop(), awaited by buildObservedUIContext(). */
    private preDecodePromise;
    private readonly intervalMs;
    private readonly maxFrames;
    private readonly watchdogMs;
    private readonly screenshotShrinkFactor;
    constructor(deps: UIObserverDeps, opt?: UIObserverOption);
    /** Number of frames currently buffered. */
    get frameCount(): number;
    /**
     * Open the frame source (or arm the screenshot fallback), capture the first
     * baseline frame, then start the background sampling loop. Awaiting this
     * guarantees at least one pre-action frame exists.
     */
    start(): Promise<void>;
    /**
     * Stop sampling, kick off background pre-decode, capture the representative,
     * and release the frame source. Guarantees that the frame source is released
     * and the agent's active-observer reference is cleared even if intermediate
     * steps (pre-decode, representative capture) throw.
     */
    stop(): Promise<void>;
    /**
     * Assert against the observed window. All buffered frames (plus the final
     * representative) are decoded and sent to the model. To control cost for
     * long windows, increase `intervalMs` or decrease `maxFrames`.
     * Throws when the assertion fails, mirroring `agent.aiAssert`.
     */
    aiAssert(assertion: string, msg?: string, opt?: AgentAssertOpt & ServiceExtractOption): Promise<undefined | {
        pass: boolean;
        thought?: string;
        message?: string;
    }>;
    /** Boolean query over the observed window (same frame semantics as aiAssert). */
    aiBoolean(prompt: string, opt?: ServiceExtractOption): Promise<boolean>;
    private buildObservedUIContext;
    private captureOnce;
    /**
     * Apply screenshotShrinkFactor to an array of decoded base64 images in
     * parallel. Returns the input unchanged when shrink factor is 1. Source
     * frames come at device-native resolution; shrinking them matches the
     * representative frame size so the sequence sent to the model has
     * consistent resolution and token cost.
     */
    private shrinkAllIfNeeded;
    private runLoop;
    private pushFrame;
    /**
     * Smart thinning: preserve all "change point" frames — frames where the
     * screen content differs from the previous frame (detected by ref identity).
     * Between change points, keep every other static frame so temporal coverage
     * is maintained without bloating the buffer. This ensures a brief toast
     * that produces a new keyframe is never thinned out.
     *
     * If smart thinning alone cannot reduce below maxFrames (e.g. the
     * screen is constantly changing and every frame is a change point), a
     * second pass of uniform sampling enforces the hard cap while keeping
     * temporal coverage.
     */
    private thinBuffer;
    /** Deduplicate frame refs by identity, preserving first-seen order. */
    private dedupeRefs;
}
export {};
