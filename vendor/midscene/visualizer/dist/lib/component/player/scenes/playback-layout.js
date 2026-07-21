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
    getPlaybackViewport: ()=>getPlaybackViewport
});
function getPlaybackViewport(containerWidth, containerHeight, imageWidth, imageHeight) {
    const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
    const contentWidth = imageWidth * scale;
    const contentHeight = imageHeight * scale;
    return {
        offsetX: (containerWidth - contentWidth) / 2,
        offsetY: (containerHeight - contentHeight) / 2,
        contentWidth,
        contentHeight
    };
}
exports.getPlaybackViewport = __webpack_exports__.getPlaybackViewport;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "getPlaybackViewport"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
