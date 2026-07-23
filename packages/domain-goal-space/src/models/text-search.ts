/**
 * @module @mtp/domain-goal-space/models/text-search
 *
 * 文本检索通道的查询/结果（实现可为 FTS5、内存词法、外部搜索引擎等）。
 */

import type { GoalSpaceRef, KeyframeId } from './ids.js';
import type { RankedKeyframeHit, RankedTransitionHit } from './ranking.js';

export interface TextSearchQuery {
  ref: GoalSpaceRef;
  /** 意图 / 步骤 / act 文案 */
  intentText: string;
  /**
   * 若给出，则只在该关键帧子集内检索（级联：视觉定屏后的邻域约束）。
   * 省略表示全图。
   */
  restrictToKeyframeIds?: KeyframeId[];
  /** 节点返回上限（通道内） */
  maxKeyframes?: number;
  /** 边返回上限（通道内） */
  maxTransitions?: number;
}

export interface TextSearchResult {
  keyframes: RankedKeyframeHit[];
  transitions: RankedTransitionHit[];
}
