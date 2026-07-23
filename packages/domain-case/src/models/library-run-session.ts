/**
 * @module @mtp/domain-case/models/library-run-session
 *
 * 用例库依次运行 Session：可暂停 / 继续 / 终止，持久化后刷新可恢复。
 */

import type {
  LibraryCaseRunResult,
  LibraryRunReportSummary,
} from './library-run-report.js';

export type LibraryRunSessionStatus =
  | 'running'
  | 'paused'
  | 'completed'
  | 'terminated';

export type LibraryRunSessionCaseStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'interrupted';

export interface LibraryRunSessionCaseItem {
  caseId: string;
  title: string;
  status: LibraryRunSessionCaseStatus;
  /** 跑完或中断后写入（含 Midscene dump） */
  result?: LibraryCaseRunResult;
}

export interface LibraryRunSession {
  sessionId: string;
  status: LibraryRunSessionStatus;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
  groupName: string;
  groupDescription?: string;
  caseIds: string[];
  cases: LibraryRunSessionCaseItem[];
  cursorCaseId?: string;
  /** 关联 Midscene 报告（增量更新） */
  reportId?: string;
  /** 本机自包含产物目录绝对路径（整夹可拷贝） */
  artifactsPath?: string;
}

export interface LibraryRunSessionSummaryItem {
  sessionId: string;
  status: LibraryRunSessionStatus;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
  groupName: string;
  caseCount: number;
  completedCount: number;
  summary: LibraryRunReportSummary;
  reportId?: string;
  artifactsPath?: string;
}

export interface CreateLibraryRunSessionInput {
  caseIds: string[];
  /** caseId → title；缺省用 caseId */
  titles?: Record<string, string>;
  groupName?: string;
  groupDescription?: string;
}

export interface PatchLibraryRunSessionInput {
  status?: LibraryRunSessionStatus;
  cursorCaseId?: string | null;
  reportId?: string | null;
  /** 按 caseId 合并更新 */
  cases?: Array<{
    caseId: string;
    status?: LibraryRunSessionCaseStatus;
    title?: string;
    result?: LibraryCaseRunResult;
  }>;
  /** 追加尚未在队列中的 case（status=pending） */
  appendCases?: Array<{ caseId: string; title?: string }>;
}
