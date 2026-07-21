import type { DeviceAction } from '@midscene/core';
export interface InlineStructuredFieldConfig {
    name: string;
    placeholder?: string;
}
/**
 * Compute the list of action identifiers that should be offered in the prompt
 * input's action dropdown.
 *
 * Inclusion rules:
 *   - If `actionSpace` is empty/undefined, fall back to the full metadata set
 *     so dry-mode / offline renderers still show something to pick from.
 *   - `aiAct` is always included. It is an Agent-level API and is executed via
 *     Playground's fallback path, so it does not need to appear in the device
 *     interface's low-level `actionSpace`.
 *   - `extraction` and `validation` APIs are kept even when not in the device's
 *     `actionSpace`: they are executed against the captured UI context rather
 *     than being dispatched to the device, so they apply universally.
 *   - All remaining `actionSpace` entries are included verbatim (device-specific
 *     actions surface automatically).
 */
export declare const getAvailablePromptActionTypes: (actionSpace: DeviceAction<any>[] | undefined) => string[];
export declare const getInlineStructuredFieldConfig: (actionSpace: DeviceAction<any>[] | undefined, selectedType: string) => InlineStructuredFieldConfig | null;
export declare const shouldOffsetEmptyStateForPromptInput: (actionSpace: DeviceAction<any>[] | undefined, selectedType: string) => boolean;
