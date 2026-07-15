/**
 * @module @mtp/domain-executor/snapshot
 *
 * UI 采样结果。是原始观察，**不是**业务态判定权威。
 * matchedStateId 等仅为可选线索（若实现方写入）；Case/Agent 不得据此本地 judge。
 */

import type { ISO8601, OpaqueJson, Platform, UUID } from '@mtp/shared-kernel';

/**
 * 采样相位（相对某次调用的时间点标签）。
 * Executor 本身不维护 Case step 游标；stepId 可选由调用方传入。
 */
export type SnapshotPhase = 'pre' | 'post' | 'error' | 'on_demand';

/**
 * UI 快照：截图路径 + 结构化描述字段。
 */
export interface UiSnapshot {
  snapshotId: UUID;

  /** 调用方可选关联（如 Case stepId）；Executor 不解释 */
  stepId?: string;

  phase: SnapshotPhase;
  timestamp: ISO8601;
  platform: Platform;

  /** 截图相对/绝对路径（实现方决定存储位置） */
  screenshotPath?: string;

  /** 页面标题类摘要（LLM/视觉描述产出） */
  screenTitle?: string;

  /** 页面描述 */
  pageDescription?: string;

  /** 关键可见元素标签列表 */
  keyElements?: string[];

  /** 浮层/弹窗等覆盖物描述 */
  overlays?: string[];

  /** 推断路由/页面路径（可选线索） */
  inferredRoute?: string;

  /**
   * 可选粗匹配状态 id。
   * **不是**业务 judge 权威；阶段一 Case 域甚至不消费此字段。
   */
  matchedStateId?: string;

  matchConfidence?: number;

  /** 原始 query / 感知结果整包 */
  rawQueryResult?: OpaqueJson;
}

/**
 * Sample 请求（AEP Sample / ExecutorPort.sample）。
 */
export interface SampleRequest {
  /** 可选：调用方关联 stepId */
  stepId?: string;
  phase?: SnapshotPhase;
  /** 实现方选项（如是否跑粗匹配）；OpaqueJson 不强制 schema */
  options?: OpaqueJson;
}
