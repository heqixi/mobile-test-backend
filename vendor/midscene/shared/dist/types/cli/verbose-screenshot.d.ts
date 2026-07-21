export type CliVerboseScreenshotExportMode = 'none' | 'tmp' | 'report';
export interface CliVerboseScreenshotCollectOptions {
    reportFile?: unknown;
    exportMode?: CliVerboseScreenshotExportMode;
    cache?: Map<string, string>;
}
export declare function collectScreenshotRefs(value: unknown, options?: CliVerboseScreenshotCollectOptions): Array<Record<string, unknown>>;
export declare function pathForReportScreenshot(path: string, reportFile?: unknown): string;
export declare function latestScreenshotPathForAiAct(value: unknown, options?: CliVerboseScreenshotCollectOptions): string;
export declare function renderScreenshotList(screenshots: unknown): string;
