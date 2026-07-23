import type {
  GoalSpaceStorePort,
  GraphNeighborhoodPort,
  NeighborhoodQuery,
  NeighborhoodResult,
} from '@mtp/domain-goal-space';

export function createGraphNeighborhoodPort(
  store: GoalSpaceStorePort,
): GraphNeighborhoodPort {
  return {
    async expand(query: NeighborhoodQuery): Promise<NeighborhoodResult> {
      const graph = await store.getGraph(query.ref);
      const hop = Math.max(0, Math.floor(query.hop));
      const seed = new Set(query.seedKeyframeIds);
      const keyframeIds = new Set<string>(seed);
      const transitionIds = new Set<string>();

      let frontier = new Set(seed);
      for (let h = 0; h < hop; h++) {
        const next = new Set<string>();
        for (const t of graph.transitions) {
          const fromIn = frontier.has(t.fromKeyframeId);
          const toIn = frontier.has(t.toKeyframeId);
          if (fromIn || toIn) {
            transitionIds.add(t.transitionId);
            if (!keyframeIds.has(t.fromKeyframeId)) {
              keyframeIds.add(t.fromKeyframeId);
              next.add(t.fromKeyframeId);
            }
            if (!keyframeIds.has(t.toKeyframeId)) {
              keyframeIds.add(t.toKeyframeId);
              next.add(t.toKeyframeId);
            }
          }
        }
        frontier = next;
        if (frontier.size === 0) break;
      }

      // include edges fully inside the node set even at hop 0 for seeds' self loops
      if (hop === 0) {
        for (const t of graph.transitions) {
          if (
            keyframeIds.has(t.fromKeyframeId) &&
            keyframeIds.has(t.toKeyframeId)
          ) {
            transitionIds.add(t.transitionId);
          }
        }
      }

      return {
        keyframeIds: [...keyframeIds],
        transitionIds: [...transitionIds],
      };
    },
  };
}
