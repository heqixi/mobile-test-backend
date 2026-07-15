/**
 * @module @mtp/case-service/api/case-http
 *
 * Case HTTP 契约（architecture §7.4b，阶段一）。
 * 核心：compile_instruction 可视化；Run 驱动为附属能力。
 */

import type { Instruction, InstructionResult } from '@mtp/domain-agent';
import type {
  CaseDefinition,
  CaseRun,
  CaseStep,
  CaseSummary,
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
  /** POST — compile_instruction（单步或整案） */
  compileCase: '/api/cases/:caseId/compile',
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

/** POST `/api/cases/:caseId/compile` */
export interface CompileCaseHttpRequest {
  /** 缺省则编译全部步骤 */
  stepOrder?: number;
  /** 单步时覆盖 expectation */
  promptOverride?: string;
  /** 整案时按 order 覆盖 */
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

export interface CaseHttpHandlers {
  health(): Promise<HttpResult>;
  listCases(): Promise<HttpResult>;
  getCase(caseId: string): Promise<HttpResult>;
  compileCase(caseId: string, body: unknown): Promise<HttpResult>;
  startRun(body: unknown): Promise<HttpResult>;
  getRun(runId: UUID): Promise<HttpResult>;
  stepNext(runId: UUID, body: unknown): Promise<HttpResult>;
  stepRetry(runId: UUID, body: unknown): Promise<HttpResult>;
  stepSkip(runId: UUID, body: unknown): Promise<HttpResult>;
  abortRun(runId: UUID): Promise<HttpResult>;
}
