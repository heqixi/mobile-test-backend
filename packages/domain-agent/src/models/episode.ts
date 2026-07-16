/**
 * @module @mtp/domain-agent/episode
 *
 * Episode：一次 Instruction 从 open 到 close 的完整生命周期。
 * 不含 Case 游标。
 */

import type { ISO8601, UUID } from '@mtp/shared-kernel';
import type { Instruction } from './instruction.js';
import type {
  ActTurn,
  EpisodeStatus,
  JudgeTurn,
  Turn,
} from './turns.js';

/**
 * Episode 实体。
 *
 * 时间线：act → tool_result? → judge → …
 */
export interface Episode {
  episodeId: UUID;

  /** Episode / Loop 统一状态 */
  status: EpisodeStatus;

  /** 本 Episode 对应的任务输入（创建后视为不可变） */
  instruction: Instruction;

  /** 时间线：act → tool_result → … → judge → … */
  turns: Turn[];

  /** 最近一次 ActTurn 快捷引用 */
  lastAct?: ActTurn;

  /** 最近一次 JudgeTurn 快捷引用 */
  lastJudge?: JudgeTurn;

  /** 已完成的 act→judge 轮次计数 */
  round?: number;
  /** 连续 judge 未满足次数（satisfied 时归零） */
  consecutiveJudgeFailures?: number;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
