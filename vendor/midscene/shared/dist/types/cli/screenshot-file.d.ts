export interface WriteCliScreenshotFileOptions {
    id?: unknown;
    mimeType?: unknown;
    extension?: unknown;
    directoryPath?: string;
    directoryName?: string;
    filenamePrefix?: string;
    overwrite?: boolean;
}
export declare function writeCliScreenshotFile(rawBase64: string, options?: WriteCliScreenshotFileOptions): string;
