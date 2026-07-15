/**
 * @module @mtp/agent-service/api/case-http
 *
 * @deprecated Case HTTP 已迁至独立进程 `@mtp/case-service`（:4102）。
 * 本文件仅保留历史契约引用；请勿再在此实现 Case 逻辑。
 *
 * Case HTTP 契约（architecture §7.4b，阶段一）。
 * 阶段一核心：`/api/runs` + step/next|retry|skip
 * 可选只读：`GET /api/cases`
 *
 * **不含** Context CRUD、Binding、Registry API。
 */

import type { InstructionResult } from '@mtp/domain-agent';
import type {
  CaseRun,
  CaseSummary,
  StartRunRequest,
  StepNextOptions,
  StepSkipOptions,
} from '@mtp/domain-case';
import type { UUID } from '@mtp/shared-kernel';
import { notImplemented } from './stub.js';

/**
 * Case HTTP 路由路径常量。
 */
export const CaseHttpRoutes = {
  /** GET — 用例摘要列表（可选只读 catalog） */
  listCases: '/api/cases',
  /** GET — 单个用例详情（可选；阶段一可不实现） */
  getCase: '/api/cases/:caseId',
  /** POST — 创建 CaseRun；body: { caseId } */
  startRun: '/api/runs',
  /** GET — 查询 CaseRun */
  getRun: '/api/runs/:runId',
  /** POST — 下一步：compile → Agent.run_instruction → 记账 */
  stepNext: '/api/runs/:runId/step/next',
  /** POST — 重跑当前失败步 */
  stepRetry: '/api/runs/:runId/step/retry',
  /** POST — 跳过并 advance */
  stepSkip: '/api/runs/:runId/step/skip',
  /** POST — 中止 Run */
  abortRun: '/api/runs/:runId/abort',
} as const;

// ── Request / Response bodies ──────────────────────────────────────────

/** GET `/api/cases` → CaseSummary[] */
export type ListCasesResponse = CaseSummary[];

/**
 * POST `/api/runs`
 * body: StartRunRequest `{ caseId }`
 * response: CaseRun
 */
export type StartRunHttpRequest = StartRunRequest;
export type StartRunHttpResponse = CaseRun;

/** GET `/api/runs/:runId` → CaseRun */
export type GetRunResponse = CaseRun;

/**
 * POST `/api/runs/:runId/step/next`
 * body: 可选 StepNextOptions
 */
export type StepNextHttpRequest = StepNextOptions;

/**
 * step/next 与 step/retry 的响应。
 * 含更新后的 Run 与本步 InstructionResult。
 */
export interface StepDriveHttpResponse {
  run: CaseRun;
  result: InstructionResult;
}

/**
 * POST `/api/runs/:runId/step/skip`
 */
export type StepSkipHttpRequest = StepSkipOptions;
export type StepSkipHttpResponse = CaseRun;

/** POST `/api/runs/:runId/abort` → CaseRun */
export type AbortRunResponse = CaseRun;

// ── Handler stubs ──────────────────────────────────────────────────────

/**
 * Case HTTP handlers 接口。
 * 实现阶段绑定 CaseCatalogPort + CaseRunPort + AgentPort。
 */
export interface CaseHttpHandlers {
  listCases(): Promise<ListCasesResponse>;
  startRun(body: StartRunHttpRequest): Promise<StartRunHttpResponse>;
  getRun(runId: UUID): Promise<GetRunResponse>;
  stepNext(
    runId: UUID,
    body?: StepNextHttpRequest,
  ): Promise<StepDriveHttpResponse>;
  stepRetry(
    runId: UUID,
    body?: StepNextHttpRequest,
  ): Promise<StepDriveHttpResponse>;
  stepSkip(
    runId: UUID,
    body?: StepSkipHttpRequest,
  ): Promise<StepSkipHttpResponse>;
  abortRun(runId: UUID): Promise<AbortRunResponse>;
}

/** 未实现的 Case HTTP handlers */
export const caseHttpHandlersStub: CaseHttpHandlers = {
  listCases: async () => notImplemented(CaseHttpRoutes.listCases),
  startRun: async () => notImplemented(CaseHttpRoutes.startRun),
  getRun: async () => notImplemented(CaseHttpRoutes.getRun),
  stepNext: async () => notImplemented(CaseHttpRoutes.stepNext),
  stepRetry: async () => notImplemented(CaseHttpRoutes.stepRetry),
  stepSkip: async () => notImplemented(CaseHttpRoutes.stepSkip),
  abortRun: async () => notImplemented(CaseHttpRoutes.abortRun),
};
