/**
 * @module @mtp/domain-goal-space/models/ranking
 *
 * 通道无关的排序命中。score 仅在同一通道内可比较；跨通道须用策略融合（级联 / 晚融合），
 * 不得假定为 BM25 或余弦等具体量纲。
 */

import type { KeyframeId, TransitionId } from './ids.js';

export interface RankedHit<TId extends string = string> {
  id: TId;
  /**
   * 通道内相对分；越大越相关。
   * 跨通道不可直接加减——由 Retrieve 策略解释。
   */
  score: number;
  /** 通道内 1-based 名次（晚融合 RRF 等可用） */
  rank?: number;
}

export type RankedKeyframeHit = RankedHit<KeyframeId>;
export type RankedTransitionHit = RankedHit<TransitionId>;
