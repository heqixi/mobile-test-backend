function unwrapCoordinateListLikeInput(coordinateList) {
    if (Array.isArray(coordinateList)) {
        if (Array.isArray(coordinateList[0])) return coordinateList[0];
    }
    return coordinateList;
}
function parseCoordinateList(input, label) {
    const unwrapped = unwrapCoordinateListLikeInput(input);
    const values = 'string' == typeof unwrapped ? unwrapped.trim().split(/[\s,]+/).filter(Boolean) : unwrapped;
    if (!Array.isArray(values)) throw new Error(`invalid ${label} data: ${JSON.stringify(input)} `);
    const numericValues = values.map((value)=>'number' == typeof value ? value : Number(value));
    if (!numericValues.every((value)=>Number.isFinite(value))) throw new Error(`invalid ${label} data: ${JSON.stringify(input)} `);
    return numericValues;
}
function createLocateResultValue(coordinatesMeta, coordinates) {
    if ('point' === coordinatesMeta.shape) return {
        coordinates: [
            coordinates[0],
            coordinates[1]
        ],
        coordinatesMeta
    };
    return {
        coordinates: [
            coordinates[0],
            coordinates[1],
            coordinates[2],
            coordinates[3]
        ],
        coordinatesMeta
    };
}
function parseNumericLocateResult(resolvedCoordinates, input) {
    if ('point' === resolvedCoordinates.shape) {
        const point = parseCoordinateList(input, 'point');
        if (point.length < 2) throw new Error(`invalid point data: ${JSON.stringify(input)} `);
        return createLocateResultValue(resolvedCoordinates, point);
    }
    const bbox = parseCoordinateList(input, 'bbox');
    if (4 !== bbox.length) throw new Error(`invalid bbox data: ${JSON.stringify(input)} `);
    return createLocateResultValue(resolvedCoordinates, bbox);
}
export { createLocateResultValue, parseCoordinateList, parseNumericLocateResult, unwrapCoordinateListLikeInput };

//# sourceMappingURL=parse.mjs.map