import type { GLOBAL_ENV_KEYS, MODEL_ENV_KEYS } from '@midscene/shared/env';
/**
 * Safely override AI configuration with built-in error handling
 * @param newConfig - The configuration to override
 * @param extendMode - Whether to extend or replace the config (default: false)
 * @param showErrorMessage - Whether to show error message in UI (default: true)
 * @returns boolean indicating success
 */
export declare function safeOverrideAIConfig(newConfig: Partial<Record<(typeof GLOBAL_ENV_KEYS)[number] | (typeof MODEL_ENV_KEYS)[number], string>>, extendMode?: boolean, showErrorMessage?: boolean): boolean;
/**
 * React Hook for safely overriding AI config with error handling
 * Useful for components that need to handle config changes
 */
export declare function useSafeOverrideAIConfig(): {
    applyConfig: (newConfig: Partial<Record<(typeof GLOBAL_ENV_KEYS)[number] | (typeof MODEL_ENV_KEYS)[number], string>>, extendMode?: boolean, showErrorMessage?: boolean) => boolean;
};
