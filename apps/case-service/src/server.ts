/**
 * @module @mtp/case-service/server
 *
 * 组装层：路由表 + dispatch（含 :param 匹配）。
 */

import type {
  CaseCatalogPort,
  CaseRunPort,
  InstructionCompilerPort,
} from '@mtp/domain-case';
import {
  CASE_SERVICE_PORT,
  CaseHttpRoutes,
  type CaseHttpHandlers,
} from './api/case-http.js';
import type { HttpResult } from './api/http-kit.js';
import { createCaseHttpHandlers } from './handlers/case-handlers.js';

export type HttpMethod = 'GET' | 'POST';

export interface RouteDescriptor {
  method: HttpMethod;
  path: string;
  summary: string;
}

export const caseServiceRouteTable: RouteDescriptor[] = [
  { method: 'GET', path: CaseHttpRoutes.health, summary: 'Case 服务健康' },
  { method: 'GET', path: CaseHttpRoutes.listCases, summary: '用例摘要列表' },
  { method: 'GET', path: CaseHttpRoutes.getCase, summary: '用例完整定义' },
  {
    method: 'POST',
    path: CaseHttpRoutes.compileCase,
    summary: 'compile_instruction（单步或整案）',
  },
  { method: 'POST', path: CaseHttpRoutes.startRun, summary: '创建 CaseRun' },
  { method: 'GET', path: CaseHttpRoutes.getRun, summary: '查询 CaseRun' },
  { method: 'POST', path: CaseHttpRoutes.stepNext, summary: '下一步' },
  { method: 'POST', path: CaseHttpRoutes.stepRetry, summary: '重试当前步' },
  { method: 'POST', path: CaseHttpRoutes.stepSkip, summary: '跳过并推进' },
  { method: 'POST', path: CaseHttpRoutes.abortRun, summary: '中止 Run' },
];

export function matchRoute(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!;
    const actual = pathParts[i]!;
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(actual);
    } else if (pp !== actual) {
      return null;
    }
  }
  return params;
}

export interface CaseHttpApi {
  port: number;
  routes: RouteDescriptor[];
  handlers: CaseHttpHandlers;
  dispatch(method: string, path: string, body: unknown): Promise<HttpResult | null>;
}

export function createCaseHttpApi(deps: {
  catalog: CaseCatalogPort;
  compiler: InstructionCompilerPort;
  runs: CaseRunPort;
}): CaseHttpApi {
  const handlers = createCaseHttpHandlers(deps);

  async function dispatch(
    method: string,
    path: string,
    body: unknown,
  ): Promise<HttpResult | null> {
    const m = method.toUpperCase();

    if (m === 'GET' && path === CaseHttpRoutes.health) {
      return handlers.health();
    }
    if (m === 'GET' && path === CaseHttpRoutes.listCases) {
      return handlers.listCases();
    }
    if (m === 'POST' && path === CaseHttpRoutes.startRun) {
      return handlers.startRun(body);
    }

    {
      const params = matchRoute(CaseHttpRoutes.compileCase, path);
      if (m === 'POST' && params?.caseId) {
        return handlers.compileCase(params.caseId, body);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.getCase, path);
      if (m === 'GET' && params?.caseId) {
        return handlers.getCase(params.caseId);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.getRun, path);
      if (m === 'GET' && params?.runId) {
        return handlers.getRun(params.runId);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.stepNext, path);
      if (m === 'POST' && params?.runId) {
        return handlers.stepNext(params.runId, body);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.stepRetry, path);
      if (m === 'POST' && params?.runId) {
        return handlers.stepRetry(params.runId, body);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.stepSkip, path);
      if (m === 'POST' && params?.runId) {
        return handlers.stepSkip(params.runId, body);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.abortRun, path);
      if (m === 'POST' && params?.runId) {
        return handlers.abortRun(params.runId);
      }
    }

    return null;
  }

  return {
    port: CASE_SERVICE_PORT,
    routes: caseServiceRouteTable,
    handlers,
    dispatch,
  };
}
