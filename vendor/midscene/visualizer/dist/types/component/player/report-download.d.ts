import type { ReportDownloadHandler } from '../../types';
export declare const DEFAULT_REPORT_FILE_NAME = "midscene_report.html";
interface AnchorLike {
    href: string;
    download: string;
    style: {
        display: string;
    };
    click: () => void;
}
interface DocumentLike {
    body: {
        appendChild: (node: AnchorLike) => void;
        removeChild: (node: AnchorLike) => void;
    };
    createElement: (tagName: string) => AnchorLike;
}
interface UrlLike {
    createObjectURL: (blob: Blob) => string;
    revokeObjectURL: (url: string) => void;
}
interface TriggerReportDownloadOptions {
    content: string;
    defaultFileName?: string;
    onDownloadReport?: ReportDownloadHandler;
    documentRef?: DocumentLike;
    urlRef?: UrlLike;
    blobFactory?: (parts: BlobPart[], options: BlobPropertyBag) => Blob;
    scheduleRevoke?: (callback: () => void) => void;
}
export declare function triggerReportDownload(options: TriggerReportDownloadOptions): Promise<void>;
export {};
