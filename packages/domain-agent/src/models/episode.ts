/**
 * @module @mtp/domain-agent/episode
 *
 * Episode：一次 Instruction 从 open 到 close 的完整生命周期。
 * 不含 Case 游标。
 */

import type { ISO8601, UUID } from '@mtp/shared-kernel';
import type { Instruction } from './instruction.js';
import type { EpisodeStatus, PlanTurn, Turn } from './turns.js';

/**
 * Episode 实体。
 *
 * 时间线：plan → tool_result? → plan → … → terminal
 */
export interface Episode {
  episodeId: UUID;

  /** Episode / Loop 统一状态 */
  status: EpisodeStatus;

  /** 本 Episode 对应的任务输入（创建后视为不可变） */
  instruction: Instruction;

  /** 时间线：plan → tool_result → … */
  turns: Turn[];

  /** 最近一次 PlanTurn */
  lastPlan?: PlanTurn;

  /** 已完成的 plan 轮次计数（每次落盘 PlanTurn 且非纯 illegal-repair 时 +1） */
  round?: number;
  /** 连续 recovery 次数（strategy=act|pass|fail 时归零） */
  consecutiveRecoveryFailures?: number;
  /** 连续 Act 执行失败次数（success 时归零） */
  consecutiveActFailures?: number;

  createdAt: ISO8601;
  updatedAt: ISO8601;
}
