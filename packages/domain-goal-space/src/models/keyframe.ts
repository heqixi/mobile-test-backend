/**
 * @module @mtp/domain-goal-space/models/keyframe
 *
 * 关键帧 = 目标 UI 状态节点。
 */

import type { KeyframeId } from './ids.js';
import type { KeyframeNote } from './keyframe-note.js';
import type { MediaRef } from './media-ref.js';
import type { WidgetAlias } from './widget.js';

export interface Keyframe {
  keyframeId: KeyframeId;
  /** 屏名，如「WPS 首页」 */
  screenName: string;
  /**
   * @deprecated 兼容字段；权威备注为 notes[]。
   * 派生：首条 caption-note 的 body，或 notes 正文 join。
   */
  caption: string;
  notes: KeyframeNote[];
  screenshot: MediaRef;
  widgets: WidgetAlias[];
  tags?: string[];
  appPackage?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 采样草稿中的关键帧（截图可尚未落盘） */
export interface DraftKeyframe {
  keyframeId: KeyframeId;
  screenName: string;
  /** @deprecated 见 Keyframe.caption */
  caption: string;
  notes: KeyframeNote[];
  screenshot?: MediaRef;
  widgets: WidgetAlias[];
  tags?: string[];
  appPackage?: string;
  createdAt: string;
  updatedAt: string;
}

/** 将 caption 与 notes 对齐（读时迁移 / 写后规范化） */
export function normalizeKeyframeNotes<
  T extends { caption: string; notes?: KeyframeNote[] },
>(kf: T, nowIso: string): T & { notes: KeyframeNote[] } {
  const notes = [...(kf.notes ?? [])];
  if (notes.length === 0 && kf.caption?.trim()) {
    notes.push({
      noteId: `legacy-caption`,
      kind: 'caption',
      body: kf.caption.trim(),
      source: 'system',
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }
  const captionNote = notes.find((n) => n.kind === 'caption');
  const caption =
    captionNote?.body?.trim() ||
    notes.map((n) => n.body).filter(Boolean).join('\n') ||
    kf.caption ||
    '';
  return { ...kf, notes, caption };
}

export function deriveCaptionFromNotes(notes: KeyframeNote[]): string {
  const captionNote = notes.find((n) => n.kind === 'caption');
  if (captionNote?.body?.trim()) return captionNote.body.trim();
  return notes
    .map((n) => n.body.trim())
    .filter(Boolean)
    .join('\n');
}
