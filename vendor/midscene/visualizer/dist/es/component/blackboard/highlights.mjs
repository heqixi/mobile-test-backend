function formatCenterKey(center) {
    return `${center[0]}:${center[1]}`;
}
function formatRectKey(rect) {
    return `${rect.left}:${rect.top}:${rect.width}:${rect.height}`;
}
function getElementLabel(element) {
    if ('content' in element && element.content) return element.content;
    if ("description" in element && element.description) return element.description;
}
function normalizeBlackboardHighlights(elements) {
    if (!(null == elements ? void 0 : elements.length)) return [];
    const deduped = new Map();
    elements.forEach((element, index)=>{
        if (!(null == element ? void 0 : element.rect) || !(null == element ? void 0 : element.center)) return;
        const label = getElementLabel(element);
        const dedupeKey = [
            'id' in element ? element.id : '',
            label || '',
            formatCenterKey(element.center),
            formatRectKey(element.rect)
        ].join('|');
        if (!deduped.has(dedupeKey)) deduped.set(dedupeKey, {
            key: 'id' in element && element.id || `${dedupeKey || 'highlight'}-${index}`,
            label,
            center: element.center,
            rect: element.rect
        });
    });
    return Array.from(deduped.values());
}
function roundRect(rect) {
    return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
    };
}
function formatBlackboardHighlightSummary(highlight) {
    const center = `[${Math.round(highlight.center[0])}, ${Math.round(highlight.center[1])}]`;
    const rect = roundRect(highlight.rect);
    const rectText = `rect=${JSON.stringify(rect)}`;
    if (highlight.label) return `${highlight.label} center=${center}, ${rectText}`;
    return `center=${center}, ${rectText}`;
}
export { formatBlackboardHighlightSummary, normalizeBlackboardHighlights };
