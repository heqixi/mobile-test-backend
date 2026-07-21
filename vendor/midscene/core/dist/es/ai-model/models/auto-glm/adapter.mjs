import { createAutoGlmPlanningTapLocator } from "./locate.mjs";
import { createAutoGlmPlanner } from "./planning.mjs";
function createAutoGlmAdapter(isMultilingual) {
    return {
        chatCompletion: {
            unsupportedUserConfig: [
                'reasoningEnabled',
                'reasoningEffort',
                'reasoningBudget'
            ],
            buildChatCompletionParams: ({ midsceneDefaults, userConfig })=>{
                const commonOverrideConfig = {};
                if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
                const modelSpecificConfig = {
                    top_p: 0.85,
                    frequency_penalty: 0.2
                };
                return {
                    config: {
                        ...midsceneDefaults,
                        ...commonOverrideConfig,
                        ...modelSpecificConfig
                    }
                };
            }
        },
        planning: {
            kind: 'custom',
            cacheEnabled: false,
            defaultReplanningCycleLimit: 100,
            planner: createAutoGlmPlanner(isMultilingual)
        },
        locate: {
            kind: 'custom',
            planningTapLocator: createAutoGlmPlanningTapLocator(isMultilingual)
        }
    };
}
const autoGlmAdapters = {
    'auto-glm': createAutoGlmAdapter(false),
    'auto-glm-multilingual': createAutoGlmAdapter(true)
};
export { autoGlmAdapters };

//# sourceMappingURL=adapter.mjs.map