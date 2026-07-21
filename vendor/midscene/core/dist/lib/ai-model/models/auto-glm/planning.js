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
    createAutoGlmPlanner: ()=>createAutoGlmPlanner
});
const utils_namespaceObject = require("@midscene/shared/utils");
const index_js_namespaceObject = require("../../shared/model-locate-result/index.js");
const external_actions_js_namespaceObject = require("./actions.js");
const external_parser_js_namespaceObject = require("./parser.js");
const external_prompt_js_namespaceObject = require("./prompt.js");
function createAutoGlmPlanner(isMultilingual) {
    return {
        messages: {
            systemPromptPlacement: 'system-message',
            buildSystemPrompt: ()=>isMultilingual ? (0, external_prompt_js_namespaceObject.getAutoGLMMultilingualPlanPrompt)() : (0, external_prompt_js_namespaceObject.getAutoGLMChinesePlanPrompt)(),
            historyImageLimit: 1,
            buildAssistantContent: (parsedResponse)=>`<think>${parsedResponse.response.think}</think><answer>${parsedResponse.response.content}</answer>`
        },
        coordinates: {
            shape: 'point',
            order: 'xy',
            normalizedBy: 1000
        },
        parseResponse: (rawResponse)=>(0, external_parser_js_namespaceObject.parseAutoGLMPlanningResponse)(rawResponse),
        transformActions: (parsedResponse, { options, coordinateSystem })=>{
            (0, utils_namespaceObject.assert)(coordinateSystem, 'Auto-GLM planning requires coordinate system');
            return (0, external_actions_js_namespaceObject.transformAutoGLMAction)(parsedResponse.action, {
                actionSpace: options.actionSpace,
                coordinateDistanceToPixels: (0, index_js_namespaceObject.createCoordinateDistanceToPixels)(options.context.shotSize, coordinateSystem)
            });
        },
        shouldContinuePlanning: (parsedResponse)=>'finish' !== parsedResponse.action._metadata,
        buildResponseLog: (_parsedResponse, rawResponse)=>rawResponse
    };
}
exports.createAutoGlmPlanner = __webpack_exports__.createAutoGlmPlanner;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "createAutoGlmPlanner"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=planning.js.map