import { UITarsModelVersion } from "@midscene/shared/env";
import { assert } from "@midscene/shared/utils";
import { parseModelResponseJson } from "../../service-caller/json.mjs";
import { createLocateResultValue, unwrapCoordinateListLikeInput } from "../../shared/model-locate-result/index.mjs";
import { createUiTarsPlanner } from "./planning.mjs";
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
    const bbox = unwrapCoordinateListLikeInput(input);
    if ('string' == typeof bbox) {
        assert(/^(\d+)\s(\d+)\s(\d+)\s(\d+)$/.test(bbox.trim()), `invalid bbox data string for ui-tars mode: ${bbox}`);
        const splitted = bbox.split(' ');
        if (4 === splitted.length) return createLocateResultValue(uiTarsBboxCoordinatesMeta, [
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
    if (4 === bboxList.length || 5 === bboxList.length) return createLocateResultValue(uiTarsBboxCoordinatesMeta, [
        bboxList[0],
        bboxList[1],
        bboxList[2],
        bboxList[3]
    ]);
    if (6 === bboxList.length || 2 === bboxList.length || 3 === bboxList.length || 7 === bboxList.length) return createLocateResultValue(uiTarsPointCoordinatesMeta, [
        bboxList[0],
        bboxList[1]
    ]);
    if (8 === bbox.length) return createLocateResultValue(uiTarsBboxCoordinatesMeta, [
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
        jsonParser: parseModelResponseJson,
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
            planner: createUiTarsPlanner(uiTarsModelVersion)
        },
        locate: {
            resultAdapter: {
                coordinates: uiTarsBboxCoordinatesMeta,
                parseRawLocateValue: parseUiTarsRawLocateValue
            }
        }
    };
}
const uiTarsDoubao15Adapter = createUiTarsAdapter(UITarsModelVersion.DOUBAO_1_5_20B);
const uiTarsAdapters = {
    'vlm-ui-tars': createUiTarsAdapter(UITarsModelVersion.V1_0),
    'vlm-ui-tars-doubao': uiTarsDoubao15Adapter,
    'vlm-ui-tars-doubao-1.5': uiTarsDoubao15Adapter
};
export { uiTarsAdapters };

//# sourceMappingURL=adapter.mjs.map