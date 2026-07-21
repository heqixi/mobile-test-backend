/**
 * Shared frame state derivation from ScriptFrame timeline.
 * Used by both Remotion preview (StepScene.tsx) and Canvas export (export-branded-video.ts).
 */
import type { ScriptFrame } from './frame-calculator';
export interface CameraState {
    left: number;
    top: number;
    width: number;
    pointerLeft: number;
    pointerTop: number;
}
export interface InsightOverlay {
    highlightElement?: ScriptFrame['highlightElement'];
    searchArea?: ScriptFrame['searchArea'];
    alpha: number;
}
export interface FrameState {
    img: string;
    imageWidth: number;
    imageHeight: number;
    prevImg: string | null;
    camera: CameraState;
    prevCamera: CameraState;
    insights: InsightOverlay[];
    spinning: boolean;
    spinningElapsedMs: number;
    currentPointerImg: string;
    pointerVisible: boolean;
    title: string;
    subTitle: string;
    taskId: string | undefined;
    frameInScript: number;
    scriptIndex: number;
    imageChanged: boolean;
    pointerMoved: boolean;
    rawProgress: number;
}
export declare function shouldRenderCursor(pointerVisible: boolean, camera: CameraState, prevCamera: CameraState, imageWidth: number, imageHeight: number): boolean;
export declare function deriveFrameState(scriptFrames: ScriptFrame[], frame: number, baseW: number, baseH: number, fps: number): FrameState;
