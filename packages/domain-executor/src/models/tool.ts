/**
 * @module @mtp/domain-executor/tool
 *
 * 工具目录与按名调用模型。
 * Agent 按 `name` 转发；Executor 负责实现；**不**要求 Agent 理解工具业务语义。
 */

import type { OpaqueJson } from '@mtp/shared-kernel';

/**
 * 工具描述（`list_tools` 返回项）。
 * 通常嵌入 Instruction.tools 喂给 LLM。
 */
export interface ToolDescription {
  /** 工具唯一名，如 `sample_ui`、`act_nl` */
  name: string;

  /** 给 LLM 看的自然语言说明 */
  description: string;

  /**
   * 可选参数 JSON Schema 或自由描述。
   * Agent 不校验；LLM 生成 arguments。
   */
  parameters?: OpaqueJson;
}

/**
 * 按名调用工具请求（AEP InvokeTool）。
 */
export interface InvokeToolRequest {
  /** 工具名，必须存在于 list_tools */
  name: string;

  /**
   * 不透明参数。
   * Agent 从 ActTurn.toolCalls[].arguments 整包透传。
   */
  arguments: OpaqueJson;

  /** 可选超时（毫秒） */
  timeoutMs?: number;
}

/**
 * 工具调用技术结果。
 * `ok`/`error` 仅表示执行成功与否，**不**表示测试期望是否达成。
 */
export interface ToolResult {
  name: string;
  /** 技术执行是否成功 */
  ok: boolean;
  /** 工具返回的原始载荷 */
  data?: OpaqueJson;
  durationMs?: number;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
}
