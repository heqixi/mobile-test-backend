/**
 * @module @mtp/domain-goal-space/models/goal-space
 *
 * 目标空间与不可变版本（提交产物）。
 */

import type {
  GoalSpaceId,
  GoalSpaceRef,
  GoalSpaceVersionId,
} from './ids.js';
import type { Keyframe } from './keyframe.js';
import type { GoalSpaceSpaceSummary } from './space-summary.js';
import type { Transition } from './transition.js';

export interface GoalSpaceSummary {
  spaceId: GoalSpaceId;
  displayName: string;
  description?: string;
  /** 当前默认版本（可选） */
  latestVersion?: GoalSpaceVersionId;
  tags?: string[];
  /** Space 级可编辑摘要 */
  summary?: GoalSpaceSpaceSummary;
}

/**
 * 某一不可变版本的完整状态图。
 * P0 落盘对应 versions/<version>/graph.json。
 */
export interface GoalSpaceGraph {
  ref: GoalSpaceRef;
  keyframes: Keyframe[];
  transitions: Transition[];
}

export interface GoalSpaceVersionMeta {
  ref: GoalSpaceRef;
  createdAt: string;
  createdBy?: string;
  /** 来源采样会话 */
  sourceSessionId?: string;
  deviceProfile?: string;
  appPackage?: string;
  keyframeCount: number;
  transitionCount: number;
  /** OpenCode 总览相对路径（适配器填写） */
  openCodeOverviewPath?: string;
  notes?: string;
}

export interface GoalSpaceVersionBundle {
  meta: GoalSpaceVersionMeta;
  graph: GoalSpaceGraph;
}
