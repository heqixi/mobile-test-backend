/**
 * Overrides the directory used by file logs in the current process.
 *
 * Callers that do not configure a resolver keep the standard
 * `midscene_run/log` location. This is intentionally process-local so an app
 * can isolate its logs without changing Node.js or CI behavior.
 */
export declare function setLogDirectoryResolver(resolver: (() => string) | undefined): void;
export type DebugFunction = (...args: unknown[]) => void;
export declare function getDebug(topic: string, options?: {
    console?: boolean;
}): DebugFunction;
export declare function enableDebug(topic: string): void;
