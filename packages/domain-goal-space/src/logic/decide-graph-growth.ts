/**
 * @module @mtp/domain-goal-space/logic/decide-graph-growth
 *
 * act 后图生长决策（纯函数，无 IO）。
 *
 * 定屏 rejected 时：若候选与某已知关键帧仍「足够像」，优先复用（link/stay/noop），
 * 避免「返回上一页」等场景因阈值略严而 spawn 近重复节点。
 */

import type { GraphGrowthDecision } from '../models/guided-act.js';
import type { KeyframeId } from '../models/ids.js';
import type { VisualMatchResult } from '../models/visual-match.js';

/**
 * 生长复用门槛（比 LIVE 定屏更松）。
 * dHash：score = 1 - dist/64；0.75 ≈ Hamming ≤ 16。
 * LIVE 默认阈值约 dist≤10（score≥0.84）；返回后状态栏/动画常落在 11–15。
 */
export const GRAPH_GROWTH_REUSE_MIN_SCORE = 0.75;

/** 歧义时要求 top1 相对 top2 的最小分差，才敢自动复用 */
export const GRAPH_GROWTH_REUSE_MIN_MARGIN = 0.03;

function decideForKnownLive(args: {
  fromKeyframeId: KeyframeId;
  successorIds: readonly KeyframeId[];
  liveId: KeyframeId;
  action: string;
}): GraphGrowthDecision {
  if (args.liveId === args.fromKeyframeId) {
    return {
      kind: 'stay',
      reason: 'still_on_from',
      fromKeyframeId: args.fromKeyframeId,
    };
  }
  if (args.successorIds.includes(args.liveId)) {
    return {
      kind: 'noop',
      reason: 'already_on_known_successor',
      liveKeyframeId: args.liveId,
    };
  }
  return {
    kind: 'link_only',
    fromKeyframeId: args.fromKeyframeId,
    toKeyframeId: args.liveId,
    action: args.action,
  };
}

/**
 * 从未接受的定屏结果中，找出可安全复用的已知关键帧。
 * - below_threshold：top1 足够像 → 复用
 * - ambiguous：top1 足够像且明显优于 top2 → 复用；否则交人工
 */
export function resolveReusableKeyframeId(
  fixation: VisualMatchResult,
  options?: { minScore?: number; minMargin?: number },
): KeyframeId | null {
  const minScore = options?.minScore ?? GRAPH_GROWTH_REUSE_MIN_SCORE;
  const minMargin = options?.minMargin ?? GRAPH_GROWTH_REUSE_MIN_MARGIN;
  const best = fixation.candidates[0];
  if (!best || best.score < minScore) return null;

  if (fixation.rejectReason === 'ambiguous') {
    const second = fixation.candidates[1];
    if (second && best.score - second.score < minMargin) return null;
  }

  return best.id;
}

export function decideGraphGrowth(args: {
  fromKeyframeId: KeyframeId;
  successorIds: readonly KeyframeId[];
  fixation: VisualMatchResult;
  midsceneOk: boolean;
  actionText: string;
}): GraphGrowthDecision {
  const action = args.actionText.trim() || '未命名动作';
  if (!args.midsceneOk) {
    return { kind: 'needs_human', reason: 'act_failed' };
  }
  if (!args.fromKeyframeId) {
    return { kind: 'needs_human', reason: 'no_from' };
  }

  const { fixation } = args;

  let liveId: KeyframeId | undefined = fixation.accepted
    ? fixation.currentKeyframeId
    : undefined;

  if (!liveId) {
    const reused = resolveReusableKeyframeId(fixation);
    if (reused) {
      liveId = reused;
    } else if (fixation.rejectReason === 'ambiguous') {
      return { kind: 'needs_human', reason: 'ambiguous' };
    } else {
      return {
        kind: 'spawn_and_link',
        fromKeyframeId: args.fromKeyframeId,
        action,
      };
    }
  }

  // 宽松近重复命中「仍是 from」不可靠（WPS 首页↔AI 入口常落在 0.75–0.84）。
  // 仅当定屏 accepted 才 stay；否则升为 spawn，交给 LLM 终审。
  if (liveId === args.fromKeyframeId && !fixation.accepted) {
    return {
      kind: 'spawn_and_link',
      fromKeyframeId: args.fromKeyframeId,
      action,
    };
  }

  return decideForKnownLive({
    fromKeyframeId: args.fromKeyframeId,
    successorIds: args.successorIds,
    liveId,
    action,
  });
}
