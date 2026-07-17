/**
 * @module @mtp/domain-agent/turns
 *
 * Agent Loop 内的「拍」（Turn）。
 * Agent **只解析信封字段**驱动 Loop，不理解 tool 参数或期望的业务含义。
 *
 * 循环：precondition → act → (dispatch) → judge → precondition → …
 */

import type { ISO8601, OpaqueJson, UUID } from '@mtp/shared-kernel';

/**
 * 单次工具调用（ActTurn 信封内一项）。
 * `arguments` 整包转发 Executor，Agent 不校验业务字段。
 */
export interface ToolCall {
  /** 工具名，对应 Executor `invoke_tool` 的 name */
  name: string;
  /** 不透明参数，直传 Executor */
  arguments: OpaqueJson;
}

/**
 * LLM Precondition 相位：先确认初始条件，不满足则下发修复 command。
 *
 * ```json
 * { "met": boolean, "command"?: string, "evidence": string, "reason"?: string }
 * ```
 * - met=true → 进入 act
 * - met=false + command → 执行后再次 precondition
 */
export interface PreconditionTurn {
  turnId: UUID;
  at: ISO8601;
  raw: OpaqueJson;
  met: boolean;
  toolCalls: ToolCall[];
  evidence: string;
  reason?: string;
}

/**
 * LLM Act 相位输出信封。
 *
 * ```json
 * { "next": "act" | "judge", "command"?: string, "evidence": string }
 * ```
 * - next="act"：下发 Midscene command（规范为 act_nl toolCall）
 * - next="judge"：本轮不调工具，直接进入 judge
 * `evidence` 必填。
 */
export interface ActTurn {
  turnId: UUID;
  at: ISO8601;
  raw: OpaqueJson;
  /** act = 执行 command；judge = 跳过工具进入 judge */
  next: 'act' | 'judge';
  toolCalls: ToolCall[];
  /** 决策依据（为何下发该 command / 为何直接 judge） */
  evidence: string;
}

/**
 * LLM Judge 相位输出信封。
 *
 * ```json
 * { "satisfied": true, "reason": "...", "continue"?: boolean, "evidence": string,
 *   "preconditionMet"?: boolean }
 * ```
 * **是否达成测试期望的权威来源**是 `satisfied`，不是 Agent 本地比较。
 * 失败时须说明是 precondition 不满足还是 expectation 未达成。
 * 失败且 continue≠false → 回到 precondition（再 act）。
 */
export interface JudgeTurn {
  turnId: UUID;
  at: ISO8601;
  raw: OpaqueJson;
  satisfied: boolean;
  reason: string;
  /** 是否继续下一轮（仅当 !satisfied 时有意义） */
  continue?: boolean;
  /** 决策依据（截图/transcript 事实） */
  evidence: string;
  /** 失败归因：当前屏是否仍满足 preconditions */
  preconditionMet?: boolean;
}

/** Executor 返回的工具执行结果拍 */
export interface ToolResultTurn {
  kind: 'tool_result';
  at: ISO8601;
  results: OpaqueJson[];
}

/** 外部观察注入拍（如 sample 原始 JSON 经 ingest 写入） */
export interface ObservationTurn {
  kind: 'observation';
  at: ISO8601;
  payload: OpaqueJson;
}

export type PreconditionTurnEntry = {
  kind: 'precondition';
  turn: PreconditionTurn;
};
export type ActTurnEntry = { kind: 'act'; turn: ActTurn };
export type JudgeTurnEntry = { kind: 'judge'; turn: JudgeTurn };

/**
 * Episode 时间线上的一个事件。
 */
export type Turn =
  | PreconditionTurnEntry
  | ActTurnEntry
  | JudgeTurnEntry
  | ToolResultTurn
  | ObservationTurn;

/**
 * Episode / Loop 统一状态。
 *
 * ```
 * open → checking_precondition → acting → dispatching? → judging
 *      → (checking_precondition | completed | failed | aborted)
 * ```
 */
export type EpisodeStatus =
  | 'open'
  | 'checking_precondition'
  | 'acting'
  | 'dispatching'
  | 'judging'
  | 'completed'
  | 'failed'
  | 'aborted';
