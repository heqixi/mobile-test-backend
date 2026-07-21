import { ExecutionDump, type ExecutionTask, type ExecutionTaskApply, type ExecutionTaskProgressOptions, type UIContext } from './types';
/**
 * A native, per-task lifecycle notification. The runner is the single source
 * of truth for when a task actually transitions, so it reports each transition
 * exactly once with the task that changed. Consumers no longer have to re-scan
 * the task list and diff it against remembered keys to reconstruct this stream.
 */
export type TaskRunnerEventKind = 'append' | 'start' | 'finish' | 'error' | 'cancel';
export interface TaskRunnerEvent {
    kind: TaskRunnerEventKind;
    task: ExecutionTask;
    runner: TaskRunner;
}
export type TaskRunnerEventListener = (event: TaskRunnerEvent) => Promise<void> | void;
type TaskRunnerInitOptions = ExecutionTaskProgressOptions & {
    tasks?: ExecutionTaskApply[];
    /**
     * Coarse "the execution snapshot changed" signal. Fires on any state change
     * (append, status flips, completion) with the whole runner, so consumers can
     * re-dump/re-render the current snapshot. Deliberately batch-granular, unlike
     * the per-task {@link onTaskEvent} stream.
     */
    onSnapshotChange?: (runner: TaskRunner, error?: TaskExecutionError) => Promise<void> | void;
    onTaskEvent?: TaskRunnerEventListener;
};
type TaskRunnerOperationOptions = {
    allowWhenError?: boolean;
};
export declare class TaskRunner {
    readonly id: string;
    name: string;
    tasks: ExecutionTask[];
    status: 'init' | 'pending' | 'running' | 'completed' | 'error';
    onTaskStart?: ExecutionTaskProgressOptions['onTaskStart'];
    private readonly uiContextBuilder;
    private readonly onSnapshotChange?;
    private readonly onTaskEvent?;
    private readonly executionLogTime;
    constructor(name: string, uiContextBuilder: () => Promise<UIContext>, options?: TaskRunnerInitOptions);
    private emitSnapshotChange;
    private emitTaskEvent;
    private lastUiContext?;
    private getUiContext;
    private captureScreenshot;
    private attachRecorderItem;
    private markTaskAsPending;
    private normalizeStatusFromError;
    append(task: ExecutionTaskApply[] | ExecutionTaskApply, options?: TaskRunnerOperationOptions): Promise<void>;
    appendAndFlush(task: ExecutionTaskApply[] | ExecutionTaskApply, options?: TaskRunnerOperationOptions): Promise<{
        output: any;
        thought?: string;
    } | undefined>;
    flush(options?: TaskRunnerOperationOptions): Promise<{
        output: any;
        thought?: string;
    } | undefined>;
    isInErrorState(): boolean;
    latestErrorTask(): ExecutionTask | null;
    dump(): ExecutionDump;
    appendErrorPlan(errorMsg: string): Promise<{
        output: undefined;
        runner: TaskRunner;
    }>;
}
export declare class TaskExecutionError extends Error {
    runner: TaskRunner;
    errorTask: ExecutionTask | null;
    constructor(message: string, runner: TaskRunner, errorTask: ExecutionTask | null, options?: {
        cause?: unknown;
    });
}
export {};
