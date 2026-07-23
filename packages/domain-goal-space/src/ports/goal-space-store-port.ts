/**
 * @module @mtp/domain-goal-space/ports/goal-space-store-port
 *
 * 已发布空间的只读/清单访问（写路径仅经 Submit）。
 */

import type {
  GoalSpaceGraph,
  GoalSpaceSummary,
  GoalSpaceVersionBundle,
  GoalSpaceVersionMeta,
} from '../models/goal-space.js';
import type {
  GoalSpaceId,
  GoalSpaceRef,
  KeyframeId,
} from '../models/ids.js';
import type { Keyframe } from '../models/keyframe.js';

/** OpenCode 友好导出清单（路径由适配器解析） */
export interface OpenCodePackManifest {
  ref: GoalSpaceRef;
  overviewPath: string;
  graphPath: string;
  nodeMarkdownPaths: string[];
  keyframeImagePaths: string[];
}

export interface GoalSpaceStorePort {
  listSpaces(): Promise<GoalSpaceSummary[]>;

  listVersions(spaceId: GoalSpaceId): Promise<GoalSpaceVersionMeta[]>;

  resolveLatest(spaceId: GoalSpaceId): Promise<GoalSpaceRef | null>;

  getVersionMeta(ref: GoalSpaceRef): Promise<GoalSpaceVersionMeta>;

  getGraph(ref: GoalSpaceRef): Promise<GoalSpaceGraph>;

  getVersionBundle(ref: GoalSpaceRef): Promise<GoalSpaceVersionBundle>;

  getKeyframe(ref: GoalSpaceRef, keyframeId: KeyframeId): Promise<Keyframe>;

  /**
   * 导出 OpenCode Pack 文件清单（不打包 zip 的义务；zip 可由 HTTP 层做）。
   */
  getOpenCodePackManifest(ref: GoalSpaceRef): Promise<OpenCodePackManifest>;
}
