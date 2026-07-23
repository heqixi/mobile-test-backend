import type {
  GoalSpaceStorePort,
  RankedKeyframeHit,
  RankedTransitionHit,
  TextSearchPort,
  TextSearchQuery,
  TextSearchResult,
} from '@mtp/domain-goal-space';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，。；;、|/\\]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function scoreDoc(queryTokens: string[], doc: string): number {
  if (!queryTokens.length) return 0;
  const hay = doc.toLowerCase();
  let score = 0;
  for (const tok of queryTokens) {
    if (!tok) continue;
    if (hay.includes(tok)) {
      score += tok.length >= 2 ? 2 : 1;
      // bonus for whole-word-ish presence
      if (new RegExp(`(^|\\W)${escapeReg(tok)}(\\W|$)`).test(hay)) {
        score += 1;
      }
    }
  }
  return score;
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 词法文本检索（实现可替换为 FTS5）。域端口不变。
 */
export function createLexicalTextSearchPort(
  store: GoalSpaceStorePort,
): TextSearchPort {
  return {
    async search(query: TextSearchQuery): Promise<TextSearchResult> {
      const graph = await store.getGraph(query.ref);
      const restrict = query.restrictToKeyframeIds
        ? new Set(query.restrictToKeyframeIds)
        : null;
      const qTokens = tokenize(query.intentText);
      const maxK = query.maxKeyframes ?? 20;
      const maxT = query.maxTransitions ?? 20;

      const keyframes: RankedKeyframeHit[] = [];
      for (const kf of graph.keyframes) {
        if (restrict && !restrict.has(kf.keyframeId)) continue;
        const doc = [
          kf.screenName,
          kf.caption,
          ...(kf.widgets ?? []).flatMap((w) => [w.name, w.description ?? '']),
          ...(kf.tags ?? []),
        ].join(' ');
        const score = scoreDoc(qTokens, doc);
        if (score > 0) {
          keyframes.push({ id: kf.keyframeId, score });
        }
      }
      keyframes.sort((a, b) => b.score - a.score);
      const topK = keyframes.slice(0, maxK).map((h, i) => ({
        ...h,
        rank: i + 1,
      }));

      const allowNodes = restrict
        ? restrict
        : new Set(topK.map((h) => h.id));

      const transitions: RankedTransitionHit[] = [];
      for (const tr of graph.transitions) {
        if (
          !allowNodes.has(tr.fromKeyframeId) &&
          !allowNodes.has(tr.toKeyframeId)
        ) {
          continue;
        }
        const doc = [tr.action, tr.precondition ?? '', tr.effect ?? ''].join(
          ' ',
        );
        const score = scoreDoc(qTokens, doc);
        if (score > 0 || allowNodes.has(tr.fromKeyframeId)) {
          transitions.push({
            id: tr.transitionId,
            score: score > 0 ? score : 0.1,
          });
        }
      }
      transitions.sort((a, b) => b.score - a.score);
      const topT = transitions.slice(0, maxT).map((h, i) => ({
        ...h,
        rank: i + 1,
      }));

      // 无词法命中时：若有 restrict，仍返回 restrict 内节点（低分），保证级联可用
      if (topK.length === 0 && restrict && restrict.size > 0) {
        let i = 0;
        for (const id of restrict) {
          topK.push({ id, score: 0.01, rank: ++i });
          if (topK.length >= maxK) break;
        }
      }

      return { keyframes: topK, transitions: topT };
    },
  };
}
