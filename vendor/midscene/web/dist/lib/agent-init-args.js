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
    adaptWebAgentInitArgs: ()=>adaptWebAgentInitArgs,
    webAgentInitArgShape: ()=>webAgentInitArgShape
});
const core_namespaceObject = require("@midscene/core");
const agent_behavior_init_args_namespaceObject = require("@midscene/shared/agent-tools/agent-behavior-init-args");
const webAgentInitArgShape = {
    url: core_namespaceObject.z.string().url().optional().describe('URL to open in new tab (omit to use current page)'),
    ...agent_behavior_init_args_namespaceObject.agentBehaviorInitArgShape
};
function adaptWebAgentInitArgs(extracted) {
    if (!extracted) return;
    const initArgs = {
        ...'string' == typeof extracted.url ? {
            url: extracted.url
        } : {},
        ...(0, agent_behavior_init_args_namespaceObject.extractAgentBehaviorInitArgs)(extracted) ?? {}
    };
    return Object.keys(initArgs).length > 0 ? initArgs : void 0;
}
exports.adaptWebAgentInitArgs = __webpack_exports__.adaptWebAgentInitArgs;
exports.webAgentInitArgShape = __webpack_exports__.webAgentInitArgShape;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "adaptWebAgentInitArgs",
    "webAgentInitArgShape"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=agent-init-args.js.map