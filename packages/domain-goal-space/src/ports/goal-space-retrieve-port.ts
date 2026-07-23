/**
 * @module @mtp/domain-goal-space/ports/goal-space-retrieve-port
 *
 * 检索门面：编排文本通道 × 视觉通道 × 邻域 × 融合策略 → ContextPack。
 *
 * 实现阶段可组合：
 * - TextSearchPort
 * - VisualMatchPort
 * - GraphNeighborhoodPort
 * - GoalSpaceStorePort（取节点详情以渲染 Pack）
 *
 * compile / agent **只依赖本端口**，不直连通道实现。
 */

import type { ContextPack } from '../models/context-pack.js';
import type { GoalSpaceRetrieveQuery } from '../models/retrieve.js';

export interface GoalSpaceRetrievePort {
  retrieve(query: GoalSpaceRetrieveQuery): Promise<ContextPack>;
}
