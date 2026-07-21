export declare const actionNameForType: (type: string) => string;
/**
 * Resolves the label shown on the prompt input primary action button.
 *
 * Priority:
 *   1. `overrideLabel` — when provided, it wins unconditionally. This lets an
 *      embedding host pin a stable label regardless of the current type.
 *   2. `actionNameForType(type)` — the auto-derived label for the selected type.
 *   3. Literal `'Action'` — last-resort fallback when neither is available.
 */
export declare const getPromptInputActionLabel: (type: string, overrideLabel?: string) => string;
