/**
 * Midscene Agent 最小接口（Executor 侧）。
 */
export interface MidsceneAgentLike {
  aiAct(prompt: string): Promise<unknown>;
  aiQuery<ReturnType = unknown>(demand: string): Promise<ReturnType>;
  aiAssert?(assertion: string, msg?: string): Promise<unknown>;
  destroy?(): Promise<void>;
  reportFile?: string | null;
}
