import { isLocateIntent } from "./utils/intent.mjs";
const originalImageDetailForDefaultIntent = (input)=>isLocateIntent(input.intent) || input.requiresOriginalImageDetail ? 'original' : void 0;
const buildGpt5ChatCompletionParams = (input)=>{
    const { midsceneDefaults, userConfig } = input;
    const { reasoningEnabled, reasoningEffort } = userConfig;
    const commonOverrideConfig = {};
    if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
    if ('none' !== input.userConfig.responseFormat && input.expectedJsonObjectResponse) commonOverrideConfig.response_format = {
        type: 'json_object'
    };
    const effectiveReasoningEffort = true === reasoningEnabled ? reasoningEffort ?? 'medium' : 'none';
    return {
        config: {
            ...midsceneDefaults,
            ...commonOverrideConfig,
            reasoning_effort: effectiveReasoningEffort
        }
    };
};
const gptAdapters = {
    'gpt-5': {
        chatCompletion: {
            unsupportedUserConfig: [
                'reasoningBudget'
            ],
            buildChatCompletionParams: buildGpt5ChatCompletionParams,
            resolveImageDetail: originalImageDetailForDefaultIntent
        },
        locate: {
            resultAdapter: {
                coordinates: {
                    shape: 'bbox',
                    order: 'xy'
                }
            }
        }
    }
};
export { gptAdapters };

//# sourceMappingURL=gpt.mjs.map