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
    getTaskSearchArea: ()=>getTaskSearchArea,
    getTaskServiceDump: ()=>getTaskServiceDump
});
function isRecord(value) {
    return 'object' == typeof value && null !== value;
}
function isServiceDump(value) {
    return isRecord(value) && 'string' == typeof value.type && isRecord(value.taskInfo);
}
function getTaskServiceDump(task) {
    const log = task?.log;
    if (isRecord(log) && isServiceDump(log.dump)) return log.dump;
    return null;
}
function getTaskSearchArea(task) {
    return task?.searchArea ?? getTaskServiceDump(task)?.taskInfo?.searchArea;
}
exports.getTaskSearchArea = __webpack_exports__.getTaskSearchArea;
exports.getTaskServiceDump = __webpack_exports__.getTaskServiceDump;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "getTaskSearchArea",
    "getTaskServiceDump"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=task-service-dump.js.map