/**
 * @module @mtp/domain-goal-space/logic/apply-screen-identity
 *
 * 将屏身份终审结果并入图生长决策（纯函数）。
 */

import type { GraphGrowthDecision } from '../models/guided-act.js';
import type { KeyframeId } from '../models/ids.js';
import type { ScreenIdentityJudgeResult } from '../models/screen-identity.js';

function looksLikeLeavingScreen(actionText: string): boolean {
  const a = actionText.trim();
  if (/返回|后退|回去/.test(a)) return false;
  return /进入|打开|跳转|前往|切换|展开/.test(a);
}

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
 * 仅在初步决策为 spawn / ambiguous 时用终审覆盖。
 * - same_screen → 复用 matched 关键帧（若 matched=from 且操作像「离开」，仍 spawn）
 * - different_screen → spawn
 * - uncertain → needs_human
 */
export function applyScreenIdentityJudge(args: {
  preliminary: GraphGrowthDecision;
  judge: ScreenIdentityJudgeResult;
  fromKeyframeId: KeyframeId;
  successorIds: readonly KeyframeId[];
  actionText: string;
  candidateIds: readonly KeyframeId[];
}): GraphGrowthDecision {
  const action = args.actionText.trim() || '未命名动作';
  const prelim = args.preliminary;

  const eligible =
    prelim.kind === 'spawn_and_link' ||
    (prelim.kind === 'needs_human' && prelim.reason === 'ambiguous');
  if (!eligible) return prelim;

  const { judge } = args;
  if (judge.verdict === 'uncertain') {
    return { kind: 'needs_human', reason: 'ambiguous' };
  }

  if (judge.verdict === 'different_screen') {
    return {
      kind: 'spawn_and_link',
      fromKeyframeId: args.fromKeyframeId,
      action,
    };
  }

  // same_screen
  const matched =
    judge.matchedKeyframeId &&
    args.candidateIds.includes(judge.matchedKeyframeId)
      ? judge.matchedKeyframeId
      : args.candidateIds[0];
  if (!matched) {
    return {
      kind: 'spawn_and_link',
      fromKeyframeId: args.fromKeyframeId,
      action,
    };
  }

  // 「进入 WPS AI」却判回 from → 典型误判，保持生长
  if (
    matched === args.fromKeyframeId &&
    looksLikeLeavingScreen(args.actionText)
  ) {
    return {
      kind: 'spawn_and_link',
      fromKeyframeId: args.fromKeyframeId,
      action,
    };
  }

  return decideForKnownLive({
    fromKeyframeId: args.fromKeyframeId,
    successorIds: args.successorIds,
    liveId: matched,
    action,
  });
}

/** 初步决策是否值得调用终审（有候选可比） */
export function shouldJudgeScreenIdentity(
  preliminary: GraphGrowthDecision,
  candidateCount: number,
): boolean {
  if (candidateCount <= 0) return false;
  return (
    preliminary.kind === 'spawn_and_link' ||
    (preliminary.kind === 'needs_human' && preliminary.reason === 'ambiguous')
  );
}
