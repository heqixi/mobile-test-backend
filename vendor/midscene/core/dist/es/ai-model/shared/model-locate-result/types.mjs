function isBboxLocateResultValue(result) {
    return 'bbox' === result.coordinatesMeta.shape;
}
function isPointLocateResultValue(result) {
    return 'point' === result.coordinatesMeta.shape;
}
export { isBboxLocateResultValue, isPointLocateResultValue };

//# sourceMappingURL=types.mjs.map