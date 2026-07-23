/**
 * @module @mtp/domain-goal-space/models/guided-act
 *
 * Midscene act 后的图生长用例输入/决策/结果。
 */

import type { CaptureSession } from './capture-session.js';
import type {
  CaptureSessionId,
  KeyframeId,
  TransitionId,
} from './ids.js';
import type { VisualMatchResult } from './visual-match.js';

export interface GuidedActInput {
  sessionId: CaptureSessionId;
  /** act 发送瞬间冻结的 from（通常为当时 LIVE） */
  fromKeyframeId: KeyframeId;
  /** 用户自然语言指令 → Transition.action */
  actionText: string;
  postScreenshotBase64: string;
  midsceneOk?: boolean;
  /** spawn 后是否调用 LLM 标注；默认 true */
  label?: boolean;
  /**
   * spawn / 歧义时是否走屏身份终审（LLM / 启发式）；
   * 默认 true（有 ScreenIdentityPort 时）。
   */
  identity?: boolean;
}

export type GraphGrowthDecision =
  | {
      kind: 'noop';
      reason: 'already_on_known_successor';
      liveKeyframeId: KeyframeId;
    }
  | {
      kind: 'link_only';
      fromKeyframeId: KeyframeId;
      toKeyframeId: KeyframeId;
      action: string;
    }
  | {
      kind: 'spawn_and_link';
      fromKeyframeId: KeyframeId;
      action: string;
    }
  | {
      kind: 'stay';
      reason: 'still_on_from';
      fromKeyframeId: KeyframeId;
    }
  | {
      kind: 'needs_human';
      reason:
        | 'ambiguous'
        | 'act_failed'
        | 'no_from'
        | 'no_screenshot'
        | 'session_not_open';
    };

export type GuidedLabelStatus = 'skipped' | 'pending' | 'done' | 'failed';

export type GuidedIdentityStatus =
  | 'skipped'
  | 'done'
  | 'failed'
  | 'not_needed';

export interface GuidedActResult {
  decision: GraphGrowthDecision;
  session: CaptureSession;
  live: VisualMatchResult;
  createdKeyframeId?: KeyframeId;
  createdTransitionId?: TransitionId;
  label?: {
    status: GuidedLabelStatus;
    screenName?: string;
    noteIds?: string[];
    error?: string;
  };
  /** 屏身份终审诊断 */
  identity?: {
    status: GuidedIdentityStatus;
    verdict?: string;
    matchedKeyframeId?: KeyframeId;
    confidence?: number;
    reason?: string;
    error?: string;
  };
}
