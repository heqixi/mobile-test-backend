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
    getTaskServiceDump: ()=>external_task_service_dump_js_namespaceObject.getTaskServiceDump,
    deriveTaskStatus: ()=>external_task_status_js_namespaceObject.deriveTaskStatus,
    parseDumpScript: ()=>external_html_utils_js_namespaceObject.parseDumpScript,
    generateImageScriptTag: ()=>external_html_utils_js_namespaceObject.generateImageScriptTag,
    restoreImageReferences: ()=>external_screenshot_restoration_js_namespaceObject.restoreImageReferences,
    deriveCaseStatus: ()=>external_task_status_js_namespaceObject.deriveCaseStatus,
    parseImageScripts: ()=>external_html_utils_js_namespaceObject.parseImageScripts,
    getTaskSearchArea: ()=>external_task_service_dump_js_namespaceObject.getTaskSearchArea,
    parseDumpScriptAttributes: ()=>external_html_utils_js_namespaceObject.parseDumpScriptAttributes,
    escapeContent: ()=>external_html_utils_js_namespaceObject.escapeContent,
    unescapeContent: ()=>external_html_utils_js_namespaceObject.unescapeContent,
    generateDumpScriptTag: ()=>external_html_utils_js_namespaceObject.generateDumpScriptTag
});
const external_screenshot_restoration_js_namespaceObject = require("./screenshot-restoration.js");
const external_html_utils_js_namespaceObject = require("./html-utils.js");
const external_task_service_dump_js_namespaceObject = require("./task-service-dump.js");
const external_task_status_js_namespaceObject = require("./task-status.js");
exports.deriveCaseStatus = __webpack_exports__.deriveCaseStatus;
exports.deriveTaskStatus = __webpack_exports__.deriveTaskStatus;
exports.escapeContent = __webpack_exports__.escapeContent;
exports.generateDumpScriptTag = __webpack_exports__.generateDumpScriptTag;
exports.generateImageScriptTag = __webpack_exports__.generateImageScriptTag;
exports.getTaskSearchArea = __webpack_exports__.getTaskSearchArea;
exports.getTaskServiceDump = __webpack_exports__.getTaskServiceDump;
exports.parseDumpScript = __webpack_exports__.parseDumpScript;
exports.parseDumpScriptAttributes = __webpack_exports__.parseDumpScriptAttributes;
exports.parseImageScripts = __webpack_exports__.parseImageScripts;
exports.restoreImageReferences = __webpack_exports__.restoreImageReferences;
exports.unescapeContent = __webpack_exports__.unescapeContent;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "deriveCaseStatus",
    "deriveTaskStatus",
    "escapeContent",
    "generateDumpScriptTag",
    "generateImageScriptTag",
    "getTaskSearchArea",
    "getTaskServiceDump",
    "parseDumpScript",
    "parseDumpScriptAttributes",
    "parseImageScripts",
    "restoreImageReferences",
    "unescapeContent"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=index.js.map