/**
 * @module @mtp/domain-goal-space/models/retrieve-strategy
 *
 * 检索融合策略（领域概念，非实现细节）。
 * 见 docs §7.2.5：级联 / 纯文本 / 晚融合。
 */

export type RetrieveStrategy =
  /** 视觉可信定屏 → 文本仅在邻域内 */
  | 'cascade'
  /** 无图或视觉拒识：仅文本 + 图扩展 */
  | 'text_only'
  /** 视觉与文本各自排序后按秩融合（如 RRF；算法由适配器选择） */
  | 'late_fusion';

/**
 * 调用方偏好。实际采用策略由 Retrieve 根据截图有无、视觉是否 accepted 决定，
 * 并在 ContextPack.diagnostics 回显。
 */
export type RetrieveStrategyPreference =
  | RetrieveStrategy
  | 'auto';
