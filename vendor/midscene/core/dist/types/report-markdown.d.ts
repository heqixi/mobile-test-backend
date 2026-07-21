import type { ExecutionDump, IExecutionDump, IReportActionDump, ReportActionDump } from './types';
import type { ScreenshotRef } from './dump/screenshot-store';
export interface MarkdownAttachment {
    id: string;
    /**
     * Stable, prefixed file name for the exported copy. The markdown image link
     * always points at `${screenshotBaseDir}/${suggestedFileName}`, so consumers
     * write the screenshot under this name to keep links in sync. See #2392.
     */
    suggestedFileName: string;
    mimeType?: string;
    /**
     * Reference to the screenshot in the source report, used to locate the
     * original bytes when copying them to the exported name. Absent for in-memory
     * screenshots, which carry their data in `base64Data` instead.
     */
    sourceRef?: ScreenshotRef;
    executionIndex: number;
    taskIndex: number;
    /** Populated when screenshot data is available in memory (e.g. browser context). */
    base64Data?: string;
}
export interface ExecutionMarkdownOptions {
    screenshotBaseDir?: string;
}
export interface ExecutionMarkdownResult {
    markdown: string;
    attachments: MarkdownAttachment[];
}
export interface ReportMarkdownResult {
    markdown: string;
    attachments: MarkdownAttachment[];
}
export declare function executionToMarkdown(execution: ExecutionDump | IExecutionDump, options?: ExecutionMarkdownOptions): ExecutionMarkdownResult;
export declare function reportToMarkdown(report: ReportActionDump | IReportActionDump): ReportMarkdownResult;
