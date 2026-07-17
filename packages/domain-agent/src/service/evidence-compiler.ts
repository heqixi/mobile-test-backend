/**
 * @module @mtp/domain-agent/service/evidence-compiler
 *
 * Visual Evidence：当前阶段以 Judge 成功截图为参考（跳过 locate/annotate）。
 * 可选开启 AGENT_VISUAL_EVIDENCE_LOCATE=1 恢复短语定位画框。
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import type { ExecutorHttpClient } from '../adapters/executor-http.js';
import type { Instruction } from '../models/instruction.js';
import type {
  ExpectationEvidenceBinding,
  PreconditionEvidenceBinding,
  StoredVisualEvidence,
  VisualEvidence,
  VisualEvidenceRegion,
} from '../models/visual-evidence.js';
import {
  resolvePreconditionEvidence,
  resolveReferenceEvidence,
} from '../models/visual-evidence.js';

export type VisualEvidenceMode = 'off' | 'final' | 'failed' | 'always';

export function resolveVisualEvidenceMode(): VisualEvidenceMode {
  const raw = (process.env.AGENT_VISUAL_EVIDENCE ?? 'final').trim().toLowerCase();
  if (raw === 'off' || raw === '0' || raw === 'false') return 'off';
  if (raw === 'failed') return 'failed';
  if (raw === 'always') return 'always';
  return 'final';
}

export function maxVisualTargets(): number {
  const n = Number(process.env.AGENT_VISUAL_EVIDENCE_MAX_TARGETS ?? 3);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

function locateEnabled(): boolean {
  return process.env.AGENT_VISUAL_EVIDENCE_LOCATE === '1';
}

function locateTimeoutMs(): number {
  const n = Number(process.env.AGENT_VISUAL_EVIDENCE_LOCATE_TIMEOUT_MS ?? 12_000);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 12_000;
}

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  return JSON.stringify(value);
}

/** 从 Instruction 抽取 locate 短语（仅 AGENT_VISUAL_EVIDENCE_LOCATE=1 时使用） */
export function extractLocateTargets(
  instruction: Instruction,
  max = maxVisualTargets(),
): Array<{ phrase: string; label: string; role: VisualEvidenceRegion['role'] }> {
  const out: Array<{
    phrase: string;
    label: string;
    role: VisualEvidenceRegion['role'];
  }> = [];
  const seen = new Set<string>();

  const push = (
    phrase: string,
    label: string,
    role: VisualEvidenceRegion['role'],
  ) => {
    const p = phrase.trim();
    if (!p || p.length < 2) return;
    if (/关闭\s*popup|如有遮挡|dismiss|先关闭/i.test(p) && !/按钮|输入框|图标/.test(p)) {
      return;
    }
    const key = p.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ phrase: p, label: label.slice(0, 24) || p.slice(0, 24), role });
  };

  const expectation = asText(instruction.expectation);
  const preconditions = asText(instruction.preconditions);

  const patterns = [
    /【([^】]+)】/g,
    /(底部[^，。；\n]{0,24}(?:输入框|按钮|图标|Tab|导航))/g,
    /((?:输入框|按钮|图标|搜索框)[^，。；\n]{0,16})/g,
    /(首页|云盘|应用中心|文档列表)/g,
  ];

  for (const text of [expectation, preconditions]) {
    if (!text || out.length >= max) continue;
    for (const re of patterns) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) && out.length < max) {
        const phrase = (m[1] ?? m[0]).trim();
        push(
          phrase,
          phrase,
          text === expectation ? 'expectation' : 'precondition',
        );
      }
    }
  }

  if (out.length === 0 && expectation) {
    push(expectation.slice(0, 48), 'expectation', 'expectation');
  }

  for (const action of instruction.actions ?? []) {
    if (out.length >= max) break;
    const short = action.replace(/^(点击|进入|打开|等待)/, '').trim().slice(0, 24);
    if (short.length >= 2) {
      push(short, short.slice(0, 20), 'action');
    }
  }

  for (const hint of instruction.hints ?? []) {
    if (out.length >= max) break;
    push(hint, hint.replace(/^点击/, '').slice(0, 20), 'hint');
  }

  return out.slice(0, max);
}

/**
 * 当前默认：仅用 Judge 截图作为 Visual Evidence（不 locate / 不 annotate）。
 */
export async function compileVisualEvidence(input: {
  executor: ExecutorHttpClient;
  instruction: Instruction;
  episodeId: string;
  phase?: VisualEvidence['phase'];
  textEvidence?: string;
  judgeSatisfied?: boolean;
  screenshotBase64?: string;
}): Promise<VisualEvidence | null> {
  const shot = input.screenshotBase64
    ? { ok: true as const, base64: input.screenshotBase64 }
    : await input.executor.captureScreenshot();
  if (!shot.ok || !shot.base64) return null;

  const base64 = shot.base64.replace(/^data:image\/\w+;base64,/, '');
  const screenshotDataUrl = `data:image/png;base64,${base64}`;

  if (!locateEnabled()) {
    return {
      evidenceId: randomUUID(),
      episodeId: input.episodeId,
      instructionId: input.instruction.instructionId,
      phase: input.phase ?? 'judge',
      capturedAt: new Date().toISOString(),
      screenshot: {
        mime: 'image/png',
        dataUrl: screenshotDataUrl,
      },
      annotated: {},
      regions: [],
      textEvidence: input.textEvidence,
      judgeSatisfied: input.judgeSatisfied,
    };
  }

  const targets = extractLocateTargets(input.instruction);
  if (targets.length === 0) {
    return {
      evidenceId: randomUUID(),
      episodeId: input.episodeId,
      instructionId: input.instruction.instructionId,
      phase: input.phase ?? 'judge',
      capturedAt: new Date().toISOString(),
      screenshot: {
        mime: 'image/png',
        dataUrl: screenshotDataUrl,
      },
      annotated: {},
      regions: [],
      textEvidence: input.textEvidence,
      judgeSatisfied: input.judgeSatisfied,
    };
  }

  const deepLocate = process.env.AGENT_VISUAL_EVIDENCE_DEEP_LOCATE === '1';
  const timeoutMs = locateTimeoutMs();
  const regions: VisualEvidenceRegion[] = [];

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]!;
    const t0 = Date.now();
    const hit = await input.executor.locate({
      phrase: t.phrase,
      deepLocate,
      timeoutMs,
    });
    console.log(
      `[evidence-compiler] locate ${i + 1}/${targets.length} ok=${hit.ok} ${Date.now() - t0}ms phrase=${JSON.stringify(t.phrase.slice(0, 40))} err=${hit.error ?? ''}`,
    );
    const rectPx =
      hit.rectPx ??
      (hit.center
        ? {
            left: Math.max(0, Math.round(hit.center[0] - 24)),
            top: Math.max(0, Math.round(hit.center[1] - 24)),
            width: 48,
            height: 48,
          }
        : undefined);
    regions.push({
      id: `r${i + 1}`,
      phrase: t.phrase,
      label: t.label,
      role: t.role,
      locateOk: hit.ok && Boolean(rectPx),
      rectPx,
      center: hit.center,
      quality: hit.quality,
      error: hit.error,
    });
  }

  const drawable = regions.filter((r) => r.locateOk && r.rectPx);
  let annotatedDataUrl: string | undefined;
  let width: number | undefined;
  let height: number | undefined;

  if (drawable.length > 0) {
    const annotated = await input.executor.annotate({
      screenshotBase64: base64,
      regions: drawable.map((r) => ({
        rectPx: r.rectPx!,
        label: r.label,
        color: '#EF4444',
      })),
    });
    if (annotated.ok && annotated.annotatedBase64) {
      annotatedDataUrl = `data:image/png;base64,${annotated.annotatedBase64}`;
      width = annotated.width;
      height = annotated.height;
    }
  }

  return {
    evidenceId: randomUUID(),
    episodeId: input.episodeId,
    instructionId: input.instruction.instructionId,
    phase: input.phase ?? 'judge',
    capturedAt: new Date().toISOString(),
    screenshot: {
      mime: 'image/png',
      dataUrl: screenshotDataUrl,
      width,
      height,
    },
    annotated: {
      dataUrl: annotatedDataUrl,
      width,
      height,
    },
    regions,
    textEvidence: input.textEvidence,
    judgeSatisfied: input.judgeSatisfied,
  };
}

/** Precondition 相位：仅上一步 Golden */
export function formatPreconditionGoldenHint(
  binding: PreconditionEvidenceBinding | undefined,
): string | undefined {
  const ref = resolvePreconditionEvidence(binding);
  if (!ref && !binding) return undefined;
  return [
    '## PreCondition Golden (starting-state reference)',
    binding?.sourceExpectationSnapshot
      ? `previous expectation (this step should start from): ${binding.sourceExpectationSnapshot}`
      : undefined,
    'If CURRENT diverges from this starting UI, restore it before met=true.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Act / Judge：仅本步 Expectation Golden */
export function formatExpectationGoldenHint(
  binding: ExpectationEvidenceBinding | undefined,
): string | undefined {
  const ref = resolveReferenceEvidence(binding);
  if (!ref) return undefined;
  return [
    '## Expectation Golden (this step success reference)',
    binding?.expectationSnapshot
      ? `expectation: ${binding.expectationSnapshot}`
      : undefined,
    'Compare CURRENT to this success layout; close the gap toward the expected outcome.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** @deprecated use phase-specific hints */
export function formatGoldenPromptBlock(
  expectationBinding: ExpectationEvidenceBinding | undefined,
  preconditionBinding?: PreconditionEvidenceBinding | undefined,
): string | undefined {
  const parts = [
    formatPreconditionGoldenHint(preconditionBinding),
    formatExpectationGoldenHint(expectationBinding),
  ].filter(Boolean);
  return parts.length ? parts.join('\n') : undefined;
}

/** @deprecated act no longer mixes both refs */
export function formatReferenceCompareActHint(input: {
  hasPreconditionRef: boolean;
  hasExpectationRef: boolean;
}): string | undefined {
  if (!input.hasExpectationRef && !input.hasPreconditionRef) return undefined;
  return [
    '## Compare CURRENT vs attached Golden reference(s)',
    input.hasPreconditionRef
      ? '- Restore PreCondition Golden starting state if CURRENT diverges.'
      : undefined,
    input.hasExpectationRef
      ? '- Close the gap toward Expectation Golden.'
      : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

export function shouldAttachReferenceImage(input: {
  phase: 'act' | 'judge';
  lastJudgeSatisfied?: boolean;
  consecutiveJudgeFailures?: number;
}): boolean {
  if (process.env.AGENT_VISUAL_EVIDENCE_ATTACH_IMAGE === '0') return false;
  if (process.env.AGENT_VISUAL_EVIDENCE_ATTACH_IMAGE === '1') {
    return input.phase === 'act';
  }
  // 默认：仅 act，且本轮已有 judge 失败时附带历史成功参考图
  if (input.phase !== 'act') return false;
  if (input.lastJudgeSatisfied === false) return true;
  return (input.consecutiveJudgeFailures ?? 0) > 0;
}

export async function loadStoredEvidenceDataUrl(
  stored: StoredVisualEvidence,
): Promise<string | undefined> {
  const a = stored.assets;
  if (a.screenshotDataUrl?.startsWith('data:')) return a.screenshotDataUrl;
  if (a.annotatedDataUrl?.startsWith('data:')) return a.annotatedDataUrl;
  if (a.localPath && existsSync(a.localPath)) {
    try {
      const buf = readFileSync(a.localPath);
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      // fall through to http
    }
  }
  if (a.imageHttpUrl) {
    try {
      const res = await fetch(a.imageHttpUrl);
      if (!res.ok) return undefined;
      const buf = Buffer.from(await res.arrayBuffer());
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
