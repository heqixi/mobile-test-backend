import { type TUserPrompt } from '../../../common';
import type { PlanningAIResponse } from '../../../types';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import type { CustomPlanningInput, CustomPlanningMessageConfig, ResolvedCustomPlanningDefinition } from '../../model-adapter/custom-planning-types';
import type { PlanOptions } from './types';
export declare function buildCustomPlanningMessages<TParsed>(input: CustomPlanningInput, config: CustomPlanningMessageConfig<TParsed>): ChatCompletionMessageParam[];
export declare function runCustomPlanning<TParsed>(userInstruction: TUserPrompt, options: PlanOptions, config: ResolvedCustomPlanningDefinition<TParsed>): Promise<PlanningAIResponse>;
