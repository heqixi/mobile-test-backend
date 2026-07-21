import type { ModelRuntime } from './ai-model/models';
import type Service from './service';
import type { AgentDescribeElementAtPointResult, LocateOption, LocateValidatorResult, LocatorValidatorOption, Size } from './types';
export type DescribeElementCoordinateSpace = 'screenshot' | 'logical';
export type LocatorVerifyFn = (input: {
    prompt: string;
    expectCenter: [number, number];
    retryCount: number;
    verifyResult: LocateValidatorResult;
}) => LocateValidatorResult | boolean;
export type DescribeElementAtPointOptions = {
    verifyPrompt?: boolean;
    retryLimit?: number;
    deepDescribe?: boolean;
    deepLocate?: boolean;
    locatorVerifyFn?: LocatorVerifyFn;
    screenshotBase64?: string;
    screenshotSize?: Size;
    coordinateSpace?: DescribeElementCoordinateSpace;
    logicalSize?: Size;
    onProgress?: (progress: {
        prompt?: string;
        deepDescribe?: boolean;
        deepLocate?: boolean;
        verifyResult?: LocateValidatorResult;
    }) => void;
} & LocatorValidatorOption;
type ScreenshotBoundContextOptions = {
    screenshotBase64?: string;
    screenshotSize?: Size;
    coordinateSpace?: DescribeElementCoordinateSpace;
    logicalSize?: Size;
};
export type VerifyElementDescriptionAtPointOptions = ScreenshotBoundContextOptions & LocatorValidatorOption;
export type ElementDescriberRuntime = {
    service: Pick<Service, 'describe' | 'locate'>;
    describeModelRuntime: ModelRuntime;
    locateModelRuntime: ModelRuntime;
};
export declare function verifyLocator(runtime: Pick<ElementDescriberRuntime, 'service' | 'locateModelRuntime'>, prompt: string, locateOpt: LocateOption | undefined, expectCenter: [number, number], verifyLocateOption?: LocatorValidatorOption & Pick<LocateOption, 'deepLocate'>): Promise<LocateValidatorResult>;
export declare function describeElementAtPoint(runtime: ElementDescriberRuntime, center: [number, number], opt?: DescribeElementAtPointOptions): Promise<AgentDescribeElementAtPointResult>;
export declare function verifyElementDescriptionAtPoint(runtime: ElementDescriberRuntime, description: string, center: [number, number], opt?: VerifyElementDescriptionAtPointOptions): Promise<LocateValidatorResult>;
export {};
