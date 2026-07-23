/**
 * @module @mtp/domain-goal-space/ports/graph-neighborhood-port
 *
 * 图邻域扩展。实现通常基于已加载的 GoalSpaceGraph，不绑定图数据库产品。
 */

import type {
  NeighborhoodQuery,
  NeighborhoodResult,
} from '../models/neighborhood.js';

export interface GraphNeighborhoodPort {
  expand(query: NeighborhoodQuery): Promise<NeighborhoodResult>;
}
