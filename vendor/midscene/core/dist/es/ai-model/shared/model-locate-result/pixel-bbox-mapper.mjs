import { expandPointToBbox, mapNormalizedCoordinatesToPixelBbox, maxPixelIndex } from "./bbox.mjs";
const defaultBboxSize = 20;
function resolveCoordinateLimits(result, width, height) {
    const resolvedCoordinates = result.coordinatesMeta;
    const normalizedBy = resolvedCoordinates.normalizedBy;
    if (void 0 !== normalizedBy) return result.coordinates.map(()=>normalizedBy);
    if ('bbox' === resolvedCoordinates.shape) return 'yx' === resolvedCoordinates.order ? [
        height,
        width,
        height,
        width
    ] : [
        width,
        height,
        width,
        height
    ];
    return 'yx' === resolvedCoordinates.order ? [
        height,
        width
    ] : [
        width,
        height
    ];
}
function assertLocateResultCoordinates(result, width, height) {
    const resolvedCoordinates = result.coordinatesMeta;
    const normalizedBy = resolvedCoordinates.normalizedBy;
    const limits = resolveCoordinateLimits(result, width, height);
    const outOfRange = result.coordinates.some((value, index)=>{
        const limit = limits[index];
        return 'number' != typeof value || !Number.isFinite(value) || value < 0 || value > limit;
    });
    if (!outOfRange) return;
    const source = void 0 !== normalizedBy ? `normalized range [0, ${normalizedBy}]` : `image size [0, ${width}]x[0, ${height}]`;
    const normalizedInfo = void 0 !== normalizedBy ? ` normalizedBy=${normalizedBy}` : '';
    throw new Error(`locate result coordinates ${JSON.stringify(result.coordinates)} exceed ${source}. shape=${resolvedCoordinates.shape} order=${resolvedCoordinates.order}${normalizedInfo} limits=${JSON.stringify(limits)}`);
}
function reorderCoordinatesToXy(coordinates, order) {
    if ('yx' !== order) return coordinates;
    if (4 === coordinates.length) {
        const [top, left, bottom, right] = coordinates;
        return [
            left,
            top,
            right,
            bottom
        ];
    }
    const [y, x] = coordinates;
    return [
        x,
        y
    ];
}
function mapLocateResultToPixelBboxByCoordinates(result, { preparedSize }) {
    const { width, height } = preparedSize;
    const resolvedCoordinates = result.coordinatesMeta;
    const normalizedBy = resolvedCoordinates.normalizedBy;
    assertLocateResultCoordinates(result, width, height);
    const xyCoordinates = reorderCoordinatesToXy(result.coordinates, resolvedCoordinates.order);
    const xyBbox = 4 === xyCoordinates.length ? xyCoordinates : expandPointToBbox(xyCoordinates[0], xyCoordinates[1], normalizedBy ?? maxPixelIndex(width), normalizedBy ?? maxPixelIndex(height), void 0 === normalizedBy ? defaultBboxSize / 2 : normalizedBy / 100);
    return void 0 === normalizedBy ? xyBbox : mapNormalizedCoordinatesToPixelBbox(xyBbox, normalizedBy, width, height);
}
export { mapLocateResultToPixelBboxByCoordinates };

//# sourceMappingURL=pixel-bbox-mapper.mjs.map