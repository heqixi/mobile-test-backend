/**
 * @module @mtp/domain-case/service/instruction-validator
 *
 * 本地确定性校验：Draft / Instruction。无 I/O、无 LLM。
 */

import type { Instruction } from '@mtp/domain-agent';
import type { CompileIssue } from '../models/compile-report.js';
import type { InstructionDraft } from '../models/instruction-draft.js';
import type { InstructionValidatorPort } from '../ports/instruction-validator-port.js';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function createInstructionValidator(): InstructionValidatorPort {
  return {
    validateDraft(draft: InstructionDraft): CompileIssue[] {
      const issues: CompileIssue[] = [];

      if (!draft || typeof draft !== 'object') {
        issues.push({
          severity: 'error',
          code: 'DRAFT_SCHEMA_INVALID',
          path: '/',
          message: 'Draft must be an object',
        });
        return issues;
      }

      if (!isNonEmptyString(draft.preconditions)) {
        issues.push({
          severity: 'error',
          code: 'PRECONDITION_EMPTY',
          path: '/preconditions',
          message: 'preconditions must be a non-empty string',
        });
      }

      if (!Array.isArray(draft.actions) || draft.actions.length === 0) {
        issues.push({
          severity: 'error',
          code: 'ACTIONS_EMPTY',
          path: '/actions',
          message: 'actions must be a non-empty string array',
        });
      } else if (draft.actions.some((a) => !isNonEmptyString(a))) {
        issues.push({
          severity: 'error',
          code: 'DRAFT_SCHEMA_INVALID',
          path: '/actions',
          message: 'each action must be a non-empty string',
        });
      }

      if (!isNonEmptyString(draft.expectation)) {
        issues.push({
          severity: 'error',
          code: 'EXPECTATION_EMPTY',
          path: '/expectation',
          message: 'expectation must be a non-empty string',
        });
      } else if (draft.expectation.trim().length < 4) {
        issues.push({
          severity: 'warn',
          code: 'EXPECTATION_TOO_SHORT',
          path: '/expectation',
          message: 'expectation is very short; prefer an observable success criterion',
        });
      }

      return issues;
    },

    validateInstruction(instruction: Instruction): CompileIssue[] {
      const issues: CompileIssue[] = [];
      if (!instruction?.instructionId) {
        issues.push({
          severity: 'error',
          code: 'INSTRUCTION_INVALID',
          path: '/instructionId',
          message: 'instructionId is required',
        });
      }
      const exp = instruction?.expectation;
      const expText =
        typeof exp === 'string' ? exp : exp != null ? JSON.stringify(exp) : '';
      if (!expText.trim()) {
        issues.push({
          severity: 'error',
          code: 'EXPECTATION_EMPTY',
          path: '/expectation',
          message: 'expectation is required',
        });
      }
      return issues;
    },
  };
}
