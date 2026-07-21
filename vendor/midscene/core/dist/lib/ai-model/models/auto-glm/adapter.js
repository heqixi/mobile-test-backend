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
    autoGlmAdapters: ()=>autoGlmAdapters
});
const external_locate_js_namespaceObject = require("./locate.js");
const external_planning_js_namespaceObject = require("./planning.js");
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
            planner: (0, external_planning_js_namespaceObject.createAutoGlmPlanner)(isMultilingual)
        },
        locate: {
            kind: 'custom',
            planningTapLocator: (0, external_locate_js_namespaceObject.createAutoGlmPlanningTapLocator)(isMultilingual)
        }
    };
}
const autoGlmAdapters = {
    'auto-glm': createAutoGlmAdapter(false),
    'auto-glm-multilingual': createAutoGlmAdapter(true)
};
exports.autoGlmAdapters = __webpack_exports__.autoGlmAdapters;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "autoGlmAdapters"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=adapter.js.map