import type { CustomPlanningDefinition } from '../../model-adapter/custom-planning-types';
import { parseAutoGLMPlanningResponse } from './parser';
type AutoGLMParsedResponse = ReturnType<typeof parseAutoGLMPlanningResponse>;
export declare function createAutoGlmPlanner(isMultilingual: boolean): CustomPlanningDefinition<AutoGLMParsedResponse>;
export {};
