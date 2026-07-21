import type { CustomPlanningDefinition, ResolvedCustomPlanningDefinition } from './custom-planning-types';
import type { ModelAdapterDefinition, PlanningAdapter } from './types';
export declare function resolveCustomPlanningDefinition<TParsed>(config: CustomPlanningDefinition<TParsed>): ResolvedCustomPlanningDefinition<TParsed>;
export declare function resolvePlanning(planning: ModelAdapterDefinition['planning'], resolvedCustomPlanner?: ResolvedCustomPlanningDefinition): PlanningAdapter;
