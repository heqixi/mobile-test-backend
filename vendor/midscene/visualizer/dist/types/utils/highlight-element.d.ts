import type { LocateResultElement, Rect } from '@midscene/core';
export declare const getCenterHighlightBox: (element: Pick<LocateResultElement, "center">) => Rect;
export declare const normalizeHighlightElementForReport: (element: LocateResultElement) => LocateResultElement;
