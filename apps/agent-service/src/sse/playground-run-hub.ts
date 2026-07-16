/**
 * @module @mtp/agent-service/sse/playground-run-hub
 *
 * 协调 Agent Loop act_nl 与前端 UniversalPlayground：
 * - Loop 发出 turn.playground_run 后在此等待
 * - 前端 ack 后在 Playground 执行，完成时 POST result
 * - 超时未 ack → 返回 null，Loop 回退 executor.freeformExecute
 */

export interface PlaygroundRunResult {
  ok: boolean;
  prompt: string;
  durationMs?: number;
  result?: unknown;
  error?: string;
}

type Pending = {
  prompt: string;
  claimed: boolean;
  resolve: (value: PlaygroundRunResult | null) => void;
  claimTimer: ReturnType<typeof setTimeout>;
  resultTimer: ReturnType<typeof setTimeout>;
  startedAt: number;
};

export function createPlaygroundRunHub(options?: {
  /** 前端未 ack 的回退等待；默认 8s（等 SSE → UniversalPlayground） */
  claimTimeoutMs?: number;
  /** 已 ack 后等结果的上限；默认 180s */
  resultTimeoutMs?: number;
}) {
  const claimTimeoutMs = options?.claimTimeoutMs ?? 15_000;
  const resultTimeoutMs = options?.resultTimeoutMs ?? 180_000;
  const pending = new Map<string, Pending>();

  function clear(entry: Pending): void {
    clearTimeout(entry.claimTimer);
    clearTimeout(entry.resultTimer);
  }

  return {
    /**
     * Loop 侧：等待前端 Playground 执行结果。
     * 返回 null 表示无人认领或超时，调用方应回退 freeform。
     */
    wait(requestId: string, prompt: string): Promise<PlaygroundRunResult | null> {
      return new Promise((resolve) => {
        const startedAt = Date.now();
        const entry: Pending = {
          prompt,
          claimed: false,
          startedAt,
          resolve: (value) => {
            clear(entry);
            pending.delete(requestId);
            resolve(value);
          },
          claimTimer: setTimeout(() => {
            const cur = pending.get(requestId);
            if (cur && !cur.claimed) {
              cur.resolve(null);
            }
          }, claimTimeoutMs),
          resultTimer: setTimeout(() => {
            const cur = pending.get(requestId);
            if (cur) {
              cur.resolve(null);
            }
          }, resultTimeoutMs),
        };
        pending.set(requestId, entry);
      });
    },

    /** 前端已接到 SSE，准备在 UniversalPlayground 执行 */
    ack(requestId: string): boolean {
      const entry = pending.get(requestId);
      if (!entry) return false;
      entry.claimed = true;
      clearTimeout(entry.claimTimer);
      return true;
    },

    /** 前端 Playground 执行完成 */
    complete(requestId: string, body: Omit<PlaygroundRunResult, 'prompt'>): boolean {
      const entry = pending.get(requestId);
      if (!entry) return false;
      entry.resolve({
        ok: body.ok,
        prompt: entry.prompt,
        durationMs: body.durationMs ?? Date.now() - entry.startedAt,
        result: body.result,
        error: body.error,
      });
      return true;
    },

    /**
     * 中止等待中的 Playground run（用户 Stop Agent）。
     * resolve 为 ok:false，避免 Loop 误回退到 freeform。
     */
    cancel(
      requestId: string,
      reason = 'aborted by user',
    ): boolean {
      const entry = pending.get(requestId);
      if (!entry) return false;
      entry.resolve({
        ok: false,
        prompt: entry.prompt,
        durationMs: Date.now() - entry.startedAt,
        error: reason,
      });
      return true;
    },

    size(): number {
      return pending.size;
    },
  };
}

export type PlaygroundRunHub = ReturnType<typeof createPlaygroundRunHub>;
