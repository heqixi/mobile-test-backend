function mergePixelBboxesToRect(pixelBboxes) {
    const minLeft = Math.min(...pixelBboxes.map(([left])=>left));
    const minTop = Math.min(...pixelBboxes.map(([, top])=>top));
    const maxRight = Math.max(...pixelBboxes.map(([, , right])=>right));
    const maxBottom = Math.max(...pixelBboxes.map(([, , , bottom])=>bottom));
    return pixelBboxToRect([
        minLeft,
        minTop,
        maxRight,
        maxBottom
    ]);
}
function pixelBboxToRect([left, top, right, bottom]) {
    return {
        left,
        top,
        width: right - left + 1,
        height: bottom - top + 1
    };
}
export { mergePixelBboxesToRect, pixelBboxToRect };

//# sourceMappingURL=locate-result-rect.mjs.map