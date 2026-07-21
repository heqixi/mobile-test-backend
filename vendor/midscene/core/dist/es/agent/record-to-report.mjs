import { normalizeScreenshotBase64 } from "@midscene/shared/img";
function normalizeRecordToReportScreenshot(screenshot, index) {
    if (!screenshot || 'string' != typeof screenshot.base64) throw new Error(`recordToReport: screenshot #${index + 1} must include a base64 string`);
    if (void 0 !== screenshot.description && 'string' != typeof screenshot.description) throw new Error(`recordToReport: screenshot #${index + 1} description must be a string`);
    return {
        base64: normalizeScreenshotBase64(screenshot.base64, {
            label: `recordToReport: screenshot #${index + 1} base64`
        }),
        description: screenshot.description
    };
}
export { normalizeRecordToReportScreenshot };

//# sourceMappingURL=record-to-report.mjs.map