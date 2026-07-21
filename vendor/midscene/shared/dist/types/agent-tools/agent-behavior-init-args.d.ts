import { z } from 'zod';
export interface AgentBehaviorInitArgs {
    aiActContext?: string;
    aiActionContext?: string;
    replanningCycleLimit?: number;
    waitAfterAction?: number;
    screenshotShrinkFactor?: number;
}
export declare const agentBehaviorInitArgShape: {
    aiActContext: z.ZodOptional<z.ZodString>;
    replanningCycleLimit: z.ZodOptional<z.ZodNumber>;
    waitAfterAction: z.ZodOptional<z.ZodNumber>;
    screenshotShrinkFactor: z.ZodOptional<z.ZodNumber>;
};
export declare function extractAgentBehaviorInitArgs(extracted: Partial<AgentBehaviorInitArgs> | undefined): AgentBehaviorInitArgs | undefined;
export declare function getAgentInitArgsSignature(initArgs: object | undefined): string | undefined;
export declare function shouldRebuildAgentForInitArgs(currentSignature: string | undefined, nextSignature: string | undefined): boolean;
