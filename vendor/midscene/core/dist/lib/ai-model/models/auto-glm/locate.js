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
    createAutoGlmPlanningTapLocator: ()=>createAutoGlmPlanningTapLocator
});
const planning_action_js_namespaceObject = require("../../shared/planning-action.js");
const external_prompt_js_namespaceObject = require("./prompt.js");
function createAutoGlmPlanningTapLocator(isMultilingual) {
    return {
        buildSystemPrompt: ()=>isMultilingual ? (0, external_prompt_js_namespaceObject.getAutoGLMMultilingualLocatePrompt)() : (0, external_prompt_js_namespaceObject.getAutoGLMChineseLocatePrompt)(),
        getLocatedPixelBbox: planning_action_js_namespaceObject.getTapLocatedPixelBbox
    };
}
exports.createAutoGlmPlanningTapLocator = __webpack_exports__.createAutoGlmPlanningTapLocator;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "createAutoGlmPlanningTapLocator"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=locate.js.map