/**
 * @module @mtp/domain-case/protocol/case-library-http
 *
 * 业务用例库 HTTP 协议（主工程定义，业务服务实现）。
 * 类比 database wire protocol：domain 只约定路径与载荷形状。
 */

import type {
  CaseDataSourceInfo,
  ConnectedCaseDetail,
  ConnectedCaseOutline,
  ConnectedCaseSummary,
  ConnectedCompiledBundle,
} from '../models/connected-case.js';

/** 用例库 REST 路径 */
export const caseLibraryPaths = {
  health: '/health',
  libraryHealth: '/api/library/health',
  info: '/api/library/info',
  cases: '/api/library/cases',
  case: (caseId: string) =>
    `/api/library/cases/${encodeURIComponent(caseId)}`,
  outline: (caseId: string) =>
    `/api/library/cases/${encodeURIComponent(caseId)}/outline`,
  compiled: (caseId: string) =>
    `/api/library/cases/${encodeURIComponent(caseId)}/compiled`,
  /** 业务切步 + LLM 编译并落盘 */
  compile: (caseId: string) =>
    `/api/library/cases/${encodeURIComponent(caseId)}/compile`,
} as const;

/** 路由匹配模板（`:caseId` 占位） */
export const caseLibraryRoutePatterns = {
  caseDetail: '/api/library/cases/:caseId',
  outline: '/api/library/cases/:caseId/outline',
  compiled: '/api/library/cases/:caseId/compiled',
  compile: '/api/library/cases/:caseId/compile',
} as const;

export interface CaseLibraryHealthResponse {
  ok: boolean;
  service?: string;
  sourceId?: string;
  displayName?: string;
}

export interface CaseLibraryInfoResponse extends CaseDataSourceInfo {
  service?: string;
}

export type CaseLibraryListResponse = ConnectedCaseSummary[];

export type CaseLibraryOutlineResponse = ConnectedCaseOutline;

export type CaseLibraryDetailResponse = ConnectedCaseDetail;

export type CaseLibraryCompiledResponse =
  | ConnectedCompiledBundle
  | { empty: true };

export type CaseLibraryCompileResponse = ConnectedCompiledBundle;
