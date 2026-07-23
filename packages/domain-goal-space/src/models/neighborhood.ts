/**
 * @module @mtp/domain-goal-space/models/neighborhood
 *
 * 图拓扑查询：与具体图数据库无关，基于已发布 GoalSpaceGraph。
 */

import type { GoalSpaceRef, KeyframeId, TransitionId } from './ids.js';

export interface NeighborhoodQuery {
  ref: GoalSpaceRef;
  seedKeyframeIds: KeyframeId[];
  /** 跳数；方案默认 1 */
  hop: number;
}

export interface NeighborhoodResult {
  keyframeIds: KeyframeId[];
  transitionIds: TransitionId[];
}
