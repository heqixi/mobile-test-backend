/**
 * @module @mtp/domain-case/ports/instruction-validator-port
 *
 * 本地强校验：对 LLM 解析结果 / Instruction 做确定性检查。
 * 无 I/O、无 LLM。
 */

import type { Instruction } from '@mtp/domain-agent';
import type { CompileIssue } from '../models/compile-report.js';
import type { InstructionDraft } from '../models/instruction-draft.js';

/**
 * Validator：Draft 与最终 Instruction 均可检。
 * 存在 severity=error 则 compile 失败（COMPILE_REJECTED）。
 */
export interface InstructionValidatorPort {
  validateDraft(draft: InstructionDraft): CompileIssue[];
  validateInstruction(instruction: Instruction): CompileIssue[];
}
