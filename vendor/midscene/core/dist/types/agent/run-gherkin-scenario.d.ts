import type { AiActOptions } from './agent';
export type GherkinStepKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But';
export type RunGherkinScenarioOptions = AiActOptions & {
    context?: string;
};
type GherkinPrimaryKeyword = 'Given' | 'When' | 'Then';
type ParsedGherkinStep = {
    keyword: GherkinStepKeyword;
    effectiveKeyword: GherkinPrimaryKeyword;
    text: string;
    lineNumber: number;
};
type ParsedGherkinScenario = {
    scenario?: string;
    steps: ParsedGherkinStep[];
};
type GherkinScenarioAgent = {
    aiAct: (taskPrompt: string, opt?: AiActOptions) => Promise<unknown>;
    aiAssert: (assertion: string, msg?: string, opt?: {
        context?: string;
        abortSignal?: AbortSignal;
    }) => Promise<unknown>;
};
export declare const parseGherkinScenario: (scenarioText: string) => ParsedGherkinScenario;
export declare const runGherkinScenario: (agent: GherkinScenarioAgent, scenarioText: string, opt?: RunGherkinScenarioOptions) => Promise<void>;
export {};
