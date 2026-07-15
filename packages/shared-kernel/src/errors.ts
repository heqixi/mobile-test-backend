/**
 * @module @mtp/shared-kernel/errors
 *
 * 三域 HTTP / 端口层共用错误码与错误体。
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

/** Case 域错误码（阶段一） */
export type CaseErrorCode =
  | 'CASE_NOT_FOUND'
  | 'RUN_NOT_FOUND'
  | 'RUN_NOT_RUNNING'
  | 'NO_MORE_STEPS'
  | 'STEP_NOT_FOUND'
  | 'INVALID_STEP_CURSOR';

/** Executor 域错误码 */
export type ExecutorErrorCode =
  | 'DEVICE_UNAVAILABLE'
  | 'EXECUTOR_BUSY'
  | 'TOOL_TIMEOUT'
  | 'TOOL_NOT_FOUND'
  | 'BIND_FAILED';

/** 所有领域错误码联合 */
export type DomainErrorCode = AgentErrorCode | CaseErrorCode | ExecutorErrorCode;

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
