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
    glmAdapters: ()=>glmAdapters
});
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
exports.glmAdapters = __webpack_exports__.glmAdapters;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "glmAdapters"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=glm.js.map