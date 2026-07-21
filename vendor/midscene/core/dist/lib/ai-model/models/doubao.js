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
    doubaoAdapters: ()=>doubaoAdapters,
    parseDoubaoRawLocateValue: ()=>parseDoubaoRawLocateValue
});
const json_js_namespaceObject = require("../service-caller/json.js");
const index_js_namespaceObject = require("../shared/model-locate-result/index.js");
const doubaoBboxCoordinatesMeta = {
    shape: 'bbox',
    order: 'xy',
    normalizedBy: 1000
};
const doubaoPointCoordinatesMeta = {
    shape: 'point',
    order: 'xy',
    normalizedBy: 1000
};
const coordinateSequencePattern = /(?:^|[^a-zA-Z0-9])(\d+(?:[^a-zA-Z0-9]+\d+)+)(?=$|[^a-zA-Z0-9])/g;
function isFourFiniteNumberArray(input) {
    return Array.isArray(input) && 4 === input.length && input.every((value)=>'number' == typeof value && Number.isFinite(value));
}
function parseNumbersFromUnexpectedBboxStructure(input) {
    const serialized = JSON.stringify(input);
    if (!serialized) return [];
    const sequences = Array.from(serialized.matchAll(coordinateSequencePattern), (match)=>match[1].match(/\d+/g)?.map(Number) ?? []);
    const longestLength = Math.max(0, ...sequences.map((sequence)=>sequence.length));
    const longestSequences = sequences.filter((sequence)=>sequence.length === longestLength);
    if (1 !== longestSequences.length) return [];
    return longestSequences[0];
}
function parseDoubaoRawLocateValue(input) {
    const bbox = (0, index_js_namespaceObject.unwrapCoordinateListLikeInput)(input);
    const bboxList = isFourFiniteNumberArray(bbox) ? bbox : parseNumbersFromUnexpectedBboxStructure(bbox);
    if (4 === bboxList.length || 5 === bboxList.length) return (0, index_js_namespaceObject.createLocateResultValue)(doubaoBboxCoordinatesMeta, [
        bboxList[0],
        bboxList[1],
        bboxList[2],
        bboxList[3]
    ]);
    if (6 === bboxList.length || 2 === bboxList.length || 3 === bboxList.length || 7 === bboxList.length) return (0, index_js_namespaceObject.createLocateResultValue)(doubaoPointCoordinatesMeta, [
        bboxList[0],
        bboxList[1]
    ]);
    if (8 === bboxList.length) return (0, index_js_namespaceObject.createLocateResultValue)(doubaoBboxCoordinatesMeta, [
        bboxList[0],
        bboxList[1],
        bboxList[4],
        bboxList[5]
    ]);
    const msg = `invalid bbox data for doubao-vision mode: ${JSON.stringify(bbox)} `;
    throw new Error(msg);
}
const buildDoubaoChatCompletionParams = (input)=>{
    const { midsceneDefaults, userConfig } = input;
    const { reasoningEnabled, reasoningEffort } = userConfig;
    const commonOverrideConfig = {};
    if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
    if ('none' !== userConfig.responseFormat && input.expectedJsonObjectResponse) commonOverrideConfig.response_format = {
        type: 'json_object'
    };
    const modelSpecificConfig = {};
    if ('default' !== reasoningEnabled) {
        modelSpecificConfig.thinking = {
            type: reasoningEnabled ?? false ? 'enabled' : 'disabled'
        };
        if (reasoningEffort) modelSpecificConfig.reasoning_effort = reasoningEffort;
    }
    return {
        config: {
            ...midsceneDefaults,
            ...commonOverrideConfig,
            ...modelSpecificConfig
        }
    };
};
const doubaoVisionAdapter = {
    jsonParser: json_js_namespaceObject.parseModelResponseJson,
    chatCompletion: {
        unsupportedUserConfig: [
            'reasoningBudget'
        ],
        buildChatCompletionParams: buildDoubaoChatCompletionParams,
        useReasoningAsContentFallback: true
    },
    locate: {
        resultAdapter: {
            coordinates: doubaoBboxCoordinatesMeta,
            parseRawLocateValue: parseDoubaoRawLocateValue
        }
    }
};
const doubaoAdapters = {
    'doubao-vision': doubaoVisionAdapter,
    'doubao-seed': doubaoVisionAdapter
};
exports.doubaoAdapters = __webpack_exports__.doubaoAdapters;
exports.parseDoubaoRawLocateValue = __webpack_exports__.parseDoubaoRawLocateValue;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "doubaoAdapters",
    "parseDoubaoRawLocateValue"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=doubao.js.map