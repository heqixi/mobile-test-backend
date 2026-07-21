"use strict";
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
    enableDebug: ()=>enableDebug,
    setLogDirectoryResolver: ()=>setLogDirectoryResolver,
    getDebug: ()=>getDebug
});
const external_node_fs_namespaceObject = require("node:fs");
var external_node_fs_default = /*#__PURE__*/ __webpack_require__.n(external_node_fs_namespaceObject);
const external_node_path_namespaceObject = require("node:path");
var external_node_path_default = /*#__PURE__*/ __webpack_require__.n(external_node_path_namespaceObject);
const external_node_util_namespaceObject = require("node:util");
var external_node_util_default = /*#__PURE__*/ __webpack_require__.n(external_node_util_namespaceObject);
const external_debug_namespaceObject = require("debug");
var external_debug_default = /*#__PURE__*/ __webpack_require__.n(external_debug_namespaceObject);
const external_common_js_namespaceObject = require("./common.js");
const external_utils_js_namespaceObject = require("./utils.js");
const topicPrefix = 'midscene';
const logStreams = new Map();
const logStreamPaths = new Map();
let logDirectoryResolver;
const backpressuredLogStreams = new Set();
const unavailableLogStreams = new Set();
const debugInstances = new Map();
function setLogDirectoryResolver(resolver) {
    if (logDirectoryResolver === resolver) return;
    logDirectoryResolver = resolver;
    for (const stream of logStreams.values())stream.end();
    logStreams.clear();
    logStreamPaths.clear();
    unavailableLogStreams.clear();
    backpressuredLogStreams.clear();
}
function getLogDirectory() {
    return logDirectoryResolver?.() ?? (0, external_common_js_namespaceObject.getMidsceneRunSubDir)('log');
}
function getLogStream(topic) {
    const topicFileName = topic.replace(/:/g, '-');
    if (unavailableLogStreams.has(topicFileName)) return null;
    const logFile = external_node_path_default().join(getLogDirectory(), `${topicFileName}.log`);
    const existingStream = logStreams.get(topicFileName);
    if (existingStream && logStreamPaths.get(topicFileName) !== logFile) {
        existingStream.end();
        logStreams.delete(topicFileName);
        logStreamPaths.delete(topicFileName);
    }
    if (!logStreams.has(topicFileName)) {
        const stream = external_node_fs_default().createWriteStream(logFile, {
            flags: 'a'
        });
        stream.on('error', ()=>{
            unavailableLogStreams.add(topicFileName);
            backpressuredLogStreams.delete(topicFileName);
            if (logStreams.get(topicFileName) === stream) {
                logStreams.delete(topicFileName);
                logStreamPaths.delete(topicFileName);
            }
        });
        logStreams.set(topicFileName, stream);
        logStreamPaths.set(topicFileName, logFile);
    }
    return logStreams.get(topicFileName) ?? null;
}
function writeLogToFile(topic, message) {
    if (!external_utils_js_namespaceObject.ifInNode) return;
    const topicFileName = topic.replace(/:/g, '-');
    if (backpressuredLogStreams.has(topicFileName)) return;
    const stream = getLogStream(topic);
    if (!stream) return;
    const now = new Date();
    const isoDate = now.toLocaleDateString('sv-SE');
    const isoTime = now.toLocaleTimeString('sv-SE');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    const timezoneOffsetMinutes = now.getTimezoneOffset();
    const sign = timezoneOffsetMinutes <= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60).toString().padStart(2, '0');
    const minutes = (Math.abs(timezoneOffsetMinutes) % 60).toString().padStart(2, '0');
    const timezoneString = `${sign}${hours}:${minutes}`;
    const localISOTime = `${isoDate}T${isoTime}.${milliseconds}${timezoneString}`;
    try {
        if (!stream.write(`[${localISOTime}] ${message}\n`)) {
            backpressuredLogStreams.add(topicFileName);
            stream.once('drain', ()=>{
                backpressuredLogStreams.delete(topicFileName);
            });
        }
    } catch  {
        unavailableLogStreams.add(topicFileName);
        backpressuredLogStreams.delete(topicFileName);
    }
}
function getDebug(topic, options) {
    const fullTopic = `${topicPrefix}:${topic}`;
    const withConsole = options?.console ?? false;
    const cacheKey = withConsole ? `${fullTopic}:withConsole` : fullTopic;
    if (!debugInstances.has(cacheKey)) if (withConsole) {
        const baseFn = getDebug(topic);
        const wrapper = (...args)=>{
            baseFn(...args);
            try {
                console.warn('[Midscene]', ...args);
            } catch  {}
        };
        debugInstances.set(cacheKey, wrapper);
    } else {
        const debugFn = external_debug_default()(fullTopic);
        const wrapper = (...args)=>{
            if (external_utils_js_namespaceObject.ifInNode) {
                const message = external_node_util_default().format(...args);
                writeLogToFile(topic, message);
            }
            debugFn(...args);
        };
        debugInstances.set(cacheKey, wrapper);
    }
    return debugInstances.get(cacheKey);
}
function enableDebug(topic) {
    if (external_utils_js_namespaceObject.ifInNode) return;
    external_debug_default().enable(`${topicPrefix}:${topic}`);
}
exports.enableDebug = __webpack_exports__.enableDebug;
exports.getDebug = __webpack_exports__.getDebug;
exports.setLogDirectoryResolver = __webpack_exports__.setLogDirectoryResolver;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "enableDebug",
    "getDebug",
    "setLogDirectoryResolver"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
