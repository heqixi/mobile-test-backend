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
    notifyError: ()=>notifyError
});
const external_antd_namespaceObject = require("antd");
const DEFAULT_TITLE = 'Something went wrong';
function normalizeMessage(error) {
    if ('string' == typeof error) return error;
    if (error instanceof Error) return error.message || error.toString();
    if (error && 'object' == typeof error && 'message' in error) {
        const value = error.message;
        if ('string' == typeof value) return value;
    }
    try {
        return JSON.stringify(error);
    } catch (e) {
        return String(error);
    }
}
function notifyError(error, options = {}) {
    var _options_title, _options_description, _options_duration;
    external_antd_namespaceObject.notification.error({
        message: null != (_options_title = options.title) ? _options_title : DEFAULT_TITLE,
        description: null != (_options_description = options.description) ? _options_description : normalizeMessage(error),
        placement: 'bottomRight',
        duration: null != (_options_duration = options.duration) ? _options_duration : 5
    });
}
exports.notifyError = __webpack_exports__.notifyError;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "notifyError"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
