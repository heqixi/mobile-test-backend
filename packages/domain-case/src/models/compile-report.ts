/**
 * @module @mtp/domain-case/models/compile-report
 *
 * 单次 compile 的校验报告。
 */

import type { InstructionDraft } from './instruction-draft.js';

export type CompileIssueSeverity = 'error' | 'warn';

export type CompileIssueCode =
  | 'DRAFT_PARSE_FAILED'
  | 'DRAFT_SCHEMA_INVALID'
  | 'PRECONDITION_EMPTY'
  | 'ACTIONS_EMPTY'
  | 'EXPECTATION_EMPTY'
  | 'EXPECTATION_TOO_SHORT'
  | 'EXPECTATION_NOT_OBSERVABLE'
  | 'EXPECTATION_IS_ACTION_ONLY'
  | 'INSTRUCTION_INVALID'
  | (string & {});

export interface CompileIssue {
  severity: CompileIssueSeverity;
  code: CompileIssueCode;
  /** 如 /expectation */
  path: string;
  message: string;
}

export interface CompileReport {
  /** 无 error 级 issue 则为 true */
  ok: boolean;
  issues: CompileIssue[];
  /** 解析得到的 Draft（调试用） */
  draft?: InstructionDraft;
}
