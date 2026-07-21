import { z } from "zod";
const agentBehaviorInitArgShape = {
    aiActContext: z.string().optional().describe('Background knowledge passed to aiAct. Default: no extra context.'),
    replanningCycleLimit: z.number().int().nonnegative().optional().describe('Maximum number of replanning cycles for aiAct. Default: model adapter default.'),
    waitAfterAction: z.number().nonnegative().optional().describe('Wait time in milliseconds after each action execution. Default: 300ms.'),
    screenshotShrinkFactor: z.number().min(1).optional().describe('Screenshot shrink factor before sending images to AI. Default: 1; high values may reduce recognition quality, especially on mobile.')
};
function extractAgentBehaviorInitArgs(extracted) {
    if (!extracted) return;
    const agentOptions = {
        ...'string' == typeof extracted.aiActContext ? {
            aiActContext: extracted.aiActContext
        } : {},
        ...'string' == typeof extracted.aiActionContext ? {
            aiActionContext: extracted.aiActionContext
        } : {},
        ...'number' == typeof extracted.replanningCycleLimit ? {
            replanningCycleLimit: extracted.replanningCycleLimit
        } : {},
        ...'number' == typeof extracted.waitAfterAction ? {
            waitAfterAction: extracted.waitAfterAction
        } : {},
        ...'number' == typeof extracted.screenshotShrinkFactor ? {
            screenshotShrinkFactor: extracted.screenshotShrinkFactor
        } : {}
    };
    return Object.keys(agentOptions).length > 0 ? agentOptions : void 0;
}
function stableJsonValue(value) {
    if (Array.isArray(value)) return value.map(stableJsonValue);
    if (value && 'object' == typeof value) return Object.fromEntries(Object.entries(value).sort(([left], [right])=>left.localeCompare(right)).map(([key, nestedValue])=>[
            key,
            stableJsonValue(nestedValue)
        ]));
    return value;
}
function getAgentInitArgsSignature(initArgs) {
    if (!initArgs || 0 === Object.keys(initArgs).length) return;
    return JSON.stringify(stableJsonValue(initArgs));
}
function shouldRebuildAgentForInitArgs(currentSignature, nextSignature) {
    return currentSignature !== nextSignature && (void 0 !== currentSignature || void 0 !== nextSignature);
}
export { agentBehaviorInitArgShape, extractAgentBehaviorInitArgs, getAgentInitArgsSignature, shouldRebuildAgentForInitArgs };
