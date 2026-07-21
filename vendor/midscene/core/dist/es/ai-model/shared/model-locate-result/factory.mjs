import { finalizePixelBbox, finalizeSectionLocatePixelBboxGroup } from "./bbox.mjs";
import { parseNumericLocateResult } from "./parse.mjs";
import { mapLocateResultToPixelBboxByCoordinates } from "./pixel-bbox-mapper.mjs";
import { createLocateResultPromptSpec } from "./prompt-spec.mjs";
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
    const parseRawLocateValue = config.parseRawLocateValue ?? ((input)=>parseNumericLocateResult(resolvedCoordinates, input));
    const mapLocateResultToPixelBbox = config.mapLocateResultToPixelBbox ?? ((result, ctx)=>mapLocateResultToPixelBboxByCoordinates(result, ctx));
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
        promptSpec: createLocateResultPromptSpec(resolvedCoordinates),
        adaptElementLocateResultToPixelBbox,
        adaptSectionLocateResultToPixelBboxGroup,
        adaptPlanningParamToPixelBbox
    };
}
function createLocateResultAdapter(config) {
    const adapter = 'custom' === config.kind ? config : createStandardLocateResultAdapterImplementation(config);
    return {
        promptSpec: adapter.promptSpec,
        adaptElementLocateResultToPixelBbox: (input, ctx)=>finalizePixelBbox(adapter.adaptElementLocateResultToPixelBbox(input, ctx), input, ctx),
        adaptSectionLocateResultToPixelBboxGroup: (input, ctx)=>finalizeSectionLocatePixelBboxGroup(adapter.adaptSectionLocateResultToPixelBboxGroup(input, ctx), input, ctx),
        adaptPlanningParamToPixelBbox: (input, ctx)=>finalizePixelBbox(adapter.adaptPlanningParamToPixelBbox(input, ctx), input, ctx)
    };
}
export { createLocateResultAdapter, resolveLocateResultCoordinates };

//# sourceMappingURL=factory.mjs.map