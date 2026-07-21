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
    uiTarsAdapters: ()=>uiTarsAdapters
});
const env_namespaceObject = require("@midscene/shared/env");
const utils_namespaceObject = require("@midscene/shared/utils");
const json_js_namespaceObject = require("../../service-caller/json.js");
const index_js_namespaceObject = require("../../shared/model-locate-result/index.js");
const external_planning_js_namespaceObject = require("./planning.js");
const defaultVlmUiTarsReplanningCycleLimit = 40;
const uiTarsBboxCoordinatesMeta = {
    shape: 'bbox',
    order: 'xy',
    normalizedBy: 1000
};
const uiTarsPointCoordinatesMeta = {
    shape: 'point',
    order: 'xy',
    normalizedBy: 1000
};
function parseUiTarsRawLocateValue(input) {
    const bbox = (0, index_js_namespaceObject.unwrapCoordinateListLikeInput)(input);
    if ('string' == typeof bbox) {
        (0, utils_namespaceObject.assert)(/^(\d+)\s(\d+)\s(\d+)\s(\d+)$/.test(bbox.trim()), `invalid bbox data string for ui-tars mode: ${bbox}`);
        const splitted = bbox.split(' ');
        if (4 === splitted.length) return (0, index_js_namespaceObject.createLocateResultValue)(uiTarsBboxCoordinatesMeta, [
            Number(splitted[0]),
            Number(splitted[1]),
            Number(splitted[2]),
            Number(splitted[3])
        ]);
        throw new Error(`invalid bbox data string for ui-tars mode: ${bbox}`);
    }
    let bboxList = [];
    if (Array.isArray(bbox) && 'string' == typeof bbox[0]) bbox.forEach((item)=>{
        if ('string' == typeof item && item.includes(',')) {
            const [x, y] = item.split(',');
            bboxList.push(Number(x.trim()), Number(y.trim()));
        } else if ('string' == typeof item && item.includes(' ')) {
            const [x, y] = item.split(' ');
            bboxList.push(Number(x.trim()), Number(y.trim()));
        } else bboxList.push(Number(item));
    });
    else bboxList = bbox;
    if (4 === bboxList.length || 5 === bboxList.length) return (0, index_js_namespaceObject.createLocateResultValue)(uiTarsBboxCoordinatesMeta, [
        bboxList[0],
        bboxList[1],
        bboxList[2],
        bboxList[3]
    ]);
    if (6 === bboxList.length || 2 === bboxList.length || 3 === bboxList.length || 7 === bboxList.length) return (0, index_js_namespaceObject.createLocateResultValue)(uiTarsPointCoordinatesMeta, [
        bboxList[0],
        bboxList[1]
    ]);
    if (8 === bbox.length) return (0, index_js_namespaceObject.createLocateResultValue)(uiTarsBboxCoordinatesMeta, [
        bboxList[0],
        bboxList[1],
        bboxList[4],
        bboxList[5]
    ]);
    const msg = `invalid bbox data for ui-tars mode: ${JSON.stringify(bbox)} `;
    throw new Error(msg);
}
function createUiTarsAdapter(uiTarsModelVersion) {
    return {
        jsonParser: json_js_namespaceObject.parseModelResponseJson,
        chatCompletion: {
            unsupportedUserConfig: [
                'reasoningEnabled',
                'reasoningEffort',
                'reasoningBudget'
            ],
            buildChatCompletionParams: ({ midsceneDefaults, userConfig })=>{
                const commonOverrideConfig = {};
                if (void 0 !== userConfig.temperature) commonOverrideConfig.temperature = userConfig.temperature;
                return {
                    config: {
                        ...midsceneDefaults,
                        ...commonOverrideConfig
                    }
                };
            }
        },
        planning: {
            kind: 'custom',
            cacheEnabled: false,
            defaultReplanningCycleLimit: defaultVlmUiTarsReplanningCycleLimit,
            planner: (0, external_planning_js_namespaceObject.createUiTarsPlanner)(uiTarsModelVersion)
        },
        locate: {
            resultAdapter: {
                coordinates: uiTarsBboxCoordinatesMeta,
                parseRawLocateValue: parseUiTarsRawLocateValue
            }
        }
    };
}
const uiTarsDoubao15Adapter = createUiTarsAdapter(env_namespaceObject.UITarsModelVersion.DOUBAO_1_5_20B);
const uiTarsAdapters = {
    'vlm-ui-tars': createUiTarsAdapter(env_namespaceObject.UITarsModelVersion.V1_0),
    'vlm-ui-tars-doubao': uiTarsDoubao15Adapter,
    'vlm-ui-tars-doubao-1.5': uiTarsDoubao15Adapter
};
exports.uiTarsAdapters = __webpack_exports__.uiTarsAdapters;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "uiTarsAdapters"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=adapter.js.map