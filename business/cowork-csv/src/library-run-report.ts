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
import { fileURLToPath } from 'node:url';
import { getVersion } from '@midscene/core';
import { insertScriptBeforeClosingHtml } from '@midscene/core/utils';
import { escapeScriptTag } from '@midscene/shared/utils';
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

const here = dirname(fileURLToPath(import.meta.url));
const REPORT_TEMPLATE_PATH = resolve(
  here,
  '../assets/midscene-report-template.html',
);

/**
 * Vendored @midscene/core 若未注入报告 SPA 模板，getReportTpl() 会变成
 * REPLACE_ME_WITH_REPORT_HTML（无 </html>），导致 reportHTMLContent(append)
 * 抛错。因此使用本包内已提取的完整报告壳，并自行追加 dump script。
 */
function loadReportHtmlTemplate(): string {
  if (!existsSync(REPORT_TEMPLATE_PATH)) {
    throw new Error(
      `Midscene report template missing: ${REPORT_TEMPLATE_PATH}. ` +
        'Restore business/cowork-csv/assets/midscene-report-template.html',
    );
  }
  const tpl = readFileSync(REPORT_TEMPLATE_PATH, 'utf8');
  if (!tpl.includes('</html>')) {
    throw new Error(
      `Invalid Midscene report template (no </html>): ${REPORT_TEMPLATE_PATH}`,
    );
  }
  return tpl;
}

function ensureReportHtmlShell(htmlPath: string): void {
  mkdirSync(dirname(htmlPath), { recursive: true });
  if (existsSync(htmlPath)) {
    const existing = readFileSync(htmlPath, 'utf8');
    // 覆盖 vendored Midscene 写出的占位符，或任何缺 </html> 的残缺文件
    if (
      existing.includes('</html>') &&
      !existing.includes('REPLACE_ME_WITH_REPORT_HTML')
    ) {
      return;
    }
  }
  writeFileSync(htmlPath, loadReportHtmlTemplate(), 'utf8');
}

function appendCaseDumpToReportHtml(
  htmlPath: string,
  dumpString: string,
  attributes: MidsceneReportDumpAttributes,
): void {
  ensureReportHtmlShell(htmlPath);
  const attributesArr = Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) => `${key}="${encodeURIComponent(String(value))}"`,
    );
  const dumpContent =
    `<script type="midscene_web_dump" type="application/json" ${attributesArr.join(' ')}>\n` +
    `${escapeScriptTag(dumpString)}\n` +
    `</script>`;
  insertScriptBeforeClosingHtml(htmlPath, dumpContent);
}

/** 单用例 Midscene HTML（自包含，可离线打开） */
export function writeCaseMidsceneHtml(
  htmlPath: string,
  caseResult: LibraryCaseRunResult,
): void {
  mkdirSync(dirname(htmlPath), { recursive: true });
  // 每次重写整份壳，避免增量残留
  writeFileSync(htmlPath, loadReportHtmlTemplate(), 'utf8');
  appendCaseDumpToReportHtml(
    htmlPath,
    JSON.stringify(caseResult.dump ?? {}),
    caseResult.attributes ?? {
      playwright_test_id: caseResult.caseId,
      playwright_test_title: caseResult.title,
      playwright_test_description: caseResult.reason ?? '',
      playwright_test_status: caseResult.status,
      playwright_test_duration: Math.max(0, Math.round(caseResult.durationMs)),
    },
  );
}
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
    const thoughtParts = [
      r.action ? `Action: ${r.action}` : null,
      r.expectation ? `Expectation: ${r.expectation}` : null,
      r.executorCommands?.length
        ? `Commands:\n${r.executorCommands.map((c) => `- ${c}`).join('\n')}`
        : null,
      r.reason || null,
    ].filter(Boolean);
    return {
      taskId: r.instructionId || `${input.caseId}-step-${i + 1}`,
      type: 'Log' as const,
      subType: r.action?.slice(0, 48) || r.label || `Instruction ${i + 1}`,
      status: failed ? ('failed' as const) : ('finished' as const),
      param: {
        content: r.label || r.instructionId,
        action: r.action,
        expectation: r.expectation,
        executorCommands: r.executorCommands,
      },
      thought: thoughtParts.join('\n\n') || r.status,
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
 * 传入 reportId 时：合并已有 cases（按 caseId 覆盖），HTML 只追加新增 case 的 dump。
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

  const existing =
    options.reportId != null
      ? getLibraryRunReport(options.csvPath, options.reportId)
      : null;

  const reportId =
    options.reportId ??
    `lib-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}-${randomUUID().slice(0, 8)}`;
  const createdAt =
    existing?.createdAt ?? options.createdAt ?? new Date().toISOString();
  const finishedAt = new Date().toISOString();
  const sdkVersion = (existing?.sdkVersion ?? getVersion()) || 'midscene';
  const htmlPath = reportHtmlPath(reportsDir, reportId);
  const dumpPath = reportJsonPath(reportsDir, reportId);

  const mergedById = new Map<string, LibraryCaseRunResult>();
  for (const c of existing?.cases ?? []) {
    mergedById.set(c.caseId, c);
  }
  const newlyAppended: LibraryCaseRunResult[] = [];
  for (const c of options.cases) {
    const had = mergedById.has(c.caseId);
    mergedById.set(c.caseId, c);
    if (!had) newlyAppended.push(c);
  }
  // 保持：已有顺序 + 新 case 追加
  const cases: LibraryCaseRunResult[] = [];
  const seen = new Set<string>();
  for (const c of existing?.cases ?? []) {
    const next = mergedById.get(c.caseId);
    if (next) {
      cases.push(next);
      seen.add(c.caseId);
    }
  }
  for (const c of options.cases) {
    if (!seen.has(c.caseId)) {
      cases.push(mergedById.get(c.caseId)!);
      seen.add(c.caseId);
    }
  }

  const toAppendHtml =
    existing == null ? cases : newlyAppended.length > 0 ? newlyAppended : [];

  for (const c of toAppendHtml) {
    appendCaseDumpToReportHtml(htmlPath, JSON.stringify(c.dump), {
      ...c.attributes,
      playwright_test_duration: c.attributes.playwright_test_duration,
    });
  }

  if (cases.length === 0 && !existsSync(htmlPath)) {
    appendCaseDumpToReportHtml(
      htmlPath,
      JSON.stringify({
        sdkVersion,
        groupName: options.groupName,
        groupDescription: options.groupDescription,
        modelBriefs: [],
        executions: [],
        deviceType: options.deviceType ?? existing?.deviceType,
      } satisfies MidsceneReportActionDump),
      {
        playwright_test_id: reportId,
        playwright_test_title: options.groupName,
        playwright_test_description: options.groupDescription ?? '',
        playwright_test_status: 'skipped',
        playwright_test_duration: 0,
      },
    );
  }

  const report: LibraryRunReport = {
    reportId,
    createdAt,
    finishedAt,
    groupName: options.groupName || existing?.groupName || 'library run',
    groupDescription:
      options.groupDescription ?? existing?.groupDescription,
    sdkVersion,
    deviceType: options.deviceType ?? existing?.deviceType,
    htmlPath,
    dumpPath,
    cases,
    summary: summarizeCaseResults(cases),
    writtenBackAt: existing?.writtenBackAt,
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
