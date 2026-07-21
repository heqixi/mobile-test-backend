import type { UITarsModelVersion } from '@midscene/shared/env';
import type { CustomPlanningDefinition } from '../../model-adapter/custom-planning-types';
import { type UiTarsParsedPlanningResponse } from './parser';
export declare function createUiTarsPlanner(uiTarsModelVersion: UITarsModelVersion): CustomPlanningDefinition<UiTarsParsedPlanningResponse>;
