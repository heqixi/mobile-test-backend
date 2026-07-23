/**
 * @module @mtp/domain-goal-space/models/keyframe-label
 *
 * LLM / 启发式关键帧标注结果（屏名 + 词条草案）。
 */

import type { KeyframeNoteKind } from './keyframe-note.js';
import type { ImageInput } from './image-input.js';

export interface KeyframeLabelInput {
  screenshot: ImageInput;
  context?: {
    actionText?: string;
    fromScreenName?: string;
    existingNoteBodies?: string[];
    locale?: string;
  };
  options?: {
    maxNotes?: number;
    suggestScreenName?: boolean;
  };
}

export interface KeyframeLabelNoteDraft {
  kind: KeyframeNoteKind;
  title?: string;
  body: string;
  confidence?: number;
}

export interface KeyframeLabelResult {
  screenName: string;
  notes: KeyframeLabelNoteDraft[];
  diagnostics?: Record<string, unknown>;
}
