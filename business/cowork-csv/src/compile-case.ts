/**
 * Cowork 业务：切步 + 逐条调用 LlmInstructionCompiler → ConnectedCompiledBundle。
 */

import type {
  CompileCaseInput,
  CompileProgressEvent,
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

export interface CompileCoworkCaseOptions {
  onProgress?: (event: CompileProgressEvent) => void | Promise<void>;
  /** 每完成一步写回部分 bundle（可选） */
  onPartial?: (bundle: ConnectedCompiledBundle) => void | Promise<void>;
}

export async function compileCoworkCase(
  detail: ConnectedCaseDetail,
  compiler: LlmInstructionCompilerPort,
  options?: CompileCoworkCaseOptions,
): Promise<ConnectedCompiledBundle> {
  const steps = splitCoworkSteps(detail.stepsText);
  const total = steps.length;
  const instructions = [];
  const reports = [];
  const emit = async (event: CompileProgressEvent) => {
    await options?.onProgress?.(event);
  };

  await emit({
    type: 'start',
    caseId: detail.caseId,
    total,
    steps: steps.map((s) => ({
      order: s.order,
      stepId: s.stepId,
      text: s.text,
    })),
  });

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index]!;
    await emit({
      type: 'step_start',
      caseId: detail.caseId,
      index,
      total,
      stepOrder: step.order,
      stepId: step.stepId,
      stepText: step.text,
    });

    const { instruction, report } = await compiler.compile(
      buildStepCompileInput(detail, step, steps.length),
    );
    instructions.push(instruction);
    reports.push(report);

    await emit({
      type: 'step_done',
      caseId: detail.caseId,
      index,
      total,
      stepOrder: step.order,
      instruction,
      report,
    });

    const partial: ConnectedCompiledBundle = {
      caseId: detail.caseId,
      instructions: [...instructions],
      reports: [...reports],
      compiledAt: new Date().toISOString(),
      sourceTag: index + 1 < total ? 'llm-partial' : 'llm',
    };
    await options?.onPartial?.(partial);
  }

  const bundle: ConnectedCompiledBundle = {
    caseId: detail.caseId,
    instructions,
    reports,
    compiledAt: new Date().toISOString(),
    sourceTag: 'llm',
  };

  await emit({ type: 'done', caseId: detail.caseId, bundle });
  return bundle;
}
