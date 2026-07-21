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
export { preparePlaygroundExecution, shouldExecuteExternalRunRequest };
