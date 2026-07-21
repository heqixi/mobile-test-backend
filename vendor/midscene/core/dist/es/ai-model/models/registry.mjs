import { getDebug } from "@midscene/shared/logger";
import { ResolvedModelAdapter } from "../model-adapter/resolve.mjs";
import { autoGlmAdapters } from "./auto-glm/adapter.mjs";
import { defaultOpenAICompatibleAdapterConfig } from "./default.mjs";
import { doubaoAdapters } from "./doubao.mjs";
import { geminiAdapters } from "./gemini.mjs";
import { glmAdapters } from "./glm.mjs";
import { gptAdapters } from "./gpt.mjs";
import { kimiAdapters } from "./kimi.mjs";
import { mimoAdapters } from "./mimo.mjs";
import { qwenAdapters } from "./qwen.mjs";
import { uiTarsAdapters } from "./ui-tars/adapter.mjs";
const MODEL_ADAPTER_CONFIGS = {
    ...qwenAdapters,
    ...doubaoAdapters,
    ...geminiAdapters,
    ...uiTarsAdapters,
    ...glmAdapters,
    ...autoGlmAdapters,
    ...gptAdapters,
    ...kimiAdapters,
    ...mimoAdapters
};
const modelAdapterCache = new Map();
const debugModelAdapter = getDebug('ai:model-adapter');
function debugAdapterUnsupportedUserConfig(modelFamily, adapter) {
    if (0 === adapter.chatCompletion.unsupportedUserConfig.length) return;
    debugModelAdapter(`model adapter "${modelFamily}" unsupportedUserConfig: ${JSON.stringify(adapter.chatCompletion.unsupportedUserConfig)}`);
}
function getModelAdapter(modelFamily) {
    const cacheKey = modelFamily ?? 'default';
    let adapter = modelAdapterCache.get(cacheKey);
    if (adapter) return adapter;
    const config = modelFamily ? MODEL_ADAPTER_CONFIGS[modelFamily] : defaultOpenAICompatibleAdapterConfig;
    if (!config) throw new Error(`No model adapter registered for modelFamily: ${modelFamily}`);
    adapter = new ResolvedModelAdapter(config, cacheKey);
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
export { MODEL_ADAPTER_CONFIGS, getModelAdapter, getModelRuntime };

//# sourceMappingURL=registry.mjs.map