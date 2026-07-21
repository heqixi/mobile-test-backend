import type { ResolvedCustomPlanningDefinition } from '../../model-adapter/custom-planning-types';
import type { PlanningTapLocatorDefinition } from '../../model-adapter/types';
import type { LocateFn } from './types';
export declare function resolvePlanningTapLocator<TParsed>(definition: PlanningTapLocatorDefinition, planner: ResolvedCustomPlanningDefinition<TParsed>): LocateFn;
