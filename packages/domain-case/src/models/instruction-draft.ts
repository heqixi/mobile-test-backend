/**
 * @module @mtp/domain-case/models/instruction-draft
 *
 * LLM 结构化输出（解析目标）。校验通过后映射为 Agent `Instruction`。
 */

/**
 * LLM 应输出的 JSON 形状。
 * - expectation：Judge 唯一成功标准（可观测）
 * - preconditions：本步开始前状态
 * - actions：面向 Midscene 的原子操作意图（写入 Instruction.actions）
 * - hints：可选补充提示（清障/等待等，写入 Instruction.hints）
 */
export interface InstructionDraft {
  preconditions: string;
  actions: string[];
  expectation: string;
  hints?: string[];
  timeoutMs?: number;
}
