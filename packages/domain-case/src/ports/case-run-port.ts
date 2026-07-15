/**
 * @module @mtp/domain-case/ports/case-run-port
 *
 * Case Run 端口：游标、账本、step 驱动（§4.3 阶段一 Can）。
 *
 * **Must not**：
 * - 直接 Sample / Execute（设备操作经 Agent → Executor）
 * - 本地 plan/judge
 * - 读写 Binding / Context / Registry
 */

import type { InstructionResult } from '@mtp/domain-agent';
import type { UUID } from '@mtp/shared-kernel';
import type { CaseRun } from '../models/case-run.js';

/** 创建 Run 请求 */
export interface StartRunRequest {
  /** 要跑的用例 id */
  caseId: string;
}

/** step_next / step_retry 可选参数 */
export interface StepNextOptions {
  /** 覆盖当前步 expectation */
  promptOverride?: string;
}

/** step_skip 可选参数 */
export interface StepSkipOptions {
  /** 跳过原因，写入 stepResults.reason */
  reason?: string;
}

/**
 * step_next / step_retry 成功时的返回。
 */
export interface StepDriveResult {
  /** 更新后的 CaseRun */
  run: CaseRun;
  /** 本步 Agent InstructionResult（skip 时可能为空，见 stepSkip） */
  result: InstructionResult;
}

/**
 * Case Run 领域端口。
 */
export interface CaseRunPort {
  /**
   * 创建新的 CaseRun。
   * stepCursor=0，status=pending，空 stepResults。
   * @throws CASE_NOT_FOUND
   */
  startRun(request: StartRunRequest): Promise<CaseRun>;

  /**
   * 查询 Run 状态。
   * @throws RUN_NOT_FOUND
   */
  getRun(runId: UUID): Promise<CaseRun>;

  /**
   * 执行下一步：
   * 1. resolve step = stepCursor + 1
   * 2. compile_instruction
   * 3. agent.runInstruction
   * 4. 按 InstructionResult 记账；passed/skipped 则 advance cursor
   *
   * @throws NO_MORE_STEPS | RUN_NOT_FOUND
   */
  stepNext(runId: UUID, options?: StepNextOptions): Promise<StepDriveResult>;

  /**
   * 重跑当前失败步（stepCursor 不变）。
   * @throws RUN_NOT_FOUND | INVALID_STEP_CURSOR
   */
  stepRetry(runId: UUID, options?: StepNextOptions): Promise<StepDriveResult>;

  /**
   * 跳过下一步（或当前待跑步）：verdict=skipped，advance cursor。
   * 可不调用 Agent。
   */
  stepSkip(runId: UUID, options?: StepSkipOptions): Promise<CaseRun>;

  /** 中止 Run → status=aborted */
  abortRun(runId: UUID): Promise<CaseRun>;
}
