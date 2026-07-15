/**
 * @module @mtp/domain-case/service/case-run-service
 *
 * CaseRun 游标 + 账本 + step 驱动（阶段一核心逻辑）。
 */

import { randomUUID } from 'node:crypto';
import type { AgentPort, InstructionResult } from '@mtp/domain-agent';
import type { UUID } from '@mtp/shared-kernel';
import { CaseDomainError } from '../errors.js';
import type { CaseDefinition } from '../models/case-definition.js';
import type {
  CaseRun,
  StepResultLedger,
  StepVerdict,
} from '../models/case-run.js';
import type { CaseCatalogPort } from '../ports/case-catalog-port.js';
import type {
  CaseRunPort,
  StartRunRequest,
  StepDriveResult,
  StepNextOptions,
  StepSkipOptions,
} from '../ports/case-run-port.js';
import type { InstructionCompilerPort } from '../ports/instruction-compiler-port.js';

function nowIso(): string {
  return new Date().toISOString();
}

function cloneRun(run: CaseRun): CaseRun {
  return structuredClone(run);
}

function findStep(definition: CaseDefinition, order: number) {
  return definition.steps.find((s) => s.order === order);
}

function upsertLedger(
  run: CaseRun,
  entry: StepResultLedger,
): void {
  const idx = run.stepResults.findIndex((r) => r.order === entry.order);
  if (idx >= 0) {
    run.stepResults[idx] = entry;
  } else {
    run.stepResults.push(entry);
    run.stepResults.sort((a, b) => a.order - b.order);
  }
}

function applyInstructionResult(
  run: CaseRun,
  definition: CaseDefinition,
  stepOrder: number,
  result: InstructionResult,
): void {
  const step = findStep(definition, stepOrder);
  if (!step) {
    throw new CaseDomainError(
      'STEP_NOT_FOUND',
      `Step order ${stepOrder} missing`,
    );
  }

  const prev = run.stepResults.find((r) => r.order === stepOrder);
  const verdict: StepVerdict = result.satisfied ? 'passed' : 'failed';

  upsertLedger(run, {
    stepId: step.stepId,
    order: stepOrder,
    verdict,
    episodeId: result.episodeId,
    satisfied: result.satisfied,
    reason: result.reason,
    finishedAt: result.finishedAt,
    attempts: (prev?.attempts ?? 0) + 1,
  });

  run.activeEpisodeId = undefined;

  if (result.satisfied) {
    run.stepCursor = stepOrder;
    if (run.stepCursor >= definition.steps.length) {
      run.status = 'completed';
    } else {
      run.status = 'pending';
    }
  } else {
    run.status = 'failed';
  }

  run.updatedAt = nowIso();
}

export interface CreateCaseRunServiceOptions {
  catalog: CaseCatalogPort;
  compiler: InstructionCompilerPort;
  agent: AgentPort;
}

export function createCaseRunService(
  options: CreateCaseRunServiceOptions,
): CaseRunPort {
  const { catalog, compiler, agent } = options;
  const runs = new Map<UUID, CaseRun>();

  async function requireRun(runId: UUID): Promise<CaseRun> {
    const run = runs.get(runId);
    if (!run) {
      throw new CaseDomainError('RUN_NOT_FOUND', `Run not found: ${runId}`, {
        details: { runId },
      });
    }
    return run;
  }

  async function driveStep(
    runId: UUID,
    stepOrder: number,
    options?: StepNextOptions,
  ): Promise<StepDriveResult> {
    const run = await requireRun(runId);
    if (run.status === 'aborted' || run.status === 'completed') {
      throw new CaseDomainError(
        'RUN_NOT_RUNNING',
        `Run ${runId} is ${run.status}`,
        { details: { runId, status: run.status } },
      );
    }

    const definition = await catalog.getCaseDefinition(run.caseId);
    const step = findStep(definition, stepOrder);
    if (!step) {
      throw new CaseDomainError(
        'NO_MORE_STEPS',
        `No step at order ${stepOrder} (cursor=${run.stepCursor})`,
        { details: { runId, stepOrder, stepCursor: run.stepCursor } },
      );
    }

    const { instruction } = compiler.compile({
      definition,
      stepOrder,
      promptOverride: options?.promptOverride,
    });

    run.status = 'running';
    run.updatedAt = nowIso();

    const result = await agent.runInstruction(instruction);
    run.activeEpisodeId = result.episodeId;
    applyInstructionResult(run, definition, stepOrder, result);

    return { run: cloneRun(run), result };
  }

  return {
    async startRun(request: StartRunRequest) {
      const caseId = request.caseId?.trim();
      if (!caseId) {
        throw new CaseDomainError('CASE_NOT_FOUND', 'caseId is required');
      }
      // 校验用例存在
      await catalog.getCaseDefinition(caseId);

      const ts = nowIso();
      const run: CaseRun = {
        runId: randomUUID(),
        caseId,
        stepCursor: 0,
        status: 'pending',
        stepResults: [],
        createdAt: ts,
        updatedAt: ts,
      };
      runs.set(run.runId, run);
      return cloneRun(run);
    },

    async getRun(runId) {
      return cloneRun(await requireRun(runId));
    },

    async stepNext(runId, options) {
      const run = await requireRun(runId);
      const nextOrder = run.stepCursor + 1;
      return driveStep(runId, nextOrder, options);
    },

    async stepRetry(runId, options) {
      const run = await requireRun(runId);
      const order = run.stepCursor + 1;
      if (order < 1) {
        throw new CaseDomainError(
          'INVALID_STEP_CURSOR',
          'Nothing to retry (cursor=0 and no failed step)',
          { details: { runId, stepCursor: run.stepCursor } },
        );
      }
      // 重跑「下一步」位置的失败步（游标不前进）
      return driveStep(runId, order, options);
    },

    async stepSkip(runId, options?: StepSkipOptions) {
      const run = await requireRun(runId);
      if (run.status === 'aborted' || run.status === 'completed') {
        throw new CaseDomainError(
          'RUN_NOT_RUNNING',
          `Run ${runId} is ${run.status}`,
        );
      }

      const definition = await catalog.getCaseDefinition(run.caseId);
      const stepOrder = run.stepCursor + 1;
      const step = findStep(definition, stepOrder);
      if (!step) {
        throw new CaseDomainError(
          'NO_MORE_STEPS',
          `No step to skip at order ${stepOrder}`,
        );
      }

      const prev = run.stepResults.find((r) => r.order === stepOrder);
      upsertLedger(run, {
        stepId: step.stepId,
        order: stepOrder,
        verdict: 'skipped',
        reason: options?.reason ?? 'skipped by client',
        finishedAt: nowIso(),
        attempts: (prev?.attempts ?? 0) + 1,
      });

      run.stepCursor = stepOrder;
      run.activeEpisodeId = undefined;
      run.status =
        run.stepCursor >= definition.steps.length ? 'completed' : 'pending';
      run.updatedAt = nowIso();

      return cloneRun(run);
    },

    async abortRun(runId) {
      const run = await requireRun(runId);
      run.status = 'aborted';
      run.activeEpisodeId = undefined;
      run.updatedAt = nowIso();
      return cloneRun(run);
    },
  };
}
