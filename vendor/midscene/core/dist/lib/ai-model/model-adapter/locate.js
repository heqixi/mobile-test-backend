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
    resolveLocate: ()=>resolveLocate
});
const factory_js_namespaceObject = require("../shared/model-locate-result/factory.js");
const planning_action_locate_js_namespaceObject = require("../workflows/inspect/planning-action-locate.js");
const defaultLocateResultAdapterDefinition = {
    coordinates: {
        shape: 'bbox',
        order: 'xy',
        normalizedBy: 1000
    }
};
function resolveLocate(locate, resolvedCustomPlanner) {
    if (locate?.kind === 'custom') {
        let locateFn = locate.locateFn;
        if (!locateFn) {
            const planningTapLocator = locate.planningTapLocator;
            if (!planningTapLocator) throw new Error('Custom locate definition requires either locateFn or planningTapLocator');
            if (!resolvedCustomPlanner) throw new Error('Custom planning tap locator requires a custom planning planner definition');
            locateFn = (0, planning_action_locate_js_namespaceObject.resolvePlanningTapLocator)(planningTapLocator, resolvedCustomPlanner);
        }
        return {
            kind: 'custom',
            supportsSearchArea: locate.supportsSearchArea ?? false,
            locateFn
        };
    }
    return {
        kind: 'standard',
        supportsSearchArea: locate?.supportsSearchArea ?? true,
        resultAdapter: (0, factory_js_namespaceObject.createLocateResultAdapter)(locate?.resultAdapter ?? defaultLocateResultAdapterDefinition)
    };
}
exports.resolveLocate = __webpack_exports__.resolveLocate;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "resolveLocate"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=locate.js.map