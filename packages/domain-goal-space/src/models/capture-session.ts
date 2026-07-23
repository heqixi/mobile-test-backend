/**
 * @module @mtp/domain-goal-space/models/capture-session
 *
 * 交互式采样会话：提交前可变草稿。
 */

import type { CaptureSessionId, GoalSpaceId, KeyframeId } from './ids.js';
import type { DraftKeyframe } from './keyframe.js';
import type { DraftTransition } from './transition.js';

export type CaptureSessionStatus = 'open' | 'submitted' | 'discarded';

export interface CaptureSession {
  sessionId: CaptureSessionId;
  spaceId: GoalSpaceId;
  status: CaptureSessionStatus;
  displayName?: string;
  deviceProfile?: string;
  appPackage?: string;
  /** 当前「上一关键帧」，便于连续记转移 */
  cursorKeyframeId?: KeyframeId;
  keyframes: DraftKeyframe[];
  transitions: DraftTransition[];
  createdAt: string;
  updatedAt: string;
  submittedVersion?: string;
}

export interface CreateCaptureSessionInput {
  spaceId: GoalSpaceId;
  displayName?: string;
  deviceProfile?: string;
  appPackage?: string;
}

export interface MarkKeyframeInput {
  screenName: string;
  caption?: string;
  notes?: DraftKeyframe['notes'];
  /** PNG/JPEG base64（可含 data URL 前缀）；由适配器落盘 */
  screenshotBase64?: string;
  widgets?: DraftKeyframe['widgets'];
  tags?: string[];
  /** 若省略则由端口生成 */
  keyframeId?: KeyframeId;
  /** 标记后是否设为 cursor */
  setAsCursor?: boolean;
}

export interface RecordTransitionInput {
  fromKeyframeId: KeyframeId;
  toKeyframeId: KeyframeId;
  action: string;
  precondition?: string;
  effect?: string;
  evidenceShotBase64?: string;
  tags?: string[];
  transitionId?: string;
}

export interface UpdateDraftKeyframeInput {
  screenName?: string;
  caption?: string;
  notes?: DraftKeyframe['notes'];
  widgets?: DraftKeyframe['widgets'];
  tags?: string[];
  screenshotBase64?: string;
}

export interface UpdateDraftTransitionInput {
  action?: string;
  precondition?: string;
  effect?: string;
  tags?: string[];
}
