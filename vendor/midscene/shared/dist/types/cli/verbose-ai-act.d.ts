import { type CliVerboseScreenshotCollectOptions } from './verbose-screenshot';
export interface CliVerboseLine {
    key: string;
    text: string;
}
/** Generic progress-bus envelope as seen by the CLI (all fields untrusted). */
export interface CliAgentProgressEvent {
    scope?: unknown;
    phase?: unknown;
    sequence?: unknown;
    data?: unknown;
}
/** Flattened, render-ready aiAct payload derived from the envelope. */
export interface CliAiActProgressPayload {
    phase?: unknown;
    sequence?: unknown;
    prompt?: unknown;
    planIndex?: unknown;
    planLimit?: unknown;
    action?: unknown;
    thought?: unknown;
    log?: unknown;
    output?: unknown;
    durationMs?: unknown;
    error?: unknown;
    screenshots?: Array<Record<string, unknown>>;
    screenshotPath?: string;
    [key: string]: unknown;
}
/** aiAct scope tag on the progress bus (mirrors core's `aiActProgressScope`). */
export declare const cliAiActProgressScope = "aiAct";
export declare function normalizeAiActProgressEventForCli(event: unknown, screenshotOptions?: CliVerboseScreenshotCollectOptions): CliAiActProgressPayload | undefined;
export declare function buildAiActProgressEventLines(event: CliAiActProgressPayload): CliVerboseLine[];
/**
 * A producer-specific renderer for the generic CLI progress dispatcher: turn a
 * raw progress envelope into a normalized payload, then that payload into
 * verbose lines. New producers register their own renderer; the dispatcher core
 * stays untouched.
 */
export interface CliProgressRenderer {
    normalize(event: unknown, screenshotOptions: CliVerboseScreenshotCollectOptions): Record<string, unknown> | undefined;
    buildLines(payload: Record<string, unknown>): CliVerboseLine[];
}
export declare const aiActCliProgressRenderer: CliProgressRenderer;
