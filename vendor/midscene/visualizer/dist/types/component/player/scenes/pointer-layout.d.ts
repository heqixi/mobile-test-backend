export declare const POINTER_WIDTH = 44;
export declare const POINTER_HEIGHT = 56;
export declare const POINTER_HOTSPOT_X = 6;
export declare const POINTER_HOTSPOT_Y = 4;
export interface PointerLayout {
    scale: number;
    width: number;
    height: number;
    hotspotX: number;
    hotspotY: number;
    centerOffsetX: number;
    centerOffsetY: number;
}
export interface SpinnerLayout {
    size: number;
    centerOffset: number;
}
export declare function resolvePointerLayout(imageWidth: number): PointerLayout;
export declare function resolveExportPointerLayout(imageWidth: number, contentWidth: number): PointerLayout;
export declare function resolveSpinnerLayout(pointerLayout: PointerLayout): SpinnerLayout;
