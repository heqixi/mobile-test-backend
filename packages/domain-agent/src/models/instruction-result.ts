/**
 * @module @mtp/domain-agent/instruction-result
 *
 * Instruction Loop 结束时的对外产物。
 * Case 域 `step_next` 根据此结果更新 stepResults 与 stepCursor。
 */

import type { ISO8601, UUID } from '@mtp/shared-kernel';
import type { Turn } from './turns.js';

/** Loop 结束状态 */
export type InstructionResultStatus =
  | 'completed'
  | 'failed'
  | 'aborted'
  | 'timeout';

/**
 * `run_instruction` 的返回值。
 *
 * `satisfied` / `reason` 来自最后一次 JudgeTurn（或 Loop 失败时的兜底说明）。
 */
export interface InstructionResult {
  episodeId: UUID;
  instructionId: UUID;

  /**
   * 期望是否达成。
   * **权威来自 LLM Judge**，不是 Agent 本地判定。
   */
  satisfied: boolean;

  /** Judge 给出的自然语言原因 */
  reason: string;

  status: InstructionResultStatus;

  /** 完整 transcript 副本，供 Case 存档或 Client 展示 */
  turns: Turn[];

  finishedAt: ISO8601;
}
