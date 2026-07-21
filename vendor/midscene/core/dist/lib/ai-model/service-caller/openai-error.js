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
    formatOpenAIAPIErrorDetails: ()=>formatOpenAIAPIErrorDetails,
    wrapOpenAICompatibleFetch: ()=>wrapOpenAICompatibleFetch
});
const logger_namespaceObject = require("@midscene/shared/logger");
const MAX_ERROR_RESPONSE_BODY_LENGTH = 4000;
const MAX_FETCH_ERROR_LENGTH = 4000;
const debugOpenAIFetch = (0, logger_namespaceObject.getDebug)('ai:call');
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}... [truncated, ${text.length} chars total]`;
}
function truncateErrorResponseBody(body) {
    return truncateText(body, MAX_ERROR_RESPONSE_BODY_LENGTH);
}
function getErrorCode(error) {
    if (!error || 'object' != typeof error) return;
    const code = error.code;
    return 'string' == typeof code ? code : void 0;
}
function formatErrorSummary(error) {
    if (error instanceof Error) {
        const code = getErrorCode(error);
        const codeText = code ? ` [${code}]` : '';
        return `${error.name}${codeText}: ${error.message}`;
    }
    return String(error);
}
function formatFetchErrorForReport(error) {
    const details = [
        formatErrorSummary(error)
    ];
    const cause = error && 'object' == typeof error ? error.cause : void 0;
    if (void 0 !== cause) details.push(`Cause: ${formatErrorSummary(cause)}`);
    return truncateText(details.join('\n'), MAX_FETCH_ERROR_LENGTH);
}
function getDefaultFetch() {
    if ('function' == typeof globalThis.fetch) return globalThis.fetch;
    throw new Error('`fetch` is not defined as a global; check that the runtime provides globalThis.fetch or polyfill it before creating the OpenAI client');
}
function wrapOpenAICompatibleFetch(context) {
    const baseFetch = getDefaultFetch();
    let attempt = 0;
    return async (input, init)=>{
        attempt += 1;
        let response;
        try {
            response = await baseFetch(input, init);
        } catch (error) {
            const fetchErrorSummary = formatFetchErrorForReport(error);
            debugOpenAIFetch('OpenAI-compatible fetch failed', fetchErrorSummary);
            context.fetchErrors ??= [];
            context.fetchErrors.push({
                attempt,
                error: fetchErrorSummary
            });
            throw error;
        }
        const requestId = response.headers.get('x-request-id') ?? response.headers.get('x-model-request-id');
        if (requestId) {
            context.responseRequestIds ??= [];
            context.responseRequestIds.push({
                attempt,
                requestId,
                status: response.status,
                ok: response.ok
            });
        }
        if (!response.ok) {
            const rawResponseBody = await response.clone().text().catch(()=>void 0);
            if (void 0 !== rawResponseBody) {
                context.rawResponseBodies ??= [];
                context.rawResponseBodies.push({
                    attempt,
                    body: rawResponseBody
                });
            }
        }
        return response;
    };
}
function formatOpenAIAPIErrorDetails(_error, context) {
    const details = [];
    if (context.rawResponseBodies?.length === 1) details.push(`OpenAI raw error response body: ${truncateErrorResponseBody(context.rawResponseBodies[0].body)}`);
    else if (context.rawResponseBodies?.length) {
        const rawResponseBodyDetails = context.rawResponseBodies.map(({ attempt, body })=>`Attempt ${attempt}: ${truncateErrorResponseBody(body)}`).join('\n');
        details.push(`OpenAI raw error response bodies:\n${rawResponseBodyDetails}`);
    }
    const errorResponseRequestIds = context.responseRequestIds?.filter(({ ok })=>!ok);
    if (errorResponseRequestIds?.length === 1) {
        const { attempt, requestId, status } = errorResponseRequestIds[0];
        details.push(`OpenAI error response request ID (attempt ${attempt}, status ${status}): ${requestId}`);
    } else if (errorResponseRequestIds?.length) {
        const requestIdDetails = errorResponseRequestIds.map(({ attempt, requestId, status })=>`Attempt ${attempt} (status ${status}): ${requestId}`).join('\n');
        details.push(`OpenAI error response request IDs:\n${requestIdDetails}`);
    }
    if (context.fetchErrors?.length === 1) details.push(`OpenAI fetch error (attempt ${context.fetchErrors[0].attempt}): ${context.fetchErrors[0].error}`);
    else if (context.fetchErrors?.length) {
        const fetchErrorDetails = context.fetchErrors.map(({ attempt, error })=>`Attempt ${attempt}: ${error}`).join('\n');
        details.push(`OpenAI fetch errors:\n${fetchErrorDetails}`);
    }
    if (!details.length) return '';
    return `\n${details.join('\n')}`;
}
exports.formatOpenAIAPIErrorDetails = __webpack_exports__.formatOpenAIAPIErrorDetails;
exports.wrapOpenAICompatibleFetch = __webpack_exports__.wrapOpenAICompatibleFetch;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "formatOpenAIAPIErrorDetails",
    "wrapOpenAICompatibleFetch"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=openai-error.js.map