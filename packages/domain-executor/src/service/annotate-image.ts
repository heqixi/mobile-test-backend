/**
 * @module @mtp/domain-executor/service/annotate-image
 *
 * 在截图上绘制红框标签（sharp composite SVG）。
 */

import sharp from 'sharp';
import type { AnnotateRegion, AnnotateResult } from '../models/visual-evidence.js';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clampRect(
  rect: AnnotateRegion['rectPx'],
  width: number,
  height: number,
): AnnotateRegion['rectPx'] {
  const left = Math.max(0, Math.min(width - 1, Math.round(rect.left)));
  const top = Math.max(0, Math.min(height - 1, Math.round(rect.top)));
  const right = Math.max(
    left + 1,
    Math.min(width, Math.round(rect.left + rect.width)),
  );
  const bottom = Math.max(
    top + 1,
    Math.min(height, Math.round(rect.top + rect.height)),
  );
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * 在 PNG/JPEG base64 上绘制 regions，返回 PNG base64（无 data URL 前缀）。
 */
export async function annotateScreenshotBase64(
  screenshotBase64: string,
  regions: AnnotateRegion[],
  style?: { strokeWidth?: number; fontSize?: number },
): Promise<AnnotateResult> {
  const raw = screenshotBase64.replace(/^data:image\/\w+;base64,/, '');
  const input = Buffer.from(raw, 'base64');
  const image = sharp(input);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    return { ok: false, error: 'invalid screenshot dimensions' };
  }

  const stroke =
    style?.strokeWidth ??
    Math.max(2, Math.round(Math.min(width, height) * 0.004));
  const fontSize =
    style?.fontSize ?? Math.max(14, Math.round(Math.min(width, height) * 0.02));

  const shapes = regions
    .map((region, i) => {
      const r = clampRect(region.rectPx, width, height);
      const color = region.color ?? '#EF4444';
      const label = escapeXml(region.label || `r${i + 1}`);
      const labelY = Math.max(fontSize + 4, r.top - 6);
      const labelX = r.left;
      return [
        `<rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`,
        `<rect x="${labelX}" y="${labelY - fontSize - 2}" width="${Math.min(width - labelX, label.length * fontSize * 0.65 + 12)}" height="${fontSize + 6}" fill="${color}" fill-opacity="0.85"/>`,
        `<text x="${labelX + 6}" y="${labelY}" font-size="${fontSize}" font-family="sans-serif" fill="#ffffff">${label}</text>`,
      ].join('');
    })
    .join('');

  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${shapes}</svg>`,
  );

  try {
    const out = await image
      .composite([{ input: svg, top: 0, left: 0 }])
      .png()
      .toBuffer();
    return {
      ok: true,
      annotatedBase64: out.toString('base64'),
      width,
      height,
      mime: 'image/png',
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
