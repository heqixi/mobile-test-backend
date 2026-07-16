/**
 * @module @mtp/domain-case/ports/llm-instruction-compiler-port
 *
 * 内置 LLM Instruction Compiler（domain-case 核心编译能力）。
 *
 * 流程（实现侧）：
 *   CompileCaseInput + optional prompt
 *     → 推送 LLM
 *     → 解析输出为 InstructionDraft → Instruction
 *     → Validator
 *     → CompileOutput | throw COMPILE_REJECTED / COMPILE_LLM_FAILED
 *
 * 数据源格式（CSV/平台 JSON 等）不在本端口范围内，由业务 Adapter 负责。
 */

import type { Instruction } from '@mtp/domain-agent';
import type {
  CompileCaseInput,
  CompileCaseOptions,
} from '../models/compile-case-input.js';
import type { CompileReport } from '../models/compile-report.js';

export interface CompileOutput {
  instruction: Instruction;
  report: CompileReport;
}

/**
 * 内置 Compiler API。
 */
export interface LlmInstructionCompilerPort {
  /**
   * 编译一条 Case 输入为合法 Instruction。
   * @throws COMPILE_LLM_FAILED | COMPILE_REJECTED
   */
  compile(
    input: CompileCaseInput,
    options?: CompileCaseOptions,
  ): Promise<CompileOutput>;
}
