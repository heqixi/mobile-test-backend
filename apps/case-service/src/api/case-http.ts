/**
 * @module @mtp/case-service/api/case-http
 *
 * Case HTTP 契约。
 * - Catalog / Run / 规则 compile（阶段一）
 * - DataConnector：连接外部用例库、按需读取、回写编译产物
 * - LLM compile：`POST /api/compile`（实现待补）
 */

import type { Instruction, InstructionResult } from '@mtp/domain-agent';
import type {
  CaseDataSourceInfo,
  CaseDefinition,
  CaseRun,
  CaseStep,
  CaseSummary,
  CompileCaseInput,
  CompileCaseOptions,
  CompileOutput,
  ConnectedCaseDetail,
  ConnectedCaseOutline,
  ConnectedCaseSummary,
  ConnectedCompiledBundle,
  StartRunRequest,
  StepNextOptions,
  StepSkipOptions,
} from '@mtp/domain-case';
import type { UUID } from '@mtp/shared-kernel';
import type { HttpResult } from './http-kit.js';

export const CASE_SERVICE_PORT = 4102;

export const CaseHttpRoutes = {
  health: '/health',
  listCases: '/api/cases',
  getCase: '/api/cases/:caseId',
  compileCase: '/api/cases/:caseId/compile',
  compileInstruction: '/api/compile',

  /** GET — DataConnector 连接状态 */
  connectorStatus: '/api/connector',
  /** POST — 连接远端用例库 body: { baseUrl?: string } */
  connectorConnect: '/api/connector/connect',
  /** POST — 断开 */
  connectorDisconnect: '/api/connector/disconnect',
  /** GET — 用例列表 ?q=&path=a/b */
  connectorList: '/api/connector/cases',
  /** POST — 重排用例并回写业务源 body: { caseIds: string[] } */
  connectorReorder: '/api/connector/cases/reorder',
  /** GET — 大纲 */
  connectorOutline: '/api/connector/cases/:caseId/outline',
  /** GET — 详情（含 compileInput，不触发编译） */
  connectorCase: '/api/connector/cases/:caseId',
  /** GET — 已持久化编译产物 */
  connectorCompiled: '/api/connector/cases/:caseId/compiled',
  /** POST — 回写编译产物 body: ConnectedCompiledBundle */
  connectorSyncCompiled: '/api/connector/cases/:caseId/compiled',
  /**
   * POST — 业务切步 + LLM 编译并落盘。
   */
  connectorCompile: '/api/connector/cases/:caseId/compile',

  /** GET — Midscene 兼容运行报告列表 */
  connectorReports: '/api/connector/reports',
  /** POST — 落盘运行报告 body: { cases, groupName? } */
  connectorSaveReport: '/api/connector/reports',
  /** GET — 报告详情 */
  connectorReport: '/api/connector/reports/:reportId',
  /** POST — 回写 CSV */
  connectorReportWriteback: '/api/connector/reports/:reportId/writeback',

  startRun: '/api/runs',
  getRun: '/api/runs/:runId',
  stepNext: '/api/runs/:runId/step/next',
  stepRetry: '/api/runs/:runId/step/retry',
  stepSkip: '/api/runs/:runId/step/skip',
  abortRun: '/api/runs/:runId/abort',
} as const;

export type ListCasesResponse = CaseSummary[];
export type GetCaseResponse = CaseDefinition;
export type StartRunHttpRequest = StartRunRequest;
export type StartRunHttpResponse = CaseRun;
export type GetRunResponse = CaseRun;
export type StepNextHttpRequest = StepNextOptions;

export interface StepDriveHttpResponse {
  run: CaseRun;
  result: InstructionResult;
}

export type StepSkipHttpRequest = StepSkipOptions;
export type StepSkipHttpResponse = CaseRun;
export type AbortRunResponse = CaseRun;

export interface CaseHealthResponse {
  ok: boolean;
  service: 'case-service';
  message?: string;
}

export interface CompileCaseHttpRequest {
  stepOrder?: number;
  promptOverride?: string;
  promptOverrideByOrder?: Record<number, string>;
}

export interface CompileCaseItemHttp {
  step: CaseStep;
  instruction: Instruction;
}

export interface CompileCaseHttpResponse {
  caseId: string;
  items: CompileCaseItemHttp[];
}

export type CompileInstructionHttpRequest = CompileCaseInput & CompileCaseOptions;
export type CompileInstructionHttpResponse = CompileOutput;

export interface ConnectorStatusResponse {
  connected: boolean;
  source: CaseDataSourceInfo | null;
}

export interface ConnectorConnectRequest {
  /** 远端业务用例库 baseUrl，如 http://127.0.0.1:4103 */
  baseUrl?: string;
}

export type ConnectorListResponse = ConnectedCaseSummary[];
export type ConnectorOutlineResponse = ConnectedCaseOutline;
export type ConnectorCaseResponse = ConnectedCaseDetail;
export type ConnectorCompiledResponse = ConnectedCompiledBundle | { empty: true };
export type ConnectorSyncCompiledRequest = ConnectedCompiledBundle;

export interface CaseHttpHandlers {
  health(): Promise<HttpResult>;
  listCases(): Promise<HttpResult>;
  getCase(caseId: string): Promise<HttpResult>;
  compileCase(caseId: string, body: unknown): Promise<HttpResult>;
  compileInstruction?(body: unknown): Promise<HttpResult>;

  connectorStatus(): Promise<HttpResult>;
  connectorConnect(body: unknown): Promise<HttpResult>;
  connectorDisconnect(): Promise<HttpResult>;
  connectorList(query: { q?: string; path?: string }): Promise<HttpResult>;
  connectorReorder(body: unknown): Promise<HttpResult>;
  connectorOutline(caseId: string): Promise<HttpResult>;
  connectorCase(caseId: string): Promise<HttpResult>;
  connectorCompiled(caseId: string): Promise<HttpResult>;
  connectorSyncCompiled(caseId: string, body: unknown): Promise<HttpResult>;
  connectorCompile(caseId: string): Promise<HttpResult>;
  connectorListReports(): Promise<HttpResult>;
  connectorGetReport(reportId: string): Promise<HttpResult>;
  connectorSaveReport(body: unknown): Promise<HttpResult>;
  connectorWritebackReport(reportId: string, body: unknown): Promise<HttpResult>;

  startRun(body: unknown): Promise<HttpResult>;
  getRun(runId: UUID): Promise<HttpResult>;
  stepNext(runId: UUID, body: unknown): Promise<HttpResult>;
  stepRetry(runId: UUID, body: unknown): Promise<HttpResult>;
  stepSkip(runId: UUID, body: unknown): Promise<HttpResult>;
  abortRun(runId: UUID): Promise<HttpResult>;
}
