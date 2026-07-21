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
    resolvePlanning: ()=>resolvePlanning,
    resolveCustomPlanningDefinition: ()=>resolveCustomPlanningDefinition
});
const index_js_namespaceObject = require("../shared/model-locate-result/index.js");
const custom_planning_js_namespaceObject = require("../workflows/planning/custom-planning.js");
const defaultReplanningCycleLimit = 20;
function resolveCustomPlanningDefinition(config) {
    const { coordinates, ...rest } = config;
    const coordinateSystem = (0, index_js_namespaceObject.resolveLocateResultCoordinates)(coordinates);
    const coordinateNormalizer = (0, index_js_namespaceObject.createLocateResultAdapter)({
        coordinates
    });
    return {
        ...rest,
        coordinateSystem,
        coordinateNormalizer
    };
}
function resolvePlanning(planning, resolvedCustomPlanner) {
    if (planning?.kind === 'custom') {
        if ('function' == typeof planning.planFn) return {
            kind: 'custom',
            cacheEnabled: planning.cacheEnabled ?? false,
            defaultReplanningCycleLimit: planning.defaultReplanningCycleLimit ?? defaultReplanningCycleLimit,
            supportsActionDeepLocate: planning.supportsActionDeepLocate ?? false,
            planFn: planning.planFn
        };
        if (!resolvedCustomPlanner) throw new Error('Custom planning planner definition is not resolved');
        return {
            kind: 'custom',
            cacheEnabled: planning.cacheEnabled ?? false,
            defaultReplanningCycleLimit: planning.defaultReplanningCycleLimit ?? defaultReplanningCycleLimit,
            supportsActionDeepLocate: planning.supportsActionDeepLocate ?? false,
            coordinateSystem: resolvedCustomPlanner.coordinateSystem,
            planFn: (userInstruction, options)=>(0, custom_planning_js_namespaceObject.runCustomPlanning)(userInstruction, options, resolvedCustomPlanner)
        };
    }
    return {
        kind: 'standard',
        cacheEnabled: planning?.cacheEnabled ?? true,
        defaultReplanningCycleLimit: planning?.defaultReplanningCycleLimit ?? defaultReplanningCycleLimit,
        supportsActionDeepLocate: planning?.supportsActionDeepLocate ?? true
    };
}
exports.resolveCustomPlanningDefinition = __webpack_exports__.resolveCustomPlanningDefinition;
exports.resolvePlanning = __webpack_exports__.resolvePlanning;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "resolveCustomPlanningDefinition",
    "resolvePlanning"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=planning.js.map