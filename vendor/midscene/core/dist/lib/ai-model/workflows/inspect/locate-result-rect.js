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
    mergePixelBboxesToRect: ()=>mergePixelBboxesToRect,
    pixelBboxToRect: ()=>pixelBboxToRect
});
function mergePixelBboxesToRect(pixelBboxes) {
    const minLeft = Math.min(...pixelBboxes.map(([left])=>left));
    const minTop = Math.min(...pixelBboxes.map(([, top])=>top));
    const maxRight = Math.max(...pixelBboxes.map(([, , right])=>right));
    const maxBottom = Math.max(...pixelBboxes.map(([, , , bottom])=>bottom));
    return pixelBboxToRect([
        minLeft,
        minTop,
        maxRight,
        maxBottom
    ]);
}
function pixelBboxToRect([left, top, right, bottom]) {
    return {
        left,
        top,
        width: right - left + 1,
        height: bottom - top + 1
    };
}
exports.mergePixelBboxesToRect = __webpack_exports__.mergePixelBboxesToRect;
exports.pixelBboxToRect = __webpack_exports__.pixelBboxToRect;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "mergePixelBboxesToRect",
    "pixelBboxToRect"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=locate-result-rect.js.map