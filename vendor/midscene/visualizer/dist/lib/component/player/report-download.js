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
    DEFAULT_REPORT_FILE_NAME: ()=>DEFAULT_REPORT_FILE_NAME,
    triggerReportDownload: ()=>triggerReportDownload
});
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) resolve(value);
    else Promise.resolve(value).then(_next, _throw);
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(void 0);
        });
    };
}
const DEFAULT_REPORT_FILE_NAME = 'midscene_report.html';
function triggerReportDownload(options) {
    return _async_to_generator(function*() {
        const { content, defaultFileName = DEFAULT_REPORT_FILE_NAME, onDownloadReport, documentRef, urlRef, blobFactory, scheduleRevoke } = options;
        if (onDownloadReport) return void (yield onDownloadReport({
            content,
            defaultFileName
        }));
        const activeDocument = null != documentRef ? documentRef : globalThis.document;
        if (!activeDocument) throw new Error('Report download requires a document context.');
        const activeUrl = null != urlRef ? urlRef : globalThis.URL;
        if (!(null == activeUrl ? void 0 : activeUrl.createObjectURL) || !(null == activeUrl ? void 0 : activeUrl.revokeObjectURL)) throw new Error('Report download requires URL.createObjectURL support.');
        const createBlob = null != blobFactory ? blobFactory : (parts, blobOptions)=>new Blob(parts, blobOptions);
        const blob = createBlob([
            content
        ], {
            type: 'text/html'
        });
        const url = activeUrl.createObjectURL(blob);
        const anchor = activeDocument.createElement('a');
        anchor.href = url;
        anchor.download = defaultFileName;
        anchor.style.display = 'none';
        activeDocument.body.appendChild(anchor);
        try {
            anchor.click();
        } finally{
            activeDocument.body.removeChild(anchor);
            (null != scheduleRevoke ? scheduleRevoke : (callback)=>setTimeout(callback, 0))(()=>{
                activeUrl.revokeObjectURL(url);
            });
        }
    })();
}
exports.DEFAULT_REPORT_FILE_NAME = __webpack_exports__.DEFAULT_REPORT_FILE_NAME;
exports.triggerReportDownload = __webpack_exports__.triggerReportDownload;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "DEFAULT_REPORT_FILE_NAME",
    "triggerReportDownload"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
