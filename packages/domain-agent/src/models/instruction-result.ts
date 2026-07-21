/**
 * @module @mtp/domain-agent/instruction-result
 *
 * Instruction Loop 结束时的对外产物。
 * Case 域 `step_next` 根据此结果更新 stepResults 与 stepCursor。
 */

import type { ISO8601, UUID } from '@mtp/shared-kernel';
import type { Turn } from './turns.js';
import type { VisualEvidence } from './visual-evidence.js';

/** Loop 结束状态 */
export type InstructionResultStatus =
  | 'completed'
  | 'failed'
  | 'aborted'
  | 'timeout';

/**
 * `run_instruction` 的返回值。
 *
 * `satisfied` / `reason` 来自最后一次 PlanTurn（strategy=pass|fail 的 evidence；或护栏失败兜底）。
 */
export interface InstructionResult {
  episodeId: UUID;
  instructionId: UUID;

  /**
   * 期望是否达成。
   * **权威来自 LLM Plan strategy=pass**（fail → false），不是 Agent 本地判定。
   */
  satisfied: boolean;

  /** Plan evidence（事实 + 归因） */
  reason: string;

  status: InstructionResultStatus;

  /** 完整 transcript 副本，供 Case 存档或 Client 展示 */
  turns: Turn[];

  /** 终态 Visual Evidence（若启用） */
  visualEvidence?: VisualEvidence;

  finishedAt: ISO8601;
}
