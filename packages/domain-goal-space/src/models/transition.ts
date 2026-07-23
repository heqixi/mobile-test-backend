/**
 * @module @mtp/domain-goal-space/models/transition
 *
 * 状态转移 = 有向边（人工完成的操作语义）。
 */

import type { KeyframeId, TransitionId } from './ids.js';
import type { MediaRef } from './media-ref.js';

export interface Transition {
  transitionId: TransitionId;
  fromKeyframeId: KeyframeId;
  toKeyframeId: KeyframeId;
  /** 动作文案，如「点击底部输入框」 */
  action: string;
  precondition?: string;
  effect?: string;
  /** 可选：动作瞬间证据帧 */
  evidenceShot?: MediaRef;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DraftTransition {
  transitionId: TransitionId;
  fromKeyframeId: KeyframeId;
  toKeyframeId: KeyframeId;
  action: string;
  precondition?: string;
  effect?: string;
  evidenceShot?: MediaRef;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
