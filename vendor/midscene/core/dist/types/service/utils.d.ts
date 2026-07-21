import type { AIDescribeElementResponse, PartialServiceDumpFromSDK, Rect, ServiceDump, Size } from '../types';
export declare const DESCRIBE_POINT_MARKER_MAX_SIZE = 40;
export declare const DESCRIBE_RECT_MARKER_BORDER_THICKNESS = 1;
export declare const DESCRIBE_LARGE_RECT_MARKER_BORDER_THICKNESS = 2;
export declare const DESCRIBE_WIDE_MARKER_INSET_MIN_WIDTH = 100;
export declare const DESCRIBE_DEEP_CONTEXT_CONFIG: {
    readonly resize: {
        readonly cropMaxLongEdge: 1000;
        readonly cropUpscaleMaxRatio: 2;
    };
};
export type DescribeDeepContextArea = {
    kind: 'focused';
    rect: Rect;
};
export declare function clampRect(rect: Rect, size: Size): Rect;
export declare function getDescribeDeepContextAreas(rect: Rect, screenSize: Size): DescribeDeepContextArea[];
export declare function getRectInCrop(rect: Rect, cropRect: Rect, cropSize: Size): Rect;
export declare function getDescribeMarkerRect(rect: Rect): Rect;
export declare function getDescribeMarkerBorderThickness(rect: Rect): number;
export declare function getDescribeDeepLocateResizeSize(size: Size): Size | undefined;
export declare function createServiceDump(data: PartialServiceDumpFromSDK): ServiceDump;
export declare function recoverDescribeResponseFromParseError(error: unknown): Pick<AIDescribeElementResponse, 'description'> | undefined;
