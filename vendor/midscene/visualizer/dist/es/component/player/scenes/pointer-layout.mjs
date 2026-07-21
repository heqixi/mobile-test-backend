const POINTER_REFERENCE_IMAGE_WIDTH = 1920;
const POINTER_WIDTH = 44;
const POINTER_HEIGHT = 56;
const POINTER_HOTSPOT_X = 6;
const POINTER_HOTSPOT_Y = 4;
function assertPositiveFinite(value, name) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive finite number`);
}
function buildPointerLayout(scale) {
    return {
        scale,
        width: POINTER_WIDTH * scale,
        height: POINTER_HEIGHT * scale,
        hotspotX: POINTER_HOTSPOT_X * scale,
        hotspotY: POINTER_HOTSPOT_Y * scale,
        centerOffsetX: POINTER_WIDTH * scale / 2,
        centerOffsetY: POINTER_HEIGHT * scale / 2
    };
}
function resolvePointerLayout(imageWidth) {
    assertPositiveFinite(imageWidth, 'imageWidth');
    return buildPointerLayout(Math.max(1, Math.sqrt(imageWidth / POINTER_REFERENCE_IMAGE_WIDTH)));
}
function resolveExportPointerLayout(imageWidth, contentWidth) {
    assertPositiveFinite(contentWidth, 'contentWidth');
    const liveLayout = resolvePointerLayout(imageWidth);
    return buildPointerLayout(liveLayout.scale * (contentWidth / imageWidth));
}
function resolveSpinnerLayout(pointerLayout) {
    const size = pointerLayout.height;
    return {
        size,
        centerOffset: size / 2
    };
}
export { POINTER_HEIGHT, POINTER_HOTSPOT_X, POINTER_HOTSPOT_Y, POINTER_WIDTH, resolveExportPointerLayout, resolvePointerLayout, resolveSpinnerLayout };
