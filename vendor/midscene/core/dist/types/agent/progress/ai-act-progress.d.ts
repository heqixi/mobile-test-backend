import type { TaskRunnerEvent } from '../../task-runner';
import type { AiActProgressAction, AiActProgressData, AiActProgressPhase, ExecutionTask } from '../../types';
export declare function errorMessageForAiAct(error: unknown): string;
/**
 * Extract the structured action descriptor for an Action Space task, or
 * `undefined` when the task is not a reportable action yet (e.g. a locate param
 * that has not been resolved to coordinates). Returns plain data only.
 */
export declare function extractProgressAction(task: ExecutionTask): AiActProgressAction | undefined;
export type AiActProgressEmit = (phase: AiActProgressPhase, data: AiActProgressData) => void | Promise<void>;
/**
 * Translate the runner's native task-lifecycle events into aiAct action
 * progress for a single planning round.
 *
 * Returned as a closure so each action batch captures its own plan context
 * instead of the executor threading it through shared mutable state. The
 * mapping is deliberate and one-shot per transition: a `start` (coordinates are
 * resolved by the time an action starts) becomes the "planned" + "running"
 * pair, and `finish`/`error` become "done"/"failed".
 */
export declare function createAiActActionReporter(planIndex: number, planLimit: number, emit: AiActProgressEmit): (event: TaskRunnerEvent) => Promise<void>;
