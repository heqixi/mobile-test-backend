"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    groupedActionDumpFileExt: ()=>groupedActionDumpFileExt,
    sleep: ()=>sleep,
    writeDumpReport: ()=>writeDumpReport,
    writeLogFile: ()=>writeLogFile,
    stringifyDumpData: ()=>stringifyDumpData,
    getReportTpl: ()=>getReportTpl,
    processCacheConfig: ()=>processCacheConfig,
    appendFileSync: ()=>external_node_fs_namespaceObject.appendFileSync,
    getTmpDir: ()=>getTmpDir,
    replacerForPageObject: ()=>replacerForPageObject,
    insertScriptBeforeClosingHtml: ()=>insertScriptBeforeClosingHtml,
    uploadTestInfoToServer: ()=>uploadTestInfoToServer,
    getVersion: ()=>getVersion,
    overlapped: ()=>overlapped,
    insertContentBeforeClosingHtml: ()=>insertContentBeforeClosingHtml,
    reportHTMLContent: ()=>reportHTMLContent,
    getTmpFile: ()=>getTmpFile
});
const external_node_child_process_namespaceObject = require("node:child_process");
const external_node_fs_namespaceObject = require("node:fs");
const external_node_os_namespaceObject = require("node:os");
const external_node_path_namespaceObject = require("node:path");
const external_node_util_namespaceObject = require("node:util");
const common_namespaceObject = require("@midscene/shared/common");
const env_namespaceObject = require("@midscene/shared/env");
const node_namespaceObject = require("@midscene/shared/node");
const utils_namespaceObject = require("@midscene/shared/utils");
let logEnvReady = false;
const groupedActionDumpFileExt = 'web-dump.json';
function htmlScriptCloseTag() {
    return String.fromCharCode(60) + "/script>";
}
function processCacheConfig(cache, cacheId) {
    if (void 0 !== cache) {
        if (false === cache) return false;
        if (true === cache) return {
            id: cacheId
        };
        if ('object' == typeof cache && null !== cache) {
            if (!cache.id) return {
                ...cache,
                id: cacheId
            };
            return cache;
        }
    }
    const envEnabled = env_namespaceObject.globalConfigManager.getEnvConfigInBoolean(env_namespaceObject.MIDSCENE_CACHE);
    if (envEnabled && cacheId) return {
        id: cacheId
    };
}
const reportInitializedMap = new Map();
const reportGroupIdMap = new Map();
function getReportTpl() {
    const reportTpl = 'REPLACE_ME_WITH_REPORT_HTML';
    return reportTpl;
}
function insertContentBeforeClosingHtml(html, content) {
    const htmlEndIdx = html.lastIndexOf('</html>');
    if (-1 === htmlEndIdx) return html + content;
    return `${html.slice(0, htmlEndIdx)}${content}\n${html.slice(htmlEndIdx)}`;
}
function insertScriptBeforeClosingHtml(filePath, scriptContent) {
    const htmlEndTag = '</html>';
    const stat = external_node_fs_namespaceObject.statSync(filePath);
    const readSize = Math.min(stat.size, 4096);
    const start = Math.max(0, stat.size - readSize);
    const buffer = Buffer.alloc(stat.size - start);
    const fd = external_node_fs_namespaceObject.openSync(filePath, 'r');
    external_node_fs_namespaceObject.readSync(fd, buffer, 0, buffer.length, start);
    external_node_fs_namespaceObject.closeSync(fd);
    const tailStr = buffer.toString('utf8');
    const htmlEndIdx = tailStr.lastIndexOf(htmlEndTag);
    if (-1 === htmlEndIdx) throw new Error(`No </html> found in file：${filePath}`);
    const beforeHtmlInTail = tailStr.slice(0, htmlEndIdx);
    const htmlEndPos = start + Buffer.byteLength(beforeHtmlInTail, 'utf8');
    external_node_fs_namespaceObject.truncateSync(filePath, htmlEndPos);
    external_node_fs_namespaceObject.appendFileSync(filePath, `${scriptContent}\n${htmlEndTag}\n`);
}
function reportHTMLContent(dumpData, reportPath, appendReport, withTpl = true) {
    let tpl = '';
    if (withTpl) {
        tpl = getReportTpl();
        if (!tpl) {
            console.warn('reportTpl is not set, will not write report');
            return '';
        }
    }
    const writeToFile = reportPath && !utils_namespaceObject.ifInBrowser;
    let dumpContent = '';
    const closeTag = htmlScriptCloseTag();
    const resolveAutoGroupId = ()=>{
        if (!reportPath || !appendReport) return (0, utils_namespaceObject.uuid)();
        const existingGroupId = reportGroupIdMap.get(reportPath);
        if (existingGroupId) return existingGroupId;
        const newGroupId = (0, utils_namespaceObject.uuid)();
        reportGroupIdMap.set(reportPath, newGroupId);
        return newGroupId;
    };
    if ('string' == typeof dumpData) {
        const groupId = resolveAutoGroupId();
        dumpContent = '<script type="midscene_web_dump" type="application/json" data-group-id="' + encodeURIComponent(groupId) + '">\n' + (0, utils_namespaceObject.escapeScriptTag)(dumpData) + '\n' + closeTag;
    } else {
        const { dumpString, attributes } = dumpData;
        const attributesArr = Object.entries(attributes || {}).filter((entry)=>void 0 !== entry[1] && null !== entry[1]).map(([key, value])=>`${key}="${encodeURIComponent(value)}"`);
        dumpContent = '<script type="midscene_web_dump" type="application/json" ' + attributesArr.join(' ') + '>\n' + (0, utils_namespaceObject.escapeScriptTag)(dumpString) + '\n' + closeTag;
    }
    if (writeToFile) {
        if (!appendReport) {
            (0, external_node_fs_namespaceObject.writeFileSync)(reportPath, insertContentBeforeClosingHtml(tpl, dumpContent), {
                flag: 'w'
            });
            return reportPath;
        }
        if (!reportInitializedMap.get(reportPath)) {
            (0, external_node_fs_namespaceObject.writeFileSync)(reportPath, tpl, {
                flag: 'w'
            });
            reportInitializedMap.set(reportPath, true);
        }
        insertScriptBeforeClosingHtml(reportPath, dumpContent);
        return reportPath;
    }
    return insertContentBeforeClosingHtml(tpl, dumpContent);
}
function writeDumpReport(fileName, dumpData, appendReport) {
    if (utils_namespaceObject.ifInBrowser || utils_namespaceObject.ifInWorker) {
        console.log('will not write report in browser');
        return null;
    }
    const reportPath = external_node_path_namespaceObject.join((0, common_namespaceObject.getMidsceneRunSubDir)('report'), `${fileName}.html`);
    reportHTMLContent(dumpData, reportPath, appendReport);
    if (process.env.MIDSCENE_DEBUG_LOG_JSON) {
        const jsonPath = `${reportPath}.json`;
        let data;
        data = 'string' == typeof dumpData ? JSON.parse(dumpData) : dumpData;
        (0, external_node_fs_namespaceObject.writeFileSync)(jsonPath, JSON.stringify(data, null, 2), {
            flag: appendReport ? 'a' : 'w'
        });
        (0, utils_namespaceObject.logMsg)(`Midscene - dump file written: ${jsonPath}`);
    }
    return reportPath;
}
function writeLogFile(opts) {
    if (utils_namespaceObject.ifInBrowser || utils_namespaceObject.ifInWorker) return '/mock/report.html';
    const { fileName, fileExt, fileContent, type = 'dump' } = opts;
    const targetDir = (0, common_namespaceObject.getMidsceneRunSubDir)(type);
    if (!logEnvReady) {
        (0, utils_namespaceObject.assert)(targetDir, 'logDir should be set before writing dump file');
        const gitIgnorePath = external_node_path_namespaceObject.join(targetDir, '../../.gitignore');
        const gitPath = external_node_path_namespaceObject.join(targetDir, '../../.git');
        let gitIgnoreContent = '';
        if ((0, external_node_fs_namespaceObject.existsSync)(gitPath)) {
            if ((0, external_node_fs_namespaceObject.existsSync)(gitIgnorePath)) gitIgnoreContent = (0, external_node_fs_namespaceObject.readFileSync)(gitIgnorePath, 'utf-8');
            if (!gitIgnoreContent.includes(`${common_namespaceObject.defaultRunDirName}/`)) (0, external_node_fs_namespaceObject.writeFileSync)(gitIgnorePath, `${gitIgnoreContent}\n# Midscene.js dump files\n${common_namespaceObject.defaultRunDirName}/dump\n${common_namespaceObject.defaultRunDirName}/report\n${common_namespaceObject.defaultRunDirName}/tmp\n${common_namespaceObject.defaultRunDirName}/log\n`, 'utf-8');
        }
        logEnvReady = true;
    }
    const filePath = external_node_path_namespaceObject.join(targetDir, `${fileName}.${fileExt}`);
    if ('dump' !== type) (0, external_node_fs_namespaceObject.writeFileSync)(filePath, JSON.stringify(fileContent));
    if (opts?.generateReport) return writeDumpReport(fileName, fileContent, opts.appendReport);
    return filePath;
}
function getTmpDir() {
    try {
        const runningPkgInfo = (0, node_namespaceObject.getRunningPkgInfo)();
        if (!runningPkgInfo) return null;
        const { name } = runningPkgInfo;
        const tmpPath = external_node_path_namespaceObject.join((0, external_node_os_namespaceObject.tmpdir)(), name);
        (0, external_node_fs_namespaceObject.mkdirSync)(tmpPath, {
            recursive: true
        });
        return tmpPath;
    } catch (e) {
        return null;
    }
}
function getTmpFile(fileExtWithoutDot) {
    if (utils_namespaceObject.ifInBrowser || utils_namespaceObject.ifInWorker) return null;
    const tmpDir = getTmpDir();
    const filename = `${(0, utils_namespaceObject.uuid)()}.${fileExtWithoutDot}`;
    return external_node_path_namespaceObject.join(tmpDir, filename);
}
function overlapped(container, target) {
    return container.left < target.left + target.width && container.left + container.width > target.left && container.top < target.top + target.height && container.top + container.height > target.top;
}
async function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
function replacerForPageObject(_key, value) {
    if (value && value.constructor?.name === 'Page') return '[Page object]';
    if (value && value.constructor?.name === 'Browser') return '[Browser object]';
    if (value && 'function' == typeof value.toSerializable) return value.toSerializable();
    return value;
}
function stringifyDumpData(data, indents) {
    return JSON.stringify(data, replacerForPageObject, indents);
}
function getVersion() {
    return "1.10.6";
}
function debugLog(...message) {
    const debugMode = process.env[env_namespaceObject.MIDSCENE_DEBUG_MODE];
    if (debugMode) console.log('[Midscene]', ...message);
}
let gitInfoPromise = null;
function getGitInfoAsync() {
    if (gitInfoPromise) return gitInfoPromise;
    const execFileAsync = (0, external_node_util_namespaceObject.promisify)(external_node_child_process_namespaceObject.execFile);
    gitInfoPromise = Promise.all([
        execFileAsync('git', [
            'config',
            '--get',
            'remote.origin.url'
        ]).then(({ stdout })=>stdout.trim(), ()=>''),
        execFileAsync('git', [
            'config',
            '--get',
            'user.email'
        ]).then(({ stdout })=>stdout.trim(), ()=>'')
    ]).then(([repoUrl, userEmail])=>({
            repoUrl,
            userEmail
        }));
    return gitInfoPromise;
}
let lastReportedRepoUrl = '';
async function uploadTestInfoToServer({ testUrl, serverUrl }) {
    if (!serverUrl) return;
    const { repoUrl, userEmail } = await getGitInfoAsync();
    if (repoUrl ? repoUrl !== lastReportedRepoUrl : !!testUrl) {
        debugLog('Uploading test info to server', {
            serverUrl,
            repoUrl,
            testUrl,
            userEmail
        });
        fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                repo_url: repoUrl,
                test_url: testUrl,
                user_email: userEmail
            })
        }).then((response)=>response.json()).then((data)=>{
            debugLog('Successfully uploaded test info to server:', data);
        }).catch((error)=>debugLog('Failed to upload test info to server:', error));
        lastReportedRepoUrl = repoUrl;
    }
}
exports.appendFileSync = __webpack_exports__.appendFileSync;
exports.getReportTpl = __webpack_exports__.getReportTpl;
exports.getTmpDir = __webpack_exports__.getTmpDir;
exports.getTmpFile = __webpack_exports__.getTmpFile;
exports.getVersion = __webpack_exports__.getVersion;
exports.groupedActionDumpFileExt = __webpack_exports__.groupedActionDumpFileExt;
exports.insertContentBeforeClosingHtml = __webpack_exports__.insertContentBeforeClosingHtml;
exports.insertScriptBeforeClosingHtml = __webpack_exports__.insertScriptBeforeClosingHtml;
exports.overlapped = __webpack_exports__.overlapped;
exports.processCacheConfig = __webpack_exports__.processCacheConfig;
exports.replacerForPageObject = __webpack_exports__.replacerForPageObject;
exports.reportHTMLContent = __webpack_exports__.reportHTMLContent;
exports.sleep = __webpack_exports__.sleep;
exports.stringifyDumpData = __webpack_exports__.stringifyDumpData;
exports.uploadTestInfoToServer = __webpack_exports__.uploadTestInfoToServer;
exports.writeDumpReport = __webpack_exports__.writeDumpReport;
exports.writeLogFile = __webpack_exports__.writeLogFile;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "appendFileSync",
    "getReportTpl",
    "getTmpDir",
    "getTmpFile",
    "getVersion",
    "groupedActionDumpFileExt",
    "insertContentBeforeClosingHtml",
    "insertScriptBeforeClosingHtml",
    "overlapped",
    "processCacheConfig",
    "replacerForPageObject",
    "reportHTMLContent",
    "sleep",
    "stringifyDumpData",
    "uploadTestInfoToServer",
    "writeDumpReport",
    "writeLogFile"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=utils.js.map