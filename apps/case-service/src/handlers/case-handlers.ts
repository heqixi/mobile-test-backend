/**
 * @module @mtp/case-service/handlers/case-handlers
 *
 * Case HTTP 契约实现 → Catalog + Compiler + CaseRunPort。
 */

import {
  CaseDomainError,
  type CaseCatalogPort,
  type CaseRunPort,
  type InstructionCompilerPort,
} from '@mtp/domain-case';
import type { CaseErrorCode } from '@mtp/shared-kernel';
import type {
  CaseHttpHandlers,
  CompileCaseHttpRequest,
  CompileCaseHttpResponse,
  StartRunHttpRequest,
  StepNextHttpRequest,
  StepSkipHttpRequest,
} from '../api/case-http.js';
import { fail, ok, type HttpResult } from '../api/http-kit.js';

function statusFor(code: CaseErrorCode): number {
  switch (code) {
    case 'CASE_NOT_FOUND':
    case 'RUN_NOT_FOUND':
    case 'STEP_NOT_FOUND':
      return 404;
    case 'NO_MORE_STEPS':
    case 'INVALID_STEP_CURSOR':
    case 'RUN_NOT_RUNNING':
      return 409;
    default:
      return 400;
  }
}

function fromDomainError(error: unknown): HttpResult {
  if (error instanceof CaseDomainError) {
    return fail(statusFor(error.code), {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
    });
  }
  const message = error instanceof Error ? error.message : String(error);
  return fail(500, { code: 'INTERNAL', message });
}

export function createCaseHttpHandlers(deps: {
  catalog: CaseCatalogPort;
  compiler: InstructionCompilerPort;
  runs: CaseRunPort;
}): CaseHttpHandlers {
  const { catalog, compiler, runs } = deps;

  return {
    async health() {
      return ok({
        ok: true,
        service: 'case-service',
        message: 'Case HTTP facade (compile + run)',
      });
    },

    async listCases() {
      try {
        return ok(await catalog.listCases());
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async getCase(caseId) {
      try {
        return ok(await catalog.getCaseDefinition(caseId));
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async compileCase(caseId, body) {
      try {
        const req = (body ?? {}) as CompileCaseHttpRequest;
        const definition = await catalog.getCaseDefinition(caseId);

        const items =
          req.stepOrder != null
            ? [
                compiler.compile({
                  definition,
                  stepOrder: req.stepOrder,
                  promptOverride: req.promptOverride,
                }),
              ]
            : compiler.compileAll(definition, {
                promptOverrideByOrder: req.promptOverrideByOrder,
              });

        const response: CompileCaseHttpResponse = {
          caseId,
          items,
        };
        return ok(response);
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async startRun(body) {
      try {
        const req = body as Partial<StartRunHttpRequest>;
        if (!req.caseId?.trim()) {
          return fail(400, {
            code: 'CASE_NOT_FOUND',
            message: 'caseId is required',
          });
        }
        return ok(await runs.startRun({ caseId: req.caseId.trim() }), 201);
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async getRun(runId) {
      try {
        return ok(await runs.getRun(runId));
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async stepNext(runId, body) {
      try {
        const opts = body as StepNextHttpRequest;
        return ok(await runs.stepNext(runId, opts));
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async stepRetry(runId, body) {
      try {
        const opts = body as StepNextHttpRequest;
        return ok(await runs.stepRetry(runId, opts));
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async stepSkip(runId, body) {
      try {
        const opts = body as StepSkipHttpRequest;
        return ok(await runs.stepSkip(runId, opts));
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async abortRun(runId) {
      try {
        return ok(await runs.abortRun(runId));
      } catch (error) {
        return fromDomainError(error);
      }
    },
  };
}
