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
    extractAgentBehaviorInitArgs: ()=>extractAgentBehaviorInitArgs,
    agentBehaviorInitArgShape: ()=>agentBehaviorInitArgShape,
    getAgentInitArgsSignature: ()=>getAgentInitArgsSignature,
    shouldRebuildAgentForInitArgs: ()=>shouldRebuildAgentForInitArgs
});
const external_zod_namespaceObject = require("zod");
const agentBehaviorInitArgShape = {
    aiActContext: external_zod_namespaceObject.z.string().optional().describe('Background knowledge passed to aiAct. Default: no extra context.'),
    replanningCycleLimit: external_zod_namespaceObject.z.number().int().nonnegative().optional().describe('Maximum number of replanning cycles for aiAct. Default: model adapter default.'),
    waitAfterAction: external_zod_namespaceObject.z.number().nonnegative().optional().describe('Wait time in milliseconds after each action execution. Default: 300ms.'),
    screenshotShrinkFactor: external_zod_namespaceObject.z.number().min(1).optional().describe('Screenshot shrink factor before sending images to AI. Default: 1; high values may reduce recognition quality, especially on mobile.')
};
function extractAgentBehaviorInitArgs(extracted) {
    if (!extracted) return;
    const agentOptions = {
        ...'string' == typeof extracted.aiActContext ? {
            aiActContext: extracted.aiActContext
        } : {},
        ...'string' == typeof extracted.aiActionContext ? {
            aiActionContext: extracted.aiActionContext
        } : {},
        ...'number' == typeof extracted.replanningCycleLimit ? {
            replanningCycleLimit: extracted.replanningCycleLimit
        } : {},
        ...'number' == typeof extracted.waitAfterAction ? {
            waitAfterAction: extracted.waitAfterAction
        } : {},
        ...'number' == typeof extracted.screenshotShrinkFactor ? {
            screenshotShrinkFactor: extracted.screenshotShrinkFactor
        } : {}
    };
    return Object.keys(agentOptions).length > 0 ? agentOptions : void 0;
}
function stableJsonValue(value) {
    if (Array.isArray(value)) return value.map(stableJsonValue);
    if (value && 'object' == typeof value) return Object.fromEntries(Object.entries(value).sort(([left], [right])=>left.localeCompare(right)).map(([key, nestedValue])=>[
            key,
            stableJsonValue(nestedValue)
        ]));
    return value;
}
function getAgentInitArgsSignature(initArgs) {
    if (!initArgs || 0 === Object.keys(initArgs).length) return;
    return JSON.stringify(stableJsonValue(initArgs));
}
function shouldRebuildAgentForInitArgs(currentSignature, nextSignature) {
    return currentSignature !== nextSignature && (void 0 !== currentSignature || void 0 !== nextSignature);
}
exports.agentBehaviorInitArgShape = __webpack_exports__.agentBehaviorInitArgShape;
exports.extractAgentBehaviorInitArgs = __webpack_exports__.extractAgentBehaviorInitArgs;
exports.getAgentInitArgsSignature = __webpack_exports__.getAgentInitArgsSignature;
exports.shouldRebuildAgentForInitArgs = __webpack_exports__.shouldRebuildAgentForInitArgs;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "agentBehaviorInitArgShape",
    "extractAgentBehaviorInitArgs",
    "getAgentInitArgsSignature",
    "shouldRebuildAgentForInitArgs"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
