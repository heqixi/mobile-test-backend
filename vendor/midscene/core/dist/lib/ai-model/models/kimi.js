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
    kimiAdapters: ()=>kimiAdapters
});
const index_js_namespaceObject = require("../shared/model-locate-result/index.js");
const kimiNormalizedPointCoordinatesMeta = {
    shape: 'point',
    order: 'xy',
    normalizedBy: 1
};
const kimiPixelPointCoordinatesMeta = {
    shape: 'point',
    order: 'xy'
};
function parseKimiRawLocateValue(input) {
    const point = (0, index_js_namespaceObject.parseCoordinateList)(input, 'point');
    if (point.length < 2) throw new Error(`invalid point data: ${JSON.stringify(input)} `);
    const [x, y] = point;
    const coordinatesMeta = x <= 1 && y <= 1 ? kimiNormalizedPointCoordinatesMeta : kimiPixelPointCoordinatesMeta;
    return (0, index_js_namespaceObject.createLocateResultValue)(coordinatesMeta, [
        x,
        y
    ]);
}
const buildKimiChatCompletionParams = (input)=>{
    const { midsceneDefaults, userConfig } = input;
    const { reasoningEnabled } = userConfig;
    const effectiveReasoningEnabled = reasoningEnabled ?? false;
    const commonOverrideConfig = {};
    commonOverrideConfig.temperature = void 0;
    if ('none' !== userConfig.responseFormat && input.expectedJsonObjectResponse) commonOverrideConfig.response_format = {
        type: 'json_object'
    };
    const modelSpecificConfig = {
        thinking: {
            type: effectiveReasoningEnabled ? 'enabled' : 'disabled'
        }
    };
    return {
        config: {
            ...midsceneDefaults,
            ...commonOverrideConfig,
            ...modelSpecificConfig
        }
    };
};
const kimiAdapters = {
    kimi: {
        chatCompletion: {
            unsupportedUserConfig: [
                'reasoningEffort',
                'reasoningBudget'
            ],
            buildChatCompletionParams: buildKimiChatCompletionParams,
            useReasoningAsContentFallback: true
        },
        locate: {
            resultAdapter: {
                coordinates: kimiNormalizedPointCoordinatesMeta,
                parseRawLocateValue: parseKimiRawLocateValue
            }
        }
    }
};
exports.kimiAdapters = __webpack_exports__.kimiAdapters;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "kimiAdapters"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=kimi.js.map