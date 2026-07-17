/**
 * @module @mtp/domain-agent/service/visual-evidence-store
 *
 * 将 VisualEvidence 截图/标注图落盘，供 SSE 过大时用 HTTP / 本地路径引用。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

export function resolveVisualEvidenceDir(): string {
  const raw = process.env.AGENT_VISUAL_EVIDENCE_DIR?.trim();
  if (raw) return resolve(raw);
  return resolve(process.cwd(), 'runs', 'visual-evidence');
}

/** 浏览器可访问的 agent 根地址（落盘图 HTTP URL） */
export function resolveAgentPublicBaseUrl(): string {
  return (
    process.env.AGENT_PUBLIC_URL?.trim() ||
    process.env.AGENT_URL?.trim() ||
    'http://127.0.0.1:4100'
  ).replace(/\/$/, '');
}

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const m = /^data:image\/\w+;base64,(.+)$/s.exec(dataUrl);
  if (!m?.[1]) return null;
  try {
    return Buffer.from(m[1], 'base64');
  } catch {
    return null;
  }
}

export type PersistedVisualEvidenceImage = {
  localPath: string;
  fileUrl: string;
  /** GET /api/agent/visual-evidence/:file */
  httpUrl: string;
  filename: string;
  kind: 'annotated' | 'screenshot';
};

/**
 * 写入 PNG；优先 annotated，否则 screenshot（judge 截图）。
 */
export function persistVisualEvidencePng(input: {
  evidenceId: string;
  annotatedDataUrl?: string;
  screenshotDataUrl?: string;
}): PersistedVisualEvidenceImage | null {
  const kind = input.annotatedDataUrl ? 'annotated' : 'screenshot';
  const dataUrl =
    kind === 'annotated' ? input.annotatedDataUrl : input.screenshotDataUrl;
  if (!dataUrl) return null;
  const buf = dataUrlToBuffer(dataUrl);
  if (!buf?.length) return null;

  const dir = resolveVisualEvidenceDir();
  mkdirSync(dir, { recursive: true });
  const filename = `${input.evidenceId}-${kind}.png`;
  const localPath = join(dir, filename);
  writeFileSync(localPath, buf);
  const fileUrl = `file://${localPath}`;
  const httpUrl = `${resolveAgentPublicBaseUrl()}/api/agent/visual-evidence/${encodeURIComponent(filename)}`;
  return { localPath, fileUrl, httpUrl, filename, kind };
}

/** 仅允许本目录下 `*-annotated.png` / `*-screenshot.png` */
export function resolveSafeVisualEvidencePath(fileParam: string): string | null {
  const name = basename(fileParam);
  if (!/^[a-zA-Z0-9._-]+-(annotated|screenshot)\.png$/.test(name)) {
    return null;
  }
  return join(resolveVisualEvidenceDir(), name);
}
