import type { UIContext } from '@midscene/core';
/**
 * @deprecated Import `actionNameForType` from `./action-label` directly.
 * This re-export exists only to keep older import paths working and may be
 * removed once all call sites are migrated.
 */
export { actionNameForType } from './action-label';
export { getPlaceholderForType } from './prompt-placeholder';
export declare const staticAgentFromContext: (context: UIContext) => any;
export declare const isRunButtonEnabled: (runButtonEnabled: boolean, needsStructuredParams: boolean, params: any, actionSpace: any[] | undefined, selectedType: string, promptValue: string) => boolean;
