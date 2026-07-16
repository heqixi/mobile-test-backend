/**
 * @module @mtp/domain-case/models/compile-case-input
 *
 * 内置 LLM Compiler 的输入。
 * domain-case **不关心** CSV/JSON/平台等数据源格式——由业务 Adapter
 * 先整理成一条本结构，再交给 Compiler。
 */

/**
 * 一条待编译的 Case 输入（通常对应一步或一个可独立跑的 Instruction 单元）。
 */
export interface CompileCaseInput {
  /**
   * 业务整理后的用例正文（自然语言或结构化文本均可）。
   * Compiler 将其交给 LLM，不解释业务源格式。
   */
  caseText: string;

  /**
   * 可选关联元数据，原样写入 Instruction.metadata（日志/追溯用）。
   * Agent Loop **不得**据此做业务分支。
   */
  metadata?: {
    caseId?: string;
    stepId?: string;
    stepOrder?: number;
    [key: string]: unknown;
  };
}

/** 编译可选参数 */
export interface CompileCaseOptions {
  /**
   * 可选额外 prompt（人工补充、覆盖说明、产品词典等）。
   * 与 caseText 一并送给 LLM。
   */
  prompt?: string;
}
