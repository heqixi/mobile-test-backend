/**
 * @module @mtp/domain-case/service/compile-instruction
 *
 * 阶段一最小 compile：step.intent → Instruction.expectation（+ metadata）。
 */

import { randomUUID } from 'node:crypto';
import type { Instruction } from '@mtp/domain-agent';
import { CaseDomainError } from '../errors.js';
import type { CaseDefinition } from '../models/case-definition.js';
import type {
  CompileAllOptions,
  CompileInstructionRequest,
  CompileInstructionResult,
  InstructionCompilerPort,
} from '../ports/instruction-compiler-port.js';

export function compileInstruction(
  request: CompileInstructionRequest,
): CompileInstructionResult {
  const step = request.definition.steps.find(
    (s) => s.order === request.stepOrder,
  );
  if (!step) {
    throw new CaseDomainError(
      'STEP_NOT_FOUND',
      `Step order ${request.stepOrder} not found in case ${request.definition.caseId}`,
      {
        details: {
          caseId: request.definition.caseId,
          stepOrder: request.stepOrder,
        },
      },
    );
  }

  const expectation = request.promptOverride?.trim() || step.intent;

  const instruction: Instruction = {
    instructionId: randomUUID(),
    expectation,
    preconditions: request.definition.preconditions,
    hints: request.definition.expected?.length
      ? [...request.definition.expected]
      : undefined,
    metadata: {
      caseId: request.definition.caseId,
      stepId: step.stepId,
      stepOrder: step.order,
      /** 可视化：标明 expectation 是否来自 override */
      expectationSource: request.promptOverride?.trim()
        ? 'promptOverride'
        : 'step.intent',
      sourceIntent: step.intent,
    },
  };

  return { instruction, step };
}

export function compileAllInstructions(
  definition: CaseDefinition,
  options?: CompileAllOptions,
): CompileInstructionResult[] {
  const sorted = [...definition.steps].sort((a, b) => a.order - b.order);
  return sorted.map((step) =>
    compileInstruction({
      definition,
      stepOrder: step.order,
      promptOverride: options?.promptOverrideByOrder?.[step.order],
    }),
  );
}

export function createInstructionCompiler(): InstructionCompilerPort {
  return {
    compile: compileInstruction,
    compileAll: compileAllInstructions,
  };
}
