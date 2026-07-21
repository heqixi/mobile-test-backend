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
    mapLocateResultToPixelBboxByCoordinates: ()=>mapLocateResultToPixelBboxByCoordinates
});
const external_bbox_js_namespaceObject = require("./bbox.js");
const defaultBboxSize = 20;
function resolveCoordinateLimits(result, width, height) {
    const resolvedCoordinates = result.coordinatesMeta;
    const normalizedBy = resolvedCoordinates.normalizedBy;
    if (void 0 !== normalizedBy) return result.coordinates.map(()=>normalizedBy);
    if ('bbox' === resolvedCoordinates.shape) return 'yx' === resolvedCoordinates.order ? [
        height,
        width,
        height,
        width
    ] : [
        width,
        height,
        width,
        height
    ];
    return 'yx' === resolvedCoordinates.order ? [
        height,
        width
    ] : [
        width,
        height
    ];
}
function assertLocateResultCoordinates(result, width, height) {
    const resolvedCoordinates = result.coordinatesMeta;
    const normalizedBy = resolvedCoordinates.normalizedBy;
    const limits = resolveCoordinateLimits(result, width, height);
    const outOfRange = result.coordinates.some((value, index)=>{
        const limit = limits[index];
        return 'number' != typeof value || !Number.isFinite(value) || value < 0 || value > limit;
    });
    if (!outOfRange) return;
    const source = void 0 !== normalizedBy ? `normalized range [0, ${normalizedBy}]` : `image size [0, ${width}]x[0, ${height}]`;
    const normalizedInfo = void 0 !== normalizedBy ? ` normalizedBy=${normalizedBy}` : '';
    throw new Error(`locate result coordinates ${JSON.stringify(result.coordinates)} exceed ${source}. shape=${resolvedCoordinates.shape} order=${resolvedCoordinates.order}${normalizedInfo} limits=${JSON.stringify(limits)}`);
}
function reorderCoordinatesToXy(coordinates, order) {
    if ('yx' !== order) return coordinates;
    if (4 === coordinates.length) {
        const [top, left, bottom, right] = coordinates;
        return [
            left,
            top,
            right,
            bottom
        ];
    }
    const [y, x] = coordinates;
    return [
        x,
        y
    ];
}
function mapLocateResultToPixelBboxByCoordinates(result, { preparedSize }) {
    const { width, height } = preparedSize;
    const resolvedCoordinates = result.coordinatesMeta;
    const normalizedBy = resolvedCoordinates.normalizedBy;
    assertLocateResultCoordinates(result, width, height);
    const xyCoordinates = reorderCoordinatesToXy(result.coordinates, resolvedCoordinates.order);
    const xyBbox = 4 === xyCoordinates.length ? xyCoordinates : (0, external_bbox_js_namespaceObject.expandPointToBbox)(xyCoordinates[0], xyCoordinates[1], normalizedBy ?? (0, external_bbox_js_namespaceObject.maxPixelIndex)(width), normalizedBy ?? (0, external_bbox_js_namespaceObject.maxPixelIndex)(height), void 0 === normalizedBy ? defaultBboxSize / 2 : normalizedBy / 100);
    return void 0 === normalizedBy ? xyBbox : (0, external_bbox_js_namespaceObject.mapNormalizedCoordinatesToPixelBbox)(xyBbox, normalizedBy, width, height);
}
exports.mapLocateResultToPixelBboxByCoordinates = __webpack_exports__.mapLocateResultToPixelBboxByCoordinates;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "mapLocateResultToPixelBboxByCoordinates"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=pixel-bbox-mapper.js.map