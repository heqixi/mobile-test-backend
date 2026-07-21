import { createLocateResultAdapter, resolveLocateResultCoordinates } from "../shared/model-locate-result/index.mjs";
import { runCustomPlanning } from "../workflows/planning/custom-planning.mjs";
const defaultReplanningCycleLimit = 20;
function resolveCustomPlanningDefinition(config) {
    const { coordinates, ...rest } = config;
    const coordinateSystem = resolveLocateResultCoordinates(coordinates);
    const coordinateNormalizer = createLocateResultAdapter({
        coordinates
    });
    return {
        ...rest,
        coordinateSystem,
        coordinateNormalizer
    };
}
function resolvePlanning(planning, resolvedCustomPlanner) {
    if (planning?.kind === 'custom') {
        if ('function' == typeof planning.planFn) return {
            kind: 'custom',
            cacheEnabled: planning.cacheEnabled ?? false,
            defaultReplanningCycleLimit: planning.defaultReplanningCycleLimit ?? defaultReplanningCycleLimit,
            supportsActionDeepLocate: planning.supportsActionDeepLocate ?? false,
            planFn: planning.planFn
        };
        if (!resolvedCustomPlanner) throw new Error('Custom planning planner definition is not resolved');
        return {
            kind: 'custom',
            cacheEnabled: planning.cacheEnabled ?? false,
            defaultReplanningCycleLimit: planning.defaultReplanningCycleLimit ?? defaultReplanningCycleLimit,
            supportsActionDeepLocate: planning.supportsActionDeepLocate ?? false,
            coordinateSystem: resolvedCustomPlanner.coordinateSystem,
            planFn: (userInstruction, options)=>runCustomPlanning(userInstruction, options, resolvedCustomPlanner)
        };
    }
    return {
        kind: 'standard',
        cacheEnabled: planning?.cacheEnabled ?? true,
        defaultReplanningCycleLimit: planning?.defaultReplanningCycleLimit ?? defaultReplanningCycleLimit,
        supportsActionDeepLocate: planning?.supportsActionDeepLocate ?? true
    };
}
export { resolveCustomPlanningDefinition, resolvePlanning };

//# sourceMappingURL=planning.mjs.map