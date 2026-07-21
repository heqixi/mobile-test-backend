import { basename, dirname, isAbsolute, join, relative } from "node:path";
import { writeCliScreenshotFile } from "./screenshot-file.mjs";
function isRecord(value) {
    return 'object' == typeof value && null !== value && !Array.isArray(value);
}
function isCliVerboseScreenshotRefLike(value) {
    return isRecord(value) && 'midscene_screenshot_ref' === value.type;
}
function toSerializableScreenshot(value) {
    if (!value || 'object' != typeof value) return null;
    const maybeSerializable = value;
    if ('function' == typeof maybeSerializable.toSerializable) try {
        const serialized = maybeSerializable.toSerializable();
        return isCliVerboseScreenshotRefLike(serialized) ? serialized : null;
    } catch  {
        return null;
    }
    return isCliVerboseScreenshotRefLike(value) ? value : null;
}
function getStringProperty(value, key) {
    if (!isRecord(value)) return;
    try {
        const property = value[key];
        return 'string' == typeof property && property.length > 0 ? property : void 0;
    } catch  {
        return;
    }
}
function screenshotRawBase64(value) {
    const rawBase64 = getStringProperty(value, 'rawBase64');
    if (rawBase64) return rawBase64;
    const base64 = getStringProperty(value, 'base64');
    const match = base64?.match(/^data:image\/(?:png|jpeg|jpg);base64,(.+)$/);
    return match?.[1];
}
function inlineScreenshotCacheKey(rawBase64, serialized, directoryPath, directoryName, extension) {
    return JSON.stringify([
        serialized.id,
        serialized.mimeType,
        directoryPath,
        directoryName,
        extension,
        rawBase64
    ]);
}
function exportInlineScreenshotForVerbose(value, serialized, options) {
    if ('string' == typeof serialized.path) return serialized.path;
    const exportMode = options.exportMode ?? 'tmp';
    if ('none' === exportMode) return;
    const rawBase64 = screenshotRawBase64(value);
    if (!rawBase64) return;
    const directoryPath = 'report' === exportMode && 'string' == typeof options.reportFile && options.reportFile.length > 0 ? join(dirname(options.reportFile), 'screenshots') : void 0;
    const directoryName = directoryPath ? void 0 : 'midscene-cli-screenshots';
    const extension = getStringProperty(value, 'extension');
    const cacheKey = inlineScreenshotCacheKey(rawBase64, serialized, directoryPath, directoryName, extension);
    const cachedPath = options.cache?.get(cacheKey);
    if (cachedPath) return cachedPath;
    try {
        const path = writeCliScreenshotFile(rawBase64, {
            id: serialized.id,
            mimeType: serialized.mimeType,
            extension,
            ...directoryPath ? {
                directoryPath
            } : {
                directoryName
            },
            overwrite: false
        });
        options.cache?.set(cacheKey, path);
        return path;
    } catch  {
        return;
    }
}
function collectScreenshotRefs(value, options = {}) {
    const screenshots = [];
    const visit = (candidate, timing)=>{
        if (Array.isArray(candidate)) {
            for (const item of candidate)visit(item, timing);
            return;
        }
        const serialized = toSerializableScreenshot(candidate);
        if (serialized?.type === 'midscene_screenshot_ref') {
            const screenshot = {
                id: serialized.id,
                storage: serialized.storage
            };
            const exportedPath = exportInlineScreenshotForVerbose(candidate, serialized, options);
            if (exportedPath) {
                screenshot.path = exportedPath;
                screenshot.file = basename(exportedPath);
            }
            if ('string' == typeof timing) screenshot.timing = timing;
            screenshots.push(screenshot);
            return;
        }
        if (!isRecord(candidate)) return;
        const screenshotRecord = candidate.screenshot;
        if (screenshotRecord) visit(screenshotRecord, candidate.timing);
        if (candidate.recorder) visit(candidate.recorder);
        if (isRecord(candidate.uiContext)) visit(candidate.uiContext.screenshot);
    };
    visit(value);
    return screenshots;
}
function pathForReportScreenshot(path, reportFile) {
    const resolvedPath = 'string' == typeof reportFile && reportFile.length > 0 && (path.startsWith('./') || path.startsWith('../')) ? join(dirname(reportFile), path) : path;
    if (!isAbsolute(resolvedPath)) return resolvedPath;
    const relativePath = relative(process.cwd(), resolvedPath);
    if (relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath)) return relativePath;
    return resolvedPath;
}
function latestScreenshotPathForAiAct(value, options = {}) {
    const screenshot = collectScreenshotRefs(value, {
        ...options,
        exportMode: options.exportMode ?? 'report'
    }).slice().reverse().find((item)=>'string' == typeof item.path && item.path.length > 0);
    const path = 'string' == typeof screenshot?.path ? screenshot.path : '';
    return path ? pathForReportScreenshot(path, options.reportFile) : '';
}
function renderScreenshotList(screenshots) {
    if (!Array.isArray(screenshots) || 0 === screenshots.length) return '';
    return screenshots.map((item)=>{
        if (!isRecord(item)) return '';
        const path = 'string' == typeof item.path ? item.path : 'string' == typeof item.file ? item.file : 'string' == typeof item.id ? item.id : '';
        const timing = 'string' == typeof item.timing ? item.timing : '';
        return [
            timing,
            path
        ].filter(Boolean).join(' ');
    }).filter(Boolean).join(', ');
}
export { collectScreenshotRefs, latestScreenshotPathForAiAct, pathForReportScreenshot, renderScreenshotList };
