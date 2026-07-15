/**
 * @module @mtp/domain-case/ports/instruction-compiler-port
 *
 * `compile_instruction` 输入/输出与端口（阶段一最小规则）。
 *
 * ```ts
 * Instruction {
 *   expectation: step.intent,           // 或 promptOverride
 *   preconditions: definition.preconditions,
 *   metadata: { caseId, stepId, stepOrder },
 * }
 * ```
 *
 * 不读取 Binding / Context / Registry。
 */

import type { Instruction } from '@mtp/domain-agent';
import type { CaseDefinition, CaseStep } from '../models/case-definition.js';

/**
 * 编译请求：指定用例定义与要编译的步骤。
 */
export interface CompileInstructionRequest {
  /** 只读用例定义 */
  definition: CaseDefinition;

  /**
   * 要编译的步骤 order（1-based）。
   * 通常等于 `caseRun.stepCursor + 1`。
   */
  stepOrder: number;

  /**
   * 可选：覆盖 step.intent 作为 expectation。
   * Console 人工注入 prompt 时使用。
   */
  promptOverride?: string;
}

/**
 * 编译结果：一条 Instruction 对应 Agent 一次 `run_instruction`。
 */
export interface CompileInstructionResult {
  instruction: Instruction;
  step: CaseStep;
}

/**
 * 整案编译选项。
 */
export interface CompileAllOptions {
  /** 按 step.order 覆盖 expectation */
  promptOverrideByOrder?: Record<number, string>;
}

/**
 * 编译器端口（纯函数，无副作用）。
 */
export interface InstructionCompilerPort {
  /**
   * 将指定步编成 Instruction + 原 step。
   * @throws STEP_NOT_FOUND 当 stepOrder 不存在
   */
  compile(request: CompileInstructionRequest): CompileInstructionResult;

  /**
   * 按 order 编译用例全部步骤（可视化 / 预览用）。
   */
  compileAll(
    definition: CaseDefinition,
    options?: CompileAllOptions,
  ): CompileInstructionResult[];
}
