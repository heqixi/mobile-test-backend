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
    createLocateResultPromptSpec: ()=>createLocateResultPromptSpec,
    describeLocateResultValueSchema: ()=>describeLocateResultValueSchema,
    locateResultExampleRegions: ()=>locateResultExampleRegions,
    locateResultExampleValue: ()=>locateResultExampleValue
});
function describeLocateResultCoordinates({ shape, order, normalizedBy }) {
    const descriptor = 'point' === shape ? 'point' : '2d bounding box';
    const coordinateDescription = void 0 !== normalizedBy ? `normalized to 0-${normalizedBy} relative to the screenshot. Do NOT use pixel coordinates or screenshot width/height` : 'in actual pixel coordinates relative to the screenshot';
    if ('point' === shape) {
        const orderDescription = 'yx' === order ? '[y, x]' : '[x, y]';
        return `${descriptor}, should be ${orderDescription} ${coordinateDescription}.`;
    }
    const orderDescription = 'yx' === order ? '[ymin, xmin, ymax, xmax]' : '[xmin, ymin, xmax, ymax]';
    return `${descriptor}, should be ${orderDescription} ${coordinateDescription}.`;
}
function describeLocateResultValueSchema({ shape }) {
    return 'point' === shape ? '[number, number]' : '[number, number, number, number]';
}
function locateResultExampleValue(resolvedCoordinates, region) {
    const [left, top, right, bottom] = region;
    if ('point' === resolvedCoordinates.shape) {
        const x = Math.round((left + right) / 2);
        const y = Math.round((top + bottom) / 2);
        return 'yx' === resolvedCoordinates.order ? [
            y,
            x
        ] : [
            x,
            y
        ];
    }
    return 'yx' === resolvedCoordinates.order ? [
        top,
        left,
        bottom,
        right
    ] : region;
}
const locateResultExampleRegions = [
    [
        100,
        100,
        200,
        200
    ],
    [
        345,
        442,
        458,
        483
    ],
    [
        120,
        180,
        380,
        210
    ],
    [
        120,
        240,
        380,
        270
    ],
    [
        50,
        100,
        200,
        200
    ],
    [
        300,
        400,
        500,
        500
    ],
    [
        600,
        100,
        800,
        250
    ],
    [
        50,
        600,
        250,
        750
    ]
];
function createExampleValues(resolvedCoordinates) {
    return locateResultExampleRegions.map((region)=>locateResultExampleValue(resolvedCoordinates, region));
}
function locateResultKey({ shape }) {
    return 'point' === shape ? 'point' : 'bbox';
}
function locateResultName({ shape }, { plural = false } = {}) {
    return 'bbox' === shape ? plural ? 'bounding boxes' : 'bounding box' : plural ? 'points' : 'point';
}
function createLocateResultPromptSpec(resolvedCoordinates) {
    return {
        resultKey: locateResultKey(resolvedCoordinates),
        resultValueSchema: describeLocateResultValueSchema(resolvedCoordinates),
        resultValueDescription: describeLocateResultCoordinates(resolvedCoordinates),
        resultNoun: locateResultName(resolvedCoordinates),
        resultNounPlural: locateResultName(resolvedCoordinates, {
            plural: true
        }),
        exampleValues: createExampleValues(resolvedCoordinates)
    };
}
exports.createLocateResultPromptSpec = __webpack_exports__.createLocateResultPromptSpec;
exports.describeLocateResultValueSchema = __webpack_exports__.describeLocateResultValueSchema;
exports.locateResultExampleRegions = __webpack_exports__.locateResultExampleRegions;
exports.locateResultExampleValue = __webpack_exports__.locateResultExampleValue;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "createLocateResultPromptSpec",
    "describeLocateResultValueSchema",
    "locateResultExampleRegions",
    "locateResultExampleValue"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=prompt-spec.js.map