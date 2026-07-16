/**
 * @module @mtp/domain-agent/ports/external-llm-port
 *
 * 外部 LLM Agent 端口（OpenCode / Codex / 其它）。
 *
 * **业务推理全部在外部**；Agent 域只负责：
 * 1. 组装 transcript + Instruction 发给外部 LLM
 * 2. 接收 OpaqueJson 原始返回
 * 3. 按信封约定解析为 ActTurn / JudgeTurn
 */

import type { OpaqueJson, UUID } from '@mtp/shared-kernel';
import type { Instruction } from '../models/instruction.js';
import type { Turn } from '../models/turns.js';

/** 外部 LLM 调用相位：act → judge */
export type LlmPhase = 'act' | 'judge';

export interface ExternalLlmInput {
  episodeId: UUID;
  phase: LlmPhase;
  instruction: Instruction;
  turns: Turn[];
}

export interface ExternalLlmAgentPort {
  complete(input: ExternalLlmInput): Promise<OpaqueJson>;
}
