import { z } from '@midscene/core';
import { type AgentBehaviorInitArgs } from '@midscene/shared/agent-tools/agent-behavior-init-args';
export type WebAgentInitArgs = AgentBehaviorInitArgs & {
    url?: string;
};
export declare const webAgentInitArgShape: {
    aiActContext: z.ZodOptional<z.ZodString>;
    replanningCycleLimit: z.ZodOptional<z.ZodNumber>;
    waitAfterAction: z.ZodOptional<z.ZodNumber>;
    screenshotShrinkFactor: z.ZodOptional<z.ZodNumber>;
    url: z.ZodOptional<z.ZodString>;
};
export declare function adaptWebAgentInitArgs(extracted: Record<string, unknown> | undefined): WebAgentInitArgs | undefined;
