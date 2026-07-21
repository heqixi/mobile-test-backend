import type { DetailedLocateParam, ExecutionTask, PullParam, ScrollParam } from '../types';
export declare function typeStr(task: ExecutionTask): any;
export declare function locateParamStr(locate?: DetailedLocateParam | string): string;
export declare function scrollParamStr(scrollParam?: ScrollParam): string;
export declare function pullParamStr(pullParam?: PullParam): string;
export declare function extractInsightParam(taskParam: any): {
    content: string;
    images?: Array<{
        name: string;
        url: string;
    }>;
};
export type TaskTitleType = 'Tap' | 'Hover' | 'Input' | 'RightClick' | 'KeyboardPress' | 'Scroll' | 'Act' | 'Query' | 'Assert' | 'WaitFor' | 'Locate' | 'Markdown' | 'Boolean' | 'Number' | 'String';
export declare function taskTitleStr(type: TaskTitleType, prompt: string): string;
export declare function paramStr(task: ExecutionTask): string;
