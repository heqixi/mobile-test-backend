export interface EmptyStatePromptScrollMetrics {
    currentScrollTop: number;
    maxScrollTop: number;
    containerTop: number;
    containerBottom: number;
    contentStartTop: number;
    contentEndBottom: number;
    topSafeMargin?: number;
    bottomSafeMargin?: number;
}
export declare function calculateEmptyStatePromptScrollTop({ currentScrollTop, maxScrollTop, containerTop, containerBottom, contentStartTop, contentEndBottom, topSafeMargin, bottomSafeMargin, }: EmptyStatePromptScrollMetrics): number;
