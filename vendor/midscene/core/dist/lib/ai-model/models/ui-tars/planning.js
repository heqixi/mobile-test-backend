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
    createUiTarsPlanner: ()=>createUiTarsPlanner
});
const external_actions_js_namespaceObject = require("./actions.js");
const external_parser_js_namespaceObject = require("./parser.js");
const external_prompt_js_namespaceObject = require("./prompt.js");
function createUiTarsPlanner(uiTarsModelVersion) {
    return {
        messages: {
            systemPromptPlacement: 'user-message',
            buildSystemPrompt: external_prompt_js_namespaceObject.getUiTarsPlanningPrompt,
            buildUserInstruction: (instruction)=>`<user_instruction>${instruction}</user_instruction>`,
            buildAssistantContent: (_parsedResponse, rawResponse)=>(0, external_prompt_js_namespaceObject.getSummary)(rawResponse)
        },
        coordinates: {
            shape: 'point',
            order: 'xy',
            normalizedBy: 1
        },
        parseResponse: (rawResponse, { options })=>(0, external_parser_js_namespaceObject.parseUiTarsPlanningResponse)(rawResponse, options.context.shotSize, uiTarsModelVersion),
        transformActions: (parsedPlanningResponse)=>(0, external_actions_js_namespaceObject.transformUiTarsActions)(parsedPlanningResponse),
        shouldContinuePlanning: (_parsedResponse, actions)=>actions.every((action)=>'Finished' !== action.type),
        buildResponseLog: (_parsedResponse, rawResponse)=>(0, external_prompt_js_namespaceObject.getSummary)(rawResponse)
    };
}
exports.createUiTarsPlanner = __webpack_exports__.createUiTarsPlanner;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "createUiTarsPlanner"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=planning.js.map