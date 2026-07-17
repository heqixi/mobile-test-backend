/** Midscene aiAct 可选参数（与 @midscene/core AiActOptions 对齐的子集） */
export interface MidsceneAiActOptions {
  abortSignal?: AbortSignal;
}

export interface MidsceneLocateResult {
  rect: { left: number; top: number; width: number; height: number };
  center: [number, number];
  dpr?: number;
}

/**
 * Midscene Agent 最小接口（Executor 侧）。
 */
export interface MidsceneAgentLike {
  aiAct(prompt: string, opt?: MidsceneAiActOptions): Promise<unknown>;
  aiQuery<ReturnType = unknown>(demand: string): Promise<ReturnType>;
  aiLocate?(
    prompt: string,
    opt?: { deepLocate?: boolean },
  ): Promise<MidsceneLocateResult>;
  aiAssert?(assertion: string, msg?: string): Promise<unknown>;
  destroy?(): Promise<void>;
  reportFile?: string | null;
}
