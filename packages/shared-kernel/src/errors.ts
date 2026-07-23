/**
 * @module @mtp/shared-kernel/errors
 *
 * 各域 HTTP / 端口层共用错误码与错误体。
 *
 * 注意：「是否达成测试期望」**不在此列**——
 * 那是 LLM JudgeTurn / InstructionResult.satisfied（§7.6）。
 */

/** Agent 域错误码 */
export type AgentErrorCode =
  | 'EPISODE_NOT_FOUND'
  | 'LLM_UNAVAILABLE'
  | 'TOOL_DISPATCH_FAILED'
  | 'JUDGE_ENVELOPE_INVALID'
  | 'INSTRUCTION_INVALID'
  | 'EPISODE_ALREADY_CLOSED';

/** Case 域错误码 */
export type CaseErrorCode =
  | 'CASE_NOT_FOUND'
  | 'RUN_NOT_FOUND'
  | 'RUN_NOT_RUNNING'
  | 'NO_MORE_STEPS'
  | 'STEP_NOT_FOUND'
  | 'INVALID_STEP_CURSOR'
  /** LLM compile：Validator 未通过 */
  | 'COMPILE_REJECTED'
  /** LLM compile：调用/解析失败 */
  | 'COMPILE_LLM_FAILED'
  /** 保留：多次修复仍失败（可选实现） */
  | 'COMPILE_REPAIR_EXHAUSTED'
  /** DataConnector 未连接外部源 */
  | 'CONNECTOR_NOT_CONNECTED';


/** Executor 域错误码 */
export type ExecutorErrorCode =
  | 'DEVICE_UNAVAILABLE'
  | 'EXECUTOR_BUSY'
  | 'TOOL_TIMEOUT'
  | 'TOOL_NOT_FOUND'
  | 'BIND_FAILED';

/** Goal Space 域错误码（交互式目标初采样） */
export type GoalSpaceErrorCode =
  | 'SPACE_NOT_FOUND'
  | 'VERSION_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_OPEN'
  | 'KEYFRAME_NOT_FOUND'
  | 'TRANSITION_NOT_FOUND'
  | 'NOTE_NOT_FOUND'
  | 'INVALID'
  | 'SUBMIT_VALIDATION_FAILED'
  | 'RETRIEVE_FAILED'
  | 'MEDIA_NOT_FOUND';

/** 所有领域错误码联合 */
export type DomainErrorCode =
  | AgentErrorCode
  | CaseErrorCode
  | ExecutorErrorCode
  | GoalSpaceErrorCode;

/**
 * API 统一错误响应体。
 * HTTP 状态码由服务层映射；body 始终含 machine-readable `code`。
 */
export interface ApiErrorBody {
  /** 机器可读错误码 */
  code: DomainErrorCode | string;

  /** 人类可读说明 */
  message: string;

  /** 是否建议客户端重试（如 LLM 短暂不可用） */
  retryable?: boolean;

  /** 可选调试上下文；生产可裁剪 */
  details?: Record<string, unknown>;
}

/**
 * 端口层领域错误类型占位（实现阶段使用）。
 * 当前骨架仅导出类型形状，不强制 throw。
 */
export interface DomainErrorShape {
  code: DomainErrorCode;
  message: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
}
