/**
 * @module @mtp/domain-goal-space/models/index-rebuild
 *
 * 版本发布后重建派生索引的请求/结果。
 * 「索引」在此为领域概念：任何加速文本/视觉匹配的派生数据；
 * 不规定 SQLite、向量库或指纹格式。
 */

import type { GoalSpaceRef } from './ids.js';

export type GoalSpaceIndexKind =
  | 'text'
  | 'visual'
  | 'all';

export interface RebuildGoalSpaceIndexInput {
  ref: GoalSpaceRef;
  kinds?: GoalSpaceIndexKind[];
}

export interface RebuildGoalSpaceIndexResult {
  ref: GoalSpaceRef;
  rebuilt: GoalSpaceIndexKind[];
  /** 适配器可填耗时、条目数等 */
  details?: Record<string, unknown>;
}
