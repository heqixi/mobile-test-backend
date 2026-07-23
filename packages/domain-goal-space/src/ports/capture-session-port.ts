/**
 * @module @mtp/domain-goal-space/ports/capture-session-port
 *
 * 交互式采样：维护可变草稿，不落不可变版本。
 */

import type {
  CaptureSession,
  CreateCaptureSessionInput,
  MarkKeyframeInput,
  RecordTransitionInput,
  UpdateDraftKeyframeInput,
  UpdateDraftTransitionInput,
} from '../models/capture-session.js';
import type {
  AddKeyframeNoteInput,
  KeyframeNote,
  UpdateKeyframeNoteInput,
} from '../models/keyframe-note.js';
import type { CaptureSessionId, GoalSpaceId, KeyframeId, TransitionId } from '../models/ids.js';
import type { DraftKeyframe } from '../models/keyframe.js';
import type { DraftTransition } from '../models/transition.js';

export interface CaptureSessionPort {
  createSession(input: CreateCaptureSessionInput): Promise<CaptureSession>;

  getSession(sessionId: CaptureSessionId): Promise<CaptureSession>;

  listOpenSessions(spaceId?: string): Promise<CaptureSession[]>;

  /**
   * 标记关键帧。若提供 screenshotBase64，适配器应落盘并回写 MediaRef。
   */
  markKeyframe(
    sessionId: CaptureSessionId,
    input: MarkKeyframeInput,
  ): Promise<DraftKeyframe>;

  updateKeyframe(
    sessionId: CaptureSessionId,
    keyframeId: KeyframeId,
    patch: UpdateDraftKeyframeInput,
  ): Promise<DraftKeyframe>;

  /** 删除关键帧，并移除以其为端点的转移；若为 cursor 则清空或回退。 */
  deleteKeyframe(
    sessionId: CaptureSessionId,
    keyframeId: KeyframeId,
  ): Promise<CaptureSession>;

  addNote(
    sessionId: CaptureSessionId,
    keyframeId: KeyframeId,
    input: AddKeyframeNoteInput,
  ): Promise<KeyframeNote>;

  updateNote(
    sessionId: CaptureSessionId,
    keyframeId: KeyframeId,
    noteId: string,
    patch: UpdateKeyframeNoteInput,
  ): Promise<KeyframeNote>;

  removeNote(
    sessionId: CaptureSessionId,
    keyframeId: KeyframeId,
    noteId: string,
  ): Promise<void>;

  recordTransition(
    sessionId: CaptureSessionId,
    input: RecordTransitionInput,
  ): Promise<DraftTransition>;

  updateTransition(
    sessionId: CaptureSessionId,
    transitionId: TransitionId,
    patch: UpdateDraftTransitionInput,
  ): Promise<DraftTransition>;

  setCursor(
    sessionId: CaptureSessionId,
    keyframeId: KeyframeId | undefined,
  ): Promise<CaptureSession>;

  discardSession(sessionId: CaptureSessionId): Promise<void>;

  /**
   * 清除非 submitted 的草稿/废弃会话（含截图目录）。
   * 永不删除 status=submitted 的会话。
   */
  purgeAbandonedSessions(spaceId?: GoalSpaceId): Promise<{
    purgedSessionIds: CaptureSessionId[];
  }>;
}
