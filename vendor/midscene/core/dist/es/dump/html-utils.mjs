import * as __rspack_external_node_fs_5ea92f0c from "node:fs";
import { antiEscapeScriptTag, escapeScriptTag } from "@midscene/shared/utils";
var __webpack_modules__ = {
    "node:fs" (module) {
        module.exports = __rspack_external_node_fs_5ea92f0c;
    }
};
var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module = __webpack_module_cache__[moduleId] = {
        exports: {}
    };
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
}
var external_node_fs_ = __webpack_require__("node:fs");
const escapeContent = escapeScriptTag;
const unescapeContent = antiEscapeScriptTag;
function cleanHtmlCommentValue(value) {
    return String(value ?? 'N/A').replace(/\0/g, '').replace(/--/g, '- -');
}
function formatModelBriefForAgent(brief) {
    const intent = brief.intent || 'default';
    const model = brief.name || 'unknown';
    const description = brief.modelDescription ? ` (${brief.modelDescription})` : '';
    return `${intent}: ${model}${description}`;
}
function hasUsageModelInfo(usage) {
    return Boolean(usage && (usage.model_name || usage.response_model_name || usage.model_description || usage.intent));
}
function formatUsageModelForAgent(source, usage) {
    const intent = usage.intent || source;
    const model = usage.model_name || usage.response_model_name || 'unknown';
    const description = usage.model_description ? ` (${usage.model_description})` : '';
    return `${intent}: ${model}${description}`;
}
function collectUsageModelsForAgent(report) {
    const models = new Map();
    const executions = Array.isArray(report.executions) ? report.executions : [];
    for (const execution of executions){
        const tasks = Array.isArray(execution.tasks) ? execution.tasks : [];
        for (const task of tasks){
            const taskWithUsage = task;
            const usages = [
                [
                    'main',
                    taskWithUsage.usage
                ],
                [
                    'searchArea',
                    taskWithUsage.searchAreaUsage
                ]
            ];
            for (const [source, usage] of usages){
                if (!hasUsageModelInfo(usage)) continue;
                const formatted = formatUsageModelForAgent(source, usage);
                models.set(formatted, formatted);
            }
        }
    }
    return Array.from(models.values()).join('; ');
}
function generateAgentReportComment(report) {
    const executions = Array.isArray(report.executions) ? report.executions : [];
    const taskCount = executions.reduce((sum, execution)=>sum + (Array.isArray(execution.tasks) ? execution.tasks.length : 0), 0);
    const modelBriefs = report.modelBriefs?.length ? report.modelBriefs.map(formatModelBriefForAgent).join('; ') : collectUsageModelsForAgent(report) || 'No model metadata recorded';
    const lines = [
        'For Agent Analysis:',
        `Report: ${cleanHtmlCommentValue(report.groupName)}`,
        `SDK: ${cleanHtmlCommentValue(report.sdkVersion)}`,
        `Device: ${cleanHtmlCommentValue(report.deviceType)}`,
        `Executions: ${executions.length}; Tasks: ${taskCount}`,
        `Models: ${cleanHtmlCommentValue(modelBriefs)}`,
        'Structured report JSON is stored in script[type="midscene_web_dump"] tags near this comment.',
        'Screenshots are stored as script[type="midscene-image"] tags or files referenced by screenshot refs.',
        'For AI analysis, inspect each execution task for type, status, timing, param, output, usage, searchAreaUsage, recorder, and screenshot refs.',
        'Use the Markdown export when available; it contains the same report context plus image links for agent review.'
    ];
    return `\n<!--\n${lines.join('\n')}\n-->\n`;
}
function htmlScriptCloseTag() {
    return String.fromCharCode(60) + "/script>";
}
const STREAMING_CHUNK_SIZE = 65536;
function streamScanTags(filePath, openTag, closeTag, onMatch) {
    const fd = (0, external_node_fs_.openSync)(filePath, 'r');
    const fileSize = (0, external_node_fs_.statSync)(filePath).size;
    const buffer = Buffer.alloc(STREAMING_CHUNK_SIZE);
    let position = 0;
    let leftover = '';
    let capturing = false;
    let currentContent = '';
    try {
        while(position < fileSize){
            const bytesRead = (0, external_node_fs_.readSync)(fd, buffer, 0, STREAMING_CHUNK_SIZE, position);
            const chunk = leftover + buffer.toString('utf-8', 0, bytesRead);
            position += bytesRead;
            let searchStart = 0;
            while(searchStart < chunk.length)if (capturing) {
                const endIdx = chunk.indexOf(closeTag, searchStart);
                if (-1 !== endIdx) {
                    currentContent += chunk.slice(searchStart, endIdx);
                    const shouldStop = onMatch(currentContent);
                    if (shouldStop) return;
                    capturing = false;
                    currentContent = '';
                    searchStart = endIdx + closeTag.length;
                } else {
                    currentContent += chunk.slice(searchStart, -closeTag.length);
                    leftover = chunk.slice(-closeTag.length);
                    break;
                }
            } else {
                const startIdx = chunk.indexOf(openTag, searchStart);
                if (-1 !== startIdx) {
                    capturing = true;
                    currentContent = chunk.slice(startIdx + openTag.length);
                    const endIdx = currentContent.indexOf(closeTag);
                    if (-1 !== endIdx) {
                        const shouldStop = onMatch(currentContent.slice(0, endIdx));
                        if (shouldStop) return;
                        capturing = false;
                        currentContent = '';
                        searchStart = startIdx + openTag.length + endIdx + closeTag.length;
                    } else {
                        leftover = currentContent.slice(-closeTag.length);
                        currentContent = currentContent.slice(0, -closeTag.length);
                        break;
                    }
                } else {
                    leftover = chunk.slice(-openTag.length);
                    break;
                }
            }
        }
    } finally{
        (0, external_node_fs_.closeSync)(fd);
    }
}
function extractImageByIdSync(htmlPath, imageId) {
    const targetTag = `<script type="midscene-image" data-id="${imageId}">`;
    const closeTag = htmlScriptCloseTag();
    let result = null;
    streamScanTags(htmlPath, targetTag, closeTag, (content)=>{
        result = unescapeContent(content);
        return true;
    });
    return result;
}
function streamImageScriptsToFile(srcFilePath, destFilePath) {
    const { appendFileSync } = __webpack_require__("node:fs");
    const openTag = '<script type="midscene-image"';
    const closeTag = htmlScriptCloseTag();
    streamScanTags(srcFilePath, openTag, closeTag, (content)=>{
        appendFileSync(destFilePath, `${openTag}${content}${closeTag}\n`);
        return false;
    });
}
function extractLastDumpScriptSync(filePath) {
    const openTagPrefix = '<script type="midscene_web_dump"';
    const closeTag = htmlScriptCloseTag();
    let lastContent = '';
    const fd = (0, external_node_fs_.openSync)(filePath, 'r');
    const fileSize = (0, external_node_fs_.statSync)(filePath).size;
    const buffer = Buffer.alloc(STREAMING_CHUNK_SIZE);
    let position = 0;
    let leftover = '';
    let capturing = false;
    let currentContent = '';
    try {
        while(position < fileSize){
            const bytesRead = (0, external_node_fs_.readSync)(fd, buffer, 0, STREAMING_CHUNK_SIZE, position);
            const chunk = leftover + buffer.toString('utf-8', 0, bytesRead);
            position += bytesRead;
            let searchStart = 0;
            while(searchStart < chunk.length)if (capturing) {
                const endIdx = chunk.indexOf(closeTag, searchStart);
                if (-1 !== endIdx) {
                    currentContent += chunk.slice(searchStart, endIdx);
                    lastContent = currentContent.trim();
                    capturing = false;
                    currentContent = '';
                    searchStart = endIdx + closeTag.length;
                } else {
                    currentContent += chunk.slice(searchStart, -closeTag.length);
                    leftover = chunk.slice(-closeTag.length);
                    break;
                }
            } else {
                const startIdx = chunk.indexOf(openTagPrefix, searchStart);
                if (-1 !== startIdx) {
                    const tagEndIdx = chunk.indexOf('>', startIdx);
                    if (-1 !== tagEndIdx) {
                        capturing = true;
                        currentContent = chunk.slice(tagEndIdx + 1);
                        const endIdx = currentContent.indexOf(closeTag);
                        if (-1 !== endIdx) {
                            lastContent = currentContent.slice(0, endIdx).trim();
                            capturing = false;
                            currentContent = '';
                            searchStart = tagEndIdx + 1 + endIdx + closeTag.length;
                        } else {
                            leftover = currentContent.slice(-closeTag.length);
                            currentContent = currentContent.slice(0, -closeTag.length);
                            break;
                        }
                    } else {
                        leftover = chunk.slice(startIdx);
                        break;
                    }
                } else {
                    leftover = chunk.slice(-openTagPrefix.length);
                    break;
                }
            }
        }
    } finally{
        (0, external_node_fs_.closeSync)(fd);
    }
    return lastContent;
}
function extractAllDumpScriptsSync(filePath) {
    const results = [];
    streamDumpScriptsSync(filePath, (dumpScript)=>{
        results.push(dumpScript);
        return false;
    });
    return results;
}
function streamDumpScriptsSync(filePath, onMatch) {
    const openTagPrefix = '<script type="midscene_web_dump"';
    const closeTag = htmlScriptCloseTag();
    const fd = (0, external_node_fs_.openSync)(filePath, 'r');
    const fileSize = (0, external_node_fs_.statSync)(filePath).size;
    const buffer = Buffer.alloc(STREAMING_CHUNK_SIZE);
    let position = 0;
    let leftover = '';
    let capturing = false;
    let currentContent = '';
    let currentOpenTag = '';
    try {
        while(position < fileSize){
            const bytesRead = (0, external_node_fs_.readSync)(fd, buffer, 0, STREAMING_CHUNK_SIZE, position);
            const chunk = leftover + buffer.toString('utf-8', 0, bytesRead);
            position += bytesRead;
            let searchStart = 0;
            while(searchStart < chunk.length)if (capturing) {
                const endIdx = chunk.indexOf(closeTag, searchStart);
                if (-1 !== endIdx) {
                    currentContent += chunk.slice(searchStart, endIdx);
                    const shouldStop = onMatch({
                        openTag: currentOpenTag,
                        content: currentContent.trim()
                    });
                    if (shouldStop) return;
                    capturing = false;
                    currentContent = '';
                    currentOpenTag = '';
                    searchStart = endIdx + closeTag.length;
                } else {
                    currentContent += chunk.slice(searchStart, -closeTag.length);
                    leftover = chunk.slice(-closeTag.length);
                    break;
                }
            } else {
                const startIdx = chunk.indexOf(openTagPrefix, searchStart);
                if (-1 !== startIdx) {
                    const tagEndIdx = chunk.indexOf('>', startIdx);
                    if (-1 !== tagEndIdx) {
                        capturing = true;
                        currentOpenTag = chunk.slice(startIdx, tagEndIdx + 1);
                        currentContent = chunk.slice(tagEndIdx + 1);
                        const endIdx = currentContent.indexOf(closeTag);
                        if (-1 !== endIdx) {
                            const shouldStop = onMatch({
                                openTag: currentOpenTag,
                                content: currentContent.slice(0, endIdx).trim()
                            });
                            if (shouldStop) return;
                            capturing = false;
                            currentContent = '';
                            currentOpenTag = '';
                            searchStart = tagEndIdx + 1 + endIdx + closeTag.length;
                        } else {
                            leftover = currentContent.slice(-closeTag.length);
                            currentContent = currentContent.slice(0, -closeTag.length);
                            break;
                        }
                    } else {
                        leftover = chunk.slice(startIdx);
                        break;
                    }
                } else {
                    leftover = chunk.slice(-openTagPrefix.length);
                    break;
                }
            }
        }
    } finally{
        (0, external_node_fs_.closeSync)(fd);
    }
}
function parseImageScripts(html) {
    const imageMap = {};
    const regex = /<script type="midscene-image" data-id="([^"]+)">([\s\S]*?)<\/script>/g;
    for (const match of html.matchAll(regex)){
        const [, id, content] = match;
        imageMap[id] = unescapeContent(content);
    }
    return imageMap;
}
function parseDumpScript(html) {
    const scriptOpenTag = '<script type="midscene_web_dump"';
    const closeTag = htmlScriptCloseTag();
    const lastOpenIndex = html.lastIndexOf(scriptOpenTag);
    if (-1 === lastOpenIndex) throw new Error("No dump script found in HTML");
    const tagEndIndex = html.indexOf('>', lastOpenIndex);
    if (-1 === tagEndIndex) throw new Error("No dump script found in HTML");
    const closeIndex = html.indexOf(closeTag, tagEndIndex);
    if (-1 === closeIndex) throw new Error("No dump script found in HTML");
    const content = html.substring(tagEndIndex + 1, closeIndex);
    return unescapeContent(content);
}
function parseDumpScriptAttributes(html) {
    const regex = /<script type="midscene_web_dump"([^>]*)>/;
    const match = regex.exec(html);
    if (!match) return {};
    const attrString = match[1];
    const attributes = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    for (const attrMatch of attrString.matchAll(attrRegex)){
        const [, key, value] = attrMatch;
        if ('type' !== key) attributes[key] = decodeURIComponent(value);
    }
    return attributes;
}
function generateImageScriptTag(id, data) {
    const closeTag = htmlScriptCloseTag();
    return '<script type="midscene-image" data-id="' + id + '">' + escapeContent(data) + closeTag;
}
let _baseUrlFixScript;
function getBaseUrlFixScript() {
    if (!_baseUrlFixScript) {
        const close = htmlScriptCloseTag();
        _baseUrlFixScript = '\n<script>(function(){var p=window.location.pathname;if(p.endsWith("/")||/\\.\\w+$/.test(p))return;var b=document.createElement("base");b.href=p+"/";document.head.insertBefore(b,document.head.firstChild)})()' + close + '\n';
    }
    return _baseUrlFixScript;
}
const DATA_SCREENSHOT_MODE_ATTR = 'data-screenshot-mode';
function generateDumpScriptTag(json, attributes) {
    const closeTag = htmlScriptCloseTag();
    let attrString = '';
    if (attributes && Object.keys(attributes).length > 0) attrString = ' ' + Object.entries(attributes).map(([k, v])=>k + '="' + encodeURIComponent(v) + '"').join(' ');
    return '<script type="midscene_web_dump"' + attrString + '>' + escapeContent(json) + closeTag;
}
export { DATA_SCREENSHOT_MODE_ATTR, STREAMING_CHUNK_SIZE, escapeContent, extractAllDumpScriptsSync, extractImageByIdSync, extractLastDumpScriptSync, generateAgentReportComment, generateDumpScriptTag, generateImageScriptTag, getBaseUrlFixScript, parseDumpScript, parseDumpScriptAttributes, parseImageScripts, streamDumpScriptsSync, streamImageScriptsToFile, streamScanTags, unescapeContent };

//# sourceMappingURL=html-utils.mjs.map