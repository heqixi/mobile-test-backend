/**
 * @module @mtp/domain-agent/instruction
 *
 * Agent 域唯一任务输入。
 *
 * **关键约束**（architecture §4.1）：
 * - `expectation` 对 Agent 是 Prompt 素材，Agent **不解释**业务含义
 * - `metadata` 中的 caseId/stepId 由 Case 写入，Agent **不读取**做业务分支
 * - Agent 内核类型中 **不得** 出现 CaseRun、stepCursor、StateId
 */

import type { OpaqueJson, UUID } from '@mtp/shared-kernel';

/**
 * Instruction：一次 Agent Loop 的任务描述。
 *
 * 通常由 Case 域 `compile_instruction` 产出，也可由 Client 调试时直接构造。
 */
export interface Instruction {
  /**
   * 本 Instruction 唯一 id。
   * 由 compile / 调用方生成；`open_episode` 会存档。
   */
  instructionId: UUID;

  /**
   * **必填**。期望达成什么。
   *
   * - 阶段一 Case：`step.intent`（步骤正文）原样填入
   * - 可为自然语言或 JSON 文本
   * - Agent 仅嵌入 Prompt 模板，**不做语义解析或本地判定**
   */
  expectation: string | OpaqueJson;

  /**
   * 可选前置条件描述。
   * 例：「已打开 App」——由外部 LLM 理解，Agent 只当 Prompt 素材。
   */
  preconditions?: string | OpaqueJson;

  /**
   * 给 LLM 的附加提示列表。
   * 例：「先 sample 再判断」。非 Case step 实体。
   */
  hints?: string[];

  /**
   * 本回合可用工具说明（通常来自 Executor `list_tools`）。
   * Agent 整包嵌入 Prompt；**不**在 Agent 内核建工具语义模型。
   */
  tools?: OpaqueJson;

  /** Loop 超时（毫秒）。超时后 Episode → failed/timeout。 */
  timeoutMs?: number;

  /**
   * 调用方私有元数据。
   * Case 可写入 `{ caseId, stepId, stepOrder }` 用于日志关联；
   * Agent Loop **不得**根据这些字段做业务分支。
   */
  metadata?: Record<string, unknown>;
}

/**
 * 创建 Instruction 的输入（HTTP body 辅助类型）。
 * `instructionId` 可由服务端生成，故为可选。
 */
export interface CreateInstructionInput {
  instructionId?: UUID;
  expectation: string | OpaqueJson;
  preconditions?: string | OpaqueJson;
  hints?: string[];
  tools?: OpaqueJson;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}
