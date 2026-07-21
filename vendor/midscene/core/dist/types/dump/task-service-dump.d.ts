import type { ExecutionTask, Rect, ServiceDump } from '../types';
export declare function getTaskServiceDump(task?: ExecutionTask | null): ServiceDump | null;
export declare function getTaskSearchArea(task?: ExecutionTask | null): Rect | undefined;
