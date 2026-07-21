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
    defaultModelFamilyRequiredForLocateMessage: ()=>defaultModelFamilyRequiredForLocateMessage,
    planningModelFamilyRequiredForLocateMessage: ()=>planningModelFamilyRequiredForLocateMessage
});
const modelConfigDocUrl = 'https://midscenejs.com/model-config';
const defaultModelFamilyRequiredForLocateMessage = `Default model family is required for locate. Configure MIDSCENE_MODEL_FAMILY so Midscene can parse locate coordinates correctly. ${modelConfigDocUrl}`;
function planningModelFamilyRequiredForLocateMessage(slot) {
    if ('planning' === slot) return `Planning model family is required because aiAct is asking the planning model to return locate coordinates. Configure MIDSCENE_PLANNING_MODEL_FAMILY for the planning model, or remove the separate planning model config and configure MIDSCENE_MODEL_FAMILY on the default model. ${modelConfigDocUrl}`;
    return `Default model family is required because aiAct is asking the default model to return locate coordinates during planning. Configure MIDSCENE_MODEL_FAMILY so Midscene can parse planning locate coordinates correctly. ${modelConfigDocUrl}`;
}
exports.defaultModelFamilyRequiredForLocateMessage = __webpack_exports__.defaultModelFamilyRequiredForLocateMessage;
exports.planningModelFamilyRequiredForLocateMessage = __webpack_exports__.planningModelFamilyRequiredForLocateMessage;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "defaultModelFamilyRequiredForLocateMessage",
    "planningModelFamilyRequiredForLocateMessage"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=errors.js.map