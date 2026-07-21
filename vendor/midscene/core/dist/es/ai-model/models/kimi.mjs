import { createLocateResultValue, parseCoordinateList } from "../shared/model-locate-result/index.mjs";
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
    const point = parseCoordinateList(input, 'point');
    if (point.length < 2) throw new Error(`invalid point data: ${JSON.stringify(input)} `);
    const [x, y] = point;
    const coordinatesMeta = x <= 1 && y <= 1 ? kimiNormalizedPointCoordinatesMeta : kimiPixelPointCoordinatesMeta;
    return createLocateResultValue(coordinatesMeta, [
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
export { kimiAdapters };

//# sourceMappingURL=kimi.mjs.map