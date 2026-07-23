/**
 * 采样会话草稿截图路径解析与会话内视觉匹配。
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CaptureSession,
  CaptureSessionPort,
  VisualMatchResult,
} from '@mtp/domain-goal-space';
import { GoalSpaceDomainError } from '@mtp/domain-goal-space';
import { spaceDir } from '../paths.js';
import {
  computeDHashHex,
  matchDHashAgainstIndex,
  stripScreenshotBase64,
} from './dhash-visual-match.js';

/** DraftKeyframe.screenshot.uri 相对 space 根目录。 */
export function resolveSessionKeyframeImagePath(
  session: CaptureSession,
  keyframeId: string,
): { absPath: string; mimeType: string } | null {
  const kf = session.keyframes.find((k) => k.keyframeId === keyframeId);
  if (!kf?.screenshot?.uri) return null;
  const absPath = join(spaceDir(session.spaceId), kf.screenshot.uri);
  if (!existsSync(absPath)) return null;
  return {
    absPath,
    mimeType: kf.screenshot.mimeType ?? 'image/png',
  };
}

export async function matchSessionVisual(
  capture: CaptureSessionPort,
  sessionId: string,
  input: { screenshotBase64: string; maxCandidates?: number },
): Promise<VisualMatchResult> {
  if (!input.screenshotBase64?.trim()) {
    return {
      accepted: false,
      candidates: [],
      rejectReason: 'no_screenshot',
    };
  }
  const session = await capture.getSession(sessionId);
  if (session.keyframes.length === 0) {
    return {
      accepted: false,
      candidates: [],
      rejectReason: 'empty_session',
    };
  }

  let queryBuf: Buffer;
  try {
    queryBuf = stripScreenshotBase64(input.screenshotBase64);
  } catch {
    return {
      accepted: false,
      candidates: [],
      rejectReason: 'unavailable',
    };
  }

  const index: Record<string, string> = {};
  for (const kf of session.keyframes) {
    const resolved = resolveSessionKeyframeImagePath(session, kf.keyframeId);
    if (!resolved) continue;
    try {
      index[kf.keyframeId] = computeDHashHex(readFileSync(resolved.absPath));
    } catch {
      /* skip broken png */
    }
  }

  return matchDHashAgainstIndex(queryBuf, index, {
    maxCandidates: input.maxCandidates,
  });
}

export async function readSessionKeyframeScreenshot(
  capture: CaptureSessionPort,
  sessionId: string,
  keyframeId: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const session = await capture.getSession(sessionId);
  const resolved = resolveSessionKeyframeImagePath(session, keyframeId);
  if (!resolved) {
    throw new GoalSpaceDomainError(
      'MEDIA_NOT_FOUND',
      `screenshot not found for keyframe ${keyframeId}`,
    );
  }
  return {
    buffer: readFileSync(resolved.absPath),
    mimeType: resolved.mimeType,
  };
}
