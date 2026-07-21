import type { ReactNode } from 'react';
export interface NotifyErrorOptions {
    /** Short, descriptive label rendered as the toast title. */
    title?: string;
    /** Custom body text; defaults to the normalized error message. */
    description?: ReactNode;
    /** Seconds before auto-dismiss. Mirrors antd's default of 4.5. */
    duration?: number;
}
/**
 * Project-wide error toast. Consolidates the ad-hoc `message.error(...)`
 * calls that used to pop a full-width banner at the top of the window — the
 * playground and shell now share a single bottom-right notification format,
 * so a series of failures stack instead of clobbering the chrome.
 */
export declare function notifyError(error: unknown, options?: NotifyErrorOptions): void;
