"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    formatBlackboardHighlightSummary: ()=>formatBlackboardHighlightSummary,
    normalizeBlackboardHighlights: ()=>normalizeBlackboardHighlights
});
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
exports.formatBlackboardHighlightSummary = __webpack_exports__.formatBlackboardHighlightSummary;
exports.normalizeBlackboardHighlights = __webpack_exports__.normalizeBlackboardHighlights;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "formatBlackboardHighlightSummary",
    "normalizeBlackboardHighlights"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
