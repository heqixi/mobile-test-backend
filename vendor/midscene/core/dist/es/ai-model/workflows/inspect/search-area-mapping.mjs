function mapSearchAreaPixelBboxToOriginalPixelBbox([left, top, right, bottom], mapping) {
    const offset = mapping?.offset ?? {
        x: 0,
        y: 0
    };
    const scale = mapping?.scale ?? 1;
    const mapX = (x)=>(1 !== scale ? Math.round(x / scale) : x) + offset.x;
    const mapY = (y)=>(1 !== scale ? Math.round(y / scale) : y) + offset.y;
    return [
        mapX(left),
        mapY(top),
        mapX(right),
        mapY(bottom)
    ];
}
export { mapSearchAreaPixelBboxToOriginalPixelBbox };

//# sourceMappingURL=search-area-mapping.mjs.map