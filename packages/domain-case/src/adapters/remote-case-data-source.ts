/**
 * @module @mtp/domain-case/adapters/remote-case-data-source
 *
 * 远端用例库 HTTP 客户端，实现 CaseDataSourcePort。
 * 类比 database-connector：只持有 baseUrl，经网络访问独立业务服务。
 */

import type {
  CaseDataSourceInfo,
  ConnectedCaseDetail,
  ConnectedCaseOutline,
  ConnectedCaseSummary,
  ConnectedCompiledBundle,
} from '../models/connected-case.js';
import type { CompileProgressEvent } from '../models/compile-progress.js';
import type {
  LibraryCaseRunResult,
  LibraryRunReport,
  LibraryRunReportSummaryItem,
  LibraryRunReportWritebackRequest,
  LibraryRunReportWritebackResponse,
} from '../models/library-run-report.js';
import {
  caseLibraryPaths,
  type CaseLibraryCompiledResponse,
  type CaseLibraryInfoResponse,
  type CaseLibraryListResponse,
} from '../protocol/case-library-http.js';
import type {
  CaseDataSourceListFilter,
  CaseDataSourcePort,
} from '../ports/case-data-source-port.js';
import { CaseDomainError } from '../errors.js';

export interface RemoteCaseDataSourceOptions {
  /** 例如 http://127.0.0.1:4103 */
  baseUrl: string;
  /** 覆盖 info；缺省从远端 GET /api/library/info 拉取 */
  info?: CaseDataSourceInfo;
  fetchImpl?: typeof fetch;
}

async function readJson<T>(res: Response, path: string): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = text || res.statusText;
    let code: string | undefined;
    let details: Record<string, unknown> | undefined;
    try {
      const body = JSON.parse(text) as {
        message?: string;
        error?: string;
        code?: string;
        details?: Record<string, unknown>;
      };
      message = body.message ?? body.error ?? message;
      code = body.code;
      details = body.details;
    } catch {
      // keep
    }
    if (res.status === 404 || code === 'CASE_NOT_FOUND') {
      throw new CaseDomainError('CASE_NOT_FOUND', message, {
        details: { path, status: res.status, ...details },
      });
    }
    if (
      code === 'COMPILE_REJECTED' ||
      code === 'COMPILE_LLM_FAILED' ||
      code === 'COMPILE_REPAIR_EXHAUSTED'
    ) {
      throw new CaseDomainError(code, message, {
        retryable: code === 'COMPILE_LLM_FAILED',
        details: { path, status: res.status, ...details },
      });
    }
    throw new Error(`${res.status} ${path}: ${message}`);
  }
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/**
 * 连接独立业务用例库服务（HTTP）。
 */
export function createRemoteCaseDataSource(
  options: RemoteCaseDataSourceOptions,
): CaseDataSourcePort {
  const base = options.baseUrl.replace(/\/$/, '');
  const fetchFn = options.fetchImpl ?? fetch;
  let info: CaseDataSourceInfo = options.info ?? {
    sourceId: 'remote',
    displayName: base,
  };

  async function get<T>(path: string): Promise<T> {
    const res = await fetchFn(`${base}${path}`, {
      headers: { Accept: 'application/json' },
    });
    return readJson<T>(res, path);
  }

  async function post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchFn(`${base}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    });
    return readJson<T>(res, path);
  }

  const port: CaseDataSourcePort = {
    get info() {
      return info;
    },

    async listCases(filter?: CaseDataSourceListFilter) {
      const qs = new URLSearchParams();
      if (filter?.q) qs.set('q', filter.q);
      if (filter?.pathPrefix?.length) {
        qs.set('path', filter.pathPrefix.join('/'));
      }
      const suffix = qs.toString() ? `?${qs}` : '';
      return get<CaseLibraryListResponse>(`${caseLibraryPaths.cases}${suffix}`);
    },

    async getOutline(caseId: string) {
      return get<ConnectedCaseOutline>(caseLibraryPaths.outline(caseId));
    },

    async getCase(caseId: string) {
      return get<ConnectedCaseDetail>(caseLibraryPaths.case(caseId));
    },

    async getCompiled(caseId: string) {
      const data = await get<CaseLibraryCompiledResponse>(
        caseLibraryPaths.compiled(caseId),
      );
      if (data && 'empty' in data && data.empty) return null;
      return data as ConnectedCompiledBundle;
    },

    async saveCompiled(bundle: ConnectedCompiledBundle) {
      await post(caseLibraryPaths.compiled(bundle.caseId), bundle);
    },

    async compileCase(caseId: string) {
      return post<ConnectedCompiledBundle>(
        caseLibraryPaths.compile(caseId),
        {},
      );
    },

    async compileCaseStream(caseId, onEvent) {
      const path = `${caseLibraryPaths.compile(caseId)}?stream=1`;
      const res = await fetchFn(`${base}${path}`, {
        method: 'POST',
        headers: {
          Accept: 'application/x-ndjson',
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      if (!res.ok || !res.body) {
        await readJson(res, path);
        throw new Error(`${res.status} ${path}: stream unavailable`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalBundle: ConnectedCompiledBundle | null = null;

      const handleLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const event = JSON.parse(trimmed) as CompileProgressEvent;
        onEvent(event);
        if (event.type === 'done') {
          finalBundle = event.bundle;
        }
        if (event.type === 'error') {
          const code =
            event.code === 'COMPILE_REJECTED' ||
            event.code === 'COMPILE_REPAIR_EXHAUSTED' ||
            event.code === 'COMPILE_LLM_FAILED'
              ? event.code
              : 'COMPILE_LLM_FAILED';
          throw new CaseDomainError(code, event.message, {
            details: { caseId, index: event.index },
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) handleLine(line);
      }
      if (buffer.trim()) handleLine(buffer);

      if (!finalBundle) {
        throw new Error(`${path}: stream ended without done event`);
      }
      return finalBundle;
    },

    async listRunReports() {
      return get<LibraryRunReportSummaryItem[]>(caseLibraryPaths.reports);
    },

    async getRunReport(reportId: string) {
      try {
        return await get<LibraryRunReport>(caseLibraryPaths.report(reportId));
      } catch (error) {
        if (error instanceof CaseDomainError && error.code === 'CASE_NOT_FOUND') {
          return null;
        }
        throw error;
      }
    },

    async saveRunReport(input: {
      groupName?: string;
      groupDescription?: string;
      deviceType?: string;
      cases: LibraryCaseRunResult[];
      reportId?: string;
      createdAt?: string;
      sessionId?: string;
    }) {
      return post<LibraryRunReport>(caseLibraryPaths.reports, input);
    },

    async writebackRunReport(
      reportId: string,
      body?: LibraryRunReportWritebackRequest,
    ) {
      return post<LibraryRunReportWritebackResponse>(
        caseLibraryPaths.reportWriteback(reportId),
        body ?? {},
      );
    },

    getRunReportHtmlPath(reportId: string) {
      return `${base}${caseLibraryPaths.reportHtml(reportId)}`;
    },

    async reorderCases(caseIds: string[]) {
      return post<ConnectedCaseSummary[]>(caseLibraryPaths.casesReorder, {
        caseIds,
      });
    },
  };

  void get<CaseLibraryInfoResponse>(caseLibraryPaths.info)
    .then((meta) => {
      if (meta?.sourceId || meta?.displayName) {
        info = {
          sourceId: meta.sourceId ?? info.sourceId,
          displayName: meta.displayName ?? info.displayName,
        };
      }
    })
    .catch(() => undefined);

  return port;
}
