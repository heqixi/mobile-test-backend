function maxPixelIndex(size) {
    return Math.max(size - 1, 0);
}
function normalizedCoordinateToPixelIndex(value, normalizedBy, size) {
    return Math.round(value * maxPixelIndex(size) / normalizedBy);
}
function mapNormalizedCoordinatesToPixelBbox(coordinates, normalizedBy, width, height) {
    const [left, top, right, bottom] = coordinates;
    return [
        normalizedCoordinateToPixelIndex(left, normalizedBy, width),
        normalizedCoordinateToPixelIndex(top, normalizedBy, height),
        normalizedCoordinateToPixelIndex(right, normalizedBy, width),
        normalizedCoordinateToPixelIndex(bottom, normalizedBy, height)
    ];
}
function expandPointToBbox(x, y, maxX, maxY, halfSize) {
    return [
        Math.max(0, x - halfSize),
        Math.max(0, y - halfSize),
        Math.min(maxX, x + halfSize),
        Math.min(maxY, y + halfSize)
    ];
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function assertFinitePixelBbox(pixelBbox, rawResult) {
    if (4 !== pixelBbox.length || !pixelBbox.every((value)=>'number' == typeof value && Number.isFinite(value))) throw new Error(`invalid locate bbox data: ${JSON.stringify(rawResult)} `);
}
function assertPixelBboxOrder(pixelBbox, rawResult) {
    const [left, top, right, bottom] = pixelBbox;
    if (right >= left && bottom >= top) return;
    throw new Error(`locate pixel bbox has invalid coordinate order: bbox=${JSON.stringify(rawResult)} pixelBbox=${JSON.stringify(pixelBbox)}`);
}
function assertPixelBboxInsideImage(pixelBbox, rawResult, width, height) {
    const [left, top, right, bottom] = pixelBbox;
    const maxRight = maxPixelIndex(width);
    const maxBottom = maxPixelIndex(height);
    const outOfImage = left < 0 || top < 0 || right > maxRight || bottom > maxBottom;
    if (!outOfImage) return;
    throw new Error(`locate pixel bbox is outside the image size: bbox=${JSON.stringify(rawResult)} imageSize=${width}x${height}`);
}
function finalizePixelBbox(pixelBbox, rawResult, { preparedSize, contentSize }) {
    const { width, height } = preparedSize;
    assertFinitePixelBbox(pixelBbox, rawResult);
    assertPixelBboxOrder(pixelBbox, rawResult);
    assertPixelBboxInsideImage(pixelBbox, rawResult, width, height);
    const rightLimit = maxPixelIndex(contentSize?.width ?? width);
    const bottomLimit = maxPixelIndex(contentSize?.height ?? height);
    const [left, top, right, bottom] = pixelBbox;
    return [
        clamp(left, 0, rightLimit),
        clamp(top, 0, bottomLimit),
        clamp(right, 0, rightLimit),
        clamp(bottom, 0, bottomLimit)
    ];
}
function finalizeSectionLocatePixelBboxGroup(result, rawResult, ctx) {
    return {
        target: finalizePixelBbox(result.target, rawResult, ctx),
        ...result.references ? {
            references: result.references.map((reference)=>finalizePixelBbox(reference, rawResult, ctx))
        } : {}
    };
}
export { expandPointToBbox, finalizePixelBbox, finalizeSectionLocatePixelBboxGroup, mapNormalizedCoordinatesToPixelBbox, maxPixelIndex, normalizedCoordinateToPixelIndex };

//# sourceMappingURL=bbox.mjs.map