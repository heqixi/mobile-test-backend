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
    callAiAndParseWithRetry: ()=>callAiAndParseWithRetry
});
async function callAiAndParseWithRetry({ callAi, parseResponse, toParseError, parseRetryTimes = 0, parseRetryInterval = 0, abortSignal, onParseRetry }) {
    const normalizedRetryTimes = Number.isFinite(parseRetryTimes) ? Math.max(0, Math.floor(parseRetryTimes)) : 0;
    const normalizedRetryInterval = Number.isFinite(parseRetryInterval) ? Math.max(0, parseRetryInterval) : 0;
    const callAndParseOnce = async (remainingRetries)=>{
        const response = await callAi();
        try {
            return await parseResponse(response);
        } catch (error) {
            if (remainingRetries > 0 && !abortSignal?.aborted) {
                onParseRetry?.(error, response);
                if (normalizedRetryInterval > 0) await new Promise((resolve)=>setTimeout(resolve, normalizedRetryInterval));
                if (abortSignal?.aborted) throw toParseError(error, response);
                return callAndParseOnce(remainingRetries - 1);
            }
            throw toParseError(error, response);
        }
    };
    return callAndParseOnce(normalizedRetryTimes);
}
exports.callAiAndParseWithRetry = __webpack_exports__.callAiAndParseWithRetry;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "callAiAndParseWithRetry"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=semantic-retry.js.map