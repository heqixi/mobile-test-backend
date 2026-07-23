/**
 * @module @mtp/domain-goal-space/models/keyframe-note
 *
 * 关键帧备注词条：可独立增删改。
 */

export type KeyframeNoteKind =
  | 'caption'
  | 'hint'
  | 'risk'
  | 'alias'
  | 'other';

export type KeyframeNoteSource = 'human' | 'llm' | 'system';

export interface KeyframeNote {
  noteId: string;
  kind: KeyframeNoteKind;
  title?: string;
  body: string;
  source: KeyframeNoteSource;
  /** llm 时可选 0–1 */
  confidence?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AddKeyframeNoteInput {
  kind?: KeyframeNoteKind;
  title?: string;
  body: string;
  source?: KeyframeNoteSource;
  confidence?: number;
  tags?: string[];
  noteId?: string;
}

export interface UpdateKeyframeNoteInput {
  kind?: KeyframeNoteKind;
  title?: string | null;
  body?: string;
  tags?: string[];
}
