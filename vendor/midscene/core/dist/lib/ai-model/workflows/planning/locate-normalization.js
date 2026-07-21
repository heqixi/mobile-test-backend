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
    normalizePlanningActionLocateFields: ()=>normalizePlanningActionLocateFields
});
const external_common_js_namespaceObject = require("../../../common.js");
const logger_namespaceObject = require("@midscene/shared/logger");
const utils_namespaceObject = require("@midscene/shared/utils");
const debug = (0, logger_namespaceObject.getDebug)('planning');
function normalizePlanningActionLocateFields(actions, { actionSpace, includeLocateInPlanning, locateResultAdapter, locateResultContext }) {
    actions.forEach((action)=>{
        const actionInActionSpace = actionSpace.find((actionInSpace)=>actionInSpace.name === action.type);
        if (!actionInActionSpace) return void debug('skip locate normalization for action outside actionSpace', action);
        debug('actionInActionSpace matched', actionInActionSpace);
        const locateFields = (0, external_common_js_namespaceObject.findAllMidsceneLocatorField)(actionInActionSpace.paramSchema);
        debug('locateFields', locateFields);
        locateFields.forEach((field)=>{
            const locateResult = action.param?.[field];
            if (!locateResult) return;
            if (!includeLocateInPlanning) {
                if ('object' == typeof locateResult) action.param[field] = {
                    prompt: locateResult.prompt
                };
                return;
            }
            (0, utils_namespaceObject.assert)(locateResultAdapter, 'planning locate normalization requires a locate result adapter');
            action.param[field] = {
                ...locateResult,
                locatedPixelBbox: locateResultAdapter.adaptPlanningParamToPixelBbox(locateResult, locateResultContext)
            };
        });
    });
}
exports.normalizePlanningActionLocateFields = __webpack_exports__.normalizePlanningActionLocateFields;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "normalizePlanningActionLocateFields"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=locate-normalization.js.map