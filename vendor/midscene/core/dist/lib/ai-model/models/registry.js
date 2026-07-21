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
    getModelAdapter: ()=>getModelAdapter,
    MODEL_ADAPTER_CONFIGS: ()=>MODEL_ADAPTER_CONFIGS,
    getModelRuntime: ()=>getModelRuntime
});
const logger_namespaceObject = require("@midscene/shared/logger");
const resolve_js_namespaceObject = require("../model-adapter/resolve.js");
const adapter_js_namespaceObject = require("./auto-glm/adapter.js");
const external_default_js_namespaceObject = require("./default.js");
const external_doubao_js_namespaceObject = require("./doubao.js");
const external_gemini_js_namespaceObject = require("./gemini.js");
const external_glm_js_namespaceObject = require("./glm.js");
const external_gpt_js_namespaceObject = require("./gpt.js");
const external_kimi_js_namespaceObject = require("./kimi.js");
const external_mimo_js_namespaceObject = require("./mimo.js");
const external_qwen_js_namespaceObject = require("./qwen.js");
const external_ui_tars_adapter_js_namespaceObject = require("./ui-tars/adapter.js");
const MODEL_ADAPTER_CONFIGS = {
    ...external_qwen_js_namespaceObject.qwenAdapters,
    ...external_doubao_js_namespaceObject.doubaoAdapters,
    ...external_gemini_js_namespaceObject.geminiAdapters,
    ...external_ui_tars_adapter_js_namespaceObject.uiTarsAdapters,
    ...external_glm_js_namespaceObject.glmAdapters,
    ...adapter_js_namespaceObject.autoGlmAdapters,
    ...external_gpt_js_namespaceObject.gptAdapters,
    ...external_kimi_js_namespaceObject.kimiAdapters,
    ...external_mimo_js_namespaceObject.mimoAdapters
};
const modelAdapterCache = new Map();
const debugModelAdapter = (0, logger_namespaceObject.getDebug)('ai:model-adapter');
function debugAdapterUnsupportedUserConfig(modelFamily, adapter) {
    if (0 === adapter.chatCompletion.unsupportedUserConfig.length) return;
    debugModelAdapter(`model adapter "${modelFamily}" unsupportedUserConfig: ${JSON.stringify(adapter.chatCompletion.unsupportedUserConfig)}`);
}
function getModelAdapter(modelFamily) {
    const cacheKey = modelFamily ?? 'default';
    let adapter = modelAdapterCache.get(cacheKey);
    if (adapter) return adapter;
    const config = modelFamily ? MODEL_ADAPTER_CONFIGS[modelFamily] : external_default_js_namespaceObject.defaultOpenAICompatibleAdapterConfig;
    if (!config) throw new Error(`No model adapter registered for modelFamily: ${modelFamily}`);
    adapter = new resolve_js_namespaceObject.ResolvedModelAdapter(config, cacheKey);
    modelAdapterCache.set(cacheKey, adapter);
    debugAdapterUnsupportedUserConfig(cacheKey, adapter);
    return adapter;
}
function getModelRuntime(config) {
    return {
        config,
        adapter: getModelAdapter(config.modelFamily)
    };
}
exports.MODEL_ADAPTER_CONFIGS = __webpack_exports__.MODEL_ADAPTER_CONFIGS;
exports.getModelAdapter = __webpack_exports__.getModelAdapter;
exports.getModelRuntime = __webpack_exports__.getModelRuntime;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "MODEL_ADAPTER_CONFIGS",
    "getModelAdapter",
    "getModelRuntime"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=registry.js.map