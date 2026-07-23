/**
 * 启发式屏身份终审（无 LLM）：按视觉 score 灰度带判定。
 * 仅用于测试 / 离线兜底；生产应优先 OpenAI-compatible VL。
 */

import type {
  ScreenIdentityPort,
  ScreenIdentityJudgeResult,
} from '@mtp/domain-goal-space';

/** score ≥ 此值 → 可考虑 same；对 from 的灰区更严 */
const DEFAULT_SAME_MIN = 0.62;
/** 与 from 比较时，低于此分一律视为可能已切屏（避免挡生长） */
const FROM_SAME_STRICT_MIN = 0.88;

export function createHeuristicScreenIdentityPort(options?: {
  sameMinScore?: number;
  fromSameMinScore?: number;
}): ScreenIdentityPort {
  const sameMin = options?.sameMinScore ?? DEFAULT_SAME_MIN;
  const fromSameMin = options?.fromSameMinScore ?? FROM_SAME_STRICT_MIN;
  return {
    async judge(input): Promise<ScreenIdentityJudgeResult> {
      const max = input.options?.maxCandidates ?? 3;
      const cands = input.candidates.slice(0, max);
      const best = cands[0];
      if (!best) {
        return {
          verdict: 'different_screen',
          reason: 'no_candidates',
          confidence: 1,
          diagnostics: { impl: 'heuristic' },
        };
      }
      const score = best.score ?? 0;
      const fromId = input.context?.fromKeyframeId;
      const isFrom = Boolean(fromId && best.keyframeId === fromId);
      const need = isFrom ? fromSameMin : sameMin;

      if (score >= need) {
        return {
          verdict: 'same_screen',
          matchedKeyframeId: best.keyframeId,
          confidence: Math.min(1, score),
          reason: `heuristic score ${score.toFixed(3)} ≥ ${need}${isFrom ? ' (from)' : ''}`,
          diagnostics: { impl: 'heuristic', score, isFrom },
        };
      }
      return {
        verdict: 'different_screen',
        confidence: Math.min(1, 1 - score),
        reason: `heuristic score ${score.toFixed(3)} < ${need}${isFrom ? ' (from gray→spawn)' : ''}`,
        diagnostics: { impl: 'heuristic', score, isFrom },
      };
    },
  };
}
