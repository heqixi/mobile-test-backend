import type { ResolvedCustomPlanningDefinition } from './custom-planning-types';
import type { LocateAdapter, ModelAdapterDefinition } from './types';
export declare function resolveLocate(locate: ModelAdapterDefinition['locate'], resolvedCustomPlanner: ResolvedCustomPlanningDefinition | undefined): LocateAdapter;
