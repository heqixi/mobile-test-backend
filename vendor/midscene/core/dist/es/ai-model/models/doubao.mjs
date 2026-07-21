import { parseModelResponseJson } from "../service-caller/json.mjs";
import { createLocateResultValue, unwrapCoordinateListLikeInput } from "../shared/model-locate-result/index.mjs";
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
    const bbox = unwrapCoordinateListLikeInput(input);
    const bboxList = isFourFiniteNumberArray(bbox) ? bbox : parseNumbersFromUnexpectedBboxStructure(bbox);
    if (4 === bboxList.length || 5 === bboxList.length) return createLocateResultValue(doubaoBboxCoordinatesMeta, [
        bboxList[0],
        bboxList[1],
        bboxList[2],
        bboxList[3]
    ]);
    if (6 === bboxList.length || 2 === bboxList.length || 3 === bboxList.length || 7 === bboxList.length) return createLocateResultValue(doubaoPointCoordinatesMeta, [
        bboxList[0],
        bboxList[1]
    ]);
    if (8 === bboxList.length) return createLocateResultValue(doubaoBboxCoordinatesMeta, [
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
    jsonParser: parseModelResponseJson,
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
export { doubaoAdapters, parseDoubaoRawLocateValue };

//# sourceMappingURL=doubao.mjs.map