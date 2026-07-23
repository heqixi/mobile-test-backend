/**
 * @module @mtp/domain-goal-space/ports/goal-space-index-port
 *
 * 版本派生索引重建（Submit 之后或显式运维）。
 * 不规定存储引擎；适配器决定落盘格式。
 */

import type {
  RebuildGoalSpaceIndexInput,
  RebuildGoalSpaceIndexResult,
} from '../models/index-rebuild.js';

export interface GoalSpaceIndexPort {
  rebuild(input: RebuildGoalSpaceIndexInput): Promise<RebuildGoalSpaceIndexResult>;
}
