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
import type {
  LibraryRunReport,
  LibraryRunReportSummaryItem,
  LibraryRunReportWritebackResponse,
} from '../models/library-run-report.js';
import type {
  CreateLibraryRunSessionInput,
  LibraryRunSession,
  LibraryRunSessionSummaryItem,
  PatchLibraryRunSessionInput,
} from '../models/library-run-session.js';

/** 用例库 REST 路径 */
export const caseLibraryPaths = {
  health: '/health',
  libraryHealth: '/api/library/health',
  info: '/api/library/info',
  cases: '/api/library/cases',
  /** POST body: { caseIds: string[] } — 重排并回写业务源 */
  casesReorder: '/api/library/cases/reorder',
  case: (caseId: string) =>
    `/api/library/cases/${encodeURIComponent(caseId)}`,
  outline: (caseId: string) =>
    `/api/library/cases/${encodeURIComponent(caseId)}/outline`,
  compiled: (caseId: string) =>
    `/api/library/cases/${encodeURIComponent(caseId)}/compiled`,
  /** 业务切步 + LLM 编译并落盘 */
  compile: (caseId: string) =>
    `/api/library/cases/${encodeURIComponent(caseId)}/compile`,
  /** Midscene 兼容的用例库运行报告 */
  reports: '/api/library/reports',
  report: (reportId: string) =>
    `/api/library/reports/${encodeURIComponent(reportId)}`,
  reportWriteback: (reportId: string) =>
    `/api/library/reports/${encodeURIComponent(reportId)}/writeback`,
  reportHtml: (reportId: string) =>
    `/api/library/reports/${encodeURIComponent(reportId)}/html`,
  /** 依次运行 Session */
  runSessions: '/api/library/run-sessions',
  runSession: (sessionId: string) =>
    `/api/library/run-sessions/${encodeURIComponent(sessionId)}`,
  runSessionArtifacts: (sessionId: string) =>
    `/api/library/run-sessions/${encodeURIComponent(sessionId)}/artifacts/`,
  runSessionArtifact: (sessionId: string, fileName: string) =>
    `/api/library/run-sessions/${encodeURIComponent(sessionId)}/artifacts/${encodeURIComponent(fileName)}`,
} as const;

/** 路由匹配模板（`:caseId` / `:reportId` / `:sessionId` 占位） */
export const caseLibraryRoutePatterns = {
  caseDetail: '/api/library/cases/:caseId',
  outline: '/api/library/cases/:caseId/outline',
  compiled: '/api/library/cases/:caseId/compiled',
  compile: '/api/library/cases/:caseId/compile',
  reportDetail: '/api/library/reports/:reportId',
  reportWriteback: '/api/library/reports/:reportId/writeback',
  reportHtml: '/api/library/reports/:reportId/html',
  runSessionDetail: '/api/library/run-sessions/:sessionId',
  runSessionArtifacts: '/api/library/run-sessions/:sessionId/artifacts',
  runSessionArtifactFile:
    '/api/library/run-sessions/:sessionId/artifacts/:fileName',
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

export type CaseLibraryReportListResponse = LibraryRunReportSummaryItem[];

export type CaseLibraryReportResponse = LibraryRunReport;

export type CaseLibraryReportWritebackResponse =
  LibraryRunReportWritebackResponse;

export type CaseLibraryRunSessionListResponse = LibraryRunSessionSummaryItem[];
export type CaseLibraryRunSessionResponse = LibraryRunSession;
export type {
  CreateLibraryRunSessionInput,
  PatchLibraryRunSessionInput,
} from '../models/library-run-session.js';
