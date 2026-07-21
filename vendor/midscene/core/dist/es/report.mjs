import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { getMidsceneRunSubDir } from "@midscene/shared/common";
import { antiEscapeScriptTag, logMsg } from "@midscene/shared/utils";
import { getReportFileName } from "./agent/index.mjs";
import { DATA_SCREENSHOT_MODE_ATTR, extractAllDumpScriptsSync, extractLastDumpScriptSync, generateAgentReportComment, getBaseUrlFixScript, streamDumpScriptsSync, streamImageScriptsToFile } from "./dump/html-utils.mjs";
import { normalizeScreenshotRef, resolveScreenshotSource } from "./dump/screenshot-store.mjs";
import { ReportActionDump } from "./types.mjs";
import { getReportTpl, getVersion, reportHTMLContent } from "./utils.mjs";
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
const screenshotModeAttrRegExp = new RegExp(`${DATA_SCREENSHOT_MODE_ATTR}="(inline|directory)"`);
function readDeclaredScreenshotMode(reportFilePath) {
    let mode;
    try {
        streamDumpScriptsSync(reportFilePath, ({ openTag })=>{
            if (!openTag.includes('data-group-id')) return false;
            const match = openTag.match(screenshotModeAttrRegExp);
            mode = match?.[1];
            return true;
        });
    } catch  {}
    return mode;
}
function isDirectoryModeReport(reportFilePath) {
    if ('index.html' !== basename(reportFilePath)) return false;
    const declared = readDeclaredScreenshotMode(reportFilePath);
    if (declared) return 'directory' === declared;
    return existsSync(join(dirname(reportFilePath), 'screenshots'));
}
function isDirectoryBasedReport(reportFilePath) {
    return 'index.html' === basename(reportFilePath);
}
function dedupeExecutionsKeepLatest(executions) {
    let noIdCounter = 0;
    const deduped = new Map();
    for (const exec of executions){
        const key = exec.id || `__no_id_${noIdCounter++}`;
        deduped.set(key, exec);
    }
    return Array.from(deduped.values());
}
function peekReportSdkVersion(reportFilePath) {
    try {
        const dump = extractLastDumpScriptSync(reportFilePath);
        if (!dump) return;
        const match = dump.match(/"sdkVersion"\s*:\s*"([^"]+)"/);
        return match?.[1];
    } catch  {
        return;
    }
}
const warnedMismatchedVersions = new Set();
function tryParseAgentReportDump(dumpString) {
    const trimmed = dumpString.trimStart();
    if (!trimmed.startsWith('{') || !trimmed.includes('"executions"')) return null;
    try {
        return ReportActionDump.fromSerializedString(trimmed);
    } catch  {
        return null;
    }
}
function mergedAgentReportComment(reports) {
    if (0 === reports.length) return '';
    if (1 === reports.length) return generateAgentReportComment(reports[0]);
    const deviceTypes = Array.from(new Set(reports.map((report)=>report.deviceType).filter(Boolean)));
    const mergedReport = new ReportActionDump({
        sdkVersion: reports[0].sdkVersion || getVersion(),
        groupName: 'Merged Midscene Report',
        groupDescription: 'Agent-readable summary for merged report HTML',
        modelBriefs: reports.flatMap((report)=>report.modelBriefs ?? []),
        deviceType: 1 === deviceTypes.length ? deviceTypes[0] : 'mixed',
        executions: reports.flatMap((report)=>report.executions ?? [])
    });
    return generateAgentReportComment(mergedReport);
}
class ReportMergingTool {
    createEmptyDumpString(groupName, groupDescription) {
        return new ReportActionDump({
            sdkVersion: '',
            groupName,
            groupDescription,
            modelBriefs: [],
            executions: []
        }).serialize();
    }
    append(reportInfo) {
        if (reportInfo.reportFilePath) {
            const sourceVersion = peekReportSdkVersion(reportInfo.reportFilePath);
            const currentVersion = getVersion();
            if (sourceVersion && currentVersion && sourceVersion !== currentVersion && !warnedMismatchedVersions.has(sourceVersion)) {
                warnedMismatchedVersions.add(sourceVersion);
                logMsg(`[@midscene/core] ReportMergingTool version mismatch: source report was written by @midscene/core@${sourceVersion} but the merger is @midscene/core@${currentVersion}. This commonly means @midscene/core and the device package (e.g. @midscene/android) resolve to different versions in node_modules. Merged output may silently drop intermediate steps. Align the versions and reinstall (rm -rf node_modules package-lock.json && npm install).`);
            }
        }
        this.reportInfos.push(reportInfo);
    }
    clear() {
        this.reportInfos = [];
    }
    mergeDumpScripts(contents) {
        const unescaped = contents.map((c)=>antiEscapeScriptTag(c)).filter((c)=>c.length > 0);
        if (0 === unescaped.length) return '';
        if (1 === unescaped.length) return unescaped[0];
        const base = ReportActionDump.fromSerializedString(unescaped[0]);
        const allExecutions = [
            ...base.executions
        ];
        for(let i = 1; i < unescaped.length; i++){
            const other = ReportActionDump.fromSerializedString(unescaped[i]);
            allExecutions.push(...other.executions);
        }
        base.executions = dedupeExecutionsKeepLatest(allExecutions);
        return base.serialize();
    }
    mergeReports(reportFileName = 'AUTO', opts) {
        const { rmOriginalReports = false, overwrite = false, outputDir } = opts ?? {};
        if (0 === this.reportInfos.length) {
            logMsg('No reports to merge');
            return null;
        }
        const targetDir = outputDir ? resolve(outputDir) : getMidsceneRunSubDir('report');
        if (outputDir) mkdirSync(targetDir, {
            recursive: true
        });
        const isDirModeByIndex = this.reportInfos.map((info)=>Boolean(info.reportFilePath && isDirectoryModeReport(info.reportFilePath)));
        const hasDirectoryModeReport = isDirModeByIndex.some(Boolean);
        const resolvedName = 'AUTO' === reportFileName ? getReportFileName('merged-report') : reportFileName;
        const outputFilePath = hasDirectoryModeReport ? resolve(targetDir, resolvedName, 'index.html') : resolve(targetDir, `${resolvedName}.html`);
        if ('AUTO' !== reportFileName && existsSync(outputFilePath)) {
            if (!overwrite) throw new Error(`Report file already exists: ${outputFilePath}\nSet overwrite to true to overwrite this file.`);
            if (hasDirectoryModeReport) rmSync(dirname(outputFilePath), {
                recursive: true,
                force: true
            });
            else unlinkSync(outputFilePath);
        }
        if (hasDirectoryModeReport) mkdirSync(dirname(outputFilePath), {
            recursive: true
        });
        logMsg(`Start merging ${this.reportInfos.length} reports...\nCreating template file...`);
        try {
            const htmlEndTag = '</html>';
            const tpl = getReportTpl();
            const htmlEndIdx = tpl.lastIndexOf(htmlEndTag);
            const tplWithoutClose = -1 !== htmlEndIdx ? tpl.slice(0, htmlEndIdx) : tpl;
            appendFileSync(outputFilePath, tplWithoutClose);
            if (hasDirectoryModeReport) appendFileSync(outputFilePath, getBaseUrlFixScript());
            const agentReports = [];
            for(let i = 0; i < this.reportInfos.length; i++){
                const reportInfo = this.reportInfos[i];
                logMsg(`Processing report ${i + 1}/${this.reportInfos.length}`);
                const { reportAttributes } = reportInfo;
                let dumpString = this.createEmptyDumpString(reportAttributes.testTitle, reportAttributes.testDescription);
                let mergedGroupId = `merged-group-${i}`;
                if (reportInfo.reportFilePath) {
                    if (isDirModeByIndex[i]) {
                        const reportDir = dirname(reportInfo.reportFilePath);
                        const screenshotsDir = join(reportDir, 'screenshots');
                        if (existsSync(screenshotsDir)) {
                            const mergedScreenshotsDir = join(dirname(outputFilePath), 'screenshots');
                            mkdirSync(mergedScreenshotsDir, {
                                recursive: true
                            });
                            for (const file of readdirSync(screenshotsDir)){
                                const src = join(screenshotsDir, file);
                                const dest = join(mergedScreenshotsDir, file);
                                copyFileSync(src, dest);
                            }
                        }
                    } else streamImageScriptsToFile(reportInfo.reportFilePath, outputFilePath);
                    const allDumps = extractAllDumpScriptsSync(reportInfo.reportFilePath).filter((d)=>d.openTag.includes('data-group-id'));
                    const groupIdMatch = allDumps[0]?.openTag.match(/data-group-id="([^"]+)"/);
                    if (groupIdMatch) mergedGroupId = decodeURIComponent(groupIdMatch[1]);
                    const extractedDumpString = allDumps.length > 0 ? this.mergeDumpScripts(allDumps.map((d)=>d.content)) : extractLastDumpScriptSync(reportInfo.reportFilePath);
                    if (extractedDumpString) dumpString = extractedDumpString;
                }
                const agentReport = tryParseAgentReportDump(dumpString);
                if (agentReport) agentReports.push(agentReport);
                const reportHtmlStr = `${reportHTMLContent({
                    dumpString,
                    attributes: {
                        'data-group-id': mergedGroupId,
                        [DATA_SCREENSHOT_MODE_ATTR]: hasDirectoryModeReport ? 'directory' : 'inline',
                        playwright_test_duration: reportAttributes.testDuration,
                        playwright_test_status: reportAttributes.testStatus,
                        playwright_test_title: reportAttributes.testTitle,
                        playwright_test_id: reportAttributes.testId,
                        playwright_test_description: reportAttributes.testDescription,
                        is_merged: true
                    }
                }, void 0, void 0, false)}\n`;
                appendFileSync(outputFilePath, reportHtmlStr);
            }
            const agentComment = mergedAgentReportComment(agentReports);
            if (agentComment) appendFileSync(outputFilePath, agentComment);
            appendFileSync(outputFilePath, `${htmlEndTag}\n`);
            logMsg(`Successfully merged new report: ${outputFilePath}`);
            if (rmOriginalReports) {
                for (const info of this.reportInfos)if (info.reportFilePath) try {
                    if (isDirectoryBasedReport(info.reportFilePath)) {
                        const reportDir = dirname(info.reportFilePath);
                        rmSync(reportDir, {
                            recursive: true,
                            force: true
                        });
                    } else unlinkSync(info.reportFilePath);
                } catch (error) {
                    logMsg(`Error deleting report ${info.reportFilePath}: ${error}`);
                }
                logMsg(`Removed ${this.reportInfos.length} original reports`);
            }
            return outputFilePath;
        } catch (error) {
            logMsg(`Error in mergeReports: ${error}`);
            throw error;
        }
    }
    constructor(){
        _define_property(this, "reportInfos", []);
    }
}
function collectDedupedExecutions(htmlPath) {
    let baseDump = null;
    let executionSerial = 0;
    const latestSerialByExecutionId = new Map();
    streamDumpScriptsSync(htmlPath, (dumpScript)=>{
        if (!dumpScript.openTag.includes('data-group-id')) return false;
        const groupedDump = ReportActionDump.fromSerializedString(antiEscapeScriptTag(dumpScript.content));
        for (const execution of groupedDump.executions){
            executionSerial += 1;
            if (execution.id) latestSerialByExecutionId.set(execution.id, executionSerial);
        }
        return false;
    });
    const executions = [];
    executionSerial = 0;
    streamDumpScriptsSync(htmlPath, (dumpScript)=>{
        if (!dumpScript.openTag.includes('data-group-id')) return false;
        const groupedDump = ReportActionDump.fromSerializedString(antiEscapeScriptTag(dumpScript.content));
        if (!baseDump) baseDump = groupedDump;
        for (const execution of groupedDump.executions){
            executionSerial += 1;
            if (!execution.id || latestSerialByExecutionId.get(execution.id) === executionSerial) executions.push(execution);
        }
        return false;
    });
    if (!baseDump) throw new Error(`No report dump scripts found in ${htmlPath}`);
    return {
        baseDump,
        executions
    };
}
function extensionByMimeType(mimeType) {
    if ('image/png' === mimeType) return 'png';
    if ('image/jpeg' === mimeType) return 'jpeg';
    throw new Error(`Unsupported screenshot mime type: ${mimeType}`);
}
function externalizeScreenshotsInExecution(execution, opts) {
    const visit = (node)=>{
        if (Array.isArray(node)) {
            for (const item of node)visit(item);
            return;
        }
        if ('object' != typeof node || null === node) return;
        const ref = normalizeScreenshotRef(node);
        if (ref) {
            const ext = extensionByMimeType(ref.mimeType);
            const fileName = `${ref.id}.${ext}`;
            const relativePath = `./screenshots/${fileName}`;
            const absolutePath = join(opts.screenshotsDir, fileName);
            if (!opts.writtenFiles.has(fileName)) {
                const resolved = resolveScreenshotSource(ref, {
                    reportPath: opts.htmlPath
                });
                if ('data-uri' === resolved.type) {
                    const rawBase64 = resolved.dataUri.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
                    writeFileSync(absolutePath, Buffer.from(rawBase64, 'base64'));
                } else copyFileSync(resolved.filePath, absolutePath);
                opts.writtenFiles.add(fileName);
            }
            ref.storage = 'file';
            ref.path = relativePath;
            return;
        }
        for (const value of Object.values(node))visit(value);
    };
    visit(execution);
}
function splitReportHtmlByExecution(options) {
    const { htmlPath, outputDir } = options;
    const screenshotsDir = join(outputDir, 'screenshots');
    mkdirSync(outputDir, {
        recursive: true
    });
    mkdirSync(screenshotsDir, {
        recursive: true
    });
    const executionJsonFiles = [];
    const writtenScreenshotFiles = new Set();
    const { baseDump, executions } = collectDedupedExecutions(htmlPath);
    let fileIndex = 0;
    for (const execution of executions){
        fileIndex += 1;
        externalizeScreenshotsInExecution(execution, {
            htmlPath,
            screenshotsDir,
            writtenFiles: writtenScreenshotFiles
        });
        const singleExecutionDump = new ReportActionDump({
            sdkVersion: baseDump.sdkVersion,
            groupName: baseDump.groupName,
            groupDescription: baseDump.groupDescription,
            modelBriefs: baseDump.modelBriefs,
            deviceType: baseDump.deviceType,
            executions: [
                execution
            ]
        });
        const jsonFilePath = join(outputDir, `${fileIndex}.execution.json`);
        writeFileSync(jsonFilePath, singleExecutionDump.serialize(2), 'utf-8');
        executionJsonFiles.push(jsonFilePath);
    }
    return {
        executionJsonFiles,
        screenshotFiles: Array.from(writtenScreenshotFiles).sort().map((fileName)=>join(screenshotsDir, fileName))
    };
}
export { ReportMergingTool, collectDedupedExecutions, dedupeExecutionsKeepLatest, isDirectoryModeReport, splitReportHtmlByExecution };

//# sourceMappingURL=report.mjs.map