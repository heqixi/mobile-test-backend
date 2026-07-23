/**
 * 用例库 Run Session 落盘：`<csv>.run-sessions/<id>.json` + index.json
 */

import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import type {
  CreateLibraryRunSessionInput,
  LibraryCaseRunResult,
  LibraryRunReport,
  LibraryRunReportSummary,
  LibraryRunSession,
  LibraryRunSessionCaseItem,
  LibraryRunSessionCaseStatus,
  LibraryRunSessionSummaryItem,
  PatchLibraryRunSessionInput,
} from '@mtp/domain-case';
import { summarizeCaseResults } from './library-run-report.js';
import { writePortableSessionReportHtml } from './session-report-html.js';

export function runSessionsDirForCsv(csvPath: string): string {
  const abs = resolve(csvPath);
  return join(dirname(abs), `${basename(abs)}.run-sessions`);
}

function indexPath(dir: string): string {
  return join(dir, 'index.json');
}

function sessionPath(dir: string, sessionId: string): string {
  return join(dir, `${sessionId}.json`);
}

type SessionIndexFile = {
  sessions: LibraryRunSessionSummaryItem[];
};

function loadIndex(dir: string): SessionIndexFile {
  const p = indexPath(dir);
  if (!existsSync(p)) return { sessions: [] };
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as SessionIndexFile;
  } catch {
    return { sessions: [] };
  }
}

function saveIndex(dir: string, index: SessionIndexFile): void {
  writeFileSync(indexPath(dir), JSON.stringify(index, null, 2), 'utf8');
}

function emptySummary(): LibraryRunReportSummary {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    interrupted: 0,
    timedOut: 0,
  };
}

function sessionSummaryFromCases(
  cases: LibraryRunSessionCaseItem[],
): LibraryRunReportSummary {
  const results = cases
    .map((c) => c.result)
    .filter((r): r is LibraryCaseRunResult => Boolean(r));
  if (results.length > 0) {
    const s = summarizeCaseResults(results);
    // pending/running 也计入 total
    s.total = cases.length;
    return s;
  }
  const s = emptySummary();
  s.total = cases.length;
  for (const c of cases) {
    if (c.status === 'passed') s.passed += 1;
    else if (c.status === 'failed') s.failed += 1;
    else if (c.status === 'interrupted') s.interrupted += 1;
  }
  return s;
}

function toSummaryItem(session: LibraryRunSession): LibraryRunSessionSummaryItem {
  const completedCount = session.cases.filter((c) =>
    ['passed', 'failed', 'interrupted'].includes(c.status),
  ).length;
  return {
    sessionId: session.sessionId,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    finishedAt: session.finishedAt,
    groupName: session.groupName,
    caseCount: session.cases.length,
    completedCount,
    summary: sessionSummaryFromCases(session.cases),
    reportId: session.reportId,
    artifactsPath: session.artifactsPath,
  };
}

function writeSession(csvPath: string, session: LibraryRunSession): LibraryRunSession {
  const dir = runSessionsDirForCsv(csvPath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    sessionPath(dir, session.sessionId),
    JSON.stringify(session, null, 2) + '\n',
    'utf8',
  );
  const index = loadIndex(dir);
  index.sessions = [
    toSummaryItem(session),
    ...index.sessions.filter((s) => s.sessionId !== session.sessionId),
  ];
  saveIndex(dir, index);
  return session;
}

export function listLibraryRunSessions(
  csvPath: string,
): LibraryRunSessionSummaryItem[] {
  return loadIndex(runSessionsDirForCsv(csvPath)).sessions;
}

export function getLibraryRunSession(
  csvPath: string,
  sessionId: string,
): LibraryRunSession | null {
  const p = sessionPath(runSessionsDirForCsv(csvPath), sessionId);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as LibraryRunSession;
  } catch {
    return null;
  }
}

export function createLibraryRunSession(
  csvPath: string,
  input: CreateLibraryRunSessionInput,
): LibraryRunSession {
  const caseIds = [...new Set((input.caseIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (caseIds.length === 0) {
    throw new Error('caseIds required');
  }
  const now = new Date().toISOString();
  const sessionId = `sess-${now.replace(/[:.]/g, '-').slice(0, 19)}-${randomUUID().slice(0, 8)}`;
  const cases: LibraryRunSessionCaseItem[] = caseIds.map((caseId) => ({
    caseId,
    title: input.titles?.[caseId] ?? caseId,
    status: 'pending' as LibraryRunSessionCaseStatus,
  }));
  const session: LibraryRunSession = {
    sessionId,
    status: 'running',
    createdAt: now,
    updatedAt: now,
    groupName: input.groupName?.trim() || 'Cowork CSV library run',
    groupDescription: input.groupDescription,
    caseIds,
    cases,
  };
  return writeSession(csvPath, session);
}

export function patchLibraryRunSession(
  csvPath: string,
  sessionId: string,
  patch: PatchLibraryRunSessionInput,
): LibraryRunSession {
  const cur = getLibraryRunSession(csvPath, sessionId);
  if (!cur) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  const now = new Date().toISOString();
  const byId = new Map(cur.cases.map((c) => [c.caseId, { ...c }]));
  const caseIds = [...cur.caseIds];

  if (Array.isArray(patch.appendCases)) {
    for (const item of patch.appendCases) {
      const caseId = item.caseId?.trim();
      if (!caseId || byId.has(caseId)) continue;
      byId.set(caseId, {
        caseId,
        title: item.title?.trim() || caseId,
        status: 'pending' as LibraryRunSessionCaseStatus,
      });
      caseIds.push(caseId);
    }
  }

  if (Array.isArray(patch.cases)) {
    for (const item of patch.cases) {
      const prev = byId.get(item.caseId);
      if (!prev) continue;
      byId.set(item.caseId, {
        ...prev,
        ...(item.title != null ? { title: item.title } : {}),
        ...(item.status != null ? { status: item.status } : {}),
        ...(item.result !== undefined ? { result: item.result } : {}),
      });
    }
  }
  const cases = caseIds.map(
    (id) => byId.get(id) ?? { caseId: id, title: id, status: 'pending' as const },
  );

  let status = patch.status ?? cur.status;
  let finishedAt = cur.finishedAt;
  if (status === 'completed' || status === 'terminated') {
    finishedAt = finishedAt ?? now;
  }
  if (status === 'running' || status === 'paused') {
    finishedAt = undefined;
  }

  const session: LibraryRunSession = {
    ...cur,
    status,
    updatedAt: now,
    finishedAt,
    caseIds,
    cases,
    cursorCaseId:
      patch.cursorCaseId === null
        ? undefined
        : patch.cursorCaseId !== undefined
          ? patch.cursorCaseId
          : cur.cursorCaseId,
    reportId:
      patch.reportId === null
        ? undefined
        : patch.reportId !== undefined
          ? patch.reportId
          : cur.reportId,
  };
  return writeSession(csvPath, session);
}

/** `<csv>.run-sessions/<sessionId>/artifacts/` */
export function sessionArtifactsDir(
  csvPath: string,
  sessionId: string,
): string {
  return join(runSessionsDirForCsv(csvPath), sessionId, 'artifacts');
}

const ARTIFACTS_README = `Session 运行报告产物（自包含）

用法：
1. 将本目录整夹拷贝到任意机器
2. 用浏览器打开 index.html（无需联网、无需本服务）

结构：
- index.html              Session 总览（控制台样式）
- report.json / summary.json
- <caseId>/
    index.html            该用例详情（原始 Case + Instructions + 截图）
    case.json             用例完整数据
    midscene.html         Midscene 详细报告
    screenshots/          步骤截图 step-1.png …
`;

/**
 * 将运行报告同步到 Session 产物目录（自包含，可整夹拷贝）。
 * index.html = 总览；每用例独立子目录含详情与 Midscene。
 */
export function writeSessionRunArtifacts(
  csvPath: string,
  sessionId: string,
  report: LibraryRunReport,
): { artifactsPath: string } {
  const session = getLibraryRunSession(csvPath, sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const dir = sessionArtifactsDir(csvPath, sessionId);
  mkdirSync(dir, { recursive: true });

  writePortableSessionReportHtml(dir, report, sessionId);

  const portableReport: LibraryRunReport = {
    ...report,
    htmlPath: 'index.html',
    dumpPath: 'report.json',
    artifactsPath: dir,
  };
  writeFileSync(
    join(dir, 'report.json'),
    JSON.stringify(portableReport, null, 2) + '\n',
    'utf8',
  );
  writeFileSync(
    join(dir, 'summary.json'),
    JSON.stringify(
      {
        sessionId,
        reportId: report.reportId,
        createdAt: report.createdAt,
        finishedAt: report.finishedAt,
        groupName: report.groupName,
        groupDescription: report.groupDescription,
        sdkVersion: report.sdkVersion,
        summary: report.summary,
        cases: report.cases.map((c) => ({
          caseId: c.caseId,
          title: c.title,
          status: c.status,
          durationMs: c.durationMs,
          path: c.path,
          priority: c.priority,
          reason: c.reason,
          dir: c.caseId.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80),
        })),
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  writeFileSync(join(dir, 'README.txt'), ARTIFACTS_README, 'utf8');

  writeSession(csvPath, {
    ...session,
    reportId: report.reportId,
    artifactsPath: dir,
    updatedAt: new Date().toISOString(),
  });

  return { artifactsPath: dir };
}

/** 解析产物文件路径；允许 screenshots/ 子目录；禁止目录穿越。缺省 → index.html */
export function resolveSessionArtifactFile(
  csvPath: string,
  sessionId: string,
  fileName?: string | null,
): string | null {
  const dir = resolve(sessionArtifactsDir(csvPath, sessionId));
  let rel = (fileName?.trim() || 'index.html').replace(/^\/+/, '');
  if (!rel || rel.includes('..')) return null;
  // 规范化分隔符
  rel = rel.split(/[/\\]+/).filter(Boolean).join(sep);
  const full = resolve(join(dir, rel));
  if (full !== dir && !full.startsWith(dir + sep)) {
    return null;
  }
  return existsSync(full) ? full : null;
}
