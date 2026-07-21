import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { appendFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getMidsceneRunSubDir } from "@midscene/shared/common";
import { MIDSCENE_REPORT_QUIET, globalConfigManager } from "@midscene/shared/env";
import { ifInBrowser, logMsg, uuid } from "@midscene/shared/utils";
import { DATA_SCREENSHOT_MODE_ATTR, generateAgentReportComment, generateDumpScriptTag, generateImageScriptTag, getBaseUrlFixScript } from "./dump/html-utils.mjs";
import { ScreenshotStore } from "./dump/screenshot-store.mjs";
import { ReportActionDump } from "./types.mjs";
import { getReportTpl } from "./utils.mjs";
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
const nullReportGenerator = {
    onExecutionUpdate: ()=>{},
    flush: async ()=>{},
    finalize: async ()=>void 0,
    getReportPath: ()=>void 0
};
function assertReportGenerationOptions(opts) {
    if (false === opts.generateReport && true === opts.persistExecutionDump) throw new Error('persistExecutionDump cannot be true when generateReport is false');
}
class ReportGenerator {
    static create(reportFileName, opts) {
        assertReportGenerationOptions(opts);
        validateReportFileName(reportFileName);
        if (false === opts.generateReport) return nullReportGenerator;
        if (ifInBrowser) return nullReportGenerator;
        const reportRootDir = getMidsceneRunSubDir('report');
        const outputDir = join(reportRootDir, reportFileName);
        const reportPath = 'html-and-external-assets' === opts.outputFormat ? join(outputDir, 'index.html') : join(reportRootDir, ensureHtmlFileName(reportFileName));
        return new ReportGenerator({
            reportPath,
            screenshotMode: 'html-and-external-assets' === opts.outputFormat ? 'directory' : 'inline',
            persistExecutionDump: opts.persistExecutionDump,
            autoPrint: opts.autoPrintReportMsg,
            reuseExistingReport: opts.reuseExistingReport
        });
    }
    onExecutionUpdate(execution, reportMeta, attributes) {
        this.lastExecution = execution;
        this.lastReportMeta = reportMeta;
        this.executionsByKey.set(this.getExecutionCommentKey(execution), execution);
        this.mergeReportAttributes(attributes);
        this.writeQueue = this.writeQueue.then(async ()=>{
            if (this.destroyed) return;
            await this.doWriteExecution(execution, reportMeta);
        });
    }
    async flush() {
        await this.writeQueue;
    }
    async finalize() {
        if (this.lastExecution && this.lastReportMeta) this.onExecutionUpdate(this.lastExecution, this.lastReportMeta);
        await this.flush();
        this.destroyed = true;
        if (!this.initialized) return;
        await this.appendAgentReportComment();
        return this.reportPath;
    }
    getReportPath() {
        return this.reportPath;
    }
    printReportPath() {
        if (!this.autoPrint || !this.reportPath) return;
        if (globalConfigManager.getEnvConfigInBoolean(MIDSCENE_REPORT_QUIET)) return;
        'directory' === this.screenshotMode ? logMsg(`Midscene - report file updated: npx serve ${dirname(this.reportPath)}`) : logMsg(`Midscene - report file updated: ${this.reportPath}`);
    }
    async doWriteExecution(execution, reportMeta) {
        const singleDump = this.wrapAsReportDump(execution, reportMeta);
        if ('inline' === this.screenshotMode) await this.writeInlineExecution(execution, singleDump);
        else await this.writeDirectoryExecution(execution, singleDump);
        if (this.shouldPersistExecutionDump) await this.persistExecutionDumpToFile(execution, singleDump);
        if (!this.firstWriteDone) {
            this.firstWriteDone = true;
            this.printReportPath();
        }
    }
    mergeReportAttributes(attributes) {
        if (!attributes) return;
        for (const [key, value] of Object.entries(attributes))if (null != value) this.reportAttributes[key] = String(value);
    }
    hydrateStateFromExistingReport() {
        if (!existsSync(this.reportPath)) return;
        this.initialized = true;
        if (!this.shouldPersistExecutionDump) return;
        const reportDir = dirname(this.reportPath);
        const existingExecutionIndices = readdirSync(reportDir).map((name)=>/^(\d+)\.execution\.json$/.exec(name)?.[1]).filter((index)=>Boolean(index)).map((index)=>Number.parseInt(index, 10)).filter((index)=>Number.isFinite(index));
        if (existingExecutionIndices.length > 0) this.executionLogIndex = Math.max(...existingExecutionIndices);
    }
    getDumpScriptAttributes() {
        return {
            'data-group-id': this.reportStreamId,
            [DATA_SCREENSHOT_MODE_ATTR]: this.screenshotMode,
            ...this.reportAttributes
        };
    }
    wrapAsReportDump(execution, reportMeta) {
        return new ReportActionDump({
            sdkVersion: reportMeta.sdkVersion,
            groupName: reportMeta.groupName,
            groupDescription: reportMeta.groupDescription,
            modelBriefs: reportMeta.modelBriefs,
            deviceType: reportMeta.deviceType,
            executions: [
                execution
            ]
        });
    }
    async writeInlineExecution(execution, singleDump) {
        const dir = dirname(this.reportPath);
        if (!existsSync(dir)) mkdirSync(dir, {
            recursive: true
        });
        if (!this.initialized) {
            await writeFile(this.reportPath, getReportTpl());
            this.initialized = true;
        }
        for (const screenshot of execution.collectScreenshots())await this.screenshotStore.persist(screenshot);
        const serialized = singleDump.serialize();
        await appendFile(this.reportPath, `\n${generateDumpScriptTag(serialized, this.getDumpScriptAttributes())}`);
    }
    async writeDirectoryExecution(execution, singleDump) {
        const dir = dirname(this.reportPath);
        if (!existsSync(dir)) mkdirSync(dir, {
            recursive: true
        });
        for (const screenshot of execution.collectScreenshots())await this.screenshotStore.persist(screenshot);
        const serialized = singleDump.serialize();
        if (!this.initialized) {
            await writeFile(this.reportPath, `${getReportTpl()}${getBaseUrlFixScript()}`);
            this.initialized = true;
        }
        await appendFile(this.reportPath, `\n${generateDumpScriptTag(serialized, this.getDumpScriptAttributes())}`);
    }
    async appendAgentReportComment() {
        if (this.agentCommentWritten || !this.lastReportMeta || 0 === this.executionsByKey.size) return;
        const reportDump = new ReportActionDump({
            sdkVersion: this.lastReportMeta.sdkVersion,
            groupName: this.lastReportMeta.groupName,
            groupDescription: this.lastReportMeta.groupDescription,
            modelBriefs: this.lastReportMeta.modelBriefs,
            deviceType: this.lastReportMeta.deviceType,
            executions: Array.from(this.executionsByKey.values())
        });
        await appendFile(this.reportPath, `\n${generateAgentReportComment(reportDump)}`);
        this.agentCommentWritten = true;
    }
    getExecutionLogKey(execution) {
        if (!execution.id) throw new Error('ReportGenerator: execution.id is required for persisting execution dumps');
        return `id:${execution.id}`;
    }
    getExecutionCommentKey(execution) {
        if (execution.id) return `id:${execution.id}`;
        const existingKey = this.executionCommentKeyByObject.get(execution);
        if (existingKey) return existingKey;
        const key = `no-id:${this.executionCommentKeyIndex++}`;
        this.executionCommentKeyByObject.set(execution, key);
        return key;
    }
    async persistExecutionDumpToFile(execution, singleDump) {
        const dir = dirname(this.reportPath);
        if (!existsSync(dir)) mkdirSync(dir, {
            recursive: true
        });
        const executionLogKey = this.getExecutionLogKey(execution);
        let fileIndex = this.executionLogFileIndexByExecutionKey.get(executionLogKey);
        if (!fileIndex) {
            this.executionLogIndex += 1;
            fileIndex = this.executionLogIndex;
            this.executionLogFileIndexByExecutionKey.set(executionLogKey, fileIndex);
        }
        const fileName = `${fileIndex}.execution.json`;
        const filePath = join(dirname(this.reportPath), fileName);
        await writeFile(filePath, singleDump.serialize(2), 'utf-8');
    }
    constructor(options){
        _define_property(this, "reportPath", void 0);
        _define_property(this, "screenshotMode", void 0);
        _define_property(this, "shouldPersistExecutionDump", void 0);
        _define_property(this, "autoPrint", void 0);
        _define_property(this, "firstWriteDone", false);
        _define_property(this, "executionLogIndex", 0);
        _define_property(this, "executionLogFileIndexByExecutionKey", new Map());
        _define_property(this, "reportStreamId", void 0);
        _define_property(this, "screenshotStore", void 0);
        _define_property(this, "initialized", false);
        _define_property(this, "lastExecution", void 0);
        _define_property(this, "lastReportMeta", void 0);
        _define_property(this, "executionsByKey", new Map());
        _define_property(this, "executionCommentKeyByObject", new WeakMap());
        _define_property(this, "executionCommentKeyIndex", 0);
        _define_property(this, "reportAttributes", {});
        _define_property(this, "agentCommentWritten", false);
        _define_property(this, "writeQueue", Promise.resolve());
        _define_property(this, "destroyed", false);
        this.reportPath = options.reportPath;
        this.screenshotMode = options.screenshotMode;
        this.shouldPersistExecutionDump = options.persistExecutionDump ?? false;
        this.autoPrint = options.autoPrint ?? true;
        this.reportStreamId = uuid();
        this.screenshotStore = new ScreenshotStore({
            mode: 'inline' === this.screenshotMode ? 'inline' : 'directory',
            reportPath: this.reportPath,
            screenshotsDir: join(dirname(this.reportPath), 'screenshots'),
            writeInlineImage: async (id, base64)=>{
                await appendFile(this.reportPath, `\n${generateImageScriptTag(id, base64)}`);
            },
            alsoWriteFileCopy: this.shouldPersistExecutionDump
        });
        if (options.reuseExistingReport) this.hydrateStateFromExistingReport();
    }
}
function ensureHtmlFileName(reportFileName) {
    return reportFileName.endsWith('.html') ? reportFileName : `${reportFileName}.html`;
}
function validateReportFileName(reportFileName) {
    if (!reportFileName?.trim()) throw new Error('reportFileName must be a non-empty string');
    if (/[\\/]/.test(reportFileName)) throw new Error('reportFileName must not contain path separators (`/` or `\\\\`)');
    if (/[:*?"<>|]/.test(reportFileName)) throw new Error('reportFileName contains illegal filename characters: : * ? " < > |');
}
export { ReportGenerator, assertReportGenerationOptions, nullReportGenerator };

//# sourceMappingURL=report-generator.mjs.map