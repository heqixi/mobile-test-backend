/**
 * @module @mtp/case-service/server
 *
 * 组装层：路由表 + dispatch。
 */

import type {
  CaseCatalogPort,
  CaseDataConnectorPort,
  CaseRunPort,
  InstructionCompilerPort,
} from '@mtp/domain-case';
import {
  CASE_SERVICE_PORT,
  CaseHttpRoutes,
  type CaseHttpHandlers,
} from './api/case-http.js';
import type { HttpResult } from './api/http-kit.js';
import type { ConnectorSourceFactory } from './connector/source-factory.js';
import { createCaseHttpHandlers } from './handlers/case-handlers.js';

export type HttpMethod = 'GET' | 'POST';

export interface RouteDescriptor {
  method: HttpMethod;
  path: string;
  summary: string;
}

export const caseServiceRouteTable: RouteDescriptor[] = [
  { method: 'GET', path: CaseHttpRoutes.health, summary: 'Case 服务健康' },
  { method: 'GET', path: CaseHttpRoutes.listCases, summary: '内置 Catalog 列表' },
  { method: 'GET', path: CaseHttpRoutes.getCase, summary: '内置 Catalog 用例' },
  {
    method: 'POST',
    path: CaseHttpRoutes.compileCase,
    summary: '规则 compile（Catalog）',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.compileInstruction,
    summary: 'LLM compile（待实现）',
  },
  { method: 'GET', path: CaseHttpRoutes.connectorStatus, summary: 'Connector 状态' },
  { method: 'POST', path: CaseHttpRoutes.connectorConnect, summary: '连接用例库' },
  {
    method: 'POST',
    path: CaseHttpRoutes.connectorDisconnect,
    summary: '断开用例库',
  },
  { method: 'GET', path: CaseHttpRoutes.connectorList, summary: '外部用例列表' },
  {
    method: 'POST',
    path: CaseHttpRoutes.connectorReorder,
    summary: '重排用例并回写业务源',
  },
  { method: 'GET', path: CaseHttpRoutes.connectorOutline, summary: '用例大纲' },
  { method: 'GET', path: CaseHttpRoutes.connectorCase, summary: '用例详情' },
  {
    method: 'GET',
    path: CaseHttpRoutes.connectorCompiled,
    summary: '已编译 Instruction',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.connectorSyncCompiled,
    summary: '回写编译产物',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.connectorCompile,
    summary: '业务切步 + LLM 编译',
  },
  {
    method: 'GET',
    path: CaseHttpRoutes.connectorReports,
    summary: '用例库运行报告列表（Midscene）',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.connectorSaveReport,
    summary: '落盘用例库运行报告（Midscene dump）',
  },
  {
    method: 'GET',
    path: CaseHttpRoutes.connectorReport,
    summary: '运行报告详情',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.connectorReportWriteback,
    summary: '回写报告结果到 CSV',
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
  dispatch(
    method: string,
    path: string,
    body: unknown,
    query?: URLSearchParams,
  ): Promise<HttpResult | null>;
}

export function createCaseHttpApi(deps: {
  catalog: CaseCatalogPort;
  compiler: InstructionCompilerPort;
  runs: CaseRunPort;
  connector: CaseDataConnectorPort;
  sourceFactory: ConnectorSourceFactory;
}): CaseHttpApi {
  const handlers = createCaseHttpHandlers(deps);

  async function dispatch(
    method: string,
    path: string,
    body: unknown,
    query?: URLSearchParams,
  ): Promise<HttpResult | null> {
    const m = method.toUpperCase();
    const q = query ?? new URLSearchParams();

    if (m === 'GET' && path === CaseHttpRoutes.health) {
      return handlers.health();
    }
    if (m === 'GET' && path === CaseHttpRoutes.listCases) {
      return handlers.listCases();
    }
    if (m === 'POST' && path === CaseHttpRoutes.startRun) {
      return handlers.startRun(body);
    }
    if (m === 'POST' && path === CaseHttpRoutes.compileInstruction) {
      return {
        status: 501,
        body: {
          code: 'NOT_IMPLEMENTED',
          message: 'LlmInstructionCompilerPort not wired yet',
        },
      };
    }
    if (m === 'GET' && path === CaseHttpRoutes.connectorStatus) {
      return handlers.connectorStatus();
    }
    if (m === 'POST' && path === CaseHttpRoutes.connectorConnect) {
      return handlers.connectorConnect(body);
    }
    if (m === 'POST' && path === CaseHttpRoutes.connectorDisconnect) {
      return handlers.connectorDisconnect();
    }
    if (m === 'GET' && path === CaseHttpRoutes.connectorList) {
      return handlers.connectorList({
        q: q.get('q') ?? undefined,
        path: q.get('path') ?? undefined,
      });
    }
    if (m === 'POST' && path === CaseHttpRoutes.connectorReorder) {
      return handlers.connectorReorder(body);
    }
    if (m === 'GET' && path === CaseHttpRoutes.connectorReports) {
      return handlers.connectorListReports();
    }
    if (m === 'POST' && path === CaseHttpRoutes.connectorSaveReport) {
      return handlers.connectorSaveReport(body);
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
      const params = matchRoute(CaseHttpRoutes.connectorReportWriteback, path);
      if (m === 'POST' && params?.reportId) {
        return handlers.connectorWritebackReport(params.reportId, body);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.connectorReport, path);
      if (m === 'GET' && params?.reportId) {
        return handlers.connectorGetReport(params.reportId);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.connectorOutline, path);
      if (m === 'GET' && params?.caseId) {
        return handlers.connectorOutline(params.caseId);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.connectorCompile, path);
      if (m === 'POST' && params?.caseId) {
        return handlers.connectorCompile(params.caseId);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.connectorCompiled, path);
      if (m === 'GET' && params?.caseId) {
        return handlers.connectorCompiled(params.caseId);
      }
      if (m === 'POST' && params?.caseId) {
        return handlers.connectorSyncCompiled(params.caseId, body);
      }
    }
    {
      const params = matchRoute(CaseHttpRoutes.connectorCase, path);
      if (m === 'GET' && params?.caseId) {
        return handlers.connectorCase(params.caseId);
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
