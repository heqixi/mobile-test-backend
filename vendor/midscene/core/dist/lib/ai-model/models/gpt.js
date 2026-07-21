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
    gptAdapters: ()=>gptAdapters
});
const intent_js_namespaceObject = require("./utils/intent.js");
const originalImageDetailForDefaultIntent = (input)=>(0, intent_js_namespaceObject.isLocateIntent)(input.intent) || input.requiresOriginalImageDetail ? 'original' : void 0;
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
exports.gptAdapters = __webpack_exports__.gptAdapters;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "gptAdapters"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=gpt.js.map