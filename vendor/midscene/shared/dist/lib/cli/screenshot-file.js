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
    writeCliScreenshotFile: ()=>writeCliScreenshotFile
});
const external_node_fs_namespaceObject = require("node:fs");
const external_node_os_namespaceObject = require("node:os");
const external_node_path_namespaceObject = require("node:path");
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
    const directory = options.directoryPath ? options.directoryPath : options.directoryName ? (0, external_node_path_namespaceObject.join)((0, external_node_os_namespaceObject.tmpdir)(), options.directoryName) : (0, external_node_os_namespaceObject.tmpdir)();
    if (!(0, external_node_fs_namespaceObject.existsSync)(directory)) (0, external_node_fs_namespaceObject.mkdirSync)(directory, {
        recursive: true
    });
    const filename = void 0 !== options.id ? `${safeScreenshotFilenamePart(options.id)}.${extension}` : `${options.filenamePrefix ?? 'screenshot'}-${Date.now()}.${extension}`;
    const filePath = (0, external_node_path_namespaceObject.join)(directory, filename);
    if (false !== options.overwrite || !(0, external_node_fs_namespaceObject.existsSync)(filePath)) (0, external_node_fs_namespaceObject.writeFileSync)(filePath, Buffer.from(rawBase64, 'base64'));
    return filePath;
}
exports.writeCliScreenshotFile = __webpack_exports__.writeCliScreenshotFile;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "writeCliScreenshotFile"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
