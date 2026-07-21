import { overrideAIConfig } from "@midscene/shared/env";
import { notifyError } from "../utils/index.mjs";
function safeOverrideAIConfig(newConfig, extendMode = false, showErrorMessage = true) {
    try {
        overrideAIConfig(newConfig, extendMode);
        return true;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Failed to override AI config:', err);
        if (showErrorMessage) notifyError(err, {
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
export { safeOverrideAIConfig, useSafeOverrideAIConfig };
