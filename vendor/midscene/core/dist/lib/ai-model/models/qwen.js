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
    qwenAdapters: ()=>qwenAdapters
});
const index_js_namespaceObject = require("../shared/model-locate-result/index.js");
const defaultBboxSize = 20;
const qwen25BboxCoordinatesMeta = {
    shape: 'bbox',
    order: 'xy'
};
const qwen25PointCoordinatesMeta = {
    shape: 'point',
    order: 'xy'
};
const qwen3BboxCoordinatesMeta = {
    shape: 'bbox',
    order: 'xy',
    normalizedBy: 1000
};
function topLeftPointToPixelBbox(x, y) {
    return [
        Math.round(x),
        Math.round(y),
        Math.round(x + defaultBboxSize),
        Math.round(y + defaultBboxSize)
    ];
}
function parseQwen25RawLocateValue(input) {
    const bbox = (0, index_js_namespaceObject.unwrapCoordinateListLikeInput)(input);
    if (bbox.length < 2) {
        const msg = `invalid bbox data for qwen-vl mode: ${JSON.stringify(bbox)} `;
        throw new Error(msg);
    }
    if ('number' == typeof bbox[2] && 'number' == typeof bbox[3]) return (0, index_js_namespaceObject.createLocateResultValue)(qwen25BboxCoordinatesMeta, [
        bbox[0],
        bbox[1],
        bbox[2],
        bbox[3]
    ]);
    return (0, index_js_namespaceObject.createLocateResultValue)(qwen25PointCoordinatesMeta, [
        bbox[0],
        bbox[1]
    ]);
}
function normalizeQwen25ResultToPixelBbox(result) {
    if ((0, index_js_namespaceObject.isBboxLocateResultValue)(result)) {
        const { coordinates } = result;
        return [
            Math.round(coordinates[0]),
            Math.round(coordinates[1]),
            Math.round(coordinates[2]),
            Math.round(coordinates[3])
        ];
    }
    const { coordinates } = result;
    return topLeftPointToPixelBbox(coordinates[0], coordinates[1]);
}
const buildQwenChatCompletionParams = (input)=>{
    const { midsceneDefaults, userConfig } = input;
    const { reasoningEnabled, reasoningBudget } = userConfig;
    const commonOverrideConfig = {};
    if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
    const modelSpecificConfig = {};
    if ('default' !== reasoningEnabled) {
        modelSpecificConfig.enable_thinking = reasoningEnabled ?? false;
        if (void 0 !== reasoningBudget) modelSpecificConfig.thinking_budget = reasoningBudget;
    }
    return {
        config: {
            ...midsceneDefaults,
            ...commonOverrideConfig,
            ...modelSpecificConfig
        }
    };
};
const buildQwen25ChatCompletionParams = (input)=>{
    const { midsceneDefaults, userConfig } = input;
    const commonOverrideConfig = {};
    if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
    return {
        config: {
            ...midsceneDefaults,
            ...commonOverrideConfig,
            vl_high_resolution_images: true
        }
    };
};
const qwen3Adapter = {
    chatCompletion: {
        unsupportedUserConfig: [
            'reasoningEffort'
        ],
        buildChatCompletionParams: buildQwenChatCompletionParams,
        messageExtraction: {
            kind: 'default',
            reasoningContentKeys: [
                'reasoning_content',
                'reasoning'
            ]
        },
        useReasoningAsContentFallback: true
    },
    locate: {
        resultAdapter: {
            coordinates: qwen3BboxCoordinatesMeta
        }
    }
};
const qwenAdapters = {
    'qwen2.5-vl': {
        chatCompletion: {
            unsupportedUserConfig: [
                'reasoningEnabled',
                'reasoningEffort',
                'reasoningBudget'
            ],
            buildChatCompletionParams: buildQwen25ChatCompletionParams
        },
        imagePreprocess: {
            padBlockSize: 28
        },
        locate: {
            resultAdapter: {
                coordinates: qwen25BboxCoordinatesMeta,
                parseRawLocateValue: parseQwen25RawLocateValue,
                mapLocateResultToPixelBbox: normalizeQwen25ResultToPixelBbox
            }
        }
    },
    'qwen3-vl': qwen3Adapter,
    qwen3: qwen3Adapter,
    'qwen3.5': qwen3Adapter,
    'qwen3.6': qwen3Adapter
};
exports.qwenAdapters = __webpack_exports__.qwenAdapters;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "qwenAdapters"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=qwen.js.map