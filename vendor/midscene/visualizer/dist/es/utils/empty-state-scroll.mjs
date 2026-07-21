const DEFAULT_SAFE_MARGIN = 24;
function calculateEmptyStatePromptScrollTop({ currentScrollTop, maxScrollTop, containerTop, containerBottom, contentStartTop, contentEndBottom, topSafeMargin = DEFAULT_SAFE_MARGIN, bottomSafeMargin = DEFAULT_SAFE_MARGIN }) {
    const scrollForContentEnd = currentScrollTop + contentEndBottom - (containerBottom - bottomSafeMargin);
    const maxScrollWithContentStartVisible = currentScrollTop + contentStartTop - (containerTop + topSafeMargin);
    const targetScrollTop = Math.min(scrollForContentEnd, maxScrollWithContentStartVisible, maxScrollTop);
    return Math.max(0, Math.round(targetScrollTop));
}
export { calculateEmptyStatePromptScrollTop };
