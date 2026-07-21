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
    createLocateResultValue: ()=>createLocateResultValue,
    parseCoordinateList: ()=>parseCoordinateList,
    parseNumericLocateResult: ()=>parseNumericLocateResult,
    unwrapCoordinateListLikeInput: ()=>unwrapCoordinateListLikeInput
});
function unwrapCoordinateListLikeInput(coordinateList) {
    if (Array.isArray(coordinateList)) {
        if (Array.isArray(coordinateList[0])) return coordinateList[0];
    }
    return coordinateList;
}
function parseCoordinateList(input, label) {
    const unwrapped = unwrapCoordinateListLikeInput(input);
    const values = 'string' == typeof unwrapped ? unwrapped.trim().split(/[\s,]+/).filter(Boolean) : unwrapped;
    if (!Array.isArray(values)) throw new Error(`invalid ${label} data: ${JSON.stringify(input)} `);
    const numericValues = values.map((value)=>'number' == typeof value ? value : Number(value));
    if (!numericValues.every((value)=>Number.isFinite(value))) throw new Error(`invalid ${label} data: ${JSON.stringify(input)} `);
    return numericValues;
}
function createLocateResultValue(coordinatesMeta, coordinates) {
    if ('point' === coordinatesMeta.shape) return {
        coordinates: [
            coordinates[0],
            coordinates[1]
        ],
        coordinatesMeta
    };
    return {
        coordinates: [
            coordinates[0],
            coordinates[1],
            coordinates[2],
            coordinates[3]
        ],
        coordinatesMeta
    };
}
function parseNumericLocateResult(resolvedCoordinates, input) {
    if ('point' === resolvedCoordinates.shape) {
        const point = parseCoordinateList(input, 'point');
        if (point.length < 2) throw new Error(`invalid point data: ${JSON.stringify(input)} `);
        return createLocateResultValue(resolvedCoordinates, point);
    }
    const bbox = parseCoordinateList(input, 'bbox');
    if (4 !== bbox.length) throw new Error(`invalid bbox data: ${JSON.stringify(input)} `);
    return createLocateResultValue(resolvedCoordinates, bbox);
}
exports.createLocateResultValue = __webpack_exports__.createLocateResultValue;
exports.parseCoordinateList = __webpack_exports__.parseCoordinateList;
exports.parseNumericLocateResult = __webpack_exports__.parseNumericLocateResult;
exports.unwrapCoordinateListLikeInput = __webpack_exports__.unwrapCoordinateListLikeInput;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "createLocateResultValue",
    "parseCoordinateList",
    "parseNumericLocateResult",
    "unwrapCoordinateListLikeInput"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=parse.js.map