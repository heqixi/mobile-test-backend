import { createLocateResultValue, isBboxLocateResultValue, unwrapCoordinateListLikeInput } from "../shared/model-locate-result/index.mjs";
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
    const bbox = unwrapCoordinateListLikeInput(input);
    if (bbox.length < 2) {
        const msg = `invalid bbox data for qwen-vl mode: ${JSON.stringify(bbox)} `;
        throw new Error(msg);
    }
    if ('number' == typeof bbox[2] && 'number' == typeof bbox[3]) return createLocateResultValue(qwen25BboxCoordinatesMeta, [
        bbox[0],
        bbox[1],
        bbox[2],
        bbox[3]
    ]);
    return createLocateResultValue(qwen25PointCoordinatesMeta, [
        bbox[0],
        bbox[1]
    ]);
}
function normalizeQwen25ResultToPixelBbox(result) {
    if (isBboxLocateResultValue(result)) {
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
export { qwenAdapters };

//# sourceMappingURL=qwen.mjs.map