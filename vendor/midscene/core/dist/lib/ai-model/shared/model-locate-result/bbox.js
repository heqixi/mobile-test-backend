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
    expandPointToBbox: ()=>expandPointToBbox,
    finalizePixelBbox: ()=>finalizePixelBbox,
    finalizeSectionLocatePixelBboxGroup: ()=>finalizeSectionLocatePixelBboxGroup,
    mapNormalizedCoordinatesToPixelBbox: ()=>mapNormalizedCoordinatesToPixelBbox,
    maxPixelIndex: ()=>maxPixelIndex,
    normalizedCoordinateToPixelIndex: ()=>normalizedCoordinateToPixelIndex
});
function maxPixelIndex(size) {
    return Math.max(size - 1, 0);
}
function normalizedCoordinateToPixelIndex(value, normalizedBy, size) {
    return Math.round(value * maxPixelIndex(size) / normalizedBy);
}
function mapNormalizedCoordinatesToPixelBbox(coordinates, normalizedBy, width, height) {
    const [left, top, right, bottom] = coordinates;
    return [
        normalizedCoordinateToPixelIndex(left, normalizedBy, width),
        normalizedCoordinateToPixelIndex(top, normalizedBy, height),
        normalizedCoordinateToPixelIndex(right, normalizedBy, width),
        normalizedCoordinateToPixelIndex(bottom, normalizedBy, height)
    ];
}
function expandPointToBbox(x, y, maxX, maxY, halfSize) {
    return [
        Math.max(0, x - halfSize),
        Math.max(0, y - halfSize),
        Math.min(maxX, x + halfSize),
        Math.min(maxY, y + halfSize)
    ];
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function assertFinitePixelBbox(pixelBbox, rawResult) {
    if (4 !== pixelBbox.length || !pixelBbox.every((value)=>'number' == typeof value && Number.isFinite(value))) throw new Error(`invalid locate bbox data: ${JSON.stringify(rawResult)} `);
}
function assertPixelBboxOrder(pixelBbox, rawResult) {
    const [left, top, right, bottom] = pixelBbox;
    if (right >= left && bottom >= top) return;
    throw new Error(`locate pixel bbox has invalid coordinate order: bbox=${JSON.stringify(rawResult)} pixelBbox=${JSON.stringify(pixelBbox)}`);
}
function assertPixelBboxInsideImage(pixelBbox, rawResult, width, height) {
    const [left, top, right, bottom] = pixelBbox;
    const maxRight = maxPixelIndex(width);
    const maxBottom = maxPixelIndex(height);
    const outOfImage = left < 0 || top < 0 || right > maxRight || bottom > maxBottom;
    if (!outOfImage) return;
    throw new Error(`locate pixel bbox is outside the image size: bbox=${JSON.stringify(rawResult)} imageSize=${width}x${height}`);
}
function finalizePixelBbox(pixelBbox, rawResult, { preparedSize, contentSize }) {
    const { width, height } = preparedSize;
    assertFinitePixelBbox(pixelBbox, rawResult);
    assertPixelBboxOrder(pixelBbox, rawResult);
    assertPixelBboxInsideImage(pixelBbox, rawResult, width, height);
    const rightLimit = maxPixelIndex(contentSize?.width ?? width);
    const bottomLimit = maxPixelIndex(contentSize?.height ?? height);
    const [left, top, right, bottom] = pixelBbox;
    return [
        clamp(left, 0, rightLimit),
        clamp(top, 0, bottomLimit),
        clamp(right, 0, rightLimit),
        clamp(bottom, 0, bottomLimit)
    ];
}
function finalizeSectionLocatePixelBboxGroup(result, rawResult, ctx) {
    return {
        target: finalizePixelBbox(result.target, rawResult, ctx),
        ...result.references ? {
            references: result.references.map((reference)=>finalizePixelBbox(reference, rawResult, ctx))
        } : {}
    };
}
exports.expandPointToBbox = __webpack_exports__.expandPointToBbox;
exports.finalizePixelBbox = __webpack_exports__.finalizePixelBbox;
exports.finalizeSectionLocatePixelBboxGroup = __webpack_exports__.finalizeSectionLocatePixelBboxGroup;
exports.mapNormalizedCoordinatesToPixelBbox = __webpack_exports__.mapNormalizedCoordinatesToPixelBbox;
exports.maxPixelIndex = __webpack_exports__.maxPixelIndex;
exports.normalizedCoordinateToPixelIndex = __webpack_exports__.normalizedCoordinateToPixelIndex;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "expandPointToBbox",
    "finalizePixelBbox",
    "finalizeSectionLocatePixelBboxGroup",
    "mapNormalizedCoordinatesToPixelBbox",
    "maxPixelIndex",
    "normalizedCoordinateToPixelIndex"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=bbox.js.map