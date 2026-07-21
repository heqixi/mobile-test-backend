import type { ModelRuntime } from '../ai-model/models';
import type { AIDescribeElementResponse, LocateResultElement, LocateResultWithDump, PlanningLocateParam, Rect, ServiceExtractOption, ServiceExtractParam, ServiceExtractResult, ServiceTaskInfo, UIContext } from '../types';
import type { TMultimodalPrompt } from '../common';
export interface LocateOpts {
    context?: UIContext;
    planLocatedElement?: LocateResultElement;
}
export type AnyValue<T> = {
    [K in keyof T]: unknown extends T[K] ? any : T[K];
};
interface ServiceOptions {
    taskInfo?: Omit<ServiceTaskInfo, 'durationMs'>;
}
export default class Service {
    contextRetrieverFn: () => Promise<UIContext> | UIContext;
    taskInfo?: Omit<ServiceTaskInfo, 'durationMs'>;
    constructor(context: UIContext | (() => Promise<UIContext> | UIContext), opt?: ServiceOptions);
    locate(query: PlanningLocateParam, opt: LocateOpts, modelRuntime: ModelRuntime, abortSignal?: AbortSignal): Promise<LocateResultWithDump>;
    private resolveLocateSearchArea;
    extract<T>(dataDemand: ServiceExtractParam, modelRuntime: ModelRuntime, opt?: ServiceExtractOption, pageDescription?: string, multimodalPrompt?: TMultimodalPrompt, context?: UIContext, executionOptions?: {
        abortSignal?: AbortSignal;
    }): Promise<ServiceExtractResult<T>>;
    describe(target: Rect | [number, number], modelRuntime: ModelRuntime, opt?: {
        deepDescribe?: boolean;
        context?: UIContext;
    }): Promise<Pick<AIDescribeElementResponse, 'description'>>;
}
export {};
