/**
 * @module @mtp/domain-agent/ports/external-llm-port
 *
 * 外部 LLM 相位端口（OpenCode 等）。
 */

/** Loop 对外相位；统一为 plan，旧名作别名 */
export type LlmPhase = 'plan' | 'precondition' | 'act' | 'judge';

export function normalizeLlmPhase(phase: LlmPhase): 'plan' {
  return 'plan';
}

export interface ExternalLlmPort {
  phase: LlmPhase;
}
