import type { AIUsageInfo } from '../types';
/**
 * Aggregated usage for a single grouping key (intent or model).
 */
export interface UsageBucket {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    calls: number;
}
/**
 * Instance-level snapshot of LLM usage accumulated by an Agent.
 *
 * Designed for cost observability: read it back after a logical unit of work
 * and push to tools like Langfuse. `byIntent` / `byModel` provide free
 * breakdowns derived from the usage data Midscene already records per call.
 */
export interface MidsceneUsageMetrics {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCachedInput: number;
    totalTimeCostMs: number;
    calls: number;
    byIntent: Record<string, UsageBucket>;
    byModel: Record<string, UsageBucket>;
}
/**
 * Pure accumulator for {@link AIUsageInfo}. Deduplication of calls is the
 * caller's responsibility; every `add` counts as one call.
 */
export declare class MetricsCollector {
    private totalPromptTokens;
    private totalCompletionTokens;
    private totalTokens;
    private totalCachedInput;
    private totalTimeCostMs;
    private calls;
    private byIntent;
    private byModel;
    add(usage: AIUsageInfo): void;
    snapshot(): MidsceneUsageMetrics;
    /**
     * Clear all accumulated state. Not wired to a public Agent API yet; kept for
     * a future per-unit reset (e.g. resetting metrics at the start of a spec).
     */
    reset(): void;
}
