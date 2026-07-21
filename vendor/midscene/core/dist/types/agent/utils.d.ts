import type { TMultimodalPrompt, TUserPrompt } from '../common';
import type { AbstractInterface } from '../device';
import type { ElementCacheFeature, LocateResultElement, PixelBbox, PlanningLocateParam, PlanningLocateParamWithLocatedPixelBbox, Rect, ScrollParam, Size, UIContext } from '../types';
import type { TaskCache } from './task-cache';
export declare const normalizeScrollType: (scrollType: string | undefined) => ScrollParam["scrollType"] | undefined;
export declare function commonContextParser(interfaceInstance: AbstractInterface, _opt: {
    uploadServerUrl?: string;
    screenshotShrinkFactor?: number;
}): Promise<UIContext>;
export declare function createScreenshotBoundUIContext(screenshotBase64: string, opt: {
    screenshotSize?: Size;
}): Promise<UIContext>;
export declare function getReportFileName(tag?: string): string;
export declare function printReportMsg(filepath: string): void;
type NormalizeFilePathsOptions = {
    fileExists?: (path: string) => boolean;
    isInBrowser?: boolean;
    resolvePath?: (path: string) => string;
    wslDistroName?: string;
    cwd?: string;
};
export declare function normalizeFilePaths(files: string[], options?: NormalizeFilePathsOptions): string[];
export declare function isPixelBbox(value: unknown): value is PixelBbox;
type PlanningLocateParamWithMaybeLocatedPixelBbox = PlanningLocateParam & {
    locatedPixelBbox?: unknown;
};
export declare function ifPlanLocateParamHasLocatedPixelBbox(planLocateParam: PlanningLocateParamWithMaybeLocatedPixelBbox): planLocateParam is PlanningLocateParamWithLocatedPixelBbox;
export declare function matchElementFromPlan(planLocateParam: PlanningLocateParamWithLocatedPixelBbox): LocateResultElement | undefined;
export declare function matchElementFromCache(context: {
    taskCache?: TaskCache;
    interfaceInstance: AbstractInterface;
}, cacheEntry: ElementCacheFeature | undefined, cachePrompt: TUserPrompt, cacheable: boolean | undefined): Promise<LocateResultElement | undefined>;
export declare const getMidsceneVersion: () => string;
export declare const parsePrompt: (prompt: TUserPrompt) => {
    textPrompt: string;
    multimodalPrompt?: TMultimodalPrompt;
};
export declare const transformLogicalElementToScreenshot: (element: LocateResultElement, shrunkShotToLogicalRatio: number) => LocateResultElement;
export declare const transformLogicalRectToScreenshotRect: (rect: Rect, shrunkShotToLogicalRatio: number) => Rect;
export {};
