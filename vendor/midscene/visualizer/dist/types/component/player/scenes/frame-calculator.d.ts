import type { LocateResultElement, Rect } from '@midscene/core';
import type { AnimationScript } from '../../../utils/replay-scripts';
export declare const FPS = 30;
export interface ScriptFrame {
    type: 'img' | 'insight' | 'clear-insight' | 'pointer' | 'spinning-pointer' | 'sleep';
    startFrame: number;
    durationInFrames: number;
    img?: string;
    imageWidth?: number;
    imageHeight?: number;
    cameraTarget?: {
        left: number;
        top: number;
        width: number;
        pointerLeft: number;
        pointerTop: number;
    };
    insightPhaseFrames?: number;
    cameraPhaseFrames?: number;
    highlightElement?: LocateResultElement;
    searchArea?: Rect;
    pointerImg?: string;
    title?: string;
    subTitle?: string;
    taskId?: string;
}
export interface FrameMap {
    scriptFrames: ScriptFrame[];
    totalDurationInFrames: number;
    fps: number;
    stepsDurationInFrames: number;
    imageWidth: number;
    imageHeight: number;
}
interface CalculateFrameMapOptions {
    imageWidth?: number;
    imageHeight?: number;
}
export declare function calculateFrameMap(scripts: AnimationScript[], options?: CalculateFrameMapOptions): FrameMap;
export {};
