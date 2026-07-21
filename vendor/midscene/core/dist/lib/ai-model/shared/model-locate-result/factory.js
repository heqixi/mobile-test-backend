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
    createLocateResultAdapter: ()=>createLocateResultAdapter,
    resolveLocateResultCoordinates: ()=>resolveLocateResultCoordinates
});
const external_bbox_js_namespaceObject = require("./bbox.js");
const external_parse_js_namespaceObject = require("./parse.js");
const external_pixel_bbox_mapper_js_namespaceObject = require("./pixel-bbox-mapper.js");
const external_prompt_spec_js_namespaceObject = require("./prompt-spec.js");
const rawLocateValueFields = {
    primary: {
        bbox: [
            'bbox',
            'bbox_2d'
        ],
        point: [
            'point'
        ]
    },
    references: {
        bbox: [
            'references_bbox',
            'references_bbox_2d'
        ],
        point: [
            'references_point'
        ]
    }
};
function resolveLocateResultCoordinates(coordinates) {
    const order = coordinates.order ?? 'xy';
    if (void 0 !== coordinates.normalizedBy && coordinates.normalizedBy <= 0) throw new Error(`locate result coordinates normalizedBy must be positive: ${coordinates.normalizedBy}`);
    return {
        shape: coordinates.shape,
        order,
        normalizedBy: coordinates.normalizedBy
    };
}
function extractFirstObjectField(input, fields) {
    if (!input || 'object' != typeof input) return;
    const record = input;
    const matchedField = fields.find((field)=>void 0 !== record[field]);
    return matchedField ? record[matchedField] : void 0;
}
function normalizeReferenceResults(input) {
    if (null == input) return [];
    return Array.isArray(input) ? input : [
        input
    ];
}
function assertValidParsedLocateResult(result) {
    if (!result || 'object' != typeof result) throw new Error(`invalid parsed locate result: expected object, got ${JSON.stringify(result)}`);
    const coordinatesMeta = result.coordinatesMeta;
    const expectedLength = coordinatesMeta?.shape === 'bbox' ? 4 : coordinatesMeta?.shape === 'point' ? 2 : 0;
    if (!expectedLength) throw new Error(`invalid parsed locate result: unsupported coordinatesMeta.shape ${JSON.stringify(coordinatesMeta?.shape)}`);
    const coordinates = result.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== expectedLength || !coordinates.every((value)=>'number' == typeof value && Number.isFinite(value))) throw new Error(`invalid parsed locate result: ${coordinatesMeta.shape} coordinates must be ${expectedLength} finite numbers, got ${JSON.stringify(coordinates)}`);
}
function pickRawLocateValue(input, resolvedCoordinates, purpose) {
    const fields = rawLocateValueFields[purpose][resolvedCoordinates.shape];
    return extractFirstObjectField(input, fields);
}
function extractPrimaryRawLocateValue(input, resolvedCoordinates) {
    const pickedRawResult = pickRawLocateValue(input, resolvedCoordinates, 'primary');
    if (void 0 === pickedRawResult && null !== input && 'object' == typeof input && !Array.isArray(input)) throw new Error('locate response does not contain a recognizable locate result field');
    return void 0 === pickedRawResult ? input : pickedRawResult;
}
function extractReferenceRawLocateValues(input, resolvedCoordinates) {
    return normalizeReferenceResults(pickRawLocateValue(input, resolvedCoordinates, 'references'));
}
function createStandardLocateResultAdapterImplementation(config) {
    const resolvedCoordinates = resolveLocateResultCoordinates(config.coordinates);
    const parseRawLocateValue = config.parseRawLocateValue ?? ((input)=>(0, external_parse_js_namespaceObject.parseNumericLocateResult)(resolvedCoordinates, input));
    const mapLocateResultToPixelBbox = config.mapLocateResultToPixelBbox ?? ((result, ctx)=>(0, external_pixel_bbox_mapper_js_namespaceObject.mapLocateResultToPixelBboxByCoordinates)(result, ctx));
    const mapRawLocateValueToPixelBbox = (rawResult, ctx)=>{
        const parsedResult = parseRawLocateValue(rawResult);
        assertValidParsedLocateResult(parsedResult);
        return mapLocateResultToPixelBbox(parsedResult, ctx);
    };
    const adaptRawLocateInputToPixelBbox = (input, ctx)=>mapRawLocateValueToPixelBbox(extractPrimaryRawLocateValue(input, resolvedCoordinates), ctx);
    const adaptElementLocateResultToPixelBbox = (input, ctx)=>adaptRawLocateInputToPixelBbox(input, ctx);
    const adaptPlanningParamToPixelBbox = (input, ctx)=>adaptRawLocateInputToPixelBbox(input, ctx);
    const adaptSectionLocateResultToPixelBboxGroup = (input, ctx)=>{
        const target = adaptRawLocateInputToPixelBbox(input, ctx);
        const references = extractReferenceRawLocateValues(input, resolvedCoordinates).map((raw)=>mapRawLocateValueToPixelBbox(raw, ctx));
        return {
            target,
            ...references.length > 0 ? {
                references
            } : {}
        };
    };
    return {
        promptSpec: (0, external_prompt_spec_js_namespaceObject.createLocateResultPromptSpec)(resolvedCoordinates),
        adaptElementLocateResultToPixelBbox,
        adaptSectionLocateResultToPixelBboxGroup,
        adaptPlanningParamToPixelBbox
    };
}
function createLocateResultAdapter(config) {
    const adapter = 'custom' === config.kind ? config : createStandardLocateResultAdapterImplementation(config);
    return {
        promptSpec: adapter.promptSpec,
        adaptElementLocateResultToPixelBbox: (input, ctx)=>(0, external_bbox_js_namespaceObject.finalizePixelBbox)(adapter.adaptElementLocateResultToPixelBbox(input, ctx), input, ctx),
        adaptSectionLocateResultToPixelBboxGroup: (input, ctx)=>(0, external_bbox_js_namespaceObject.finalizeSectionLocatePixelBboxGroup)(adapter.adaptSectionLocateResultToPixelBboxGroup(input, ctx), input, ctx),
        adaptPlanningParamToPixelBbox: (input, ctx)=>(0, external_bbox_js_namespaceObject.finalizePixelBbox)(adapter.adaptPlanningParamToPixelBbox(input, ctx), input, ctx)
    };
}
exports.createLocateResultAdapter = __webpack_exports__.createLocateResultAdapter;
exports.resolveLocateResultCoordinates = __webpack_exports__.resolveLocateResultCoordinates;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "createLocateResultAdapter",
    "resolveLocateResultCoordinates"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=factory.js.map