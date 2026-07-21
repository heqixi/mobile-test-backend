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
    normalizeRecordToReportScreenshot: ()=>normalizeRecordToReportScreenshot
});
const img_namespaceObject = require("@midscene/shared/img");
function normalizeRecordToReportScreenshot(screenshot, index) {
    if (!screenshot || 'string' != typeof screenshot.base64) throw new Error(`recordToReport: screenshot #${index + 1} must include a base64 string`);
    if (void 0 !== screenshot.description && 'string' != typeof screenshot.description) throw new Error(`recordToReport: screenshot #${index + 1} description must be a string`);
    return {
        base64: (0, img_namespaceObject.normalizeScreenshotBase64)(screenshot.base64, {
            label: `recordToReport: screenshot #${index + 1} base64`
        }),
        description: screenshot.description
    };
}
exports.normalizeRecordToReportScreenshot = __webpack_exports__.normalizeRecordToReportScreenshot;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "normalizeRecordToReportScreenshot"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=record-to-report.js.map