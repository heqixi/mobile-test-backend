/**
 * @module @mtp/domain-agent/episode
 *
 * Episode：一次 Instruction 从 open 到 close 的完整生命周期。
 * 不含 Case 游标；多个 Episode 可属于同一 CaseRun 的不同步骤。
 */

import type { ISO8601, UUID } from '@mtp/shared-kernel';
import type { Instruction } from './instruction.js';
import type {
  ActTurn,
  EpisodeStatus,
  JudgeTurn,
  LoopPhase,
  Turn,
} from './turns.js';

/**
 * Episode 实体。
 *
 * 存储 Instruction 与多轮 Turn transcript，供 `advance` 步进与审计回放。
 */
export interface Episode {
  episodeId: UUID;

  /** 当前 Episode 状态 */
  status: EpisodeStatus;

  /** Loop 控制面相位（细粒度进度） */
  phase: LoopPhase;

  /** 本 Episode 对应的任务输入（创建后视为不可变） */
  instruction: Instruction;

  /** 时间线：act → tool_result → … → judge */
  turns: Turn[];

  /** 最近一次 ActTurn 快捷引用 */
  lastAct?: ActTurn;

  /** 最近一次 JudgeTurn 快捷引用 */
  lastJudge?: JudgeTurn;

  createdAt: ISO8601;
  updatedAt: ISO8601;
}
