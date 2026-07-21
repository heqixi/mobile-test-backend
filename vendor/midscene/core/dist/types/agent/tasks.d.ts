import type { ModelRuntime } from '../ai-model/models';
import { type TMultimodalPrompt, type TUserPrompt } from '../common';
import type { AbstractInterface } from '../device';
import type Service from '../service';
import type { TaskRunner } from '../task-runner';
import { TaskExecutionError } from '../task-runner';
import type { DeviceAction, ExecutionTask, ExecutionTaskApply, ExecutionTaskProgressOptions, MidsceneYamlFlowItem, PlanningAction, PlanningActionParamWaitFor, ServiceExtractOption, ServiceExtractParam, UIContext } from '../types';
import { type AgentProgressPublisher } from './progress';
import type { TaskCache } from './task-cache';
export { locatePlanForLocate } from './task-builder';
import { type TaskTitleType } from './ui-utils';
interface ExecutionResult<OutputType = any> {
    output: OutputType;
    thought?: string;
    runner: TaskRunner;
}
interface TaskExecutorHooks {
    onSnapshotChange?: (runner: TaskRunner, error?: TaskExecutionError) => Promise<void> | void;
    onProgress?: AgentProgressPublisher;
}
export type ActionReportOptions = {
    type?: TaskTitleType;
    prompt?: string;
};
export { TaskExecutionError };
export declare class TaskExecutor {
    interface: AbstractInterface;
    service: Service;
    taskCache?: TaskCache;
    private readonly providedActionSpace;
    private readonly taskBuilder;
    onTaskStartCallback?: ExecutionTaskProgressOptions['onTaskStart'];
    private readonly hooks?;
    replanningCycleLimit?: number;
    waitAfterAction?: number;
    useDeviceTime?: boolean;
    get page(): AbstractInterface;
    constructor(interfaceInstance: AbstractInterface, service: Service, opts: {
        taskCache?: TaskCache;
        onTaskStart?: ExecutionTaskProgressOptions['onTaskStart'];
        replanningCycleLimit?: number;
        waitAfterAction?: number;
        useDeviceTime?: boolean;
        hooks?: TaskExecutorHooks;
        actionSpace: DeviceAction[];
    });
    private createExecutionSession;
    private getActionSpace;
    /**
     * Publish one event onto the agent's progress bus. The task layer is a pure
     * producer here: it names the scope/phase and forwards the structured
     * payload; the bus stamps the sequence and isolates listener errors. It has
     * no knowledge of how the event is rendered or consumed.
     */
    private emitProgress;
    /**
     * aiAct-flavored convenience over {@link emitProgress}: aiAct is the first
     * producer ("pilot") on the generic bus, so its events are simply tagged with
     * the `aiAct` scope.
     */
    private emitAiActProgress;
    /**
     * Set the pending feedback message consumed by the next planning round.
     * The message is always prefixed with the current time. When a body is
     * provided it is appended after the timestamp; otherwise only the time
     * context is recorded. This is the single entry point for writing
     * `pendingFeedbackMessage` so the time prefix stays consistent.
     */
    private setPendingFeedbackMessage;
    /**
     * Collect feedback produced by executed tasks for the next planning round.
     * Returns undefined when no task reported feedback.
     */
    private collectPlanningFeedback;
    /**
     * Get a readable time string. When device time is enabled, use the
     * device-formatted wall-clock time directly so host timezone formatting does
     * not reinterpret a device timestamp.
     * @param format - Optional format string
     * @returns A formatted time string
     */
    private getTimeString;
    convertPlanToExecutable(plans: PlanningAction[], planningModel: ModelRuntime, defaultModel: ModelRuntime, options?: {
        cacheable?: boolean;
        deepLocate?: boolean;
        abortSignal?: AbortSignal;
    }): Promise<{
        tasks: ExecutionTaskApply[];
    }>;
    loadYamlFlowAsPlanning(userInstruction: TUserPrompt, yamlString: string, reportOptions?: ActionReportOptions): Promise<{
        runner: TaskRunner;
    }>;
    runPlans(title: string, plans: PlanningAction[], planningModel: ModelRuntime, defaultModel: ModelRuntime, options?: {
        uiContext?: UIContext;
    }): Promise<ExecutionResult>;
    action(userPrompt: TUserPrompt, planningModel: ModelRuntime, defaultModel: ModelRuntime, includeLocateInPlanning: boolean, aiActContext?: string, cacheable?: boolean, replanningCycleLimitOverride?: number, imagesIncludeCount?: number, deepThink?: boolean, fileChooserAccept?: string[], deepLocate?: boolean, abortSignal?: AbortSignal, reportOptions?: ActionReportOptions, maxActions?: number): Promise<ExecutionResult<{
        yamlFlow?: MidsceneYamlFlowItem[];
        output?: string;
    } | undefined>>;
    /**
     * Called when the task is about to replan. Marks every cache-hit locate task
     * in the just-run batch (tasks at index >= fromIndex) as stale: that batch
     * did not finish the task, so the element each cache hit produced is suspect.
     * The upcoming re-locate of the same prompt then replaces the bad entry in
     * place instead of appending a duplicate that would re-poison the cache on the
     * next run (#2529).
     *
     * Marking a locate that was actually fine is harmless: the step is only ever
     * replaced if the same prompt is located again (i.e. the step is redone),
     * which does not happen for a locate that already succeeded.
     */
    private invalidateFailedCacheHitLocates;
    private runAction;
    private createTypeQueryTask;
    createTypeQueryExecution<T>(type: 'Query' | 'Boolean' | 'Number' | 'String' | 'Assert', demand: ServiceExtractParam, modelRuntime: ModelRuntime, opt?: ServiceExtractOption, multimodalPrompt?: TMultimodalPrompt, executionOptions?: {
        abortSignal?: AbortSignal;
        uiContext?: UIContext;
    }): Promise<ExecutionResult<T>>;
    waitFor(assertion: TUserPrompt, opt: PlanningActionParamWaitFor, modelRuntime: ModelRuntime): Promise<ExecutionResult<void>>;
}
/**
 * Surface a captured screenshot sequence in the report timeline, then release
 * it from the UIContext.
 *
 * When a UIObserver assertion runs, the observed frames live on
 * `uiContext.screenshotSequence` only as a transient model input. This attaches
 * them to the task recorder so the report renders the full sequence the model
 * saw (the report timeline builds one screenshot per recorder item), then drops
 * the field from the UIContext so its base64 is not retained twice for the
 * lifetime of the dump.
 *
 * The last frame is the representative `uiContext.screenshot`, already shown in
 * the report, so only the earlier frames are recorded to avoid duplication.
 * Observed frames are PREPENDED to `task.recorder` (rather than appended) so
 * array order matches chronological order — they were captured before the
 * assertion's before/after screenshots.
 */
export declare function recordAndReleaseScreenshotSequence(task: ExecutionTask, uiContext: UIContext | undefined): void;
export declare function withFileChooser<T>(interfaceInstance: AbstractInterface, fileChooserAccept: string[] | undefined, action: () => Promise<T>): Promise<T>;
