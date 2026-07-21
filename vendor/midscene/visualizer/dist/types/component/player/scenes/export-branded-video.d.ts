import type { Rect } from '@midscene/core';
import type { FrameMap } from './frame-calculator';
interface ExportOverlayViewport {
    offsetX: number;
    offsetY: number;
    contentWidth: number;
    contentHeight: number;
    imageWidth: number;
    imageHeight: number;
}
export declare function isExportRenderStalled(elapsedSinceLastFrameMs: number, frameDurationMs: number): boolean;
export declare function resolveExportCamera(prevCamera: {
    left: number;
    top: number;
    width: number;
}, camera: {
    left: number;
    top: number;
    width: number;
}, imageWidth: number, progress: number, autoZoom: boolean): {
    camLeft: number;
    camTop: number;
    camWidth: number;
};
export declare function projectNativeRectToExportViewport(rect: Rect, cameraTransform: {
    zoom: number;
    tx: number;
    ty: number;
}, viewport: ExportOverlayViewport): Rect;
export declare function exportBrandedVideo(frameMap: FrameMap, options?: {
    autoZoom?: boolean;
}, onProgress?: (pct: number) => void): Promise<void>;
export {};
