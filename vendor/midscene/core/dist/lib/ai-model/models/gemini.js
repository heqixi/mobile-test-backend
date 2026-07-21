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
    extractGeminiContentAndReasoning: ()=>extractGeminiContentAndReasoning,
    geminiAdapters: ()=>geminiAdapters
});
const buildGeminiChatCompletionParams = (input)=>{
    const { midsceneDefaults, userConfig } = input;
    const { reasoningEnabled, reasoningEffort } = userConfig;
    const commonOverrideConfig = {};
    if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
    const modelSpecificConfig = {};
    if ('default' !== reasoningEnabled) modelSpecificConfig.extra_body = {
        google: {
            thinking_config: {
                include_thoughts: true,
                thinking_level: reasoningEnabled ? reasoningEffort ?? 'medium' : 'minimal'
            }
        }
    };
    return {
        config: {
            ...midsceneDefaults,
            ...commonOverrideConfig,
            ...modelSpecificConfig
        }
    };
};
const extractInlineThought = (content)=>{
    const match = content.match(/<thought>([\s\S]*?)<\/thought>/i);
    return match?.[1]?.trim() || void 0;
};
function isRecord(value) {
    return !!value && 'object' == typeof value && !Array.isArray(value);
}
const formatReasoningContent = ({ geminiReasoningContent, providerReasoningContent })=>{
    if (geminiReasoningContent && providerReasoningContent) return `thoughtParts：${geminiReasoningContent}; reasoning_content：${providerReasoningContent}`;
    return geminiReasoningContent || providerReasoningContent || '';
};
const extractGeminiThoughtParts = (content)=>{
    const contentParts = [];
    const reasoningParts = [];
    for (const part of content){
        if (!isRecord(part)) continue;
        const text = 'string' == typeof part.text ? part.text : void 0;
        if (text) if (true === part.thought) reasoningParts.push(text);
        else contentParts.push(text);
    }
    return {
        content: contentParts.join(''),
        geminiReasoningContent: reasoningParts.join('')
    };
};
const extractGeminiContentAndReasoning = (message)=>{
    if (!message) return {
        content: '',
        reasoning_content: ''
    };
    if (Array.isArray(message.content)) {
        const extracted = extractGeminiThoughtParts(message.content);
        return {
            content: extracted.content,
            reasoning_content: formatReasoningContent({
                geminiReasoningContent: extracted.geminiReasoningContent,
                providerReasoningContent: 'string' == typeof message.reasoning_content ? message.reasoning_content : ''
            })
        };
    }
    const content = 'string' == typeof message.content ? message.content : '';
    const geminiReasoningContent = extractInlineThought(content) || '';
    return {
        content,
        reasoning_content: formatReasoningContent({
            geminiReasoningContent,
            providerReasoningContent: 'string' == typeof message.reasoning_content ? message.reasoning_content : ''
        })
    };
};
const geminiAdapters = {
    gemini: {
        chatCompletion: {
            unsupportedUserConfig: [
                'reasoningBudget'
            ],
            buildChatCompletionParams: buildGeminiChatCompletionParams,
            messageExtraction: {
                kind: 'custom',
                extractContentAndReasoning: extractGeminiContentAndReasoning
            }
        },
        locate: {
            resultAdapter: {
                coordinates: {
                    shape: 'bbox',
                    order: 'yx',
                    normalizedBy: 1000
                }
            }
        }
    }
};
exports.extractGeminiContentAndReasoning = __webpack_exports__.extractGeminiContentAndReasoning;
exports.geminiAdapters = __webpack_exports__.geminiAdapters;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "extractGeminiContentAndReasoning",
    "geminiAdapters"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=gemini.js.map