import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
function safeScreenshotFilenamePart(value) {
    const text = 'string' == typeof value && value.length > 0 ? value : 'shot';
    return text.replace(/[^a-zA-Z0-9._-]/g, '_') || 'shot';
}
function extensionFromImageMetadata(mimeType, extension) {
    if ('jpeg' === extension || 'jpg' === extension) return 'jpeg';
    if ('png' === extension) return 'png';
    return 'image/jpeg' === mimeType ? 'jpeg' : 'png';
}
function writeCliScreenshotFile(rawBase64, options = {}) {
    const extension = extensionFromImageMetadata(options.mimeType, options.extension);
    const directory = options.directoryPath ? options.directoryPath : options.directoryName ? join(tmpdir(), options.directoryName) : tmpdir();
    if (!existsSync(directory)) mkdirSync(directory, {
        recursive: true
    });
    const filename = void 0 !== options.id ? `${safeScreenshotFilenamePart(options.id)}.${extension}` : `${options.filenamePrefix ?? 'screenshot'}-${Date.now()}.${extension}`;
    const filePath = join(directory, filename);
    if (false !== options.overwrite || !existsSync(filePath)) writeFileSync(filePath, Buffer.from(rawBase64, 'base64'));
    return filePath;
}
export { writeCliScreenshotFile };
