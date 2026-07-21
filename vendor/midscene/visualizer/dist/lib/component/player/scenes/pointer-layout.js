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
    POINTER_HEIGHT: ()=>POINTER_HEIGHT,
    POINTER_HOTSPOT_X: ()=>POINTER_HOTSPOT_X,
    POINTER_HOTSPOT_Y: ()=>POINTER_HOTSPOT_Y,
    POINTER_WIDTH: ()=>POINTER_WIDTH,
    resolveExportPointerLayout: ()=>resolveExportPointerLayout,
    resolvePointerLayout: ()=>resolvePointerLayout,
    resolveSpinnerLayout: ()=>resolveSpinnerLayout
});
const POINTER_REFERENCE_IMAGE_WIDTH = 1920;
const POINTER_WIDTH = 44;
const POINTER_HEIGHT = 56;
const POINTER_HOTSPOT_X = 6;
const POINTER_HOTSPOT_Y = 4;
function assertPositiveFinite(value, name) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive finite number`);
}
function buildPointerLayout(scale) {
    return {
        scale,
        width: POINTER_WIDTH * scale,
        height: POINTER_HEIGHT * scale,
        hotspotX: POINTER_HOTSPOT_X * scale,
        hotspotY: POINTER_HOTSPOT_Y * scale,
        centerOffsetX: POINTER_WIDTH * scale / 2,
        centerOffsetY: POINTER_HEIGHT * scale / 2
    };
}
function resolvePointerLayout(imageWidth) {
    assertPositiveFinite(imageWidth, 'imageWidth');
    return buildPointerLayout(Math.max(1, Math.sqrt(imageWidth / POINTER_REFERENCE_IMAGE_WIDTH)));
}
function resolveExportPointerLayout(imageWidth, contentWidth) {
    assertPositiveFinite(contentWidth, 'contentWidth');
    const liveLayout = resolvePointerLayout(imageWidth);
    return buildPointerLayout(liveLayout.scale * (contentWidth / imageWidth));
}
function resolveSpinnerLayout(pointerLayout) {
    const size = pointerLayout.height;
    return {
        size,
        centerOffset: size / 2
    };
}
exports.POINTER_HEIGHT = __webpack_exports__.POINTER_HEIGHT;
exports.POINTER_HOTSPOT_X = __webpack_exports__.POINTER_HOTSPOT_X;
exports.POINTER_HOTSPOT_Y = __webpack_exports__.POINTER_HOTSPOT_Y;
exports.POINTER_WIDTH = __webpack_exports__.POINTER_WIDTH;
exports.resolveExportPointerLayout = __webpack_exports__.resolveExportPointerLayout;
exports.resolvePointerLayout = __webpack_exports__.resolvePointerLayout;
exports.resolveSpinnerLayout = __webpack_exports__.resolveSpinnerLayout;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "POINTER_HEIGHT",
    "POINTER_HOTSPOT_X",
    "POINTER_HOTSPOT_Y",
    "POINTER_WIDTH",
    "resolveExportPointerLayout",
    "resolvePointerLayout",
    "resolveSpinnerLayout"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
