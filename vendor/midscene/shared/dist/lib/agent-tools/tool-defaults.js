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
    TOOL_BEHAVIOR_FLAGS: ()=>TOOL_BEHAVIOR_FLAGS,
    mergeToolDefaults: ()=>mergeToolDefaults,
    resolveToolDefaults: ()=>resolveToolDefaults,
    stripBehaviorFlags: ()=>stripBehaviorFlags
});
const TOOL_BEHAVIOR_FLAGS = [
    {
        cli: 'deep-locate',
        description: 'Force deep locate for every locating operation (better precision for small/ambiguous targets, a bit slower).',
        defaults: {
            locate: {
                deepLocate: true
            },
            act: {
                deepLocate: true
            }
        }
    },
    {
        cli: 'deep-think',
        description: 'Plan the act tool with deep thinking (richer context and sub-goal decomposition, a bit slower).',
        defaults: {
            act: {
                deepThink: true
            }
        }
    }
];
function mergeToolDefaults(a, b) {
    const locate = {
        ...a.locate,
        ...b.locate
    };
    const act = {
        ...a.act,
        ...b.act
    };
    const result = {};
    if (Object.keys(locate).length > 0) result.locate = locate;
    if (Object.keys(act).length > 0) result.act = act;
    return result;
}
function resolveToolDefaults(isEnabled) {
    return TOOL_BEHAVIOR_FLAGS.reduce((acc, flag)=>isEnabled(flag.cli) ? mergeToolDefaults(acc, flag.defaults) : acc, {});
}
function stripBehaviorFlags(argv) {
    const enabled = new Set();
    const rawArgs = [];
    for (const arg of argv){
        const flag = TOOL_BEHAVIOR_FLAGS.find((f)=>arg === `--${f.cli}`);
        if (flag) enabled.add(flag.cli);
        else rawArgs.push(arg);
    }
    return {
        rawArgs,
        toolDefaults: resolveToolDefaults((cli)=>enabled.has(cli))
    };
}
exports.TOOL_BEHAVIOR_FLAGS = __webpack_exports__.TOOL_BEHAVIOR_FLAGS;
exports.mergeToolDefaults = __webpack_exports__.mergeToolDefaults;
exports.resolveToolDefaults = __webpack_exports__.resolveToolDefaults;
exports.stripBehaviorFlags = __webpack_exports__.stripBehaviorFlags;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "TOOL_BEHAVIOR_FLAGS",
    "mergeToolDefaults",
    "resolveToolDefaults",
    "stripBehaviorFlags"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
