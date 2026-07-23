/**
 * @module @mtp/domain-goal-space/models/submit
 *
 * 提交草稿 → 不可变版本。
 */

import type { CaptureSessionId, GoalSpaceRef, GoalSpaceVersionId } from './ids.js';
import type { GoalSpaceVersionMeta } from './goal-space.js';
import type { GoalSpaceIndexKind } from './index-rebuild.js';

export interface SubmitCaptureSessionInput {
  sessionId: CaptureSessionId;
  /** 指定版本号；省略则由适配器生成 */
  version?: GoalSpaceVersionId;
  createdBy?: string;
  notes?: string;
  /**
   * 孤立关键帧（无入边也无出边，且非唯一节点）是否视为错误。
   * 默认 true。
   */
  failOnOrphanKeyframes?: boolean;
  /**
   * 提交成功后是否重建派生索引（文本/视觉）。
   * 默认由适配器决定（通常 true）；不规定索引引擎。
   */
  rebuildIndexes?: boolean | GoalSpaceIndexKind[];
}

export interface SubmitValidationIssue {
  code: string;
  message: string;
  keyframeId?: string;
  transitionId?: string;
}

export interface SubmitCaptureSessionResult {
  ref: GoalSpaceRef;
  meta: GoalSpaceVersionMeta;
  warnings: SubmitValidationIssue[];
  /** 若已触发索引重建，回显种类 */
  indexesRebuilt?: GoalSpaceIndexKind[];
}
