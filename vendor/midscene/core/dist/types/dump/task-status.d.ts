/**
 * Single source of truth for turning raw task/execution dump data into a
 * semantic status.
 *
 * Both the report sidebar (per-step status icon) and the merged-report
 * status aggregation must agree on what "failed" means, otherwise a merged
 * report can mark a failing case as passed. Keeping the rules here — as pure
 * functions over plain dump fields — lets the front-end icons and the backend
 * `mergeReportFiles` attribute derivation share the exact same logic.
 */
import type { ExecutionTask, TestStatus } from '../types';
/**
 * The subset of a task's fields needed to derive its status, picked from
 * `ExecutionTask` so the field names/types stay defined in one place. It is a
 * structural subset, so both the full `ExecutionTask` and the front-end task
 * variants (which carry extra fields) satisfy it.
 */
export type TaskStatusFields = Partial<Pick<ExecutionTask, 'status' | 'subType' | 'error' | 'errorMessage'> & {
    output: unknown;
}>;
export type DerivedTaskStatus = 'passed' | 'failed' | 'warning' | 'pending' | 'running' | 'cancelled';
/**
 * Derive a single task's semantic status from its raw dump fields. Mirrors the
 * historical `getStatusIcon` logic in the report sidebar so icons and merged
 * status never diverge.
 */
export declare function deriveTaskStatus(task: TaskStatusFields): DerivedTaskStatus;
/**
 * Aggregate the tasks of one case (a list of executions) into a single
 * `TestStatus`. A case is `failed` when any of its tasks derives to `failed`;
 * otherwise it is `passed`. Warnings, pending/running/cancelled steps do not by
 * themselves fail a case.
 *
 * This only ever produces `passed` / `failed`; the finer `timedOut` /
 * `skipped` / `interrupted` statuses can only come from a source report that
 * already recorded them (e.g. a Playwright run), which callers should prefer
 * when available.
 */
export declare function deriveCaseStatus(executions: Array<{
    tasks?: TaskStatusFields[];
}>): TestStatus;
