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
    safeOverrideAIConfig: ()=>safeOverrideAIConfig,
    useSafeOverrideAIConfig: ()=>useSafeOverrideAIConfig
});
const env_namespaceObject = require("@midscene/shared/env");
const index_js_namespaceObject = require("../utils/index.js");
function safeOverrideAIConfig(newConfig, extendMode = false, showErrorMessage = true) {
    try {
        (0, env_namespaceObject.overrideAIConfig)(newConfig, extendMode);
        return true;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Failed to override AI config:', err);
        if (showErrorMessage) (0, index_js_namespaceObject.notifyError)(err, {
            title: 'Failed to apply AI configuration'
        });
        return false;
    }
}
function useSafeOverrideAIConfig() {
    const applyConfig = (newConfig, extendMode = false, showErrorMessage = true)=>safeOverrideAIConfig(newConfig, extendMode, showErrorMessage);
    return {
        applyConfig
    };
}
exports.safeOverrideAIConfig = __webpack_exports__.safeOverrideAIConfig;
exports.useSafeOverrideAIConfig = __webpack_exports__.useSafeOverrideAIConfig;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "safeOverrideAIConfig",
    "useSafeOverrideAIConfig"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
