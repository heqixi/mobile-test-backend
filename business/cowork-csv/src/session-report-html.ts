/**
 * Session 自包含运行报告产物：
 *
 * artifacts/
 *   index.html                 # 总览（控制台样式）
 *   report.json / summary.json / README.txt
 *   <caseId>/
 *     index.html               # 该用例详情
 *     case.json
 *     midscene.html            # Midscene 详细报告
 *     screenshots/step-N.png
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type {
  LibraryCaseRunResult,
  LibraryInstructionRunSummary,
  LibraryRunReport,
  MidsceneTestStatus,
} from '@mtp/domain-case';
import { writeCaseMidsceneHtml } from './library-run-report.js';

type DumpTask = {
  taskId?: string;
  status?: string;
  subType?: string;
  thought?: string;
  errorMessage?: string;
  timing?: { cost?: number };
  recorder?: Array<{
    type?: string;
    screenshot?: { base64?: string };
    description?: string;
  }>;
};

type PortableStep = {
  index: number;
  label: string;
  status: string;
  satisfied?: boolean;
  action?: string;
  expectation?: string;
  executorCommands?: string[];
  reason?: string;
  durationMs?: number;
  /** 相对当前 HTML 的截图路径 */
  screenshotRel?: string;
};

type PortableCase = {
  caseId: string;
  safeDir: string;
  title: string;
  status: MidsceneTestStatus;
  path?: string[];
  priority?: string;
  durationMs: number;
  reason?: string;
  sourceFields?: Record<string, string>;
  steps: PortableStep[];
};

const SOURCE_FIELD_ORDER = [
  '用例标题',
  '前提条件',
  '操作步骤',
  '预期结果',
  '用例等级',
  '目录1',
  '目录2',
  '目录3',
] as const;

const RESERVED_TOP_NAMES = new Set([
  'index.html',
  'report.json',
  'summary.json',
  'readme.txt',
  'screenshots',
  'midscene.html',
]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMs(ms?: number): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'passed':
    case 'completed':
    case 'finished':
      return '通过';
    case 'failed':
      return '失败';
    case 'timedOut':
      return '超时';
    case 'interrupted':
    case 'aborted':
    case 'cancelled':
      return '暂停';
    case 'skipped':
      return '跳过';
    default:
      return status || '—';
  }
}

function statusClass(status: string): string {
  switch (status) {
    case 'passed':
    case 'completed':
    case 'finished':
      return 'pass';
    case 'failed':
    case 'timedOut':
      return 'fail';
    case 'interrupted':
    case 'aborted':
    case 'cancelled':
      return 'warn';
    default:
      return 'muted';
  }
}

export function safeCaseDirName(caseId: string): string {
  const raw = caseId.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'case';
  if (RESERVED_TOP_NAMES.has(raw.toLowerCase())) return `case-${raw}`;
  return raw;
}

function parseDataUrl(dataUrl: string): { ext: string; buffer: Buffer } | null {
  const s = dataUrl.trim();
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(s);
  if (m) {
    const mime = m[1]!.toLowerCase();
    const ext =
      mime.includes('jpeg') || mime.includes('jpg')
        ? 'jpg'
        : mime.includes('webp')
          ? 'webp'
          : mime.includes('gif')
            ? 'gif'
            : 'png';
    try {
      return { ext, buffer: Buffer.from(m[2]!.replace(/\s+/g, ''), 'base64') };
    } catch {
      return null;
    }
  }
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 64) {
    try {
      return {
        ext: 'png',
        buffer: Buffer.from(s.replace(/\s+/g, ''), 'base64'),
      };
    } catch {
      return null;
    }
  }
  return null;
}

function dumpTasks(c: LibraryCaseRunResult): DumpTask[] {
  const dump = c.dump as
    | { executions?: Array<{ tasks?: DumpTask[] }> }
    | undefined;
  return (dump?.executions ?? []).flatMap((e) => e.tasks ?? []);
}

function taskShot(task: DumpTask): string | undefined {
  const rec = task.recorder?.find((r) => r.screenshot?.base64);
  return rec?.screenshot?.base64?.trim();
}

function writeStepScreenshot(
  caseDir: string,
  stepIndex: number,
  dataUrl: string | undefined,
): string | undefined {
  if (!dataUrl?.trim()) return undefined;
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return undefined;
  const shotsDir = join(caseDir, 'screenshots');
  mkdirSync(shotsDir, { recursive: true });
  const fileName = `step-${stepIndex}.${parsed.ext}`;
  writeFileSync(join(shotsDir, fileName), parsed.buffer);
  return `screenshots/${fileName}`;
}

function stepsForCase(
  c: LibraryCaseRunResult,
  caseDir: string,
): PortableStep[] {
  const irs = c.instructionResults ?? [];
  if (irs.length > 0) {
    return irs.map((ir: LibraryInstructionRunSummary, i) => {
      const shot =
        ir.screenshotDataUrl ||
        (() => {
          const tasks = dumpTasks(c);
          return tasks[i] ? taskShot(tasks[i]!) : undefined;
        })();
      return {
        index: i + 1,
        label: ir.label || `Instruction #${i + 1}`,
        status: ir.status,
        satisfied: ir.satisfied,
        action: ir.action,
        expectation: ir.expectation,
        executorCommands: ir.executorCommands,
        reason: ir.reason,
        durationMs: ir.durationMs,
        screenshotRel: writeStepScreenshot(caseDir, i + 1, shot),
      };
    });
  }
  return dumpTasks(c).map((t, i) => ({
    index: i + 1,
    label: t.subType || `步骤 ${i + 1}`,
    status: t.status || '—',
    reason: t.errorMessage || t.thought,
    durationMs: t.timing?.cost,
    screenshotRel: writeStepScreenshot(caseDir, i + 1, taskShot(t)),
  }));
}

function sourceRows(
  fields?: Record<string, string>,
): Array<{ key: string; value: string }> {
  if (!fields) return [];
  const rows: Array<{ key: string; value: string }> = [];
  for (const key of SOURCE_FIELD_ORDER) {
    const v = fields[key]?.trim();
    if (v) rows.push({ key, value: v });
  }
  if (rows.length === 0) {
    for (const [key, value] of Object.entries(fields)) {
      const v = value?.trim();
      if (v) rows.push({ key, value: v });
    }
  }
  return rows;
}

const SHARED_CSS = `
:root { color-scheme: light; --bg:#f1f5f9; --card:#fff; --line:#e2e8f0; --text:#0f172a; --muted:#64748b; --pass:#047857; --fail:#b91c1c; --warn:#b45309; }
* { box-sizing: border-box; }
body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background:var(--bg); color:var(--text); }
.wrap { max-width: 1180px; margin: 0 auto; padding: 20px 16px 40px; }
.header h1 { margin:0 0 6px; font-size:20px; }
.header p { margin:0; color:var(--muted); font-size:13px; }
.nav { margin: 10px 0 16px; font-size:13px; }
.nav a { color:#2563eb; text-decoration:none; }
.nav a:hover { text-decoration:underline; }
.filters { display:flex; flex-wrap:wrap; gap:8px; margin:16px 0; }
.filters button { border:1px solid var(--line); background:#fff; border-radius:8px; padding:6px 10px; cursor:pointer; font-size:12px; }
.filters button.active { border-color:#2563eb; background:#eff6ff; font-weight:650; }
.layout { display:grid; grid-template-columns: minmax(200px,280px) 1fr; gap:12px; min-height:420px; }
.list { background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:6px; overflow:auto; max-height:78vh; display:flex; flex-direction:column; gap:4px; }
.case-item { display:grid; grid-template-columns:auto 1fr auto; gap:8px; align-items:center; width:100%; text-align:left; border:1px solid transparent; background:transparent; border-radius:8px; padding:8px; cursor:pointer; font-size:12px; color:inherit; text-decoration:none; }
.case-item:hover { background:#f1f5f9; }
.case-item .title { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
.case-item.hidden { display:none; }
.detail { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px; overflow:auto; max-height:78vh; }
.pill { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:650; background:#f1f5f9; color:#475569; }
.pill.pass { background:#ecfdf5; color:var(--pass); }
.pill.fail { background:#fef2f2; color:var(--fail); }
.pill.warn { background:#fffbeb; color:var(--warn); }
.muted { color:var(--muted); }
.hero { border:1px solid var(--line); border-radius:10px; padding:14px 16px; background:linear-gradient(180deg,#f8fafc 0%,#fff 72%); margin-bottom:14px; }
.hero-top { display:flex; flex-wrap:wrap; align-items:baseline; gap:8px 10px; }
.hero h2 { margin:0; font-size:16px; font-weight:650; }
.reason { margin:10px 0 0; font-size:13px; line-height:1.45; }
.reason.fail { color:var(--fail); }
.source { margin:12px 0 0; display:grid; gap:8px; }
.src-row { display:grid; grid-template-columns:88px 1fr; gap:10px; padding-top:8px; border-top:1px solid #eef2f7; }
.src-row:first-child { border-top:0; padding-top:0; }
.src-row dt { margin:0; font-size:11px; font-weight:650; color:var(--muted); }
.src-row dd { margin:0; font-size:13px; line-height:1.55; white-space:pre-wrap; word-break:break-word; }
.steps-head { display:flex; justify-content:space-between; align-items:baseline; margin:4px 0 10px; gap:10px; }
.steps-head h3 { margin:0; font-size:13px; }
.links { display:flex; flex-wrap:wrap; gap:8px; }
.links a { font-size:12px; padding:4px 10px; border:1px solid var(--line); border-radius:8px; background:#fff; color:#2563eb; text-decoration:none; }
.links a:hover { background:#eff6ff; }
.steps { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.step { display:grid; grid-template-columns:minmax(0,1fr) 140px; gap:12px; border:1px solid var(--line); border-radius:10px; padding:12px; background:#fff; }
.step.is-failed { border-color:#fecaca; background:#fffbfb; }
.step-head { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:10px; }
.idx { font-size:11px; font-weight:700; color:var(--muted); }
.fields { display:flex; flex-direction:column; gap:8px; }
.field { border-radius:8px; background:#f8fafc; padding:8px 10px; }
.field.emphasis { background:#eff6ff; border:1px solid #dbeafe; }
.field.command { border:1px solid #e2e8f0; }
.field.fail { background:#fef2f2; border:1px solid #fecaca; }
.lab { display:block; font-size:10px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--muted); margin-bottom:4px; }
.field pre, .field p { margin:0; font-size:12.5px; line-height:1.5; white-space:pre-wrap; word-break:break-word; font-family:inherit; }
.cmds { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; }
.cmds code { display:block; font-size:12px; line-height:1.45; background:#fff; border:1px solid #e2e8f0; border-radius:6px; padding:6px 8px; white-space:pre-wrap; word-break:break-word; }
.shot { margin:0; border-radius:8px; overflow:hidden; border:1px solid var(--line); background:#0f172a08; min-height:96px; display:flex; align-items:center; justify-content:center; }
.shot img { display:block; width:100%; max-height:160px; object-fit:contain; background:#0b1220; }
.shot-empty { font-size:12px; padding:16px 8px; text-align:center; }
@media (max-width:900px) {
  .layout { grid-template-columns:1fr; }
  .list, .detail { max-height:none; }
  .step { grid-template-columns:1fr; }
  .src-row { grid-template-columns:1fr; gap:4px; }
}
`;

function renderCaseBody(c: PortableCase, opts?: { showMidsceneLink?: boolean }): string {
  const rows = sourceRows(c.sourceFields);
  const stepsHtml =
    c.steps.length === 0
      ? `<p class="muted">无 Instruction 步骤</p>`
      : `<ol class="steps">${c.steps
          .map((step) => {
            const failed =
              step.satisfied === false ||
              step.status === 'failed' ||
              step.status === 'aborted' ||
              step.status === 'cancelled';
            const st = failed
              ? 'failed'
              : step.satisfied
                ? 'passed'
                : step.status;
            const fields = [
              step.action
                ? `<div class="field"><span class="lab">Action</span><pre>${escapeHtml(step.action)}</pre></div>`
                : '',
              step.expectation
                ? `<div class="field emphasis"><span class="lab">Expectation</span><pre>${escapeHtml(step.expectation)}</pre></div>`
                : '',
              step.executorCommands?.length
                ? `<div class="field command"><span class="lab">Executor 命令</span><ul class="cmds">${step.executorCommands
                    .map((cmd) => `<li><code>${escapeHtml(cmd)}</code></li>`)
                    .join('')}</ul></div>`
                : '',
              step.reason
                ? `<div class="field${failed ? ' fail' : ''}"><span class="lab">${failed ? '失败原因' : '说明'}</span><p>${escapeHtml(step.reason)}</p></div>`
                : '',
            ]
              .filter(Boolean)
              .join('');
            const shot = step.screenshotRel
              ? `<img src="${escapeHtml(step.screenshotRel)}" alt="step ${step.index}" />`
              : `<div class="shot-empty muted">无截图</div>`;
            return `<li class="step${failed ? ' is-failed' : ''}">
  <div class="step-main">
    <header class="step-head">
      <span class="idx">#${step.index}</span>
      <span class="pill ${statusClass(st)}">${escapeHtml(statusLabel(st))}</span>
      <strong>${escapeHtml(step.label)}</strong>
      <span class="muted">${escapeHtml(formatMs(step.durationMs))}</span>
    </header>
    <div class="fields">${fields || '<p class="muted">无步骤详情</p>'}</div>
  </div>
  <figure class="shot">${shot}</figure>
</li>`;
          })
          .join('\n')}</ol>`;

  const sourceHtml =
    rows.length === 0
      ? ''
      : `<dl class="source">${rows
          .map(
            (r) =>
              `<div class="src-row"><dt>${escapeHtml(r.key)}</dt><dd>${escapeHtml(r.value)}</dd></div>`,
          )
          .join('')}</dl>`;

  const links = opts?.showMidsceneLink
    ? `<div class="links"><a href="./midscene.html" target="_blank" rel="noreferrer">打开 Midscene 详细报告</a><a href="../index.html">返回总览</a></div>`
    : '';

  return `<article class="hero">
  <div class="hero-top">
    <span class="pill ${statusClass(c.status)}">${escapeHtml(statusLabel(c.status))}</span>
    <h2>${escapeHtml(c.title)}</h2>
    <span class="muted">${escapeHtml(c.path?.join(' / ') || '—')}${c.priority ? ` · ${escapeHtml(c.priority)}` : ''} · ${escapeHtml(formatMs(c.durationMs))}</span>
  </div>
  ${c.reason ? `<p class="reason${c.status === 'failed' || c.status === 'timedOut' ? ' fail' : ''}">${c.status === 'failed' || c.status === 'timedOut' ? '失败原因' : '说明'}：${escapeHtml(c.reason)}</p>` : ''}
  ${sourceHtml}
  ${links}
</article>
<div class="steps-head"><h3>Instructions</h3><span class="muted">${c.steps.length} 步</span></div>
${stepsHtml}`;
}

function clearPreviousCaseDirs(artifactsDir: string): void {
  // 清掉旧的顶层 screenshots / midscene.html
  for (const name of ['screenshots', 'midscene.html']) {
    const p = join(artifactsDir, name);
    if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  }
  if (!existsSync(artifactsDir)) return;
  for (const ent of readdirSync(artifactsDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (RESERVED_TOP_NAMES.has(ent.name.toLowerCase())) continue;
    // 用例目录：含 case.json 或 midscene.html 才删，避免误删
    const caseJson = join(artifactsDir, ent.name, 'case.json');
    const mid = join(artifactsDir, ent.name, 'midscene.html');
    if (existsSync(caseJson) || existsSync(mid) || ent.name.startsWith('cowork-') || ent.name.startsWith('case-')) {
      rmSync(join(artifactsDir, ent.name), { recursive: true, force: true });
    }
  }
}

function writeCaseDetailHtml(
  caseDir: string,
  portable: PortableCase,
  sessionId: string,
): void {
  const body = renderCaseBody(portable, { showMidsceneLink: true });
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(portable.title)} · ${escapeHtml(portable.caseId)}</title>
<style>${SHARED_CSS}</style>
</head>
<body>
<div class="wrap">
  <header class="header">
    <h1>用例详情</h1>
    <p>Session ${escapeHtml(sessionId)} · ${escapeHtml(portable.caseId)}</p>
  </header>
  <nav class="nav"><a href="../index.html">← 返回 Session 总览</a></nav>
  <main class="detail" style="max-height:none">${body}</main>
</div>
</body>
</html>
`;
  writeFileSync(join(caseDir, 'index.html'), html, 'utf8');
}

/**
 * 写出 Session 产物：总览 index.html + 每用例子目录（详情 + midscene + 截图）。
 */
export function writePortableSessionReportHtml(
  artifactsDir: string,
  report: LibraryRunReport,
  sessionId: string,
): { screenshotCount: number; caseDirs: string[] } {
  mkdirSync(artifactsDir, { recursive: true });
  clearPreviousCaseDirs(artifactsDir);

  const portableCases: PortableCase[] = [];
  let screenshotCount = 0;
  const caseDirs: string[] = [];

  for (const c of report.cases) {
    const safeDir = safeCaseDirName(c.caseId);
    const caseDir = join(artifactsDir, safeDir);
    mkdirSync(caseDir, { recursive: true });
    caseDirs.push(safeDir);

    const steps = stepsForCase(c, caseDir);
    screenshotCount += steps.filter((s) => s.screenshotRel).length;
    const portable: PortableCase = {
      caseId: c.caseId,
      safeDir,
      title: c.title,
      status: c.status,
      path: c.path,
      priority: c.priority,
      durationMs: c.durationMs,
      reason: c.reason,
      sourceFields: c.sourceFields,
      steps,
    };
    portableCases.push(portable);

    writeFileSync(
      join(caseDir, 'case.json'),
      JSON.stringify(
        {
          caseId: c.caseId,
          title: c.title,
          path: c.path,
          priority: c.priority,
          sourceFields: c.sourceFields,
          status: c.status,
          durationMs: c.durationMs,
          reason: c.reason,
          instructionResults: (c.instructionResults ?? []).map((ir) => ({
            instructionId: ir.instructionId,
            label: ir.label,
            action: ir.action,
            expectation: ir.expectation,
            executorCommands: ir.executorCommands,
            satisfied: ir.satisfied,
            status: ir.status,
            reason: ir.reason,
            durationMs: ir.durationMs,
            // 截图已落盘，不重复写 base64
            screenshot: steps.find(
              (s) =>
                s.label === ir.label ||
                s.index ===
                  (c.instructionResults?.indexOf(ir) ?? -1) + 1,
            )?.screenshotRel,
          })),
          steps: steps.map((s) => ({
            index: s.index,
            label: s.label,
            status: s.status,
            satisfied: s.satisfied,
            action: s.action,
            expectation: s.expectation,
            executorCommands: s.executorCommands,
            reason: s.reason,
            durationMs: s.durationMs,
            screenshot: s.screenshotRel,
          })),
          files: {
            detailHtml: 'index.html',
            midsceneHtml: 'midscene.html',
            screenshotsDir: 'screenshots',
          },
        },
        null,
        2,
      ) + '\n',
      'utf8',
    );

    writeCaseDetailHtml(caseDir, portable, sessionId);
    writeCaseMidsceneHtml(join(caseDir, 'midscene.html'), c);
  }

  const summary = report.summary;
  const listHtml = portableCases
    .map(
      (c) =>
        `<a class="case-item" data-status="${escapeHtml(c.status)}" href="./${escapeHtml(c.safeDir)}/index.html">
  <span class="pill ${statusClass(c.status)}">${escapeHtml(statusLabel(c.status))}</span>
  <span class="title">${escapeHtml(c.title)}</span>
  <span class="muted">${escapeHtml(formatMs(c.durationMs))}</span>
</a>`,
    )
    .join('\n');

  const overviewHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(report.groupName || '运行报告')} · ${escapeHtml(sessionId)}</title>
<style>${SHARED_CSS}</style>
</head>
<body>
<div class="wrap">
  <header class="header">
    <h1>运行报告</h1>
    <p>${escapeHtml(report.groupName)}${report.finishedAt ? ` · ${escapeHtml(new Date(report.finishedAt).toLocaleString())}` : ''} · Session ${escapeHtml(sessionId)} · ${portableCases.length} 用例 · 截图 ${screenshotCount} 张</p>
  </header>
  <div class="filters" role="tablist">
    <button type="button" class="active" data-filter="all">全部 ${summary.total}</button>
    <button type="button" data-filter="passed">成功 ${summary.passed}</button>
    <button type="button" data-filter="failed">失败 ${summary.failed}</button>
    <button type="button" data-filter="other">其他 ${summary.skipped + summary.interrupted + summary.timedOut}</button>
  </div>
  <div class="layout">
    <aside class="list" id="caseList">${listHtml}</aside>
    <main class="detail">
      <p class="muted">点击左侧用例进入详情目录：原始 Case、Instructions、截图，以及 Midscene 详细报告。</p>
      <ul style="margin:12px 0 0; padding-left:18px; line-height:1.7; font-size:13px;">
        ${portableCases
          .map(
            (c) =>
              `<li><a href="./${escapeHtml(c.safeDir)}/index.html">${escapeHtml(statusLabel(c.status))} · ${escapeHtml(c.title)}</a>
              <span class="muted"> · <a href="./${escapeHtml(c.safeDir)}/midscene.html">Midscene</a></span></li>`,
          )
          .join('')}
      </ul>
    </main>
  </div>
</div>
<script>
const list = document.getElementById('caseList');
document.querySelector('.filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  const filter = btn.getAttribute('data-filter');
  for (const b of document.querySelectorAll('.filters button')) b.classList.toggle('active', b === btn);
  for (const item of list.querySelectorAll('.case-item')) {
    const status = item.getAttribute('data-status') || '';
    let show = true;
    if (filter === 'passed') show = status === 'passed';
    else if (filter === 'failed') show = status === 'failed' || status === 'timedOut';
    else if (filter === 'other') show = status !== 'passed' && status !== 'failed' && status !== 'timedOut';
    item.classList.toggle('hidden', !show);
  }
});
</script>
</body>
</html>
`;

  writeFileSync(join(artifactsDir, 'index.html'), overviewHtml, 'utf8');
  return { screenshotCount, caseDirs };
}
