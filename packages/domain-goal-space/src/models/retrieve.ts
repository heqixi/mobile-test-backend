/**
 * @module @mtp/domain-goal-space/models/retrieve
 *
 * 门面检索请求：compile / agent 只依赖 GoalSpaceRetrievePort + 本结构。
 * 不出现 FTS / pHash / CLIP / SQLite 等实现名。
 */

import type { GoalSpaceRef, KeyframeId } from './ids.js';
import type { ImageInput } from './image-input.js';
import type { RetrieveStrategyPreference } from './retrieve-strategy.js';

export interface ContextPackLimits {
  /** 默认 3 */
  maxKeyframes?: number;
  /** 默认 6 */
  maxTransitions?: number;
  /** 默认 2 */
  maxThumbnails?: number;
  /** 邻域跳数，默认 1 */
  hop?: number;
}

export interface GoalSpaceRetrieveQuery {
  /** 绑定版本；缺省则用空间 latest（由 Store 解析） */
  ref?: GoalSpaceRef;
  spaceId?: string;
  /** 本步操作意图 / act 命令 / 用例片段 */
  intentText: string;
  /**
   * 已知当前关键帧（强先验）。
   * 若同时提供截图，适配器可校验一致性；冲突时以策略为准并写入 diagnostics。
   */
  currentKeyframeId?: KeyframeId;
  /**
   * 运行期当前屏截图。编译期通常省略。
   * 有图时 Retrieve 可走 cascade / late_fusion；无图则 text_only。
   */
  currentScreenshot?: ImageInput;
  /** 策略偏好；默认 auto */
  strategy?: RetrieveStrategyPreference;
  limits?: ContextPackLimits;
}
