/**
 * @module @mtp/domain-goal-space/models/context-pack
 *
 * 防腐层输出：编译 / Agent 只消费本结构。
 * 硬上限由 Retrieve 选项与适配器共同保证。
 */

import type { GoalSpaceRef, KeyframeId, TransitionId } from './ids.js';
import type { MediaRef } from './media-ref.js';
import type { RetrieveStrategy } from './retrieve-strategy.js';
import type { VisualMatchRejectReason } from './visual-match.js';
import type { WidgetAlias } from './widget.js';

export interface ContextPackKeyframeSlice {
  keyframeId: KeyframeId;
  screenName: string;
  caption: string;
  widgets: WidgetAlias[];
  /** 可选缩略图；全尺寸勿默认注入 */
  thumbnail?: MediaRef;
  score?: number;
}

export interface ContextPackTransitionSlice {
  transitionId: TransitionId;
  fromKeyframeId: KeyframeId;
  toKeyframeId: KeyframeId;
  action: string;
  precondition?: string;
  effect?: string;
  score?: number;
}

/** 检索过程回显（调试 / 评测）；不含实现算法名的义务 */
export interface ContextPackDiagnostics {
  strategyUsed: RetrieveStrategy;
  visualAccepted?: boolean;
  visualRejectReason?: VisualMatchRejectReason;
  /** 级联或先验采用的当前屏 */
  currentKeyframeId?: KeyframeId;
  neighborhoodSize?: number;
}

/**
 * OpenCode / Agent 友好包。
 * `textMarkdown` 为主要注入体；结构化字段便于程序化拼 prompt。
 */
export interface ContextPack {
  ref: GoalSpaceRef;
  retrievedAt: string;
  /** 给 LLM 的主文本（已裁剪） */
  textMarkdown: string;
  keyframes: ContextPackKeyframeSlice[];
  transitions: ContextPackTransitionSlice[];
  /** 检索查询回显，便于日志 */
  querySummary?: string;
  truncated?: boolean;
  diagnostics?: ContextPackDiagnostics;
}
