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
export { extractGeminiContentAndReasoning, geminiAdapters };

//# sourceMappingURL=gemini.mjs.map