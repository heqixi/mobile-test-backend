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
    mapSearchAreaPixelBboxToOriginalPixelBbox: ()=>mapSearchAreaPixelBboxToOriginalPixelBbox
});
function mapSearchAreaPixelBboxToOriginalPixelBbox([left, top, right, bottom], mapping) {
    const offset = mapping?.offset ?? {
        x: 0,
        y: 0
    };
    const scale = mapping?.scale ?? 1;
    const mapX = (x)=>(1 !== scale ? Math.round(x / scale) : x) + offset.x;
    const mapY = (y)=>(1 !== scale ? Math.round(y / scale) : y) + offset.y;
    return [
        mapX(left),
        mapY(top),
        mapX(right),
        mapY(bottom)
    ];
}
exports.mapSearchAreaPixelBboxToOriginalPixelBbox = __webpack_exports__.mapSearchAreaPixelBboxToOriginalPixelBbox;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "mapSearchAreaPixelBboxToOriginalPixelBbox"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=search-area-mapping.js.map