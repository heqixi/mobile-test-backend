export declare const cliVerboseFlag = "verbose";
export type CliVerboseFormat = 'text' | 'jsonl';
export interface CliVerboseContext {
    enabled: boolean;
    format?: CliVerboseFormat;
    scriptName?: string;
    commandName?: string;
    startedAt?: number;
    renderedLineKeys?: Set<string>;
}
export interface CliVerboseEvent {
    event: string;
    scriptName?: string;
    command?: string;
    status?: 'ok' | 'error';
    durationMs?: number;
    error?: string;
    [key: string]: unknown;
}
type DumpUpdateAgent = {
    addDumpUpdateListener?: (listener: (dump: string, executionDump?: unknown) => void) => () => void;
    addProgressListener?: (listener: (event: unknown) => void) => () => void;
    reportFile?: string | null;
};
export declare function stripVerboseFlag(argv: readonly string[]): {
    rawArgs: string[];
    verbose: boolean;
    format: CliVerboseFormat;
};
export declare function withCliVerboseContext<T>(context: CliVerboseContext, fn: () => Promise<T>): Promise<T>;
export declare function getCliVerboseContext(): CliVerboseContext;
export declare function isCliVerboseEnabled(): boolean;
export declare function emitCliVerboseEvent(event: CliVerboseEvent): void;
declare function errorMessageOf(error: unknown): string;
export declare function compactCliVerboseValue(value: unknown): unknown;
export declare function compactCliVerboseArgs(args: Record<string, unknown>): Record<string, unknown>;
export declare function attachCliVerboseDumpListener(agent: DumpUpdateAgent, options?: {
    toolName?: string;
}): () => void;
export { errorMessageOf as cliVerboseErrorMessage };
