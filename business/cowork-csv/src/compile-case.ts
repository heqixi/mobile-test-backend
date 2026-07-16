/**
 * Cowork 业务：切步 + 逐条调用 LlmInstructionCompiler → ConnectedCompiledBundle。
 */

import type {
  CompileCaseInput,
  ConnectedCaseDetail,
  ConnectedCompiledBundle,
  LlmInstructionCompilerPort,
} from '@mtp/domain-case';
import { splitCoworkSteps, type CoworkStepSegment } from './split-steps.js';

export function buildStepCompileInput(
  detail: ConnectedCaseDetail,
  step: CoworkStepSegment,
  stepCount: number,
): CompileCaseInput {
  const isLast = step.order === stepCount;
  const parts = [
    `用例标题：${detail.title}`,
    detail.path?.length ? `目录：${detail.path.join(' / ')}` : undefined,
    detail.preconditions?.trim()
      ? `用例前提条件：${detail.preconditions.trim()}`
      : undefined,
    `本步序号：${step.order} / ${stepCount}`,
    `本步操作意图（唯一允许写入 actions 的内容，禁止补写前后步骤）：${step.text}`,
    `约束：假设前面 ${step.order - 1} 步已成功完成；preconditions 描述「本步开始前」状态；actions 只做本步意图，不要再写「点击拍照/打开相机」等已完成动作。`,
    isLast && detail.expectedText?.trim()
      ? `整案预期结果（本步为最后一步，expectation 应对齐）：\n${detail.expectedText.trim()}`
      : `说明：本步不是最后一步；expectation 只写完成本步后的中间可观测状态。`,
  ].filter(Boolean);

  return {
    caseText: parts.join('\n\n'),
    metadata: {
      caseId: detail.caseId,
      stepId: step.stepId,
      stepOrder: step.order,
      title: detail.title,
      source: 'cowork-csv',
      stepText: step.text,
    },
  };
}

export async function compileCoworkCase(
  detail: ConnectedCaseDetail,
  compiler: LlmInstructionCompilerPort,
): Promise<ConnectedCompiledBundle> {
  const steps = splitCoworkSteps(detail.stepsText);
  const instructions = [];
  const reports = [];

  for (const step of steps) {
    const { instruction, report } = await compiler.compile(
      buildStepCompileInput(detail, step, steps.length),
    );
    instructions.push(instruction);
    reports.push(report);
  }

  return {
    caseId: detail.caseId,
    instructions,
    reports,
    compiledAt: new Date().toISOString(),
    sourceTag: 'llm',
  };
}
