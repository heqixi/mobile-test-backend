import { type ReactNode } from 'react';
/**
 * Default icon for a completed `InfoListItem.actionKind`. All action types
 * resolve to the same green checkmark glyph; callers can opt out by passing
 * an override via `ExecutionFlowConfig.resolveActionIcon`.
 */
export declare function defaultProgressActionIcon(_kind: string): ReactNode | null;
/** Default error icon matching the completed checkmark's 1.2px stroke. */
export declare function defaultProgressErrorIcon(): ReactNode;
/**
 * Resolve the icon for a progress action, applying the host's override
 * (if any) before falling back to the default mapping.
 */
export declare function resolveProgressActionIcon(kind: string | undefined, override?: (kind: string) => ReactNode | null | undefined): ReactNode | null;
