/**
 * @module @mtp/domain-agent/ports/external-llm-port
 *
 * 外部 LLM Agent 端口（Codex / OpenCode / 其它）。
 *
 * **业务推理全部在外部**；Agent 域只负责：
 * 1. 组装 transcript + Instruction 发给外部 LLM
 * 2. 接收 OpaqueJson 原始返回
 * 3. 按信封约定解析为 ActTurn / JudgeTurn
 */

import type { OpaqueJson, UUID } from '@mtp/shared-kernel';
import type { Instruction } from '../models/instruction.js';
import type { Turn } from '../models/turns.js';

/** 外部 LLM 调用相位 */
export type LlmPhase = 'act' | 'judge';

/**
 * 发给外部 LLM 的输入。
 * `turns` 为截至当前的完整 transcript。
 */
export interface ExternalLlmInput {
  episodeId: UUID;
  phase: LlmPhase;
  instruction: Instruction;
  turns: Turn[];
}

/**
 * 外部 LLM Agent 端口。
 * 实现方：Codex SDK、OpenAI-compatible 适配器等（L1 适配层，本仓库骨架不实现）。
 */
export interface ExternalLlmAgentPort {
  /**
   * 完成一次 LLM 调用。
   * @returns 原始 JSON；由 Agent 域按信封解析为 ActTurn 或 JudgeTurn
   */
  complete(input: ExternalLlmInput): Promise<OpaqueJson>;
}
