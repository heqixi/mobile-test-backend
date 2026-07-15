/**
 * @module @mtp/domain-case/case-run
 *
 * CaseRun：单次用例执行的运行时状态（阶段一核心）。
 *
 * 职责：
 * 1. 维护 stepCursor（已完成步游标）
 * 2. 维护 stepResults 账本
 * 3. 驱动 step_next → compile_instruction → Agent.run_instruction
 */

import type { ISO8601, UUID } from '@mtp/shared-kernel';

/** 单步裁决（Case 侧账本，非 Executor 技术 verdict） */
export type StepVerdict = 'passed' | 'failed' | 'skipped' | 'pending';

/** CaseRun 生命周期状态 */
export type CaseRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'aborted';

/**
 * 单步执行结果账本条目。
 * 每个 `step.order` 在任意时刻最多一条「当前有效」记录（retry 覆盖）。
 */
export interface StepResultLedger {
  stepId: string;
  order: number;

  /**
   * Case 侧步骤结论：
   * - passed：InstructionResult.satisfied === true
   * - failed：satisfied === false 或 Agent/网络错误
   * - skipped：用户 skip，不调用 Agent
   * - pending：已 compile 已提交 Agent，尚未落账
   */
  verdict: StepVerdict;

  /** 关联的 Agent Episode（若调用了 Agent） */
  episodeId?: UUID;

  /**
   * 来自 InstructionResult.satisfied。
   * **权威在 LLM Judge**；Case 只记账，不再解释。
   */
  satisfied?: boolean;

  /** 来自 InstructionResult.reason */
  reason?: string;

  /** 本步完成时间 */
  finishedAt?: ISO8601;

  /** 本步尝试次数（首次为 1） */
  attempts?: number;
}

/**
 * CaseRun 实体。
 */
export interface CaseRun {
  /** 本次执行唯一 id */
  runId: UUID;

  /** 关联的用例定义 id */
  caseId: string;

  /**
   * 已完成（passed 或 skipped）的最大 step.order。
   *
   * - 初始值：`0`（尚未完成任何步）
   * - 下一步：`order === stepCursor + 1`
   * - 全部完成：stepCursor === steps.length 且 status=completed
   */
  stepCursor: number;

  status: CaseRunStatus;

  /** 各步账本 */
  stepResults: StepResultLedger[];

  /**
   * 当前步已提交给 Agent、尚未落账的 Episode id。
   * status=running 时可能有值。
   */
  activeEpisodeId?: UUID;

  createdAt: ISO8601;
  updatedAt: ISO8601;
}
