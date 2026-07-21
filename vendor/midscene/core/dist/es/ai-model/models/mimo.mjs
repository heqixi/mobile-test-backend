const buildMimoChatCompletionParams = (input)=>{
    const { midsceneDefaults, userConfig } = input;
    const { reasoningEnabled } = userConfig;
    const commonOverrideConfig = {};
    if ('none' !== userConfig.responseFormat && input.expectedJsonObjectResponse) commonOverrideConfig.response_format = {
        type: 'json_object'
    };
    if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
    const modelSpecificConfig = {
        thinking: {
            type: reasoningEnabled ?? false ? 'enabled' : 'disabled'
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
const mimoAdapters = {
    'xiaomi-mimo': {
        chatCompletion: {
            unsupportedUserConfig: [
                'reasoningEffort',
                'reasoningBudget'
            ],
            buildChatCompletionParams: buildMimoChatCompletionParams,
            useReasoningAsContentFallback: true
        }
    }
};
export { mimoAdapters };

//# sourceMappingURL=mimo.mjs.map