/**
 * @module @mtp/domain-goal-space/models/screen-identity
 *
 * 屏身份终审：视觉召回候选后，由 LLM / 启发式判定是否同一语义屏。
 */

import type { ImageInput } from './image-input.js';
import type { KeyframeId } from './ids.js';

export type ScreenIdentityVerdict =
  | 'same_screen'
  | 'different_screen'
  | 'uncertain';

export interface ScreenIdentityCandidate {
  keyframeId: KeyframeId;
  screenName: string;
  /** 视觉通道分数（可选，供启发式 / prompt 参考） */
  score?: number;
  screenshot: ImageInput;
}

export interface ScreenIdentityJudgeInput {
  query: ImageInput;
  candidates: ScreenIdentityCandidate[];
  context?: {
    actionText?: string;
    fromKeyframeId?: KeyframeId;
    fromScreenName?: string;
    locale?: string;
  };
  options?: {
    /** 最多送入终审的候选数，默认 3 */
    maxCandidates?: number;
  };
}

export interface ScreenIdentityJudgeResult {
  verdict: ScreenIdentityVerdict;
  /** same_screen 时应指向某候选 keyframeId */
  matchedKeyframeId?: KeyframeId;
  confidence?: number;
  reason?: string;
  /** 元素级观察（供调试 / 人工） */
  elements?: {
    title?: string;
    primaryRegion?: string;
    bottomBar?: string;
    other?: string;
  };
  /**
   * 当判定为新屏（different_screen）时，一并给出可写入关键帧的屏名与词条。
   * spawn 时可直接填充，避免再调一次标注模型。
   */
  label?: {
    screenName: string;
    notes: Array<{
      kind: 'caption' | 'hint' | 'risk' | 'alias' | 'other';
      title?: string;
      body: string;
      confidence?: number;
    }>;
  };
  diagnostics?: Record<string, unknown>;
}
