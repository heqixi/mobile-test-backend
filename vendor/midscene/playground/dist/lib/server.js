"use strict";
const __rslib_import_meta_url__ = /*#__PURE__*/ function() {
    return 'undefined' == typeof document ? new (require('url'.replace('', ''))).URL('file:' + __filename).href : document.currentScript && document.currentScript.src || new URL('main.js', document.baseURI).href;
}();
var __webpack_require__ = {};
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
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
    createManualExecutorContext: ()=>createManualExecutorContext,
    buildPlaygroundBrowserUrl: ()=>buildPlaygroundBrowserUrl,
    PlaygroundServer: ()=>PlaygroundServer,
    default: ()=>server,
    resolvePlaygroundBrowserHost: ()=>resolvePlaygroundBrowserHost,
    serializeZodField: ()=>serializeZodField,
    resolvePlaygroundListenHost: ()=>resolvePlaygroundListenHost,
    InteractParamsValidationError: ()=>InteractParamsValidationError,
    buildInteractParams: ()=>buildInteractParams
});
const external_node_crypto_namespaceObject = require("node:crypto");
const external_node_fs_namespaceObject = require("node:fs");
const promises_namespaceObject = require("node:fs/promises");
const external_node_path_namespaceObject = require("node:path");
const external_node_url_namespaceObject = require("node:url");
const core_namespaceObject = require("@midscene/core");
const ai_model_namespaceObject = require("@midscene/core/ai-model");
const utils_namespaceObject = require("@midscene/core/utils");
const common_namespaceObject = require("@midscene/shared/common");
const constants_namespaceObject = require("@midscene/shared/constants");
const env_namespaceObject = require("@midscene/shared/env");
const extractor_namespaceObject = require("@midscene/shared/extractor");
const img_namespaceObject = require("@midscene/shared/img");
const logger_namespaceObject = require("@midscene/shared/logger");
const recorder_namespaceObject = require("@midscene/shared/recorder");
const shared_utils_namespaceObject = require("@midscene/shared/utils");
const external_express_namespaceObject = require("express");
var external_express_default = /*#__PURE__*/ __webpack_require__.n(external_express_namespaceObject);
const external_common_js_namespaceObject = require("./common.js");
const external_mjpeg_stream_handler_js_namespaceObject = require("./mjpeg-stream-handler.js");
const external_pointer_dispatch_js_namespaceObject = require("./pointer-dispatch.js");
const external_runtime_metadata_js_namespaceObject = require("./runtime-metadata.js");
require("dotenv/config");
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
const defaultPort = constants_namespaceObject.PLAYGROUND_SERVER_PORT;
const RECORDER_CAPTURE_AFTER_INTERACT_DELAY_MS = 250;
const RECORDER_TYPE_ONLY_INPUT_SETTLE_DELAY_MS = 750;
const RECORDER_AI_DESCRIBE_AFTER_INTERACT_TIMEOUT_MS = 30000;
const RECORDER_AI_DESCRIBE_VERIFY_PROMPT = false;
const RECORDER_AI_DESCRIBE_SCREENSHOT_DUMP_DIR = 'recorder-ai-describe-screenshots';
const RECORDER_SCREENSHOT_ASSET_DIR = 'recorder-screenshots';
const RECORDER_SCREENSHOT_ASSET_MAX_SESSION_BYTES = 134217728;
const RECORDER_SCREENSHOT_ASSET_MAX_TOTAL_BYTES = 536870912;
const PLAYGROUND_REPORT_REF_TTL_MS = 3600000;
const REPORT_DUMP_OPEN_TAG = '<script type="midscene_web_dump"';
const REPORT_IMAGE_CLOSE_TAG = "<\/script>";
const recorderScreenshotAssetQuotaExceededSessions = new Set();
const recorderScreenshotAssetBytesBySession = new Map();
let recorderScreenshotAssetUsageInitialized = false;
async function extractLastReportDump(reportPath) {
    let pending = '';
    let current = '';
    let last = '';
    let capturing = false;
    for await (const rawChunk of (0, external_node_fs_namespaceObject.createReadStream)(reportPath, {
        encoding: 'utf8'
    })){
        let chunk = pending + rawChunk;
        pending = '';
        while(chunk){
            if (!capturing) {
                const openIndex = chunk.indexOf(REPORT_DUMP_OPEN_TAG);
                if (-1 === openIndex) {
                    pending = chunk.slice(-(REPORT_DUMP_OPEN_TAG.length - 1));
                    break;
                }
                const tagEndIndex = chunk.indexOf('>', openIndex);
                if (-1 === tagEndIndex) {
                    pending = chunk.slice(openIndex);
                    break;
                }
                capturing = true;
                current = '';
                chunk = chunk.slice(tagEndIndex + 1);
                continue;
            }
            const closeIndex = chunk.indexOf(REPORT_IMAGE_CLOSE_TAG);
            if (-1 === closeIndex) {
                const retainedLength = REPORT_IMAGE_CLOSE_TAG.length - 1;
                current += chunk.slice(0, -retainedLength);
                pending = chunk.slice(-retainedLength);
                break;
            }
            current += chunk.slice(0, closeIndex);
            last = current.trim();
            current = '';
            capturing = false;
            chunk = chunk.slice(closeIndex + REPORT_IMAGE_CLOSE_TAG.length);
        }
    }
    if (!last) throw new Error('No replay dump found in report');
    return (0, shared_utils_namespaceObject.antiEscapeScriptTag)(last);
}
async function extractInlineReportImage(reportPath, imageId) {
    const openTag = `<script type="midscene-image" data-id="${imageId}">`;
    let pending = '';
    let content = '';
    let capturing = false;
    for await (const rawChunk of (0, external_node_fs_namespaceObject.createReadStream)(reportPath, {
        encoding: 'utf8'
    })){
        let chunk = pending + rawChunk;
        pending = '';
        if (!capturing) {
            const openIndex = chunk.indexOf(openTag);
            if (-1 === openIndex) {
                pending = chunk.slice(-(openTag.length - 1));
                continue;
            }
            capturing = true;
            chunk = chunk.slice(openIndex + openTag.length);
        }
        const closeIndex = chunk.indexOf(REPORT_IMAGE_CLOSE_TAG);
        if (-1 !== closeIndex) {
            content += chunk.slice(0, closeIndex);
            return (0, shared_utils_namespaceObject.antiEscapeScriptTag)(content.trim());
        }
        const retainedLength = REPORT_IMAGE_CLOSE_TAG.length - 1;
        content += chunk.slice(0, -retainedLength);
        pending = chunk.slice(-retainedLength);
    }
    return null;
}
function shouldPersistStudioPreviewRecorderScreenshot(actionType) {
    return [
        'Tap',
        'DoubleClick',
        'LongPress',
        'RightClick',
        'DragAndDrop',
        'Input'
    ].includes(actionType);
}
function createElementDescriberRuntime(agent) {
    const modelConfigManager = agent.modelConfigManager;
    const missingModelRuntime = void 0;
    return {
        service: agent.service,
        describeModelRuntime: modelConfigManager ? (0, ai_model_namespaceObject.getModelRuntime)(modelConfigManager.getModelConfig('insight')) : missingModelRuntime,
        locateModelRuntime: modelConfigManager ? (0, ai_model_namespaceObject.getModelRuntime)(modelConfigManager.getModelConfig('default')) : missingModelRuntime
    };
}
function extractBase64Payload(value) {
    const dataUrlMatch = value.match(/^data:([^;,]+)?(?:;[^,]*)?,([\s\S]*)$/);
    if (dataUrlMatch) return {
        mimeType: dataUrlMatch[1],
        base64: dataUrlMatch[2] || ''
    };
    return {
        base64: value
    };
}
function estimateBase64Bytes(value) {
    if (!value) return;
    const { base64 } = extractBase64Payload(value);
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor(3 * base64.length / 4) - padding);
}
function buildRecorderRawPayloadSummary(rawPayload) {
    if (!rawPayload) return;
    const allowedKeys = [
        'actionType',
        'x',
        'y',
        'endX',
        'endY',
        'duration',
        'direction',
        'scrollType',
        'distance',
        'keyName',
        'mode'
    ];
    const summary = {};
    for (const key of allowedKeys)if (void 0 !== rawPayload[key]) summary[key] = rawPayload[key];
    const value = rawPayload.value;
    if ('string' == typeof value) summary.valueLength = value.length;
    return Object.keys(summary).length > 0 ? summary : void 0;
}
function buildRecorderEventSummary(event) {
    return {
        hashId: event.hashId,
        mergedHashIds: event.mergedHashIds,
        type: event.type,
        source: event.source,
        actionType: event.actionType,
        timestamp: event.timestamp,
        url: event.url,
        title: event.title,
        valueLength: 'string' == typeof event.value ? event.value.length : void 0,
        rawPayloadSummary: buildRecorderRawPayloadSummary(event.rawPayload),
        elementRect: event.elementRect,
        pageInfo: event.pageInfo
    };
}
function sanitizeRecorderPathSegment(value, fallback, maxLength = 64) {
    const normalized = 'string' == typeof value && value.trim() ? value.trim() : fallback;
    const sanitized = normalized.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return (sanitized || fallback).slice(0, maxLength);
}
function formatRecorderAiDescribeScreenshotPathParts() {
    const date = new Date();
    const localDate = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (value, length = 2)=>String(value).padStart(length, '0');
    const datePart = [
        localDate.getFullYear(),
        pad(localDate.getMonth() + 1),
        pad(localDate.getDate())
    ].join('-');
    const timePart = [
        pad(localDate.getHours()),
        pad(localDate.getMinutes()),
        pad(localDate.getSeconds()),
        pad(localDate.getMilliseconds(), 3)
    ].join('-');
    const hourPart = timePart.slice(0, 2) || 'unknown-hour';
    return {
        datePart,
        hourPart,
        filePrefix: `${timePart}_${(0, external_node_crypto_namespaceObject.randomUUID)()}`
    };
}
function assertPathInsideDirectory(rootDir, targetPath) {
    const resolvedRoot = (0, external_node_path_namespaceObject.resolve)(rootDir);
    const resolvedTarget = (0, external_node_path_namespaceObject.resolve)(targetPath);
    if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${external_node_path_namespaceObject.sep}`)) throw new Error(`Refusing to write recorder dump outside ${resolvedRoot}`);
    return resolvedTarget;
}
function writeRecorderAiDescribeScreenshot(imageBase64, suffix) {
    const { base64, mimeType } = extractBase64Payload(imageBase64);
    const bytes = Buffer.from(base64, 'base64');
    const sha256 = (0, external_node_crypto_namespaceObject.createHash)('sha256').update(bytes).digest('hex');
    const extension = mimeType?.includes('jpeg') ? 'jpg' : 'png';
    const pathParts = formatRecorderAiDescribeScreenshotPathParts();
    const dumpRoot = (0, external_node_path_namespaceObject.resolve)((0, common_namespaceObject.getMidsceneRunSubDir)('dump'), RECORDER_AI_DESCRIBE_SCREENSHOT_DUMP_DIR);
    const dumpDir = assertPathInsideDirectory(dumpRoot, (0, external_node_path_namespaceObject.join)(dumpRoot, pathParts.datePart, pathParts.hourPart));
    (0, external_node_fs_namespaceObject.mkdirSync)(dumpDir, {
        recursive: true
    });
    const safeSuffix = 'annotated' === suffix ? 'annotated' : 'raw';
    const fileName = `${pathParts.filePrefix}_${safeSuffix}.${extension}`;
    const filePath = assertPathInsideDirectory(dumpRoot, (0, external_node_path_namespaceObject.join)(dumpDir, fileName));
    if (!(0, external_node_fs_namespaceObject.existsSync)(filePath)) (0, external_node_fs_namespaceObject.writeFileSync)(filePath, bytes);
    return {
        path: filePath,
        sha256,
        bytes: bytes.byteLength,
        mimeType
    };
}
function getRecorderScreenshotAssetRoot() {
    const root = (0, external_node_path_namespaceObject.resolve)((0, common_namespaceObject.getMidsceneRunSubDir)('output'), RECORDER_SCREENSHOT_ASSET_DIR);
    (0, external_node_fs_namespaceObject.mkdirSync)(root, {
        recursive: true
    });
    return root;
}
function assertRecorderScreenshotAssetId(assetId) {
    if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) throw new Error('Invalid recorder screenshot asset id');
    return assetId;
}
function recorderScreenshotAssetExtension(mimeType) {
    return mimeType?.includes('jpeg') ? 'jpg' : 'png';
}
function recorderScreenshotAssetPath(assetId, mimeType) {
    const root = getRecorderScreenshotAssetRoot();
    const safeAssetId = assertRecorderScreenshotAssetId(assetId);
    return assertPathInsideDirectory(root, (0, external_node_path_namespaceObject.join)(root, `${safeAssetId}.${recorderScreenshotAssetExtension(mimeType)}`));
}
function getRecorderScreenshotAssetUsage(sessionId) {
    initializeRecorderScreenshotAssetUsage();
    const safeSessionId = sanitizeRecorderPathSegment(sessionId, 'session');
    const sessionBytes = recorderScreenshotAssetBytesBySession.get(safeSessionId) || 0;
    const totalBytes = Array.from(recorderScreenshotAssetBytesBySession.values()).reduce((total, bytes)=>total + bytes, 0);
    return {
        totalBytes,
        sessionBytes
    };
}
function initializeRecorderScreenshotAssetUsage() {
    if (recorderScreenshotAssetUsageInitialized) return;
    recorderScreenshotAssetUsageInitialized = true;
    const root = getRecorderScreenshotAssetRoot();
    try {
        for (const entry of (0, external_node_fs_namespaceObject.readdirSync)(root, {
            withFileTypes: true
        })){
            if (!entry.isFile()) continue;
            const match = entry.name.match(/^(.*)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg)$/i);
            if (!match?.[1]) continue;
            const sessionId = match[1];
            const bytes = (0, external_node_fs_namespaceObject.statSync)((0, external_node_path_namespaceObject.join)(root, entry.name)).size;
            recorderScreenshotAssetBytesBySession.set(sessionId, (recorderScreenshotAssetBytesBySession.get(sessionId) || 0) + bytes);
        }
    } catch (error) {
        debugRecorderAssets('failed to initialize recorder screenshot asset usage:', error);
    }
}
function persistRecorderScreenshotAsset(sessionId, imageBase64) {
    if (!imageBase64?.startsWith('data:')) return;
    const { base64, mimeType } = extractBase64Payload(imageBase64);
    const bytes = Buffer.from(base64, 'base64');
    const safeSessionId = sanitizeRecorderPathSegment(sessionId, 'session');
    const usage = getRecorderScreenshotAssetUsage(sessionId);
    if (usage.sessionBytes + bytes.byteLength > RECORDER_SCREENSHOT_ASSET_MAX_SESSION_BYTES || usage.totalBytes + bytes.byteLength > RECORDER_SCREENSHOT_ASSET_MAX_TOTAL_BYTES) {
        if (!recorderScreenshotAssetQuotaExceededSessions.has(safeSessionId)) {
            recorderScreenshotAssetQuotaExceededSessions.add(safeSessionId);
            debugRecorderAssets('recorder screenshot asset quota reached %o', {
                sessionId: safeSessionId,
                sessionBytes: usage.sessionBytes,
                totalBytes: usage.totalBytes
            });
        }
        return;
    }
    const assetId = `${safeSessionId}-${(0, external_node_crypto_namespaceObject.randomUUID)()}`;
    const normalizedMimeType = mimeType || 'image/png';
    const filePath = recorderScreenshotAssetPath(assetId, normalizedMimeType);
    try {
        (0, external_node_fs_namespaceObject.writeFileSync)(filePath, bytes);
    } catch (error) {
        debugRecorderAssets('failed to persist recorder screenshot asset:', error);
        return;
    }
    recorderScreenshotAssetBytesBySession.set(safeSessionId, usage.sessionBytes + bytes.byteLength);
    return {
        id: assetId,
        mimeType: normalizedMimeType,
        bytes: bytes.byteLength
    };
}
function readRecorderScreenshotAsset(asset) {
    const filePath = recorderScreenshotAssetPath(asset.id, asset.mimeType);
    if (!(0, external_node_fs_namespaceObject.existsSync)(filePath)) return;
    return `data:${asset.mimeType};base64,${(0, external_node_fs_namespaceObject.readFileSync)(filePath).toString('base64')}`;
}
function findRecorderScreenshotAssetPath(assetId) {
    const safeAssetId = assertRecorderScreenshotAssetId(assetId);
    const root = getRecorderScreenshotAssetRoot();
    for (const extension of [
        'png',
        'jpg'
    ]){
        const filePath = assertPathInsideDirectory(root, (0, external_node_path_namespaceObject.join)(root, `${safeAssetId}.${extension}`));
        if ((0, external_node_fs_namespaceObject.existsSync)(filePath)) return filePath;
    }
}
function removeRecorderScreenshotAssetsForSession(sessionId) {
    const safeSessionId = sanitizeRecorderPathSegment(sessionId, 'session');
    const prefix = `${safeSessionId}-`;
    const root = getRecorderScreenshotAssetRoot();
    for (const entry of (0, external_node_fs_namespaceObject.readdirSync)(root, {
        withFileTypes: true
    }))if (entry.isFile() && entry.name.startsWith(prefix)) (0, external_node_fs_namespaceObject.rmSync)((0, external_node_path_namespaceObject.join)(root, entry.name), {
        force: true
    });
    recorderScreenshotAssetQuotaExceededSessions.delete(safeSessionId);
    recorderScreenshotAssetBytesBySession.delete(safeSessionId);
}
function pruneRecorderScreenshotAssetsForSession(sessionId, retainedAssetIds) {
    const safeSessionId = sanitizeRecorderPathSegment(sessionId, 'session');
    const prefix = `${safeSessionId}-`;
    const retained = new Set(retainedAssetIds.map((assetId)=>{
        const safeAssetId = assertRecorderScreenshotAssetId(assetId);
        if (!safeAssetId.startsWith(prefix)) throw new Error('Recorder screenshot asset does not belong to session');
        return safeAssetId;
    }));
    const root = getRecorderScreenshotAssetRoot();
    let sessionBytes = 0;
    for (const entry of (0, external_node_fs_namespaceObject.readdirSync)(root, {
        withFileTypes: true
    })){
        if (!entry.isFile() || !entry.name.startsWith(prefix)) continue;
        const assetId = entry.name.replace(/\.(?:png|jpg)$/i, '');
        const filePath = (0, external_node_path_namespaceObject.join)(root, entry.name);
        if (!retained.has(assetId)) {
            (0, external_node_fs_namespaceObject.rmSync)(filePath, {
                force: true
            });
            continue;
        }
        sessionBytes += (0, external_node_fs_namespaceObject.statSync)(filePath).size;
    }
    recorderScreenshotAssetBytesBySession.set(safeSessionId, sessionBytes);
}
function calculateRecorderScreenshotAnnotation(event, imageSize, verifyResult) {
    const pageWidth = event.pageInfo?.width;
    const pageHeight = event.pageInfo?.height;
    const scaleX = pageWidth ? imageSize.width / pageWidth : void 0;
    const scaleY = pageHeight ? imageSize.height / pageHeight : void 0;
    const mapX = (value)=>scaleX ? value * scaleX : value;
    const mapY = (value)=>scaleY ? value * scaleY : value;
    const logicalPoint = 'number' == typeof event.elementRect?.x && 'number' == typeof event.elementRect?.y ? [
        event.elementRect.x,
        event.elementRect.y
    ] : void 0;
    const locateRect = verifyResult?.rect;
    const sourceTargetRect = 'number' == typeof event.elementRect?.left && 'number' == typeof event.elementRect?.top && 'number' == typeof event.elementRect?.width && 'number' == typeof event.elementRect?.height && event.elementRect.width > 0 && event.elementRect.height > 0 ? {
        left: mapX(event.elementRect.left),
        top: mapY(event.elementRect.top),
        width: mapX(event.elementRect.width),
        height: mapY(event.elementRect.height)
    } : void 0;
    if (!logicalPoint && !sourceTargetRect && !locateRect) return;
    const screenshotPoint = logicalPoint && scaleX && scaleY ? [
        logicalPoint[0] * scaleX,
        logicalPoint[1] * scaleY
    ] : void 0;
    const pointTargetRect = screenshotPoint && !sourceTargetRect ? {
        left: Math.max(0, screenshotPoint[0] - 6),
        top: Math.max(0, screenshotPoint[1] - 6),
        width: 12,
        height: 12
    } : void 0;
    const center = verifyResult?.center || (locateRect ? [
        locateRect.left + locateRect.width / 2,
        locateRect.top + locateRect.height / 2
    ] : void 0);
    const centerDelta = screenshotPoint && center ? {
        x: center[0] - screenshotPoint[0],
        y: center[1] - screenshotPoint[1],
        distance: Math.hypot(center[0] - screenshotPoint[0], center[1] - screenshotPoint[1])
    } : void 0;
    const distanceOutsideRect = screenshotPoint && locateRect ? (()=>{
        const right = locateRect.left + locateRect.width;
        const bottom = locateRect.top + locateRect.height;
        const x = screenshotPoint[0] < locateRect.left ? locateRect.left - screenshotPoint[0] : screenshotPoint[0] > right ? screenshotPoint[0] - right : 0;
        const y = screenshotPoint[1] < locateRect.top ? locateRect.top - screenshotPoint[1] : screenshotPoint[1] > bottom ? screenshotPoint[1] - bottom : 0;
        return {
            x,
            y,
            distance: Math.hypot(x, y)
        };
    })() : void 0;
    return {
        inputPoint: screenshotPoint ? {
            logical: logicalPoint,
            screenshot: screenshotPoint
        } : void 0,
        sourceTargetRect: sourceTargetRect || pointTargetRect,
        locateRect,
        centerDelta,
        distanceOutsideRect
    };
}
async function persistRecorderAiDescribeScreenshot(event, eventScreenshot, verifyResult) {
    if (!eventScreenshot) return;
    const screenshotRef = writeRecorderAiDescribeScreenshot(eventScreenshot, 'raw');
    let annotatedScreenshotRef;
    let screenshotAnnotation;
    let annotatedScreenshotPersistError;
    try {
        const imageSize = await (0, img_namespaceObject.imageInfoOfBase64)(eventScreenshot);
        screenshotAnnotation = calculateRecorderScreenshotAnnotation(event, imageSize, verifyResult);
        const annotatedRects = [
            screenshotAnnotation?.sourceTargetRect,
            screenshotAnnotation?.locateRect
        ].filter((rect)=>Boolean(rect));
        if (annotatedRects.length > 0) {
            const annotatedScreenshot = await (0, img_namespaceObject.annotateRects)(eventScreenshot, annotatedRects);
            annotatedScreenshotRef = writeRecorderAiDescribeScreenshot(annotatedScreenshot, 'annotated');
        }
    } catch (error) {
        annotatedScreenshotPersistError = error instanceof Error ? error.message : String(error);
    }
    return {
        screenshotRef,
        annotatedScreenshotRef,
        screenshotAnnotation,
        annotatedScreenshotPersistError
    };
}
function createRecorderAiDescribeTraceBase(event, eventScreenshot) {
    return {
        traceId: `${event.hashId || 'recorder-event'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        eventHashId: event.hashId,
        eventType: event.type,
        actionType: event.actionType,
        eventSummary: buildRecorderEventSummary(event),
        point: 'number' == typeof event.elementRect?.x && 'number' == typeof event.elementRect?.y ? [
            event.elementRect.x,
            event.elementRect.y
        ] : void 0,
        pageInfo: event.pageInfo,
        screenshotBytes: estimateBase64Bytes(eventScreenshot)
    };
}
function resolvePlaygroundListenHost() {
    return process.env.MIDSCENE_PLAYGROUND_HOST?.trim() || '127.0.0.1';
}
function resolvePlaygroundBrowserHost() {
    const listenHost = resolvePlaygroundListenHost();
    return '0.0.0.0' === listenHost || '::' === listenHost ? '127.0.0.1' : listenHost;
}
function buildPlaygroundBrowserUrl(host, port) {
    const normalizedHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
    return `http://${normalizedHost}:${port}`;
}
function serializeAiConfigSignature(aiConfig) {
    return JSON.stringify(Object.entries(aiConfig).sort(([leftKey], [rightKey])=>leftKey.localeCompare(rightKey)));
}
function serializeZodField(field) {
    if (!field || 'object' != typeof field) return field;
    const def = field._def;
    if (!def || 'object' != typeof def) return field;
    const typeName = def.typeName;
    const result = {
        _def: {
            typeName
        }
    };
    if (def.description) result._def.description = def.description;
    if (def.innerType) result._def.innerType = serializeZodField(def.innerType);
    if ('ZodDefault' === typeName && 'function' == typeof def.defaultValue) try {
        result._def._serializedDefaultValue = def.defaultValue();
    } catch  {}
    if ('ZodEnum' === typeName && Array.isArray(def.values)) result._def.values = def.values;
    if ('ZodObject' === typeName) {
        const rawShape = 'function' == typeof def.shape ? def.shape() : def.shape;
        if (rawShape && 'object' == typeof rawShape) {
            const serializedShape = {};
            for (const [k, v] of Object.entries(rawShape))serializedShape[k] = serializeZodField(v);
            result._def.shape = serializedShape;
            result.shape = serializedShape;
        }
    }
    if (field.description) result.description = field.description;
    return result;
}
const server_filename = (0, external_node_url_namespaceObject.fileURLToPath)(__rslib_import_meta_url__);
const server_dirname = (0, external_node_path_namespaceObject.dirname)(server_filename);
const STATIC_PATH = (0, external_node_path_namespaceObject.join)(server_dirname, '..', '..', 'static');
const debugScreenshot = (0, logger_namespaceObject.getDebug)('playground:screenshot', {
    console: true
});
const debugMjpeg = (0, logger_namespaceObject.getDebug)('playground:mjpeg', {
    console: true
});
const debugInteract = (0, logger_namespaceObject.getDebug)('playground:interact', {
    console: true
});
const debugCancel = (0, logger_namespaceObject.getDebug)('playground:cancel', {
    console: true
});
const debugReport = (0, logger_namespaceObject.getDebug)('playground:report', {
    console: true
});
const debugRecorderAssets = (0, logger_namespaceObject.getDebug)('playground:recorder-assets', {
    console: true
});
class InteractParamsValidationError extends Error {
    constructor(message){
        super(message);
        this.name = 'InteractParamsValidationError';
    }
}
function requireNumber(value, field) {
    if ('number' != typeof value || Number.isNaN(value)) throw new InteractParamsValidationError(`${field} must be a number for this action`);
    return value;
}
function locateFromPoint(x, y, fieldX, fieldY, description) {
    return (0, extractor_namespaceObject.generateElementByPoint)([
        Math.round(requireNumber(x, fieldX)),
        Math.round(requireNumber(y, fieldY))
    ], description);
}
const POINTER_INTERACT_ACTIONS = new Set([
    'Tap',
    'DoubleClick',
    'LongPress',
    'Swipe',
    'DragAndDrop',
    'Scroll',
    'KeyboardPress',
    'Input',
    'Pinch'
]);
function isPointerInteractActionType(actionType) {
    return POINTER_INTERACT_ACTIONS.has(actionType);
}
function summarizeInteractPayload(body) {
    return {
        actionType: body.actionType,
        x: body.x,
        y: body.y,
        endX: body.endX,
        endY: body.endY,
        duration: body.duration,
        direction: body.direction,
        scrollType: body.scrollType,
        distance: body.distance,
        keyName: body.keyName,
        valueLength: 'string' == typeof body.value ? body.value.length : void 0
    };
}
const buildLocateActionParams = (body, actionType)=>{
    const params = {
        locate: locateFromPoint(body.x, body.y, 'x', 'y', `manual ${actionType}`)
    };
    if ('number' == typeof body.duration) params.duration = body.duration;
    return params;
};
const buildSwipeParams = (body)=>{
    const params = {
        start: locateFromPoint(body.x, body.y, 'x', 'y', 'manual swipe start'),
        end: locateFromPoint(body.endX, body.endY, 'endX', 'endY', 'manual swipe end')
    };
    if ('number' == typeof body.duration) params.duration = body.duration;
    if ('number' == typeof body.repeat) params.repeat = body.repeat;
    return params;
};
const buildDragAndDropParams = (body)=>({
        from: locateFromPoint(body.x, body.y, 'x', 'y', 'manual drag from'),
        to: locateFromPoint(body.endX, body.endY, 'endX', 'endY', 'manual drag to')
    });
const buildScrollParams = (body)=>{
    const params = {
        scrollType: 'string' == typeof body.scrollType ? body.scrollType : 'singleAction'
    };
    if ('string' == typeof body.direction) params.direction = body.direction;
    if ('number' == typeof body.distance) params.distance = body.distance;
    if ('number' == typeof body.x && 'number' == typeof body.y) params.locate = locateFromPoint(body.x, body.y, 'x', 'y', 'manual scroll');
    return params;
};
const buildKeyboardPressParams = (body)=>{
    if ('string' != typeof body.keyName) throw new InteractParamsValidationError('keyName is required for KeyboardPress');
    const params = {
        keyName: body.keyName
    };
    if ('number' == typeof body.x && 'number' == typeof body.y) params.locate = locateFromPoint(body.x, body.y, 'x', 'y', 'manual keyboard press');
    return params;
};
const buildInputParams = (body)=>{
    if ('string' != typeof body.value) throw new InteractParamsValidationError('value is required for Input');
    const params = {
        value: body.value
    };
    if ('number' == typeof body.x && 'number' == typeof body.y) params.locate = locateFromPoint(body.x, body.y, 'x', 'y', 'manual input');
    if ('string' == typeof body.mode) params.mode = body.mode;
    if ('boolean' == typeof body.autoDismissKeyboard) params.autoDismissKeyboard = body.autoDismissKeyboard;
    return params;
};
function getManualInteractParamBuilder(actionType) {
    switch(actionType){
        case 'Tap':
        case 'DoubleClick':
        case 'RightClick':
        case 'Hover':
        case 'LongPress':
            return buildLocateActionParams;
        case 'Swipe':
            return buildSwipeParams;
        case 'DragAndDrop':
            return buildDragAndDropParams;
        case 'Scroll':
            return buildScrollParams;
        case 'KeyboardPress':
            return buildKeyboardPressParams;
        case 'Input':
            return buildInputParams;
        default:
            return;
    }
}
function buildInteractParams(actionType, body) {
    const builder = getManualInteractParamBuilder(actionType);
    if (builder) return builder(body, actionType);
    const { actionType: _omit, ...passthrough } = body;
    return passthrough;
}
function getRecorderSemanticActionType(actionType) {
    switch(actionType){
        case 'Tap':
        case 'DoubleClick':
        case 'LongPress':
        case 'RightClick':
            return 'click';
        case 'Swipe':
        case 'DragAndDrop':
            return 'drag';
        case 'Input':
            return 'input';
        case 'KeyboardPress':
            return 'keydown';
        case 'Scroll':
            return 'scroll';
        case 'GoBack':
        case 'GoForward':
        case 'Reload':
        case 'Stop':
        case 'Navigate':
        case 'InitialNavigation':
        case 'NavigationChanged':
            return 'navigation';
        default:
            return 'click';
    }
}
function buildRecorderSemanticAction(actionType, payload, url) {
    return {
        type: getRecorderSemanticActionType(actionType),
        actionType,
        value: 'string' == typeof payload.value ? payload.value : 'string' == typeof payload.keyName ? payload.keyName : void 0,
        url
    };
}
function buildReadyRecorderSemantic(source, event, elementDescription, confidence, extra) {
    return {
        source,
        status: 'ready',
        elementDescription,
        replayInstruction: (0, recorder_namespaceObject.buildMidsceneRecorderReplayInstruction)(event, elementDescription),
        actionSummary: (0, recorder_namespaceObject.buildMidsceneRecorderActionSummary)(event, elementDescription),
        confidence,
        ...extra
    };
}
function buildFailedAiDescribeRecorderSemantic(error, extra) {
    return {
        source: 'aiDescribe',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        ...extra
    };
}
function withTimeout(promise, timeoutMs, message) {
    let timeout;
    const timeoutPromise = new Promise((_resolve, reject)=>{
        timeout = setTimeout(()=>{
            reject(new Error(message));
        }, timeoutMs);
    });
    return Promise.race([
        promise,
        timeoutPromise
    ]).finally(()=>{
        if (timeout) clearTimeout(timeout);
    });
}
function createManualExecutorContext(actionType, param) {
    const task = {
        type: 'Action Space',
        subType: actionType,
        param,
        executor: async ()=>void 0,
        taskId: `manual-${(0, shared_utils_namespaceObject.uuid)()}`,
        status: 'running'
    };
    return {
        task
    };
}
const errorHandler = (err, req, res, next)=>{
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({
        error: errorMessage
    });
};
const RECOVERABLE_PAGE_SESSION_ERROR_PATTERN = /Session closed|page has been closed|target closed|browser has been closed|Target page, context or browser has been closed/i;
function isRecoverablePageSessionError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return RECOVERABLE_PAGE_SESSION_ERROR_PATTERN.test(message);
}
class PlaygroundServer {
    setActiveAgent(agent, options = {}) {
        this._activeConnection.agent = agent;
        if (!options.preserveActiveStream) this._mjpegHandler.reset();
    }
    get agent() {
        return this._activeConnection.agent;
    }
    assertNoActiveSessionForBaseStateUpdate(methodName) {
        if (this._activeConnection.session) throw new Error(`${methodName} cannot update prepared state while a session is active`);
    }
    buildBaseRuntimeState() {
        if (!this._baseRuntimeState) return;
        return {
            ...this._baseRuntimeState,
            metadata: this.buildSessionMetadata()
        };
    }
    resetConnectionToBaseState() {
        this._activeConnection = {
            session: null,
            agent: this._activeConnection.agent,
            agentFactory: this._activeConnection.agentFactory,
            runtime: this.buildBaseRuntimeState(),
            executionHooks: this._baseExecutionHooks,
            sidecars: this._baseSidecars
        };
    }
    syncRuntimeState() {
        this._baseRuntimeState = {
            ...this._baseRuntimeState || {},
            metadata: this.buildSessionMetadata()
        };
        if (this._activeConnection.session) {
            this._activeConnection = {
                ...this._activeConnection,
                runtime: this._activeConnection.runtime ? {
                    ...this._activeConnection.runtime,
                    metadata: this.buildSessionMetadata()
                } : this.buildBaseRuntimeState()
            };
            return;
        }
        this.resetConnectionToBaseState();
    }
    restoreBaseSessionState() {
        this.clearActiveSessionNavigationEvents();
        this.taskExecutionDumps = {};
        this.currentTaskId = null;
        this.sessionSetupState = 'blocked' === this.sessionSetupState ? 'blocked' : 'required';
        this._activeConnection = {
            session: null,
            agent: null,
            agentFactory: null,
            runtime: this.buildBaseRuntimeState(),
            executionHooks: this._baseExecutionHooks,
            sidecars: this._baseSidecars
        };
        this._mjpegHandler.reset();
        this.syncRuntimeState();
    }
    setPreparedPlatform(prepared) {
        if (this._activeConnection.session && this._activeConnection.agentFactory) this._activeConnection.session = null;
        this.assertNoActiveSessionForBaseStateUpdate('setPreparedPlatform');
        this.sessionManager = prepared.sessionManager;
        this._basePreparedMetadata = prepared.metadata ? {
            ...prepared.metadata
        } : void 0;
        this._baseRuntimeState = {
            platformId: prepared.platformId,
            title: prepared.title,
            description: prepared.description,
            preview: prepared.preview,
            metadata: this.buildSessionMetadata()
        };
        this._baseExecutionHooks = prepared.executionHooks;
        this._baseSidecars = prepared.sidecars;
        this.resetConnectionToBaseState();
        if (this.sessionManager && !this._activeConnection.agent && !this._activeConnection.session) {
            this.sessionSetupState = this._basePreparedMetadata?.setupState === 'blocked' ? 'blocked' : 'required';
            this.sessionSetupBlockingReason = 'string' == typeof this._basePreparedMetadata?.setupBlockingReason ? this._basePreparedMetadata.setupBlockingReason : void 0;
        }
    }
    setPreviewDescriptor(preview) {
        this.assertNoActiveSessionForBaseStateUpdate("setPreviewDescriptor");
        this._baseRuntimeState = {
            ...this._baseRuntimeState || {},
            preview
        };
        this.resetConnectionToBaseState();
    }
    setRuntimeMetadata(metadata) {
        this.assertNoActiveSessionForBaseStateUpdate('setRuntimeMetadata');
        this._basePreparedMetadata = metadata ? {
            ...metadata
        } : void 0;
        this.syncRuntimeState();
    }
    getRuntimeInfo() {
        return (0, external_runtime_metadata_js_namespaceObject.buildRuntimeInfo)({
            platformId: this._activeConnection.runtime?.platformId,
            title: this._activeConnection.runtime?.title,
            platformDescription: this._activeConnection.runtime?.description,
            interfaceType: this._activeConnection.agent?.interface?.interfaceType || 'Unknown',
            interfaceDescription: this._activeConnection.agent?.interface?.describe?.() || void 0,
            preview: this._activeConnection.runtime?.preview,
            metadata: this.buildSessionMetadata(),
            supportsScreenshot: 'function' == typeof this._activeConnection.agent?.interface?.screenshotBase64,
            mjpegStreamUrl: this._activeConnection.agent?.interface?.mjpegStreamUrl,
            scrcpyPort: this.scrcpyPort
        });
    }
    isEffectivelyConnected() {
        const rawConnected = this.sessionManager ? Boolean(this._activeConnection.session?.connected && this._activeConnection.agent) : Boolean(this._activeConnection.agent);
        return rawConnected || !this._agentReady;
    }
    getSessionInfo() {
        return {
            connected: this.isEffectivelyConnected(),
            displayName: this._activeConnection.session?.displayName,
            metadata: {
                ...this._activeConnection.session?.metadata || {}
            },
            setupState: this.sessionSetupState,
            setupBlockingReason: this.sessionSetupBlockingReason
        };
    }
    buildSessionMetadata() {
        return {
            ...this._basePreparedMetadata || {},
            ...this._activeConnection.session?.metadata || {},
            sessionConnected: this.isEffectivelyConnected(),
            sessionDisplayName: this._activeConnection.session?.displayName,
            setupState: this.sessionSetupState,
            ...this.sessionSetupBlockingReason ? {
                setupBlockingReason: this.sessionSetupBlockingReason
            } : {}
        };
    }
    async startSidecars(sidecars) {
        for (const sidecar of sidecars || [])await sidecar.start();
    }
    async stopSidecars(sidecars) {
        for (const sidecar of sidecars || [])await sidecar.stop?.();
    }
    getActiveAgentOrThrow() {
        if (!this._activeConnection.agent) throw new Error('No active session');
        return this._activeConnection.agent;
    }
    async getRecorderCapabilities() {
        const agent = this._activeConnection.agent;
        const platformId = this._activeConnection.runtime?.platformId || agent?.interface?.interfaceType;
        if (!agent) return {
            supported: false,
            source: 'unsupported',
            platformId,
            error: 'No active session.'
        };
        if (this.canRecordStudioPreviewInteractions()) return {
            supported: true,
            source: 'studio-preview',
            platformId
        };
        return {
            supported: false,
            source: 'unsupported',
            platformId,
            error: `Preview recording is unavailable for ${platformId || 'the current target'} because it does not expose manual interaction controls.`
        };
    }
    resetRecorderState() {
        this.clearPendingTypeOnlyRecorderInputFlushTimer();
        this._recorderSessionId = null;
        this._recorderEvents = [];
        this._recorderPendingTypeOnlyInput = null;
        this._recorderEventQueue = Promise.resolve();
        this._studioPreviewRecorderLastTargetPoint = void 0;
        this._studioPreviewRecorderLastScreenshot = void 0;
        this._studioPreviewRecorderLastPageState = void 0;
    }
    async waitForRecorderIdle() {
        await this.waitForQueuedRecorderEvents();
    }
    async waitForQueuedRecorderEvents() {
        await this._recorderEventQueue;
    }
    canRecordStudioPreviewInteractions() {
        const agent = this._activeConnection.agent;
        if (!agent) return false;
        if (agent.interface.inputPrimitives) return true;
        try {
            return 'function' == typeof agent.interface.actionSpace && agent.interface.actionSpace().length > 0;
        } catch  {
            return false;
        }
    }
    async takeRecorderScreenshot() {
        const agent = this._activeConnection.agent;
        if ('function' != typeof agent?.interface?.screenshotBase64) return;
        try {
            return await agent.interface.screenshotBase64();
        } catch (error) {
            debugScreenshot('recorder screenshot failed:', error);
            return;
        }
    }
    async getActivePageInfo() {
        const agent = this._activeConnection.agent;
        if ('function' != typeof agent?.interface?.size) return {
            width: 0,
            height: 0
        };
        try {
            return await agent.interface.size();
        } catch (error) {
            debugScreenshot('recorder page size failed:', error);
            return {
                width: 0,
                height: 0
            };
        }
    }
    async getActivePageUrl() {
        const activeInterface = this._activeConnection.agent?.interface;
        const getUrl = activeInterface?.url;
        if ('function' != typeof getUrl) return;
        try {
            const url = await getUrl.call(activeInterface);
            return 'string' == typeof url && url ? url : void 0;
        } catch (error) {
            debugScreenshot('recorder page url failed:', error);
            return;
        }
    }
    async getActivePageTitle() {
        const activeInterface = this._activeConnection.agent?.interface;
        const evaluateJavaScript = activeInterface?.evaluateJavaScript;
        if ('function' != typeof evaluateJavaScript) return;
        try {
            const title = await evaluateJavaScript.call(activeInterface, 'document.title');
            return 'string' == typeof title && title ? title : void 0;
        } catch (error) {
            debugScreenshot('recorder page title failed:', error);
            return;
        }
    }
    async getActiveRecorderPageState() {
        const [pageInfo, url, title] = await Promise.all([
            this.getActivePageInfo(),
            this.getActivePageUrl(),
            this.getActivePageTitle()
        ]);
        return {
            pageInfo,
            ...url ? {
                url
            } : {},
            ...title ? {
                title
            } : {}
        };
    }
    async captureRecorderSnapshotBeforeInteract() {
        if (!this._recorderSessionId) return;
        return {
            screenshot: this._studioPreviewRecorderLastScreenshot,
            pageState: this._studioPreviewRecorderLastPageState || await this.getActiveRecorderPageState()
        };
    }
    captureCachedRecorderSnapshotBeforeInteract() {
        if (!this._recorderSessionId || !this._studioPreviewRecorderLastPageState || this._recorderPendingCaptures > 0) return;
        return {
            screenshot: this._mjpegHandler.getLastFrameBase64() || this._studioPreviewRecorderLastScreenshot,
            pageState: this._studioPreviewRecorderLastPageState
        };
    }
    async startStudioPreviewRecorder(sessionId) {
        this._recorderSessionId = sessionId;
        this._studioPreviewRecorderLastScreenshot = await this.takeRecorderScreenshot();
        const initialPageState = await this.getActiveRecorderPageState();
        this._studioPreviewRecorderLastPageState = initialPageState;
        const initialNavigationEvent = this.buildStudioPreviewInitialNavigationEvent(initialPageState, this._studioPreviewRecorderLastScreenshot);
        if (initialNavigationEvent) this._recorderEvents.push(initialNavigationEvent);
    }
    persistStudioPreviewRecorderScreenshot(screenshot) {
        if (!this._recorderSessionId) return;
        return persistRecorderScreenshotAsset(this._recorderSessionId, screenshot);
    }
    async storeStudioPreviewRecorderEvent(payload, snapshotBefore, agent) {
        if (!this._recorderSessionId) return;
        const before = snapshotBefore || await this.captureRecorderSnapshotBeforeInteract();
        const screenshotBefore = before?.screenshot;
        debugInteract('recorder capture scheduled after action %o', {
            payload: summarizeInteractPayload(payload),
            delayMs: RECORDER_CAPTURE_AFTER_INTERACT_DELAY_MS,
            hasBeforeScreenshot: Boolean(screenshotBefore),
            beforeUrl: before?.pageState.url
        });
        await (0, utils_namespaceObject.sleep)(RECORDER_CAPTURE_AFTER_INTERACT_DELAY_MS);
        if (!this._recorderSessionId) return;
        const screenshotAfter = await this.takeRecorderScreenshot();
        const pageStateAfter = await this.getActiveRecorderPageState();
        debugInteract('recorder capture completed after action %o', {
            payload: summarizeInteractPayload(payload),
            hasAfterScreenshot: Boolean(screenshotAfter),
            afterUrl: pageStateAfter.url
        });
        const event = await this.buildStudioPreviewRecorderEvent(payload, before?.pageState || pageStateAfter, screenshotBefore, screenshotAfter);
        if (!event) {
            this._studioPreviewRecorderLastScreenshot = screenshotAfter;
            this._studioPreviewRecorderLastPageState = pageStateAfter;
            return;
        }
        const navigationEvent = this.buildStudioPreviewNavigationStateEvent(payload, this.getRecorderNavigationPageStateBefore(before?.pageState), pageStateAfter);
        this._studioPreviewRecorderLastScreenshot = screenshotAfter;
        this._studioPreviewRecorderLastPageState = pageStateAfter;
        this.queueStudioPreviewRecorderEventAppend(event, navigationEvent);
    }
    async buildStudioPreviewRecorderEvent(payload, pageState, screenshotBefore, screenshotAfter) {
        const actionType = 'string' == typeof payload.actionType ? payload.actionType : void 0;
        if (!actionType) return null;
        const { pageInfo, url, title } = pageState;
        const timestamp = Date.now();
        const payloadX = 'number' == typeof payload.x ? payload.x : void 0;
        const payloadY = 'number' == typeof payload.y ? payload.y : void 0;
        const canReuseLastTargetPoint = 'Input' === actionType || 'KeyboardPress' === actionType;
        const inheritedTargetPoint = canReuseLastTargetPoint && (void 0 === payloadX || void 0 === payloadY) ? this._studioPreviewRecorderLastTargetPoint : void 0;
        const x = payloadX ?? inheritedTargetPoint?.x;
        const y = payloadY ?? inheritedTargetPoint?.y;
        if (void 0 !== payloadX && void 0 !== payloadY) this._studioPreviewRecorderLastTargetPoint = {
            x: payloadX,
            y: payloadY
        };
        const endX = 'number' == typeof payload.endX ? payload.endX : void 0;
        const endY = 'number' == typeof payload.endY ? payload.endY : void 0;
        const dragDescription = void 0 !== x && void 0 !== y && void 0 !== endX && void 0 !== endY ? `${Math.round(x)},${Math.round(y)} -> ${Math.round(endX)},${Math.round(endY)}` : void 0;
        const shouldPersistScreenshot = shouldPersistStudioPreviewRecorderScreenshot(actionType);
        const retainedScreenshot = shouldPersistScreenshot ? screenshotBefore || screenshotAfter : void 0;
        const deferScreenshotPersistence = 'Input' === actionType && 'typeOnly' === payload.mode;
        const screenshotAsset = deferScreenshotPersistence ? void 0 : this.persistStudioPreviewRecorderScreenshot(retainedScreenshot);
        const shouldDiscardDataUrlScreenshot = Boolean(retainedScreenshot?.startsWith('data:'));
        const hasRetainedScreenshot = Boolean(screenshotAsset || deferScreenshotPersistence && retainedScreenshot || !shouldDiscardDataUrlScreenshot && retainedScreenshot);
        const base = {
            source: 'studio-preview',
            actionType,
            rawPayload: payload,
            pageInfo,
            url,
            title,
            ...screenshotAsset ? {
                screenshotAsset
            } : deferScreenshotPersistence ? retainedScreenshot ? {
                screenshotWithBox: retainedScreenshot
            } : {} : shouldDiscardDataUrlScreenshot ? {} : {
                screenshotBefore,
                screenshotAfter
            },
            semantic: hasRetainedScreenshot ? {
                source: 'aiDescribe',
                status: 'pending'
            } : buildFailedAiDescribeRecorderSemantic('Recorder screenshot was not retained because asset storage is unavailable or its quota was reached.'),
            timestamp,
            hashId: `studio-preview-${actionType}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`
        };
        switch(actionType){
            case 'Tap':
            case 'DoubleClick':
            case 'LongPress':
            case 'RightClick':
                return {
                    ...base,
                    type: 'click',
                    elementRect: void 0 !== x && void 0 !== y ? {
                        x,
                        y,
                        left: x,
                        top: y
                    } : {},
                    value: void 0 !== x && void 0 !== y ? `${Math.round(x)},${Math.round(y)}` : void 0
                };
            case 'DragAndDrop':
            case 'Swipe':
                return {
                    ...base,
                    type: 'drag',
                    elementRect: void 0 !== x && void 0 !== y ? {
                        x,
                        y,
                        left: x,
                        top: y,
                        width: void 0 !== endX ? Math.abs(endX - x) || void 0 : void 0,
                        height: void 0 !== endY ? Math.abs(endY - y) || void 0 : void 0
                    } : {},
                    value: dragDescription
                };
            case 'Input':
                return {
                    ...base,
                    type: 'input',
                    value: 'string' == typeof payload.value ? payload.value : '',
                    elementRect: void 0 !== x && void 0 !== y ? {
                        x,
                        y,
                        left: x,
                        top: y
                    } : {}
                };
            case 'KeyboardPress':
                return {
                    ...base,
                    type: 'keydown',
                    value: 'string' == typeof payload.keyName ? payload.keyName : '',
                    elementRect: void 0 !== x && void 0 !== y ? {
                        x,
                        y,
                        left: x,
                        top: y
                    } : {}
                };
            case 'Scroll':
                return {
                    ...base,
                    type: 'scroll',
                    value: [
                        'string' == typeof payload.direction ? payload.direction : 'down',
                        'number' == typeof payload.distance ? payload.distance : void 0
                    ].filter((part)=>void 0 !== part).join(' '),
                    elementRect: void 0 !== x && void 0 !== y ? {
                        x,
                        y,
                        left: x,
                        top: y
                    } : {}
                };
            case 'GoBack':
            case 'GoForward':
            case 'Reload':
            case 'Stop':
                {
                    const elementDescription = url || actionType;
                    const semanticEvent = buildRecorderSemanticAction(actionType, {
                        value: actionType
                    }, url);
                    return {
                        ...base,
                        type: 'navigation',
                        value: actionType,
                        semantic: buildReadyRecorderSemantic('heuristic', semanticEvent, elementDescription, url ? 'high' : 'medium')
                    };
                }
            default:
                return {
                    ...base,
                    type: 'click',
                    value: void 0 !== x && void 0 !== y ? `${Math.round(x)},${Math.round(y)}` : actionType
                };
        }
    }
    async enrichStudioPreviewRecorderEventWithAiDescribe(event, agent) {
        const startedAt = new Date();
        const startedAtMs = Date.now();
        const eventScreenshot = await this.getRecorderAiDescribeScreenshot(event);
        const traceBase = createRecorderAiDescribeTraceBase(event, eventScreenshot);
        const finishTrace = async (status, extra = {})=>{
            let screenshotRef;
            let annotatedScreenshotRef;
            let screenshotAnnotation;
            let screenshotPersistError;
            let annotatedScreenshotPersistError;
            if ('failed' === status || extra.verifyResult?.pass === false) try {
                const screenshotDump = await persistRecorderAiDescribeScreenshot(event, eventScreenshot, extra.verifyResult);
                screenshotRef = screenshotDump?.screenshotRef;
                annotatedScreenshotRef = screenshotDump?.annotatedScreenshotRef;
                screenshotAnnotation = screenshotDump?.screenshotAnnotation;
                annotatedScreenshotPersistError = screenshotDump?.annotatedScreenshotPersistError;
            } catch (error) {
                screenshotPersistError = error instanceof Error ? error.message : String(error);
            }
            return {
                ...traceBase,
                ...extra,
                screenshotRef,
                annotatedScreenshotRef,
                screenshotAnnotation,
                screenshotPersistError,
                annotatedScreenshotPersistError,
                status,
                startedAt: startedAt.toISOString(),
                durationMs: Date.now() - startedAtMs
            };
        };
        if ('navigation' === event.type || 'setViewport' === event.type) {
            const error = 'aiDescribe skipped because the event type does not target a UI element.';
            const trace = await finishTrace('failed', {
                error
            });
            debugInteract('recorder aiDescribe trace:', trace);
            return {
                event: {
                    ...event,
                    semantic: buildFailedAiDescribeRecorderSemantic(error)
                },
                trace
            };
        }
        if (!agent) {
            const error = 'Active agent does not support describeElementAtPoint.';
            const trace = await finishTrace('failed', {
                error
            });
            debugInteract('recorder aiDescribe trace:', trace);
            return {
                event: {
                    ...event,
                    semantic: buildFailedAiDescribeRecorderSemantic(error)
                },
                trace
            };
        }
        const x = event.elementRect?.x;
        const y = event.elementRect?.y;
        let modelCallDurationMs;
        let modelCallStartedAt;
        let elementDescription;
        let deepLocate;
        let verifyResult;
        const verifyPrompt = RECORDER_AI_DESCRIBE_VERIFY_PROMPT;
        try {
            if ('number' != typeof x || 'number' != typeof y) throw new Error('Skipped aiDescribe because the recorder event has no stable point target.');
            if (!eventScreenshot) throw new Error('Skipped aiDescribe because the recorder event has no screenshot.');
            if (!event.pageInfo?.width || !event.pageInfo?.height) throw new Error('Skipped aiDescribe because the recorder event has no pageInfo for coordinate mapping.');
            modelCallStartedAt = Date.now();
            const elementDescriber = createElementDescriberRuntime(agent);
            const describeResult = await withTimeout((0, core_namespaceObject.describeElementAtPoint)(elementDescriber, [
                x,
                y
            ], {
                verifyPrompt,
                screenshotBase64: eventScreenshot,
                coordinateSpace: 'logical',
                logicalSize: event.pageInfo,
                onProgress: (progress)=>{
                    elementDescription = progress.prompt?.trim() || elementDescription;
                    deepLocate = progress.deepLocate;
                    verifyResult = verifyPrompt ? progress.verifyResult : void 0;
                }
            }), RECORDER_AI_DESCRIBE_AFTER_INTERACT_TIMEOUT_MS, 'Timed out while analyzing recorder event with aiDescribe.');
            modelCallDurationMs = Date.now() - modelCallStartedAt;
            elementDescription = describeResult.prompt?.trim();
            deepLocate = describeResult.deepLocate;
            verifyResult = verifyPrompt ? describeResult.verifyResult : void 0;
            if (!elementDescription) throw new Error("aiDescribe returned an empty element description.");
            const semanticAction = buildRecorderSemanticAction(event.actionType || event.type, event.rawPayload || {}, event.url);
            if (false === describeResult.success && verifyResult?.pass === false) {
                const trace = await finishTrace('ready', {
                    modelCallDurationMs,
                    elementDescription,
                    verifyPrompt,
                    verifyPassed: false,
                    centerDistance: verifyResult.centerDistance,
                    verifyResult
                });
                debugInteract('recorder aiDescribe trace:', trace);
                return {
                    event: {
                        ...event,
                        semantic: buildReadyRecorderSemantic('aiDescribe', semanticAction, elementDescription, 'low', {
                            aiDescribe: {
                                verifyPrompt,
                                verifyPassed: false,
                                deepLocate,
                                centerDistance: verifyResult.centerDistance,
                                expectedCenter: [
                                    x,
                                    y
                                ],
                                actualCenter: verifyResult.center,
                                annotatedScreenshotPath: trace.annotatedScreenshotRef?.path
                            }
                        })
                    },
                    trace
                };
            }
            if (false === describeResult.success) throw new Error(describeResult.error || `aiDescribe ${describeResult.failureStage || 'unknown'} failed.`);
            const trace = await finishTrace('ready', {
                modelCallDurationMs,
                elementDescription,
                verifyPrompt,
                verifyPassed: verifyResult?.pass,
                centerDistance: verifyResult?.centerDistance,
                verifyResult
            });
            debugInteract('recorder aiDescribe trace:', trace);
            return {
                event: {
                    ...event,
                    semantic: buildReadyRecorderSemantic('aiDescribe', semanticAction, elementDescription, verifyResult?.pass ? 'high' : 'medium', {
                        aiDescribe: {
                            verifyPrompt,
                            verifyPassed: verifyResult?.pass,
                            deepLocate,
                            centerDistance: verifyResult?.centerDistance,
                            expectedCenter: [
                                x,
                                y
                            ],
                            actualCenter: verifyResult?.center,
                            annotatedScreenshotPath: trace.annotatedScreenshotRef?.path
                        }
                    })
                },
                trace
            };
        } catch (error) {
            const reportedError = verifyResult?.pass === false ? new Error('aiDescribe verification failed.') : error;
            if (void 0 === modelCallDurationMs && modelCallStartedAt) modelCallDurationMs = Date.now() - modelCallStartedAt;
            debugInteract('canonical recorder aiDescribe failed:', reportedError);
            const trace = await finishTrace('failed', {
                error: reportedError instanceof Error ? reportedError.message : String(reportedError),
                modelCallDurationMs,
                elementDescription,
                verifyPrompt,
                verifyPassed: verifyResult?.pass,
                centerDistance: verifyResult?.centerDistance,
                verifyResult
            });
            debugInteract('recorder aiDescribe trace:', trace);
            const aiDescribeDetails = verifyPrompt && (verifyResult || trace.annotatedScreenshotRef) ? {
                aiDescribe: {
                    verifyPrompt,
                    verifyPassed: verifyResult?.pass,
                    deepLocate,
                    centerDistance: verifyResult?.centerDistance,
                    expectedCenter: 'number' == typeof x && 'number' == typeof y ? [
                        x,
                        y
                    ] : void 0,
                    actualCenter: verifyResult?.center,
                    annotatedScreenshotPath: trace.annotatedScreenshotRef?.path
                }
            } : void 0;
            return {
                event: {
                    ...event,
                    semantic: buildFailedAiDescribeRecorderSemantic(reportedError, aiDescribeDetails)
                },
                trace
            };
        }
    }
    async getRecorderAiDescribeScreenshot(event) {
        if (event.screenshotAsset) {
            const screenshot = readRecorderScreenshotAsset(event.screenshotAsset);
            if (screenshot) return screenshot;
        }
        if ('click' === event.type || 'input' === event.type || 'keydown' === event.type || 'drag' === event.type) return event.screenshotBefore || event.screenshotAfter;
        return event.screenshotAfter || event.screenshotBefore || event.screenshotWithBox;
    }
    queueStudioPreviewRecorderEventAppend(event, navigationEvent) {
        const sessionId = this._recorderSessionId;
        if (!sessionId) return;
        if (this.isDeferredTypeOnlyRecorderInput(event) && !navigationEvent) {
            const pending = this._recorderPendingTypeOnlyInput;
            if (pending && this.canCoalesceDeferredTypeOnlyRecorderInput(pending, event)) this._recorderPendingTypeOnlyInput = this.mergeDeferredTypeOnlyRecorderInput(pending, event);
            else {
                this.flushPendingTypeOnlyRecorderInput();
                this._recorderPendingTypeOnlyInput = event;
            }
            this.schedulePendingTypeOnlyRecorderInputFlush();
            return;
        }
        this.flushPendingTypeOnlyRecorderInput();
        this._recorderEvents.push(event);
        if (navigationEvent) this._recorderEvents.push(navigationEvent);
    }
    isDeferredTypeOnlyRecorderInput(event) {
        return 'studio-preview' === event.source && 'input' === event.type && 'Input' === event.actionType && event.rawPayload?.mode === 'typeOnly';
    }
    canCoalesceDeferredTypeOnlyRecorderInput(current, next) {
        return current.url === next.url && current.title === next.title && current.rawPayload?.x === next.rawPayload?.x && current.rawPayload?.y === next.rawPayload?.y;
    }
    mergeDeferredTypeOnlyRecorderInput(current, next) {
        const value = `${current.value || ''}${next.value || ''}`;
        return {
            ...current,
            value,
            rawPayload: {
                ...current.rawPayload,
                ...next.rawPayload,
                value
            },
            pageInfo: next.pageInfo || current.pageInfo,
            screenshotWithBox: next.screenshotWithBox || next.screenshotAfter || next.screenshotBefore || current.screenshotWithBox,
            timestamp: next.timestamp,
            mergedHashIds: Array.from(new Set([
                current.hashId,
                ...current.mergedHashIds || [],
                next.hashId,
                ...next.mergedHashIds || []
            ]))
        };
    }
    flushPendingTypeOnlyRecorderInput() {
        this.clearPendingTypeOnlyRecorderInputFlushTimer();
        const pending = this._recorderPendingTypeOnlyInput;
        if (!pending) return;
        this._recorderPendingTypeOnlyInput = null;
        const screenshot = pending.screenshotWithBox || pending.screenshotAfter || pending.screenshotBefore;
        const screenshotAsset = this.persistStudioPreviewRecorderScreenshot(screenshot);
        if (screenshotAsset) return void this._recorderEvents.push({
            ...pending,
            screenshotAsset,
            screenshotBefore: void 0,
            screenshotAfter: void 0,
            screenshotWithBox: void 0
        });
        this._recorderEvents.push({
            ...pending,
            screenshotBefore: void 0,
            screenshotAfter: void 0,
            screenshotWithBox: void 0,
            semantic: buildFailedAiDescribeRecorderSemantic('Recorder screenshot was not retained because asset storage is unavailable or its quota was reached.')
        });
    }
    schedulePendingTypeOnlyRecorderInputFlush() {
        this.clearPendingTypeOnlyRecorderInputFlushTimer();
        this._recorderPendingTypeOnlyInputFlushTimer = setTimeout(()=>{
            this._recorderPendingTypeOnlyInputFlushTimer = void 0;
            this.flushPendingTypeOnlyRecorderInput();
        }, RECORDER_TYPE_ONLY_INPUT_SETTLE_DELAY_MS);
    }
    clearPendingTypeOnlyRecorderInputFlushTimer() {
        if (!this._recorderPendingTypeOnlyInputFlushTimer) return;
        clearTimeout(this._recorderPendingTypeOnlyInputFlushTimer);
        this._recorderPendingTypeOnlyInputFlushTimer = void 0;
    }
    getRecorderNavigationPageStateBefore(snapshotPageState) {
        const lastPageState = this._studioPreviewRecorderLastPageState;
        if (!snapshotPageState?.url || !lastPageState?.url || snapshotPageState.url === lastPageState.url) return snapshotPageState;
        return lastPageState;
    }
    buildStudioPreviewNavigationStateEvent(payload, pageStateBefore, pageStateAfter) {
        const triggerActionType = 'string' == typeof payload.actionType ? payload.actionType : void 0;
        const beforeUrl = pageStateBefore?.url;
        const afterUrl = pageStateAfter.url;
        if (!triggerActionType || !afterUrl || beforeUrl === afterUrl) return null;
        const timestamp = Date.now();
        const semanticAction = buildRecorderSemanticAction('Navigate', {
            value: afterUrl
        }, afterUrl);
        return {
            source: 'studio-preview',
            type: 'navigation',
            actionType: 'Navigate',
            rawPayload: {
                triggerActionType,
                beforeUrl,
                afterUrl,
                implicitNavigationState: true
            },
            pageInfo: pageStateAfter.pageInfo,
            url: afterUrl,
            title: pageStateAfter.title,
            value: afterUrl,
            semantic: buildReadyRecorderSemantic('heuristic', semanticAction, afterUrl, 'high'),
            timestamp,
            hashId: `studio-preview-navigation-${timestamp}-${Math.random().toString(36).slice(2, 8)}`
        };
    }
    recordStudioPreviewNavigationState(navigation) {
        const sessionId = this._recorderSessionId;
        if (!sessionId || !navigation.url) return;
        const task = this._recorderEventQueue.catch(()=>void 0).then(()=>{
            if (this._recorderSessionId !== sessionId) return;
            const pageStateBefore = this._studioPreviewRecorderLastPageState;
            if (pageStateBefore?.url === navigation.url) return;
            const navigationEvent = this.buildStudioPreviewNavigationStateEvent({
                actionType: 'SessionNavigation'
            }, pageStateBefore, {
                pageInfo: pageStateBefore?.pageInfo || {
                    width: 0,
                    height: 0
                },
                url: navigation.url
            });
            if (!navigationEvent) return;
            navigationEvent.timestamp = navigation.timestamp || Date.now();
            navigationEvent.rawPayload = {
                ...navigationEvent.rawPayload,
                navigationSource: 'session-event'
            };
            const lastActionIndex = this._recorderEvents.findLastIndex((event)=>'studio-preview' === event.source && 'navigation' !== event.type);
            const existingState = lastActionIndex >= 0 ? this._recorderEvents[lastActionIndex + 1] : void 0;
            if (existingState?.rawPayload?.implicitNavigationState === true) this._recorderEvents.push({
                ...navigationEvent,
                hashId: existingState.hashId
            });
            else if (lastActionIndex >= 0) this._recorderEvents.splice(lastActionIndex + 1, 0, navigationEvent);
            else this._recorderEvents.push(navigationEvent);
            this._studioPreviewRecorderLastPageState = {
                pageInfo: pageStateBefore?.pageInfo || {
                    width: 0,
                    height: 0
                },
                ...pageStateBefore?.title ? {
                    title: pageStateBefore.title
                } : {},
                url: navigation.url
            };
        });
        this._recorderEventQueue = task.catch((error)=>{
            debugInteract('session navigation recorder event failed:', error);
        });
    }
    queueStudioPreviewRecorderEvent(payload, snapshotBefore, agent) {
        const sessionId = this._recorderSessionId;
        if (!sessionId) return;
        this._recorderPendingCaptures++;
        const queuedTask = this._recorderEventQueue.catch(()=>void 0).then(async ()=>{
            try {
                if (!this._recorderSessionId || this._recorderSessionId !== sessionId) return;
                await this.storeStudioPreviewRecorderEvent(payload, snapshotBefore, agent);
            } finally{
                this._recorderPendingCaptures = Math.max(0, this._recorderPendingCaptures - 1);
            }
        });
        this._recorderEventQueue = queuedTask.catch((error)=>{
            debugInteract('async recorder event capture failed:', error);
        });
    }
    buildStudioPreviewInitialNavigationEvent(pageState, screenshot) {
        if (!pageState.url) return null;
        const timestamp = Date.now();
        const semanticEvent = buildRecorderSemanticAction('InitialNavigation', {
            value: pageState.url
        }, pageState.url);
        return {
            source: 'studio-preview',
            type: 'navigation',
            actionType: 'InitialNavigation',
            rawPayload: {
                url: pageState.url,
                title: pageState.title
            },
            pageInfo: pageState.pageInfo,
            url: pageState.url,
            title: pageState.title,
            value: pageState.url,
            semantic: buildReadyRecorderSemantic('heuristic', semanticEvent, pageState.url, 'high'),
            timestamp,
            hashId: `studio-preview-initial-navigation-${timestamp}-${Math.random().toString(36).slice(2, 8)}`
        };
    }
    async destroyCurrentAgent({ preserveActiveStream = false } = {}) {
        if (!this._activeConnection.agent) return;
        try {
            this.resetRecorderState();
            if ('function' == typeof this._activeConnection.agent.destroy) await this._activeConnection.agent.destroy();
        } catch (error) {
            console.warn('Failed to destroy old agent:', error);
        } finally{
            this.setActiveAgent(null, {
                preserveActiveStream
            });
            this._configDirty = false;
        }
    }
    async destroyCurrentSession() {
        const previousSession = this._activeConnection.session;
        const previousSidecars = this._activeConnection.sidecars;
        this.clearActiveSessionNavigationEvents();
        await this.destroyCurrentAgent();
        await this.stopSidecars(previousSidecars);
        if (this.sessionManager?.destroySession) await this.sessionManager.destroySession(previousSession || void 0);
        this.restoreBaseSessionState();
    }
    async applyCreatedSession(session) {
        if (!session.agent && !session.agentFactory) throw new Error('Session creation must provide either an agent or agentFactory');
        const sessionSidecars = session.sidecars || this._baseSidecars;
        await this.startSidecars(sessionSidecars);
        try {
            this._activeConnection = {
                session: {
                    connected: true,
                    displayName: session.displayName,
                    metadata: session.metadata ? {
                        ...session.metadata
                    } : {}
                },
                agent: session.agent || null,
                agentFactory: session.agentFactory || null,
                runtime: {
                    platformId: session.platformId ?? this._baseRuntimeState?.platformId,
                    title: session.title ?? this._baseRuntimeState?.title,
                    description: session.platformDescription ?? this._baseRuntimeState?.description,
                    preview: session.preview ?? this._baseRuntimeState?.preview,
                    metadata: session.metadata ? {
                        ...session.metadata
                    } : {}
                },
                executionHooks: session.executionHooks || this._baseExecutionHooks,
                sidecars: sessionSidecars,
                subscribeNavigationEvents: session.subscribeNavigationEvents
            };
            this._mjpegHandler.reset();
            this.sessionSetupState = 'ready';
            this.sessionSetupBlockingReason = void 0;
            this.syncRuntimeState();
        } catch (error) {
            await this.stopSidecars(sessionSidecars).catch(()=>{});
            this.restoreBaseSessionState();
            throw error;
        }
    }
    bindActiveSessionNavigationEvents() {
        this.clearActiveSessionNavigationEvents();
        const subscribe = this._activeConnection.subscribeNavigationEvents;
        if (!subscribe) return;
        this._activeConnection.unsubscribeNavigationEvents = subscribe((event)=>{
            this.recordStudioPreviewNavigationState(event);
        });
    }
    clearActiveSessionNavigationEvents() {
        const unsubscribe = this._activeConnection.unsubscribeNavigationEvents;
        this._activeConnection.unsubscribeNavigationEvents = void 0;
        if (!unsubscribe) return;
        try {
            unsubscribe();
        } catch (error) {
            debugInteract('failed to unsubscribe session navigation events:', error);
        }
    }
    async getSessionSetupSchema(input) {
        if (!this.sessionManager) return null;
        return this.sessionManager.getSetupSchema ? this.sessionManager.getSetupSchema(input) : null;
    }
    async getSessionTargets() {
        if (!this.sessionManager?.listTargets) return [];
        return this.sessionManager.listTargets();
    }
    get app() {
        return this._app;
    }
    initializeApp() {
        if (this._initialized) return;
        this._app.use(external_express_default().json({
            limit: '50mb'
        }));
        this._app.use((req, _res, next)=>{
            const { context } = req.body || {};
            if (this._activeConnection.agent && context && 'updateContext' in this._activeConnection.agent.interface && 'function' == typeof this._activeConnection.agent.interface.updateContext) {
                this._activeConnection.agent.interface.updateContext(context);
                console.log('Context updated by PlaygroundServer middleware');
            }
            next();
        });
        this.setupRoutes();
        this.setupStaticRoutes();
        this._app.use(errorHandler);
        this._initialized = true;
    }
    filePathForUuid(uuid) {
        if (!/^[a-zA-Z0-9-]+$/.test(uuid)) throw new Error('Invalid uuid format');
        const filePath = (0, external_node_path_namespaceObject.join)(this.tmpDir, `${uuid}.json`);
        const resolvedPath = (0, external_node_path_namespaceObject.resolve)(filePath);
        const resolvedTmpDir = (0, external_node_path_namespaceObject.resolve)(this.tmpDir);
        if (!resolvedPath.startsWith(resolvedTmpDir)) throw new Error('Invalid path');
        return filePath;
    }
    saveContextFile(uuid, context) {
        const tmpFile = this.filePathForUuid(uuid);
        console.log(`save context file: ${tmpFile}`);
        (0, external_node_fs_namespaceObject.writeFileSync)(tmpFile, context);
        return tmpFile;
    }
    async recreateAgent({ preserveActiveStream = false } = {}) {
        this._agentReady = false;
        console.log('Recreating agent to cancel current task...');
        await this.destroyCurrentAgent({
            preserveActiveStream
        });
        if (this._activeConnection.agentFactory) try {
            this.setActiveAgent(await this._activeConnection.agentFactory(), {
                preserveActiveStream
            });
            this._agentReady = true;
            console.log('Agent recreated successfully');
        } catch (error) {
            this._agentReady = true;
            console.error('Failed to recreate agent:', error);
            throw error;
        }
        else {
            this._agentReady = true;
            console.warn('Agent destroyed but cannot recreate: no factory function provided. Next /execute call will fail.');
        }
    }
    async recoverActiveAgentAfterPreviewError(error, reason) {
        if (!this._activeConnection.agentFactory || !isRecoverablePageSessionError(error)) return null;
        debugMjpeg(`Recovering active agent after ${reason}:`, error);
        try {
            this._mjpegHandler.reset();
            await this.recreateAgent();
            return this._activeConnection.agent;
        } catch (recreateError) {
            debugMjpeg(`Failed to recover active agent after ${reason}:`, recreateError);
            return null;
        }
    }
    findInteractAction(agent, actionType) {
        return agent.interface.actionSpace().find((entry)=>entry.name === actionType);
    }
    canRunBrowserChromeInteractAction(agent, actionType) {
        return 'Stop' === actionType && 'function' == typeof agent.interface.stopLoading;
    }
    async runBrowserChromeInteractAction(agent, actionType) {
        switch(actionType){
            case 'Stop':
                await agent.interface.stopLoading?.();
                return;
        }
    }
    async runInteractAction(agent, actionType, params) {
        if (this.canRunBrowserChromeInteractAction(agent, actionType)) return void await this.runBrowserChromeInteractAction(agent, actionType);
        const action = this.findInteractAction(agent, actionType);
        if (!action || 'function' != typeof action.call) throw new Error(`Action "${actionType}" is not available on the current device`);
        await action.call(params, createManualExecutorContext(actionType, params));
    }
    async registerReportFile(reportPath) {
        if (!reportPath) return null;
        const reportStat = await (0, promises_namespaceObject.stat)(reportPath);
        if (!reportStat.isFile()) throw new Error(`Report path is not a file: ${reportPath}`);
        const screenshotsPath = (0, external_node_path_namespaceObject.join)((0, external_node_path_namespaceObject.dirname)(reportPath), 'screenshots');
        const hasExternalScreenshots = await (0, promises_namespaceObject.stat)(screenshotsPath).then((entry)=>entry.isDirectory()).catch(()=>false);
        const format = 'index.html' === (0, external_node_path_namespaceObject.basename)(reportPath) && hasExternalScreenshots ? 'html-and-external-assets' : 'single-html';
        const now = Date.now();
        for (const [id, report] of this.reportFiles)if (report.expiresAt <= now) this.reportFiles.delete(id);
        const id = (0, external_node_crypto_namespaceObject.randomUUID)();
        this.reportFiles.set(id, {
            path: reportPath,
            expiresAt: now + PLAYGROUND_REPORT_REF_TTL_MS,
            format
        });
        return {
            id,
            url: `/reports/${id}/`,
            replayUrl: `/reports/${id}/replay`,
            bytes: reportStat.size,
            format
        };
    }
    getRegisteredReport(reportId) {
        const report = this.reportFiles.get(reportId);
        if (!report || report.expiresAt <= Date.now()) {
            if (report) this.reportFiles.delete(reportId);
            return null;
        }
        report.expiresAt = Date.now() + PLAYGROUND_REPORT_REF_TTL_MS;
        return report;
    }
    setupRoutes() {
        this._app.get('/status', async (req, res)=>{
            res.send({
                status: 'ok',
                id: this.id
            });
        });
        this._app.get('/reports/:reportId/replay', async (req, res)=>{
            const report = this.getRegisteredReport(req.params.reportId);
            if (!report) return res.status(404).json({
                error: 'Report not found or expired'
            });
            try {
                const serializedDump = await extractLastReportDump(report.path);
                res.setHeader('Cache-Control', 'no-store');
                return res.type('json').send(serializedDump);
            } catch (error) {
                debugReport('failed to stream report replay: %s', error);
                return res.status(500).json({
                    error: 'Failed to load report replay'
                });
            }
        });
        this._app.get('/reports/:reportId/screenshots/:assetName', async (req, res)=>{
            const report = this.getRegisteredReport(req.params.reportId);
            if (!report) return res.status(404).json({
                error: 'Report not found or expired'
            });
            const match = /^([A-Za-z0-9_-]+)\.(png|jpe?g)$/.exec(req.params.assetName);
            if (!match) return res.status(400).json({
                error: 'Invalid screenshot asset'
            });
            const [, imageId, extension] = match;
            const externalAssetPath = (0, external_node_path_namespaceObject.join)((0, external_node_path_namespaceObject.dirname)(report.path), 'screenshots', req.params.assetName);
            const externalAssetExists = await (0, promises_namespaceObject.stat)(externalAssetPath).then((entry)=>entry.isFile()).catch(()=>false);
            res.setHeader('Cache-Control', 'private, max-age=3600');
            if (externalAssetExists) return res.sendFile(externalAssetPath);
            try {
                const dataUri = await extractInlineReportImage(report.path, imageId);
                if (!dataUri) return res.status(404).json({
                    error: 'Screenshot not found'
                });
                const commaIndex = dataUri.indexOf(',');
                if (-1 === commaIndex) throw new Error('Invalid screenshot data URI');
                const mimeType = 'png' === extension ? 'image/png' : 'image/jpeg';
                return res.type(mimeType).send(Buffer.from(dataUri.slice(commaIndex + 1), 'base64'));
            } catch (error) {
                debugReport('failed to stream report screenshot: %s', error);
                return res.status(500).json({
                    error: 'Failed to load screenshot'
                });
            }
        });
        this._app.get('/reports/:reportId/', (req, res)=>{
            const report = this.getRegisteredReport(req.params.reportId);
            if (!report) return res.status(404).json({
                error: 'Report not found or expired'
            });
            res.setHeader('Cache-Control', 'no-store');
            res.type('html');
            return res.sendFile(report.path);
        });
        this._app.get('/session', async (_req, res)=>{
            res.json(this.getSessionInfo());
        });
        this._app.get('/session/setup', async (req, res)=>{
            try {
                const setup = await this.getSessionSetupSchema(Object.fromEntries(Object.entries(req.query).filter(([, value])=>'string' == typeof value)));
                if (!setup) return res.status(404).json({
                    error: 'Session setup is not available for this playground'
                });
                const targets = await this.getSessionTargets();
                res.json({
                    ...setup,
                    targets: targets.length > 0 ? targets : setup.targets
                });
            } catch (error) {
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Failed to load session setup'
                });
            }
        });
        this._app.get('/session/targets', async (_req, res)=>{
            try {
                res.json(await this.getSessionTargets());
            } catch (error) {
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Failed to load session targets'
                });
            }
        });
        this._app.post('/session', async (req, res)=>{
            if (!this.sessionManager) return res.status(404).json({
                error: 'Session creation is not available for this playground'
            });
            if (this.currentTaskId) return res.status(409).json({
                error: 'Cannot replace session while a task is running'
            });
            try {
                await this.destroyCurrentSession();
                const created = await this.sessionManager.createSession(req.body || {});
                await this.applyCreatedSession(created);
                if (!this._activeConnection.agent && this._activeConnection.agentFactory) this.setActiveAgent(await this._activeConnection.agentFactory());
                this.bindActiveSessionNavigationEvents();
                if (this._configDirty && this._activeConnection.agentFactory) {
                    this._configDirty = false;
                    await this.recreateAgent();
                }
                res.json({
                    session: this.getSessionInfo(),
                    runtimeInfo: this.getRuntimeInfo()
                });
            } catch (error) {
                const failedSessionSidecars = this._activeConnection.session ? this._activeConnection.sidecars : void 0;
                await this.destroyCurrentAgent();
                await this.stopSidecars(failedSessionSidecars).catch(()=>{});
                this.restoreBaseSessionState();
                res.status(400).json({
                    error: error instanceof Error ? error.message : 'Failed to create session'
                });
            }
        });
        this._app.delete('/session', async (_req, res)=>{
            if (this.currentTaskId) return res.status(409).json({
                error: 'Cannot destroy session while a task is running'
            });
            try {
                await this.destroyCurrentSession();
                res.json({
                    session: this.getSessionInfo(),
                    runtimeInfo: this.getRuntimeInfo()
                });
            } catch (error) {
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Failed to destroy session'
                });
            }
        });
        this._app.get('/context/:uuid', async (req, res)=>{
            const { uuid } = req.params;
            let contextFile;
            try {
                contextFile = this.filePathForUuid(uuid);
            } catch  {
                return res.status(400).json({
                    error: 'Invalid uuid format'
                });
            }
            if (!(0, external_node_fs_namespaceObject.existsSync)(contextFile)) return res.status(404).json({
                error: 'Context not found'
            });
            const context = (0, external_node_fs_namespaceObject.readFileSync)(contextFile, 'utf8');
            res.json({
                context
            });
        });
        this._app.get('/task-progress/:requestId', async (req, res)=>{
            const { requestId } = req.params;
            const executionDump = this.taskExecutionDumps[requestId] || null;
            res.json({
                executionDump
            });
        });
        this._app.post('/action-space', async (req, res)=>{
            try {
                const agent = this.getActiveAgentOrThrow();
                let actionSpace = [];
                actionSpace = agent.interface.actionSpace();
                const processedActionSpace = actionSpace.map((action)=>{
                    if (action && 'object' == typeof action && 'paramSchema' in action) {
                        const typedAction = action;
                        if (typedAction.paramSchema && 'object' == typeof typedAction.paramSchema) {
                            let processedSchema = null;
                            try {
                                if (typedAction.paramSchema.shape && 'object' == typeof typedAction.paramSchema.shape) {
                                    const rawShape = typedAction.paramSchema.shape;
                                    const serializedShape = {};
                                    for (const [key, field] of Object.entries(rawShape))serializedShape[key] = serializeZodField(field);
                                    processedSchema = {
                                        type: 'ZodObject',
                                        shape: serializedShape
                                    };
                                }
                            } catch (e) {
                                const actionName = 'name' in typedAction && 'string' == typeof typedAction.name ? typedAction.name : 'unknown';
                                console.warn('Failed to process paramSchema for action:', actionName, e);
                            }
                            return {
                                ...typedAction,
                                paramSchema: processedSchema
                            };
                        }
                    }
                    return action;
                });
                res.json(processedActionSpace);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error('Failed to get action space:', error);
                res.status('No active session' === errorMessage ? 409 : 500).json({
                    error: errorMessage
                });
            }
        });
        this._app.post('/playground-with-context', async (req, res)=>{
            const context = req.body.context;
            if (!context) return res.status(400).json({
                error: 'context is required'
            });
            const requestId = (0, shared_utils_namespaceObject.uuid)();
            this.saveContextFile(requestId, context);
            return res.json({
                location: `/playground/${requestId}`,
                uuid: requestId
            });
        });
        this._app.post('/execute', async (req, res)=>{
            let agent;
            try {
                agent = this.getActiveAgentOrThrow();
            } catch (error) {
                return res.status(409).json({
                    error: error instanceof Error ? error.message : 'No active session'
                });
            }
            const { type, prompt, params, requestId, deepLocate, deepThink, screenshotIncluded, domIncluded, deviceOptions, reportDisplay } = req.body;
            if (!type) return res.status(400).json({
                error: 'type is required'
            });
            if (this._activeConnection.agentFactory && this._configDirty) {
                this._configDirty = false;
                this._agentReady = false;
                console.log('AI config changed, recreating agent...');
                try {
                    await this.destroyCurrentAgent();
                    this.setActiveAgent(await this._activeConnection.agentFactory());
                    agent = this.getActiveAgentOrThrow();
                    this._agentReady = true;
                    console.log('Agent recreated with new config');
                } catch (error) {
                    this._agentReady = true;
                    console.error('Failed to recreate agent:', error);
                    return res.status(500).json({
                        error: `Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                }
            }
            if (deviceOptions) {
                const iface = agent.interface;
                iface.options = {
                    ...iface.options || {},
                    ...deviceOptions
                };
            }
            if (this.currentTaskId) return res.status(409).json({
                error: 'Another task is already running',
                currentTaskId: this.currentTaskId
            });
            let abortController = null;
            if (requestId) {
                this.currentTaskId = requestId;
                this.taskExecutionDumps[requestId] = null;
                abortController = new AbortController();
                this.taskAbortControllers[requestId] = abortController;
                agent.onDumpUpdate = (_dump, executionDump)=>{
                    if (executionDump) this.taskExecutionDumps[requestId] = executionDump;
                };
            }
            const response = {
                result: null,
                dump: null,
                error: null,
                reportHTML: null,
                report: null,
                requestId
            };
            const startTime = Date.now();
            try {
                agent.resetDump?.();
                await this._activeConnection.executionHooks?.beforeExecute?.();
                const actionSpace = agent.interface.actionSpace();
                const value = {
                    type,
                    prompt,
                    params
                };
                response.result = await (0, external_common_js_namespaceObject.executeAction)(agent, type, actionSpace, value, {
                    requestId,
                    deepLocate,
                    deepThink,
                    screenshotIncluded,
                    domIncluded,
                    abortSignal: abortController?.signal,
                    deviceOptions,
                    reportDisplay
                });
            } catch (error) {
                response.error = (0, external_common_js_namespaceObject.formatErrorMessage)(error);
            } finally{
                try {
                    await this._activeConnection.executionHooks?.afterExecute?.();
                } catch (hookError) {
                    console.error('Failed to run execution after hook:', hookError);
                }
            }
            if (abortController?.signal.aborted) response.dump = null;
            else try {
                const reportStartedAt = Date.now();
                const reportFile = agent.reportFile;
                response.report = await this.registerReportFile(reportFile);
                response.dump = null;
                agent.resetDump();
                debugReport('registered persisted report: requestId=%s, duration=%dms, bytes=%d, file=%s', requestId, Date.now() - reportStartedAt, response.report?.bytes || 0, reportFile || 'none');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                debugReport('register persisted report failed: requestId=%s, error=%s', requestId, errorMessage);
            }
            res.send(response);
            const timeCost = Date.now() - startTime;
            if (response.error) console.error(`handle request failed after ${timeCost}ms: requestId: ${requestId}, ${response.error}`);
            else console.log(`handle request done after ${timeCost}ms: requestId: ${requestId}`);
            if (requestId) {
                delete this.taskExecutionDumps[requestId];
                delete this.taskAbortControllers[requestId];
                if (this.currentTaskId === requestId) this.currentTaskId = null;
            }
        });
        this._app.post('/cancel/:requestId', async (req, res)=>{
            const { requestId } = req.params;
            if (!requestId) return res.status(400).json({
                error: 'requestId is required'
            });
            try {
                const agent = this.getActiveAgentOrThrow();
                if (this.currentTaskId !== requestId) return res.json({
                    status: 'not_found',
                    message: 'Task not found or already completed'
                });
                console.log(`Cancelling task: ${requestId}`);
                const abortController = this.taskAbortControllers[requestId];
                abortController?.abort(new Error(`Task cancelled by user: ${requestId}`));
                const latestExecutionDump = this.taskExecutionDumps[requestId];
                if (latestExecutionDump) agent.writeOutActionDumps?.(latestExecutionDump);
                try {
                    await this.recreateAgent({
                        preserveActiveStream: true
                    });
                } catch (error) {
                    console.warn('Failed to recreate agent during cancel:', error);
                }
                let report = null;
                if (agent.reportFile) try {
                    report = await this.registerReportFile(agent.reportFile);
                } catch (error) {
                    debugCancel('Failed to register finalized report after cancel: %s', error);
                }
                delete this.taskExecutionDumps[requestId];
                delete this.taskAbortControllers[requestId];
                this.currentTaskId = null;
                res.json({
                    status: 'cancelled',
                    message: 'Task cancelled successfully',
                    dump: null,
                    reportHTML: null,
                    report
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to cancel: ${errorMessage}`);
                res.status('No active session' === errorMessage ? 409 : 500).json({
                    error: `Failed to cancel: ${errorMessage}`
                });
            }
        });
        this._app.post('/recorder/start', async (req, res)=>{
            const { sessionId } = req.body ?? {};
            if ('string' != typeof sessionId || !sessionId.trim()) return res.status(400).json({
                ok: false,
                error: 'sessionId is required'
            });
            const capabilities = await this.getRecorderCapabilities();
            if (!capabilities.supported) {
                this.resetRecorderState();
                return res.json({
                    ok: false,
                    supported: false,
                    source: capabilities.source,
                    platformId: capabilities.platformId,
                    error: capabilities.error
                });
            }
            try {
                this.resetRecorderState();
                await this.startStudioPreviewRecorder(sessionId);
                res.json({
                    ok: true,
                    supported: true,
                    source: 'studio-preview',
                    platformId: capabilities.platformId
                });
            } catch (error) {
                this.resetRecorderState();
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                res.status(500).json({
                    ok: false,
                    supported: false,
                    error: errorMessage
                });
            }
        });
        this._app.get('/recorder/capabilities', async (_req, res)=>{
            res.json(await this.getRecorderCapabilities());
        });
        this._app.post('/recorder/stop', async (_req, res)=>{
            await this.waitForQueuedRecorderEvents();
            this.flushPendingTypeOnlyRecorderInput();
            this._recorderSessionId = null;
            this._studioPreviewRecorderLastScreenshot = void 0;
            this._studioPreviewRecorderLastPageState = void 0;
            res.json({
                ok: true
            });
        });
        this._app.get('/recorder/events', async (req, res)=>{
            if ('false' !== req.query.flushPending) this.flushPendingTypeOnlyRecorderInput();
            const since = 'string' == typeof req.query.since ? Number.parseInt(req.query.since, 10) : 0;
            const startIndex = Number.isFinite(since) && since > 0 ? since : 0;
            res.json({
                events: this._recorderEvents.slice(startIndex),
                nextIndex: this._recorderEvents.length
            });
        });
        this._app.get('/recorder/assets/:assetId', async (req, res)=>{
            try {
                const assetId = String(req.params.assetId || '');
                const filePath = findRecorderScreenshotAssetPath(assetId);
                if (!filePath) return res.status(404).json({
                    error: 'Recorder screenshot not found'
                });
                res.type(filePath.endsWith('.jpg') ? 'image/jpeg' : 'image/png');
                return res.send((0, external_node_fs_namespaceObject.readFileSync)(filePath));
            } catch (error) {
                return res.status(400).json({
                    error: error instanceof Error ? error.message : 'Invalid recorder screenshot request'
                });
            }
        });
        this._app.delete('/recorder/assets/session/:sessionId', async (req, res)=>{
            try {
                removeRecorderScreenshotAssetsForSession(String(req.params.sessionId || ''));
                return res.json({
                    ok: true
                });
            } catch (error) {
                return res.status(400).json({
                    ok: false,
                    error: error instanceof Error ? error.message : 'Invalid recorder session id'
                });
            }
        });
        this._app.post('/recorder/assets/session/:sessionId/prune', async (req, res)=>{
            try {
                const assetIds = Array.isArray(req.body?.assetIds) ? req.body.assetIds.filter((assetId)=>'string' == typeof assetId) : [];
                pruneRecorderScreenshotAssetsForSession(String(req.params.sessionId || ''), assetIds);
                return res.json({
                    ok: true
                });
            } catch (error) {
                return res.status(400).json({
                    ok: false,
                    error: error instanceof Error ? error.message : 'Invalid recorder screenshot cleanup request'
                });
            }
        });
        this._app.post('/recorder/describe-event', async (req, res)=>{
            const event = req.body?.event;
            if (!event || 'object' != typeof event) return res.status(400).json({
                ok: false,
                error: 'event is required'
            });
            try {
                const agent = this.getActiveAgentOrThrow();
                const { event: describedEvent, trace } = await this.enrichStudioPreviewRecorderEventWithAiDescribe(event, agent);
                res.json({
                    ok: true,
                    event: describedEvent,
                    trace
                });
            } catch (error) {
                const startedAt = new Date();
                const traceBase = createRecorderAiDescribeTraceBase(event);
                const trace = {
                    ...traceBase,
                    status: 'failed',
                    startedAt: startedAt.toISOString(),
                    durationMs: 0,
                    error: error instanceof Error ? error.message : String(error)
                };
                debugInteract('recorder aiDescribe trace:', trace);
                res.status(500).json({
                    ok: false,
                    error: error instanceof Error ? error.message : String(error),
                    trace
                });
            }
        });
        this._app.get('/screenshot', async (_req, res)=>{
            try {
                let agent = this.getActiveAgentOrThrow();
                if ('function' != typeof agent.interface.screenshotBase64) return res.status(500).json({
                    error: 'Screenshot method not available on current interface'
                });
                let screenshot;
                try {
                    screenshot = await agent.interface.screenshotBase64();
                } catch (error) {
                    const recoveredAgent = await this.recoverActiveAgentAfterPreviewError(error, 'screenshot capture');
                    if (!recoveredAgent || 'function' != typeof recoveredAgent.interface.screenshotBase64) throw error;
                    agent = recoveredAgent;
                    screenshot = await agent.interface.screenshotBase64();
                }
                res.json({
                    screenshot,
                    timestamp: Date.now()
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const statusCode = 'No active session' === errorMessage ? 409 : 500;
                if (409 !== statusCode) console.error(`Failed to take screenshot: ${errorMessage}`);
                res.status(statusCode).json({
                    error: `Failed to take screenshot: ${errorMessage}`
                });
            }
        });
        this._app.get('/mjpeg', async (req, res)=>{
            const agent = this._activeConnection.agent;
            if (!agent) return res.status(409).json({
                error: 'No active session'
            });
            await this._mjpegHandler.serve(req, res);
        });
        this._app.get('/interface-info', async (_req, res)=>{
            try {
                const runtimeInfo = this.getRuntimeInfo();
                const agent = this._activeConnection.agent;
                let size;
                let navigationState;
                let actionTypes;
                if ('function' == typeof agent?.interface?.size) try {
                    size = await agent.interface.size();
                } catch (error) {
                    debugScreenshot('interface size() failed:', error);
                }
                if ('function' == typeof agent?.interface?.navigationState) try {
                    navigationState = await agent.interface.navigationState();
                } catch (error) {
                    debugScreenshot('interface navigationState() failed:', error);
                }
                if ('function' == typeof agent?.interface?.actionSpace) try {
                    const actions = agent.interface.actionSpace();
                    actionTypes = Array.isArray(actions) ? actions.map((action)=>action?.name).filter((name)=>'string' == typeof name) : void 0;
                } catch (error) {
                    debugScreenshot('interface actionSpace() failed:', error);
                }
                res.json({
                    type: runtimeInfo.interface.type,
                    description: runtimeInfo.interface.description,
                    ...size ? {
                        size
                    } : {},
                    ...navigationState ? {
                        navigationState
                    } : {},
                    ...actionTypes ? {
                        actionTypes
                    } : {}
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to get interface info: ${errorMessage}`);
                res.status(500).json({
                    error: `Failed to get interface info: ${errorMessage}`
                });
            }
        });
        this._app.post('/interact', async (req, res)=>{
            let agent;
            try {
                agent = this.getActiveAgentOrThrow();
            } catch (error) {
                return res.status(409).json({
                    error: error instanceof Error ? error.message : 'No active session'
                });
            }
            const { actionType } = req.body ?? {};
            if ('string' != typeof actionType || !actionType) return res.status(400).json({
                error: 'actionType is required'
            });
            try {
                const interactStartedAt = Date.now();
                debugInteract('received manual interact %o', {
                    payload: summarizeInteractPayload(req.body ?? {}),
                    interfaceType: agent.interface.interfaceType,
                    recorderActive: Boolean(this._recorderSessionId),
                    hasInputPrimitives: Boolean(agent.interface.inputPrimitives)
                });
                const recorderSnapshotBefore = this.captureCachedRecorderSnapshotBeforeInteract();
                const inputPrimitives = agent.interface.inputPrimitives;
                if (inputPrimitives) {
                    await (0, external_pointer_dispatch_js_namespaceObject.dispatchPointer)(inputPrimitives, req.body ?? {}, ()=>agent.interface.size());
                    debugInteract('primitive manual interact dispatched %o', {
                        payload: summarizeInteractPayload(req.body ?? {}),
                        elapsedMs: Date.now() - interactStartedAt
                    });
                    res.json({});
                    this.queueStudioPreviewRecorderEvent(req.body ?? {}, recorderSnapshotBefore, agent);
                    debugInteract('manual interact completed %o', {
                        payload: summarizeInteractPayload(req.body ?? {}),
                        elapsedMs: Date.now() - interactStartedAt
                    });
                    return;
                }
                if (!this.findInteractAction(agent, actionType) && !this.canRunBrowserChromeInteractAction(agent, actionType)) return res.status(404).json({
                    error: isPointerInteractActionType(actionType) ? 'Manual control is not supported on this device' : `Action "${actionType}" is not available on the current device`
                });
                const params = buildInteractParams(actionType, req.body ?? {});
                await this.runInteractAction(agent, actionType, params);
                debugInteract('actionSpace manual interact dispatched %o', {
                    payload: summarizeInteractPayload(req.body ?? {}),
                    elapsedMs: Date.now() - interactStartedAt
                });
                res.json({});
                this.queueStudioPreviewRecorderEvent(req.body ?? {}, recorderSnapshotBefore, agent);
                debugInteract('manual interact completed %o', {
                    payload: summarizeInteractPayload(req.body ?? {}),
                    elapsedMs: Date.now() - interactStartedAt
                });
            } catch (error) {
                if (error instanceof external_pointer_dispatch_js_namespaceObject.PointerInputError) return res.status(error.statusCode).json({
                    error: error.message
                });
                if (error instanceof InteractParamsValidationError) return res.status(400).json({
                    error: error.message
                });
                const recoveredAgent = await this.recoverActiveAgentAfterPreviewError(error, `manual interact action "${actionType}"`);
                if (recoveredAgent) return res.status(409).json({
                    error: 'The page session was closed and has been recreated. Please retry the action.'
                });
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to run interact action "${actionType}": ${errorMessage}`);
                res.status(500).json({
                    error: errorMessage
                });
            }
        });
        this._app.get('/runtime-info', async (_req, res)=>{
            try {
                res.json(this.getRuntimeInfo());
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to get runtime info: ${errorMessage}`);
                res.status(500).json({
                    error: `Failed to get runtime info: ${errorMessage}`
                });
            }
        });
        this.app.post('/config', async (req, res)=>{
            const { aiConfig } = req.body;
            if (!aiConfig || 'object' != typeof aiConfig) return res.status(400).json({
                error: 'aiConfig is required and must be an object'
            });
            if (0 === Object.keys(aiConfig).length) return res.json({
                status: 'ok',
                message: 'AI config not changed due to empty object'
            });
            const nextConfigSignature = serializeAiConfigSignature(aiConfig);
            const configChanged = nextConfigSignature !== this._lastAiConfigSignature;
            try {
                if (configChanged) {
                    (0, env_namespaceObject.overrideAIConfig)(aiConfig);
                    this._lastAiConfigSignature = nextConfigSignature;
                    this._configDirty = Boolean(this._activeConnection.agent);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to update AI config: ${errorMessage}`);
                return res.status(500).json({
                    error: `Failed to update AI config: ${errorMessage}`
                });
            }
            if (!configChanged) return res.json({
                status: 'ok',
                message: 'AI config not changed because it is identical to current'
            });
            try {
                env_namespaceObject.globalModelConfigManager.getModelConfig('default');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`AI config validation failed: ${errorMessage}`);
                return res.status(400).json({
                    error: errorMessage
                });
            }
            return res.json({
                status: 'ok',
                message: this._configDirty ? 'AI config updated. Agent will be recreated on next execution.' : 'AI config updated. New sessions will use it immediately.'
            });
        });
        this.app.post('/connectivity-test', async (req, res)=>{
            try {
                if (!req.body?.config) return res.status(400).json({
                    error: 'Model config is required for connectivity test.'
                });
                const modelConfigManager = new env_namespaceObject.ModelConfigManager(req.body.config);
                const result = await (0, core_namespaceObject.runConnectivityTest)({
                    defaultModelConfig: modelConfigManager.getModelConfig('default'),
                    planningModelConfig: modelConfigManager.getModelConfig('planning'),
                    insightModelConfig: modelConfigManager.getModelConfig('insight')
                });
                return res.json(result);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Connectivity test failed: ${errorMessage}`);
                return res.status(500).json({
                    error: errorMessage
                });
            }
        });
    }
    setupStaticRoutes() {
        this._app.get('/', (_req, res)=>{
            this.serveHtmlWithPorts(res);
        });
        this._app.get('/index.html', (_req, res)=>{
            this.serveHtmlWithPorts(res);
        });
        this._app.use(external_express_default()["static"](this.staticPath));
        this._app.get('*', (_req, res)=>{
            this.serveHtmlWithPorts(res);
        });
    }
    serveHtmlWithPorts(res) {
        try {
            const htmlPath = (0, external_node_path_namespaceObject.join)(this.staticPath, 'index.html');
            let html = (0, external_node_fs_namespaceObject.readFileSync)(htmlPath, 'utf8');
            const scrcpyPort = this.scrcpyPort ?? this.port + 1;
            const configScript = `
        <script>
          window.SCRCPY_PORT = ${scrcpyPort};
        </script>
      `;
            html = html.replace('</head>', `${configScript}</head>`);
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        } catch (error) {
            console.error('Error serving HTML with ports:', error);
            res.status(500).send('Internal Server Error');
        }
    }
    async launch(port) {
        if (this._activeConnection.agentFactory && !this.sessionManager) {
            console.log('Initializing agent from factory function...');
            this.setActiveAgent(await this._activeConnection.agentFactory());
            this._activeConnection.session = {
                connected: true,
                metadata: {}
            };
            this.sessionSetupState = 'ready';
            this.syncRuntimeState();
            console.log('Agent initialized successfully');
        }
        this.initializeApp();
        this.port = port || defaultPort;
        return new Promise((resolve)=>{
            const serverPort = this.port ?? defaultPort;
            const listenHost = resolvePlaygroundListenHost();
            this.server = this._app.listen(serverPort, listenHost, ()=>{
                resolve(this);
            });
        });
    }
    async close() {
        await this.destroyCurrentSession().catch((error)=>{
            console.warn('Failed to destroy current session during shutdown:', error);
        });
        this._mjpegHandler.shutdown();
        this.reportFiles.clear();
        return new Promise((resolve, reject)=>{
            if (this.server) {
                this.taskExecutionDumps = {};
                this.server.close((error)=>{
                    if (error) reject(error);
                    else {
                        this.server = void 0;
                        resolve();
                    }
                });
            } else resolve();
        });
    }
    constructor(agent, staticPath = STATIC_PATH, id){
        _define_property(this, "_app", void 0);
        _define_property(this, "tmpDir", void 0);
        _define_property(this, "server", void 0);
        _define_property(this, "port", void 0);
        _define_property(this, "staticPath", void 0);
        _define_property(this, "taskExecutionDumps", void 0);
        _define_property(this, "id", void 0);
        _define_property(this, "reportFiles", new Map());
        _define_property(this, "scrcpyPort", void 0);
        _define_property(this, "_initialized", false);
        _define_property(this, "_mjpegHandler", new external_mjpeg_stream_handler_js_namespaceObject.MjpegStreamHandler({
            getNativeUrl: ()=>this._activeConnection.agent?.interface?.mjpegStreamUrl,
            getActiveInterface: ()=>this._activeConnection.agent?.interface ?? null,
            takeScreenshot: ()=>this.getActiveAgentOrThrow().interface.screenshotBase64(),
            canTakeScreenshot: ()=>'function' == typeof this._activeConnection.agent?.interface?.screenshotBase64,
            isAgentReady: ()=>this._agentReady,
            recoverFromPreviewError: async (error, reason)=>(await this.recoverActiveAgentAfterPreviewError(error, reason))?.interface ?? null
        }));
        _define_property(this, "sessionManager", void 0);
        _define_property(this, "sessionSetupState", 'ready');
        _define_property(this, "sessionSetupBlockingReason", void 0);
        _define_property(this, "currentTaskId", null);
        _define_property(this, "taskAbortControllers", {});
        _define_property(this, "_agentReady", true);
        _define_property(this, "_configDirty", false);
        _define_property(this, "_lastAiConfigSignature", null);
        _define_property(this, "_baseRuntimeState", void 0);
        _define_property(this, "_basePreparedMetadata", void 0);
        _define_property(this, "_baseExecutionHooks", void 0);
        _define_property(this, "_baseSidecars", void 0);
        _define_property(this, "_recorderSessionId", null);
        _define_property(this, "_recorderEvents", []);
        _define_property(this, "_recorderPendingTypeOnlyInput", null);
        _define_property(this, "_recorderPendingTypeOnlyInputFlushTimer", void 0);
        _define_property(this, "_recorderEventQueue", Promise.resolve());
        _define_property(this, "_recorderPendingCaptures", 0);
        _define_property(this, "_studioPreviewRecorderLastTargetPoint", void 0);
        _define_property(this, "_studioPreviewRecorderLastScreenshot", void 0);
        _define_property(this, "_studioPreviewRecorderLastPageState", void 0);
        _define_property(this, "_activeConnection", {
            session: null,
            agent: null,
            agentFactory: null,
            runtime: void 0,
            executionHooks: void 0,
            sidecars: void 0
        });
        this._app = external_express_default()();
        this.tmpDir = (0, utils_namespaceObject.getTmpDir)();
        this.staticPath = staticPath;
        this.taskExecutionDumps = {};
        this.id = id || (0, shared_utils_namespaceObject.uuid)();
        if ('function' == typeof agent) this._activeConnection.agentFactory = agent;
        else this.setActiveAgent(agent || null);
    }
}
const server = PlaygroundServer;
exports.InteractParamsValidationError = __webpack_exports__.InteractParamsValidationError;
exports.PlaygroundServer = __webpack_exports__.PlaygroundServer;
exports.buildInteractParams = __webpack_exports__.buildInteractParams;
exports.buildPlaygroundBrowserUrl = __webpack_exports__.buildPlaygroundBrowserUrl;
exports.createManualExecutorContext = __webpack_exports__.createManualExecutorContext;
exports["default"] = __webpack_exports__["default"];
exports.resolvePlaygroundBrowserHost = __webpack_exports__.resolvePlaygroundBrowserHost;
exports.resolvePlaygroundListenHost = __webpack_exports__.resolvePlaygroundListenHost;
exports.serializeZodField = __webpack_exports__.serializeZodField;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "InteractParamsValidationError",
    "PlaygroundServer",
    "buildInteractParams",
    "buildPlaygroundBrowserUrl",
    "createManualExecutorContext",
    "default",
    "resolvePlaygroundBrowserHost",
    "resolvePlaygroundListenHost",
    "serializeZodField"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=server.js.map