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
    deriveCaseStatus: ()=>deriveCaseStatus,
    deriveTaskStatus: ()=>deriveTaskStatus
});
function deriveTaskStatus(task) {
    const isFinished = 'finished' === task.status;
    if ('failed' === task.status) return 'failed';
    if (isFinished && (task.error || task.errorMessage)) return 'failed';
    if (isFinished && 'WaitFor' === task.subType && false === task.output) return 'warning';
    if ('Assert' === task.subType && isFinished && false === task.output) return 'failed';
    if ('pending' === task.status) return 'pending';
    if ('running' === task.status) return 'running';
    if ('cancelled' === task.status) return 'cancelled';
    return 'passed';
}
function deriveCaseStatus(executions) {
    for (const execution of executions)for (const task of execution.tasks ?? [])if ('failed' === deriveTaskStatus(task)) return 'failed';
    return 'passed';
}
exports.deriveCaseStatus = __webpack_exports__.deriveCaseStatus;
exports.deriveTaskStatus = __webpack_exports__.deriveTaskStatus;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "deriveCaseStatus",
    "deriveTaskStatus"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=task-status.js.map