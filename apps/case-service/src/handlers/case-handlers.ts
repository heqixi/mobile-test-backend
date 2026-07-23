/**
 * @module @mtp/case-service/handlers/case-handlers
 *
 * Catalog + 规则 Compiler + CaseRun + DataConnector。
 */

import type {
  CaseCatalogPort,
  CaseDataConnectorPort,
  CaseRunPort,
  ConnectedCompiledBundle,
  InstructionCompilerPort,
} from '@mtp/domain-case';
import { CaseDomainError } from '@mtp/domain-case';
import type { CaseErrorCode } from '@mtp/shared-kernel';
import type {
  CaseHttpHandlers,
  CompileCaseHttpRequest,
  CompileCaseHttpResponse,
  ConnectorConnectRequest,
  StartRunHttpRequest,
  StepNextHttpRequest,
  StepSkipHttpRequest,
} from '../api/case-http.js';
import { fail, ok, type HttpResult } from '../api/http-kit.js';
import type { ConnectorSourceFactory } from '../connector/source-factory.js';

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
    case 'COMPILE_REJECTED':
    case 'COMPILE_REPAIR_EXHAUSTED':
      return 422;
    case 'COMPILE_LLM_FAILED':
      return 502;
    case 'CONNECTOR_NOT_CONNECTED':
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
  connector: CaseDataConnectorPort;
  sourceFactory: ConnectorSourceFactory;
}): CaseHttpHandlers {
  const { catalog, compiler, runs, connector, sourceFactory } = deps;

  return {
    async health() {
      return ok({
        ok: true,
        service: 'case-service',
        message: 'Case HTTP facade (catalog + connector + run)',
        connector: connector.getSourceInfo(),
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
        const response: CompileCaseHttpResponse = { caseId, items };
        return ok(response);
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorStatus() {
      return ok({
        connected: connector.isConnected(),
        source: connector.getSourceInfo(),
      });
    },

    async connectorConnect(body) {
      try {
        const req = (body ?? {}) as ConnectorConnectRequest;
        const source = sourceFactory.create(req);
        connector.connect(source);
        return ok({
          connected: true,
          source: connector.getSourceInfo(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return fail(400, { code: 'CONNECTOR_CONNECT_FAILED', message });
      }
    },

    async connectorDisconnect() {
      connector.disconnect();
      return ok({ connected: false, source: null });
    },

    async connectorList(query) {
      try {
        const pathPrefix = query.path
          ? query.path.split('/').map((s) => s.trim()).filter(Boolean)
          : undefined;
        const list = await connector.listCases({
          q: query.q,
          pathPrefix,
        });
        return ok(list);
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorReorder(body) {
      try {
        const input = (body ?? {}) as { caseIds?: string[] };
        if (!Array.isArray(input.caseIds) || input.caseIds.length === 0) {
          return fail(400, {
            code: 'INVALID_REORDER',
            message: 'caseIds array required',
          });
        }
        return ok(await connector.reorderCases(input.caseIds));
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorOutline(caseId) {
      try {
        return ok(await connector.getOutline(caseId));
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorCase(caseId) {
      try {
        return ok(await connector.getCase(caseId));
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorCompiled(caseId) {
      try {
        const bundle = await connector.getCompiled(caseId);
        if (!bundle) return ok({ empty: true });
        return ok(bundle);
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorSyncCompiled(caseId, body) {
      try {
        const bundle = body as ConnectedCompiledBundle;
        if (!bundle?.instructions?.length) {
          return fail(400, {
            code: 'INVALID_BUNDLE',
            message: 'instructions required',
          });
        }
        const synced: ConnectedCompiledBundle = {
          ...bundle,
          caseId: bundle.caseId || caseId,
        };
        await connector.syncCompiled(synced);
        return ok(synced);
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorCompile(caseId) {
      try {
        const bundle = await connector.compileCase(caseId);
        return ok(bundle);
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorListReports() {
      try {
        return ok(await connector.listRunReports());
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorGetReport(reportId) {
      try {
        const report = await connector.getRunReport(reportId);
        if (!report) {
          return fail(404, {
            code: 'REPORT_NOT_FOUND',
            message: `Report not found: ${reportId}`,
          });
        }
        return ok(report);
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorSaveReport(body) {
      try {
        const input = (body ?? {}) as {
          groupName?: string;
          groupDescription?: string;
          deviceType?: string;
          cases?: unknown;
          reportId?: string;
          createdAt?: string;
          sessionId?: string;
        };
        if (!Array.isArray(input.cases)) {
          return fail(400, {
            code: 'INVALID_REPORT',
            message: 'cases array required',
          });
        }
        return ok(
          await connector.saveRunReport({
            groupName: input.groupName,
            groupDescription: input.groupDescription,
            deviceType: input.deviceType,
            cases: input.cases as never,
            reportId: input.reportId,
            createdAt: input.createdAt,
            sessionId: input.sessionId,
          }),
          201,
        );
      } catch (error) {
        return fromDomainError(error);
      }
    },

    async connectorWritebackReport(reportId, body) {
      try {
        return ok(await connector.writebackRunReport(reportId, body as never));
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
