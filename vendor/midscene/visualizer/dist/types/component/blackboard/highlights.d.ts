import type { BaseElement, LocateResultElement, Rect } from '@midscene/core';
type HighlightLikeElement = (Pick<BaseElement, 'center' | 'rect'> & Partial<Pick<BaseElement, 'content' | 'id'>>) | LocateResultElement;
export interface BlackboardHighlightOverlay {
    key: string;
    label?: string;
    center: [number, number];
    rect: Rect;
}
export declare function normalizeBlackboardHighlights(elements: HighlightLikeElement[] | undefined): BlackboardHighlightOverlay[];
export declare function formatBlackboardHighlightSummary(highlight: BlackboardHighlightOverlay): string;
export {};
