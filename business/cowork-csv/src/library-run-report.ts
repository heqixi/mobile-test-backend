/**
 * Midscene 兼容的用例库运行报告：构建 dump、写 HTML、索引与 CSV 回写。
 */

import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { getVersion } from '@midscene/core';
import { reportHTMLContent } from '@midscene/core/utils';
import type {
  LibraryCaseRunResult,
  LibraryInstructionRunSummary,
  LibraryRunReport,
  LibraryRunReportSummary,
  LibraryRunReportSummaryItem,
  LibraryRunReportWritebackRequest,
  LibraryRunReportWritebackResponse,
  MidsceneDumpTask,
  MidsceneReportActionDump,
  MidsceneReportDumpAttributes,
  MidsceneTestStatus,
} from '@mtp/domain-case';
import {
  COWORK_CSV_COLUMNS,
  makeCoworkCaseId,
  parseCsv,
  serializeCsv,
} from './csv-io.js';

export { serializeCsv } from './csv-io.js';

export interface BuildCaseRunResultInput {
  caseId: string;
  title: string;
  path?: string[];
  priority?: string;
  sourceFields?: Record<string, string>;
  status: MidsceneTestStatus;
  durationMs: number;
  reason?: string;
  instructionResults?: LibraryInstructionRunSummary[];
  /** 无 instruction 时的兜底截图 */
  screenshotDataUrl?: string;
  deviceType?: string;
  sdkVersion?: string;
}

function defaultResultValue(status: MidsceneTestStatus): string {
  switch (status) {
    case 'passed':
      return 'pass';
    case 'failed':
      return 'fail';
    case 'skipped':
      return 'skip';
    case 'timedOut':
      return 'timeout';
    case 'interrupted':
      return 'interrupted';
    default:
      return status;
  }
}

export function summarizeCaseResults(
  cases: LibraryCaseRunResult[],
): LibraryRunReportSummary {
  const summary: LibraryRunReportSummary = {
    total: cases.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    interrupted: 0,
    timedOut: 0,
  };
  for (const c of cases) {
    if (c.status === 'passed') summary.passed += 1;
    else if (c.status === 'failed') summary.failed += 1;
    else if (c.status === 'skipped') summary.skipped += 1;
    else if (c.status === 'interrupted') summary.interrupted += 1;
    else if (c.status === 'timedOut') summary.timedOut += 1;
  }
  return summary;
}

function normalizeScreenshotBase64(raw?: string): string | undefined {
  const s = raw?.trim();
  if (!s) return undefined;
  if (s.startsWith('data:image/')) return s;
  // raw base64 → data URI
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 64) {
    return `data:image/png;base64,${s.replace(/\s+/g, '')}`;
  }
  return undefined;
}

function recorderFromScreenshot(
  dataUrl: string | undefined,
  ts: number,
  description?: string,
): MidsceneDumpTask['recorder'] {
  const base64 = normalizeScreenshotBase64(dataUrl);
  if (!base64) return undefined;
  return [
    {
      type: 'screenshot',
      ts,
      screenshot: { base64, capturedAt: ts },
      description,
    },
  ];
}

function buildDumpTasks(
  input: BuildCaseRunResultInput,
): MidsceneDumpTask[] {
  const results = input.instructionResults ?? [];
  if (results.length === 0) {
    const start = Date.now() - Math.max(0, input.durationMs);
    const end = Date.now();
    return [
      {
        taskId: `${input.caseId}-result`,
        type: 'Log',
        subType: 'CaseResult',
        status: input.status === 'passed' ? 'finished' : 'failed',
        param: { content: input.title },
        thought: input.reason || input.status,
        errorMessage:
          input.status === 'passed' ? undefined : input.reason || input.status,
        timing: {
          start,
          end,
          cost: Math.max(0, input.durationMs),
        },
        recorder: recorderFromScreenshot(
          input.screenshotDataUrl,
          end,
          'case result',
        ),
      },
    ];
  }

  let cursor = Date.now() - Math.max(0, input.durationMs);
  return results.map((r, i) => {
    const cost = Math.max(0, r.durationMs ?? 0);
    const start = cursor;
    const end = cursor + cost;
    cursor = end;
    const failed = !r.satisfied || r.status === 'failed' || r.status === 'aborted';
    return {
      taskId: r.instructionId || `${input.caseId}-step-${i + 1}`,
      type: 'Log' as const,
      subType: 'Screenshot',
      status: failed ? ('failed' as const) : ('finished' as const),
      param: { content: r.label || r.instructionId },
      thought: r.reason || r.status,
      errorMessage: failed ? r.reason || r.status : undefined,
      timing: { start, end, cost },
      recorder: recorderFromScreenshot(
        r.screenshotDataUrl,
        end,
        r.label || r.instructionId,
      ),
    };
  });
}

/**
 * 构造 Midscene 兼容的单用例 ReportActionDump + attributes。
 */
export function buildLibraryCaseRunResult(
  input: BuildCaseRunResultInput,
): LibraryCaseRunResult {
  const sdkVersion = input.sdkVersion || getVersion() || 'midscene';
  const descriptionParts = [
    input.path?.length ? `目录：${input.path.join(' / ')}` : null,
    input.priority ? `等级：${input.priority}` : null,
    input.reason ? `结果：${input.reason}` : null,
  ].filter(Boolean);

  const dump: MidsceneReportActionDump = {
    sdkVersion,
    groupName: input.title,
    groupDescription: descriptionParts.join(' · ') || undefined,
    modelBriefs: [],
    deviceType: input.deviceType,
    executions: [
      {
        id: input.caseId,
        logTime: Date.now(),
        name: input.title,
        description: descriptionParts.join('\n') || undefined,
        tasks: buildDumpTasks(input),
      },
    ],
  };

  const attributes: MidsceneReportDumpAttributes = {
    playwright_test_id: input.caseId,
    playwright_test_title: input.title,
    playwright_test_description:
      descriptionParts.join(' · ') ||
      input.sourceFields?.['用例标题'] ||
      input.title,
    playwright_test_status: input.status,
    playwright_test_duration: Math.max(0, Math.round(input.durationMs)),
  };

  return {
    caseId: input.caseId,
    title: input.title,
    path: input.path,
    priority: input.priority,
    sourceFields: input.sourceFields,
    status: input.status,
    durationMs: input.durationMs,
    reason: input.reason,
    instructionResults: input.instructionResults,
    dump,
    attributes,
  };
}

export function reportsDirForCsv(csvPath: string): string {
  const abs = resolve(csvPath);
  return join(dirname(abs), `${basename(abs)}.reports`);
}

function indexPath(reportsDir: string): string {
  return join(reportsDir, 'index.json');
}

function reportJsonPath(reportsDir: string, reportId: string): string {
  return join(reportsDir, `${reportId}.json`);
}

function reportHtmlPath(reportsDir: string, reportId: string): string {
  return join(reportsDir, `${reportId}.html`);
}

type ReportIndexFile = {
  reports: LibraryRunReportSummaryItem[];
};

function loadIndex(reportsDir: string): ReportIndexFile {
  const p = indexPath(reportsDir);
  if (!existsSync(p)) return { reports: [] };
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as ReportIndexFile;
  } catch {
    return { reports: [] };
  }
}

function saveIndex(reportsDir: string, index: ReportIndexFile): void {
  writeFileSync(indexPath(reportsDir), JSON.stringify(index, null, 2), 'utf8');
}

function toSummaryItem(report: LibraryRunReport): LibraryRunReportSummaryItem {
  return {
    reportId: report.reportId,
    createdAt: report.createdAt,
    finishedAt: report.finishedAt,
    groupName: report.groupName,
    groupDescription: report.groupDescription,
    summary: report.summary,
    htmlPath: report.htmlPath,
    writtenBackAt: report.writtenBackAt,
  };
}

/**
 * 将用例结果写成 Midscene HTML（script[type=midscene_web_dump]）并落盘索引。
 */
export function persistLibraryRunReport(options: {
  csvPath: string;
  groupName: string;
  groupDescription?: string;
  deviceType?: string;
  cases: LibraryCaseRunResult[];
  reportId?: string;
  createdAt?: string;
}): LibraryRunReport {
  const reportsDir = reportsDirForCsv(options.csvPath);
  mkdirSync(reportsDir, { recursive: true });

  const reportId =
    options.reportId ??
    `lib-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}-${randomUUID().slice(0, 8)}`;
  const createdAt = options.createdAt ?? new Date().toISOString();
  const finishedAt = new Date().toISOString();
  const sdkVersion = getVersion() || 'midscene';
  const htmlPath = reportHtmlPath(reportsDir, reportId);
  const dumpPath = reportJsonPath(reportsDir, reportId);

  // Midscene HTML：每个用例一条 dump script + playwright_* attributes。
  // 注意：必须全程 append=true。若首条用 append=false、后续 append=true，
  // Midscene 会因 reportInitializedMap 未标记而用空模板覆盖首条 dump（失败用例丢失）。
  options.cases.forEach((c) => {
    const dumpString = JSON.stringify(c.dump);
    reportHTMLContent(
      {
        dumpString,
        attributes: {
          ...c.attributes,
          playwright_test_duration: c.attributes.playwright_test_duration,
        },
      },
      htmlPath,
      true,
    );
  });

  if (options.cases.length === 0) {
    reportHTMLContent(
      {
        dumpString: JSON.stringify({
          sdkVersion,
          groupName: options.groupName,
          groupDescription: options.groupDescription,
          modelBriefs: [],
          executions: [],
          deviceType: options.deviceType,
        } satisfies MidsceneReportActionDump),
        attributes: {
          playwright_test_id: reportId,
          playwright_test_title: options.groupName,
          playwright_test_description: options.groupDescription ?? '',
          playwright_test_status: 'skipped',
          playwright_test_duration: 0,
        },
      },
      htmlPath,
      false,
    );
  }

  const report: LibraryRunReport = {
    reportId,
    createdAt,
    finishedAt,
    groupName: options.groupName,
    groupDescription: options.groupDescription,
    sdkVersion,
    deviceType: options.deviceType,
    htmlPath,
    dumpPath,
    cases: options.cases,
    summary: summarizeCaseResults(options.cases),
  };

  writeFileSync(dumpPath, JSON.stringify(report, null, 2), 'utf8');

  const index = loadIndex(reportsDir);
  index.reports = [
    toSummaryItem(report),
    ...index.reports.filter((r) => r.reportId !== reportId),
  ];
  saveIndex(reportsDir, index);

  return report;
}

export function listLibraryRunReports(csvPath: string): LibraryRunReportSummaryItem[] {
  return loadIndex(reportsDirForCsv(csvPath)).reports;
}

export function getLibraryRunReport(
  csvPath: string,
  reportId: string,
): LibraryRunReport | null {
  const p = reportJsonPath(reportsDirForCsv(csvPath), reportId);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as LibraryRunReport;
  } catch {
    return null;
  }
}

/**
 * 将报告中的用例结果回写到 CSV「测试结果」列。
 */
export function writebackLibraryRunReportToCsv(options: {
  csvPath: string;
  reportId: string;
  body?: LibraryRunReportWritebackRequest;
}): LibraryRunReportWritebackResponse {
  const csvPath = resolve(options.csvPath);
  const report = getLibraryRunReport(csvPath, options.reportId);
  if (!report) {
    throw new Error(`Report not found: ${options.reportId}`);
  }

  const text = readFileSync(csvPath, 'utf8');
  const table = parseCsv(text);
  if (table.length < 2) {
    throw new Error(`CSV empty or invalid: ${csvPath}`);
  }

  const header = table[0]!.map((h) => h.replace(/^\uFEFF/, '').trim());
  const resultCol = header.indexOf(COWORK_CSV_COLUMNS.testResult);
  const titleCol = header.indexOf(COWORK_CSV_COLUMNS.title);
  if (resultCol < 0) {
    throw new Error(
      `CSV missing column 「${COWORK_CSV_COLUMNS.testResult}」`,
    );
  }

  // caseId（与 adapter 一致：有用例编号用编号，否则 path|title 稳定哈希）
  const caseIds = new Set(
    options.body?.caseIds?.length
      ? options.body.caseIds
      : report.cases.map((c) => c.caseId),
  );
  const byCaseId = new Map(
    report.cases.filter((c) => caseIds.has(c.caseId)).map((c) => [c.caseId, c]),
  );

  const caseNoCol = header.indexOf(COWORK_CSV_COLUMNS.caseNo);
  const updatedCaseIds: string[] = [];

  for (let r = 1; r < table.length; r++) {
    const line = table[r]!;
    while (line.length < header.length) line.push('');
    const title = (titleCol >= 0 ? line[titleCol] : '')?.trim() ?? '';
    if (!title) continue;

    const path: string[] = [];
    for (let d = 1; d <= 15; d++) {
      const di = header.indexOf(`目录${d}`);
      const v = di >= 0 ? (line[di] ?? '').trim() : '';
      if (v) path.push(v);
    }
    const numbered =
      caseNoCol >= 0 ? (line[caseNoCol] ?? '').trim() : '';
    const caseId = makeCoworkCaseId(title, path, numbered);
    const result = byCaseId.get(caseId);
    if (!result) continue;

    const mapped =
      options.body?.resultValueByStatus?.[result.status] ??
      defaultResultValue(result.status);
    line[resultCol] = mapped;
    updatedCaseIds.push(caseId);
  }

  writeFileSync(csvPath, serializeCsv(table), 'utf8');

  const writtenBackAt = new Date().toISOString();
  report.writtenBackAt = writtenBackAt;
  writeFileSync(
    reportJsonPath(reportsDirForCsv(csvPath), report.reportId),
    JSON.stringify(report, null, 2),
    'utf8',
  );

  const index = loadIndex(reportsDirForCsv(csvPath));
  index.reports = index.reports.map((item) =>
    item.reportId === report.reportId
      ? { ...item, writtenBackAt }
      : item,
  );
  saveIndex(reportsDirForCsv(csvPath), index);

  return {
    reportId: report.reportId,
    updatedCaseIds,
    csvPath,
    writtenBackAt,
  };
}
