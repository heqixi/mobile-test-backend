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
    calculateEmptyStatePromptScrollTop: ()=>calculateEmptyStatePromptScrollTop
});
const DEFAULT_SAFE_MARGIN = 24;
function calculateEmptyStatePromptScrollTop({ currentScrollTop, maxScrollTop, containerTop, containerBottom, contentStartTop, contentEndBottom, topSafeMargin = DEFAULT_SAFE_MARGIN, bottomSafeMargin = DEFAULT_SAFE_MARGIN }) {
    const scrollForContentEnd = currentScrollTop + contentEndBottom - (containerBottom - bottomSafeMargin);
    const maxScrollWithContentStartVisible = currentScrollTop + contentStartTop - (containerTop + topSafeMargin);
    const targetScrollTop = Math.min(scrollForContentEnd, maxScrollWithContentStartVisible, maxScrollTop);
    return Math.max(0, Math.round(targetScrollTop));
}
exports.calculateEmptyStatePromptScrollTop = __webpack_exports__.calculateEmptyStatePromptScrollTop;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "calculateEmptyStatePromptScrollTop"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
