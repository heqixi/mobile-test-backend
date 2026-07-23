import type {
  ContextPack,
  ContextPackDiagnostics,
  GoalSpaceRef,
  GoalSpaceRetrievePort,
  GoalSpaceRetrieveQuery,
  GoalSpaceStorePort,
  GraphNeighborhoodPort,
  RetrieveStrategy,
  TextSearchPort,
  VisualMatchPort,
} from '@mtp/domain-goal-space';
import { GoalSpaceDomainError } from '@mtp/domain-goal-space';

function rrfScore(ranks: number[], k = 60): number {
  return ranks.reduce((s, r) => s + 1 / (k + r), 0);
}

export function createRetrievePort(deps: {
  store: GoalSpaceStorePort;
  text: TextSearchPort;
  visual: VisualMatchPort;
  neighborhood: GraphNeighborhoodPort;
}): GoalSpaceRetrievePort {
  const { store, text, visual, neighborhood } = deps;

  async function resolveRef(
    query: GoalSpaceRetrieveQuery,
  ): Promise<GoalSpaceRef> {
    if (query.ref?.spaceId && query.ref.version) return query.ref;
    const spaceId = query.ref?.spaceId ?? query.spaceId;
    if (!spaceId) {
      throw new GoalSpaceDomainError(
        'SPACE_NOT_FOUND',
        'spaceId or ref required',
      );
    }
    if (query.ref?.version) {
      return { spaceId, version: query.ref.version };
    }
    const latest = await store.resolveLatest(spaceId);
    if (!latest) {
      throw new GoalSpaceDomainError(
        'VERSION_NOT_FOUND',
        `no published version for space ${spaceId}`,
      );
    }
    return latest;
  }

  return {
    async retrieve(query: GoalSpaceRetrieveQuery): Promise<ContextPack> {
      const ref = await resolveRef(query);
      const limits = query.limits ?? {};
      const maxKeyframes = limits.maxKeyframes ?? 3;
      const maxTransitions = limits.maxTransitions ?? 6;
      const hop = limits.hop ?? 1;
      const pref = query.strategy ?? 'auto';

      const screenshot = query.currentScreenshot
        ? query.currentScreenshot
        : undefined;

      let visualAccepted = false;
      let visualRejectReason: ContextPackDiagnostics['visualRejectReason'];
      let currentKeyframeId = query.currentKeyframeId;
      let visualRanks = new Map<string, number>();

      if (screenshot?.base64) {
        const vm = await visual.match({
          ref,
          screenshot,
          maxCandidates: 8,
        });
        visualAccepted = vm.accepted;
        visualRejectReason = vm.rejectReason;
        if (vm.accepted && vm.currentKeyframeId) {
          currentKeyframeId = vm.currentKeyframeId;
        }
        for (const c of vm.candidates) {
          if (c.rank != null) visualRanks.set(c.id, c.rank);
        }
      } else if (!currentKeyframeId) {
        visualRejectReason = 'no_screenshot';
      }

      let strategy: RetrieveStrategy;
      if (pref === 'cascade' || pref === 'text_only' || pref === 'late_fusion') {
        strategy = pref;
      } else if (visualAccepted && currentKeyframeId) {
        strategy = 'cascade';
      } else {
        strategy = 'text_only';
      }

      const graph = await store.getGraph(ref);
      const byId = new Map(graph.keyframes.map((k) => [k.keyframeId, k]));
      const trById = new Map(graph.transitions.map((t) => [t.transitionId, t]));

      let selectedIds: string[] = [];
      let selectedTrIds: string[] = [];
      const scores = new Map<string, number>();
      const trScores = new Map<string, number>();

      if (strategy === 'cascade' && currentKeyframeId) {
        const neigh = await neighborhood.expand({
          ref,
          seedKeyframeIds: [currentKeyframeId],
          hop,
        });
        const hits = await text.search({
          ref,
          intentText: query.intentText,
          restrictToKeyframeIds: neigh.keyframeIds,
          maxKeyframes: 20,
          maxTransitions: 20,
        });
        const ordered = new Set<string>([currentKeyframeId]);
        for (const h of hits.keyframes) ordered.add(h.id);
        for (const id of neigh.keyframeIds) ordered.add(id);
        selectedIds = [...ordered].slice(0, maxKeyframes);
        scores.set(currentKeyframeId, 1);
        for (const h of hits.keyframes) {
          scores.set(h.id, Math.max(scores.get(h.id) ?? 0, h.score));
        }
        for (const h of hits.transitions) {
          if (neigh.transitionIds.includes(h.id) || true) {
            trScores.set(h.id, h.score);
          }
        }
        selectedTrIds = [...trScores.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id)
          .filter((id) => {
            const t = trById.get(id);
            if (!t) return false;
            return (
              selectedIds.includes(t.fromKeyframeId) ||
              selectedIds.includes(t.toKeyframeId)
            );
          })
          .slice(0, maxTransitions);
      } else if (strategy === 'late_fusion') {
        const hits = await text.search({
          ref,
          intentText: query.intentText,
          maxKeyframes: 20,
          maxTransitions: 20,
        });
        const textRanks = new Map<string, number>();
        hits.keyframes.forEach((h, i) =>
          textRanks.set(h.id, h.rank ?? i + 1),
        );
        const allIds = new Set([
          ...textRanks.keys(),
          ...visualRanks.keys(),
        ]);
        const fused = [...allIds].map((id) => {
          const ranks: number[] = [];
          const tr = textRanks.get(id);
          const vr = visualRanks.get(id);
          if (tr != null) ranks.push(tr);
          if (vr != null) ranks.push(vr);
          return { id, score: rrfScore(ranks) };
        });
        fused.sort((a, b) => b.score - a.score);
        selectedIds = fused.slice(0, maxKeyframes).map((f) => f.id);
        for (const f of fused) scores.set(f.id, f.score);
        const seeds = selectedIds.slice(0, 3);
        const neigh = await neighborhood.expand({
          ref,
          seedKeyframeIds: seeds,
          hop,
        });
        selectedTrIds = neigh.transitionIds.slice(0, maxTransitions);
      } else {
        // text_only
        const hits = await text.search({
          ref,
          intentText: query.intentText,
          maxKeyframes: 20,
          maxTransitions: 20,
        });
        let seeds = hits.keyframes.map((h) => h.id);
        if (currentKeyframeId) seeds = [currentKeyframeId, ...seeds];
        if (seeds.length === 0 && graph.keyframes[0]) {
          seeds = [graph.keyframes[0].keyframeId];
        }
        const neigh = await neighborhood.expand({
          ref,
          seedKeyframeIds: seeds.slice(0, 5),
          hop,
        });
        const ordered = new Set<string>();
        if (currentKeyframeId) ordered.add(currentKeyframeId);
        for (const h of hits.keyframes) ordered.add(h.id);
        for (const id of neigh.keyframeIds) ordered.add(id);
        selectedIds = [...ordered].slice(0, maxKeyframes);
        for (const h of hits.keyframes) scores.set(h.id, h.score);
        for (const h of hits.transitions) trScores.set(h.id, h.score);
        selectedTrIds = [
          ...new Set([
            ...hits.transitions.map((h) => h.id),
            ...neigh.transitionIds,
          ]),
        ]
          .filter((id) => {
            const t = trById.get(id);
            if (!t) return false;
            return (
              selectedIds.includes(t.fromKeyframeId) ||
              selectedIds.includes(t.toKeyframeId)
            );
          })
          .slice(0, maxTransitions);
      }

      const keyframeSlices = selectedIds
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((kf) => ({
          keyframeId: kf!.keyframeId,
          screenName: kf!.screenName,
          caption: kf!.caption,
          widgets: kf!.widgets ?? [],
          score: scores.get(kf!.keyframeId),
        }));

      const transitionSlices = selectedTrIds
        .map((id) => trById.get(id))
        .filter(Boolean)
        .map((t) => ({
          transitionId: t!.transitionId,
          fromKeyframeId: t!.fromKeyframeId,
          toKeyframeId: t!.toKeyframeId,
          action: t!.action,
          precondition: t!.precondition,
          effect: t!.effect,
          score: trScores.get(t!.transitionId),
        }));

      const lines: string[] = [
        `## 目标状态空间参考 (\`${ref.spaceId}@${ref.version}\`)`,
        '',
        '### 候选状态',
      ];
      keyframeSlices.forEach((k, i) => {
        const widgets =
          k.widgets.map((w) => w.name).join('、') || '（无）';
        lines.push(
          `${i + 1}. **${k.screenName}** (\`${k.keyframeId}\`)${k.score != null ? ` — score=${k.score.toFixed(3)}` : ''}`,
          `   - 说明：${k.caption}`,
          `   - 控件：${widgets}`,
        );
      });
      lines.push('', '### 合法转移');
      if (transitionSlices.length === 0) {
        lines.push('- （无）');
      } else {
        for (const t of transitionSlices) {
          lines.push(
            `- \`${t.fromKeyframeId}\` → \`${t.toKeyframeId}\`：${t.action}`,
          );
        }
      }
      lines.push(
        '',
        '### 约束',
        '- actions / 点击目标优先使用上述控件别名与转移文案',
        '- 不要臆造未列出的入口',
      );

      const truncated =
        graph.keyframes.length > maxKeyframes ||
        graph.transitions.length > maxTransitions;

      return {
        ref,
        retrievedAt: new Date().toISOString(),
        textMarkdown: lines.join('\n'),
        keyframes: keyframeSlices,
        transitions: transitionSlices,
        querySummary: query.intentText.slice(0, 200),
        truncated,
        diagnostics: {
          strategyUsed: strategy,
          visualAccepted,
          visualRejectReason,
          currentKeyframeId,
          neighborhoodSize: selectedIds.length,
        },
      };
    },
  };
}
