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
    resolveChatCompletion: ()=>resolveChatCompletion
});
const defaultImageDetail = (_input)=>void 0;
const defaultChatCompletionParams = ({ midsceneDefaults, userConfig })=>({
        config: {
            temperature: userConfig.temperature ?? midsceneDefaults.temperature
        }
    });
const midsceneChatCompletionDefaults = {
    temperature: 0
};
function createDefaultExtractContentAndReasoning(reasoningContentKeys) {
    return (message)=>{
        if (!message) return {
            content: '',
            reasoning_content: ''
        };
        const messageRecord = message;
        const rawReasoning = reasoningContentKeys.map((key)=>messageRecord[key]).find((value)=>'string' == typeof value);
        const messageReasoning = 'string' == typeof rawReasoning ? rawReasoning : '';
        return {
            content: 'string' == typeof message.content ? message.content : '',
            reasoning_content: messageReasoning
        };
    };
}
function resolveExtractContentAndReasoning(chatCompletion) {
    const messageExtraction = chatCompletion?.messageExtraction;
    if (messageExtraction?.kind === 'custom') return messageExtraction.extractContentAndReasoning;
    return createDefaultExtractContentAndReasoning(messageExtraction?.reasoningContentKeys ?? [
        'reasoning_content'
    ]);
}
function resolveChatCompletion(chatCompletion) {
    const buildChatCompletionParams = chatCompletion?.buildChatCompletionParams ?? defaultChatCompletionParams;
    const resolveImageDetail = chatCompletion?.resolveImageDetail ?? defaultImageDetail;
    const unsupportedUserConfig = chatCompletion?.unsupportedUserConfig ?? [];
    const extractContentAndReasoning = resolveExtractContentAndReasoning(chatCompletion);
    const useReasoningAsContentFallback = chatCompletion?.useReasoningAsContentFallback ?? false;
    return {
        unsupportedUserConfig,
        buildChatCompletionParams: (input)=>{
            const context = {
                ...input,
                userConfig: input.userConfig ?? {},
                midsceneDefaults: midsceneChatCompletionDefaults
            };
            return buildChatCompletionParams(context);
        },
        resolveImageDetail: (input)=>resolveImageDetail({
                ...input,
                userConfig: input.userConfig ?? {},
                midsceneDefaults: midsceneChatCompletionDefaults
            }),
        extractContentAndReasoning,
        useReasoningAsContentFallback
    };
}
exports.resolveChatCompletion = __webpack_exports__.resolveChatCompletion;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "resolveChatCompletion"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=chat-completion.js.map