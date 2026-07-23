/**
 * @module @mtp/domain-goal-space/models/space-summary
 *
 * Space 级可编辑摘要（显示 / 手改 / LLM 生成）。
 * 与列表 DTO GoalSpaceSummary 不同；勿混淆。
 */

export type GoalSpaceSpaceSummarySource = 'llm' | 'human' | 'mixed';

/**
 * 挂在 space.json.summary；采样面板显示与编辑。
 * LLM 生成输入：latest（或指定）版本的压缩 graph JSON + 种子关键词。
 */
export interface GoalSpaceSpaceSummary {
  /** 2～5 句：业务域、主路径、关键入口 */
  overview: string;
  /** 关联关键词（产品名、功能、屏名别名等） */
  keywords: string[];
  /** 可选：主路径一句话 */
  flows?: string[];
  source: GoalSpaceSpaceSummarySource;
  updatedAt: string;
  /** 上次生成用的种子关键词 */
  seedKeywords?: string[];
}

/** PUT body（手改） */
export interface PutGoalSpaceSpaceSummaryInput {
  overview: string;
  keywords: string[];
  flows?: string[];
  seedKeywords?: string[];
  source?: GoalSpaceSpaceSummarySource;
}

/** POST .../summary:generate body */
export interface GenerateGoalSpaceSpaceSummaryInput {
  seedKeywords?: string[];
  extraHints?: string;
  /** 省略则用 latest 版本 graph */
  version?: string;
}
