/**
 * @module @mtp/domain-agent/turns
 *
 * Agent Loop 内的「拍」（Turn）。
 * Agent **只解析信封字段**驱动 Loop，不理解 tool 参数或期望的业务含义。
 *
 * 循环：plan → (act) → plan → … → completed | failed | aborted
 */

import type { ISO8601, OpaqueJson, UUID } from '@mtp/shared-kernel';

/**
 * 单次工具调用（PlanTurn 选中 act/recovery 时的信封项）。
 * `arguments` 整包转发 Executor，Agent 不校验业务字段。
 */
export interface ToolCall {
  /** 工具名，对应 Executor `invoke_tool` 的 name */
  name: string;
  /** 不透明参数，直传 Executor */
  arguments: OpaqueJson;
}

/**
 * Plan 业务策略（2×2）+ 元策略 illegal：
 * - act：继续向 expectation 推进一步
 * - recovery：上一步走偏 / last act 失败，纠偏
 * - pass：肯定 expectation 已满足 → 用例通过
 * - fail：肯定 expectation 未满足或已被违背 → 用例失败
 * - illegal：信封/命令不合法（元策略，相位内 repair）
 */
export type PlanStrategy = 'act' | 'recovery' | 'pass' | 'fail' | 'illegal';

/**
 * LLM Plan 相位输出信封。
 *
 * ```json
 * { "strategy": "act"|"recovery"|"pass"|"fail", "command"?: string, "evidence": string }
 * ```
 * `evidence` 同时承载事实与归因（不再另设 reason）。
 */
export interface PlanTurn {
  turnId: UUID;
  at: ISO8601;
  raw: OpaqueJson;
  strategy: PlanStrategy;
  /** act/recovery 时规范为 act_nl toolCall */
  toolCalls: ToolCall[];
  command?: string;
  evidence: string;
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

export type PlanTurnEntry = { kind: 'plan'; turn: PlanTurn };

/**
 * Episode 时间线上的一个事件。
 */
export type Turn = PlanTurnEntry | ToolResultTurn | ObservationTurn;

/**
 * Episode / Loop 统一状态（控制态）。
 *
 * ```
 * open → plan ⇄ act → (plan | completed | failed | aborted)
 * ```
 */
export type EpisodeStatus =
  | 'open'
  | 'plan'
  | 'act'
  | 'completed'
  | 'failed'
  | 'aborted';

/** @deprecated 兼容旧 transcript；新 Loop 不再写入 */
export type PreconditionTurn = {
  turnId: UUID;
  at: ISO8601;
  raw: OpaqueJson;
  met: boolean;
  toolCalls: ToolCall[];
  evidence: string;
  reason?: string;
};

/** @deprecated 兼容旧 transcript；新 Loop 不再写入 */
export type ActTurn = {
  turnId: UUID;
  at: ISO8601;
  raw: OpaqueJson;
  next: 'act' | 'judge';
  toolCalls: ToolCall[];
  evidence: string;
};

/** @deprecated 兼容旧 transcript；新 Loop 不再写入 */
export type JudgeTurn = {
  turnId: UUID;
  at: ISO8601;
  raw: OpaqueJson;
  satisfied: boolean;
  reason: string;
  continue?: boolean;
  evidence: string;
  preconditionMet?: boolean;
};
