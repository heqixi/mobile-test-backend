import type { ExecutionDump, ExecutionTask, IExecutionDump, IReportActionDump, LocateResultElement, ModelBrief, Rect, ReportActionDump, UIContext } from '@midscene/core';
export interface CameraState {
    left: number;
    top: number;
    width: number;
    pointerLeft: number;
    pointerTop: number;
}
export type TargetCameraState = Omit<CameraState, 'pointerLeft' | 'pointerTop'> & Partial<Pick<CameraState, 'pointerLeft' | 'pointerTop'>>;
export interface AnimationScript {
    type: 'img' | 'insight' | 'clear-insight' | 'pointer' | 'spinning-pointer' | 'sleep';
    img?: string;
    camera?: TargetCameraState;
    context?: UIContext;
    highlightElement?: LocateResultElement;
    searchArea?: Rect;
    duration: number;
    insightCameraDuration?: number;
    title?: string;
    subTitle?: string;
    imageWidth?: number;
    imageHeight?: number;
    taskId?: string;
}
export declare const cameraStateForRect: (rect: Rect, imageWidth: number, imageHeight: number) => TargetCameraState;
export declare const mergeTwoCameraState: (cameraState1: TargetCameraState, cameraState2: TargetCameraState) => TargetCameraState;
export interface ReplayScriptsInfo {
    scripts: AnimationScript[];
    width?: number;
    height?: number;
    sdkVersion?: string;
    modelBriefs: ModelBrief[];
    deviceType?: string;
}
type DumpInput = ReportActionDump | IReportActionDump | ExecutionDump | null | undefined;
export interface DumpMetaInfo {
    width: number;
    height: number;
    sdkVersion?: string;
    modelBriefs: ModelBrief[];
    deviceType?: string;
}
/**
 * Extract lightweight metadata from dump without reading any .base64 fields.
 * Used to set up the UI (dimensions, version, model info) before replay.
 */
export declare const extractDumpMetaInfo: (dump: DumpInput) => DumpMetaInfo | null;
export declare const allScriptsFromDump: (dump: DumpInput) => ReplayScriptsInfo | null;
export declare const generateAnimationScripts: (execution: ExecutionDump | IExecutionDump | null, task: ExecutionTask | number, imageWidth: number, imageHeight: number, executionIndex?: number) => AnimationScript[] | null;
export {};
