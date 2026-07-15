/**
 * @module @mtp/domain-agent/turns
 *
 * Agent Loop 内的「拍」（Turn）。
 * Agent **只解析信封字段**驱动 Loop，不理解 tool 参数或期望的业务含义。
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
 * LLM Planner（act 相位）输出信封。
 *
 * 约定 raw JSON 形状：
 * ```json
 * { "tool_calls": [ { "name": "sample_ui", "arguments": { ... } } ] }
 * ```
 * 字段缺失时 `toolCalls` 视为空数组。
 */
export interface ActTurn {
  turnId: UUID;
  at: ISO8601;
  /** LLM 原始返回，完整存档供审计 */
  raw: OpaqueJson;
  /** 从 raw 解析出的工具调用列表 */
  toolCalls: ToolCall[];
}

/**
 * LLM Judge（judge 相位）输出信封。
 *
 * 约定 raw JSON 形状：
 * ```json
 * { "satisfied": true, "reason": "..." }
 * ```
 * **是否达成测试期望的权威来源**是 `satisfied`，不是 Agent 本地比较。
 */
export interface JudgeTurn {
  turnId: UUID;
  at: ISO8601;
  raw: OpaqueJson;
  satisfied: boolean;
  reason: string;
}

/** Executor 返回的工具执行结果拍 */
export interface ToolResultTurn {
  kind: 'tool_result';
  at: ISO8601;
  /** 每项对应一次 invoke 的原始结果 */
  results: OpaqueJson[];
}

/** 外部观察注入拍（如 sample 原始 JSON 经 ingest 写入） */
export interface ObservationTurn {
  kind: 'observation';
  at: ISO8601;
  payload: OpaqueJson;
}

export type ActTurnEntry = { kind: 'act'; turn: ActTurn };
export type JudgeTurnEntry = { kind: 'judge'; turn: JudgeTurn };

/**
 * Episode 时间线上的一个事件。
 * 按时间顺序排列，构成完整 Loop transcript。
 */
export type Turn =
  | ActTurnEntry
  | JudgeTurnEntry
  | ToolResultTurn
  | ObservationTurn;

/**
 * Agent Loop 控制面相位（非业务 UI 状态）。
 */
export type LoopPhase =
  | 'idle'
  | 'preparing'
  | 'acting'
  | 'dispatching'
  | 'judging'
  | 'completed'
  | 'failed'
  | 'aborted';

/** Episode 生命周期状态 */
export type EpisodeStatus =
  | 'open'
  | 'acting'
  | 'dispatching'
  | 'judging'
  | 'completed'
  | 'failed'
  | 'aborted';
