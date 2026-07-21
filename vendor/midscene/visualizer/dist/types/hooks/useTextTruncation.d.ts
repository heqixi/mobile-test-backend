type MeasurableElement = Pick<HTMLElement, 'clientHeight' | 'clientWidth' | 'scrollHeight' | 'scrollWidth'>;
export type TextTruncationMode = 'multi-line' | 'single-line';
export declare function isTextTruncated(element: MeasurableElement | null, mode: TextTruncationMode): boolean;
/**
 * Detect whether text hidden by its matching line-clamp or ellipsis can be
 * revealed with a tooltip. Re-check when the text or its available space
 * changes.
 */
export declare function useTextTruncation<T extends HTMLElement>(content: string, mode: TextTruncationMode): {
    ref: import("react").RefObject<T>;
    truncated: boolean;
};
export {};
