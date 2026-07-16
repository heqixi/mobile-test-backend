/** Midscene aiAct 可选参数（与 @midscene/core AiActOptions 对齐的子集） */
export interface MidsceneAiActOptions {
  abortSignal?: AbortSignal;
}

/**
 * Midscene Agent 最小接口（Executor 侧）。
 */
export interface MidsceneAgentLike {
  aiAct(prompt: string, opt?: MidsceneAiActOptions): Promise<unknown>;
  aiQuery<ReturnType = unknown>(demand: string): Promise<ReturnType>;
  aiAssert?(assertion: string, msg?: string): Promise<unknown>;
  destroy?(): Promise<void>;
  reportFile?: string | null;
}
