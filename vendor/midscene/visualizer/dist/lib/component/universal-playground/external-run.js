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
    preparePlaygroundExecution: ()=>preparePlaygroundExecution,
    shouldExecuteExternalRunRequest: ()=>shouldExecuteExternalRunRequest
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
function preparePlaygroundExecution(_0) {
    return _async_to_generator(function*({ clearTimeline, clearTimelineBeforeRun = false, onBeforeExecutionStart }) {
        yield null == onBeforeExecutionStart ? void 0 : onBeforeExecutionStart();
        if (clearTimelineBeforeRun) yield clearTimeline();
    }).apply(this, arguments);
}
function shouldExecuteExternalRunRequest({ request, handledRequestIds, lastRequestId, sdkReady, messagesInitialized }) {
    return Boolean(request && request.id !== lastRequestId && !(null == handledRequestIds ? void 0 : handledRequestIds.has(request.id)) && sdkReady && messagesInitialized);
}
exports.preparePlaygroundExecution = __webpack_exports__.preparePlaygroundExecution;
exports.shouldExecuteExternalRunRequest = __webpack_exports__.shouldExecuteExternalRunRequest;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "preparePlaygroundExecution",
    "shouldExecuteExternalRunRequest"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
