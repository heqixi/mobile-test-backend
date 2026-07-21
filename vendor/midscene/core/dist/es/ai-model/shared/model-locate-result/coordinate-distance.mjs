function createCoordinateDistanceToPixels(size, coordinateSystem) {
    return (delta, axis)=>{
        if (void 0 === coordinateSystem.normalizedBy) return Math.round(Math.abs(delta));
        const length = 'x' === axis ? size.width : size.height;
        return Math.round(Math.abs(delta) * length / coordinateSystem.normalizedBy);
    };
}
export { createCoordinateDistanceToPixels };

//# sourceMappingURL=coordinate-distance.mjs.map