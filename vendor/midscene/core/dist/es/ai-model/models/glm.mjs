const buildGlmChatCompletionParams = (input)=>{
    const { midsceneDefaults, userConfig } = input;
    const { reasoningEnabled } = userConfig;
    const commonOverrideConfig = {};
    if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
    if ('none' !== userConfig.responseFormat && input.expectedJsonObjectResponse) commonOverrideConfig.response_format = {
        type: 'json_object'
    };
    const modelSpecificConfig = {};
    if ('default' !== reasoningEnabled) modelSpecificConfig.thinking = {
        type: reasoningEnabled ?? false ? 'enabled' : 'disabled'
    };
    return {
        config: {
            ...midsceneDefaults,
            ...commonOverrideConfig,
            ...modelSpecificConfig
        }
    };
};
const glmAdapters = {
    'glm-v': {
        chatCompletion: {
            unsupportedUserConfig: [
                'reasoningEffort',
                'reasoningBudget'
            ],
            buildChatCompletionParams: buildGlmChatCompletionParams,
            useReasoningAsContentFallback: true
        },
        locate: {
            resultAdapter: {
                coordinates: {
                    shape: 'bbox',
                    order: 'xy',
                    normalizedBy: 1000
                }
            }
        }
    }
};
export { glmAdapters };

//# sourceMappingURL=glm.mjs.map