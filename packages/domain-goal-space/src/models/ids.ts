/**
 * @module @mtp/domain-goal-space/models/ids
 *
 * 稳定标识（字符串品牌；实现阶段可用 UUID）。
 */

/** 目标空间，如 cowork-android */
export type GoalSpaceId = string;

/** 不可变版本号（semver 或单调串，由适配器约定） */
export type GoalSpaceVersionId = string;

/** 关键帧节点 */
export type KeyframeId = string;

/** 状态转移边 */
export type TransitionId = string;

/** 采样会话（草稿） */
export type CaptureSessionId = string;

/** 空间 + 版本的对外引用 */
export interface GoalSpaceRef {
  spaceId: GoalSpaceId;
  version: GoalSpaceVersionId;
}
