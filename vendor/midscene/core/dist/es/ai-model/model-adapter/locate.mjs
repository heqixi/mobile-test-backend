import { createLocateResultAdapter } from "../shared/model-locate-result/factory.mjs";
import { resolvePlanningTapLocator } from "../workflows/inspect/planning-action-locate.mjs";
const defaultLocateResultAdapterDefinition = {
    coordinates: {
        shape: 'bbox',
        order: 'xy',
        normalizedBy: 1000
    }
};
function resolveLocate(locate, resolvedCustomPlanner) {
    if (locate?.kind === 'custom') {
        let locateFn = locate.locateFn;
        if (!locateFn) {
            const planningTapLocator = locate.planningTapLocator;
            if (!planningTapLocator) throw new Error('Custom locate definition requires either locateFn or planningTapLocator');
            if (!resolvedCustomPlanner) throw new Error('Custom planning tap locator requires a custom planning planner definition');
            locateFn = resolvePlanningTapLocator(planningTapLocator, resolvedCustomPlanner);
        }
        return {
            kind: 'custom',
            supportsSearchArea: locate.supportsSearchArea ?? false,
            locateFn
        };
    }
    return {
        kind: 'standard',
        supportsSearchArea: locate?.supportsSearchArea ?? true,
        resultAdapter: createLocateResultAdapter(locate?.resultAdapter ?? defaultLocateResultAdapterDefinition)
    };
}
export { resolveLocate };

//# sourceMappingURL=locate.mjs.map