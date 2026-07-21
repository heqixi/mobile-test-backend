import { type TUserPrompt } from '../common';
import type { PlanningAIResponse, RawResponsePlanningAIResponse } from '../types';
import type { JsonParser } from './service-caller/json';
import type { PlanOptions } from './workflows/planning/types';
/**
 * Parse XML response from LLM and convert to RawResponsePlanningAIResponse.
 */
export declare function parseXMLPlanningResponse(xmlString: string, jsonParser: JsonParser): RawResponsePlanningAIResponse;
export declare function plan(userInstruction: TUserPrompt, opts: PlanOptions): Promise<PlanningAIResponse>;
