/**
 * @module @mtp/domain-goal-space/models/visual-match
 *
 * 视觉定屏通道：当前截图 → 候选关键帧。
 * 实现可为感知哈希、图嵌入等；域内只表达 accepted / candidates。
 */

import type { GoalSpaceRef, KeyframeId } from './ids.js';
import type { ImageInput } from './image-input.js';
import type { RankedKeyframeHit } from './ranking.js';

/** 拒识原因（扩展时用字符串，预置常见值） */
export type VisualMatchRejectReason =
  | 'below_threshold'
  | 'ambiguous'
  | 'unavailable'
  | 'no_screenshot'
  | 'empty_session'
  | (string & {});

export interface VisualMatchQuery {
  ref: GoalSpaceRef;
  screenshot: ImageInput;
  /** 返回候选上限（通道内） */
  maxCandidates?: number;
}

/**
 * 视觉匹配结果。
 * - `accepted=true`：可安全作为级联先验 \(v_0\)（通常取 candidates[0]）。
 * - `accepted=false`：应降级为 text_only 或晚融合；candidates 仍可供融合。
 */
export interface VisualMatchResult {
  accepted: boolean;
  candidates: RankedKeyframeHit[];
  /** 采纳时的当前屏；accepted 时建议必填 */
  currentKeyframeId?: KeyframeId;
  rejectReason?: VisualMatchRejectReason;
}
