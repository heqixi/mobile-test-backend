/**
 * @module @mtp/domain-case/adapters/remote-case-data-source
 *
 * 远端用例库 HTTP 客户端，实现 CaseDataSourcePort。
 * 类比 database-connector：只持有 baseUrl，经网络访问独立业务服务。
 */

import { CaseDomainError } from '../errors.js';
import type {
  CaseDataSourceInfo,
  ConnectedCaseDetail,
  ConnectedCaseOutline,
  ConnectedCaseSummary,
  ConnectedCompiledBundle,
} from '../models/connected-case.js';
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
