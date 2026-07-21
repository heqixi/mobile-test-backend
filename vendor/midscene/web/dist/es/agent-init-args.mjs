import { z } from "@midscene/core";
import { agentBehaviorInitArgShape, extractAgentBehaviorInitArgs } from "@midscene/shared/agent-tools/agent-behavior-init-args";
const webAgentInitArgShape = {
    url: z.string().url().optional().describe('URL to open in new tab (omit to use current page)'),
    ...agentBehaviorInitArgShape
};
function adaptWebAgentInitArgs(extracted) {
    if (!extracted) return;
    const initArgs = {
        ...'string' == typeof extracted.url ? {
            url: extracted.url
        } : {},
        ...extractAgentBehaviorInitArgs(extracted) ?? {}
    };
    return Object.keys(initArgs).length > 0 ? initArgs : void 0;
}
export { adaptWebAgentInitArgs, webAgentInitArgShape };

//# sourceMappingURL=agent-init-args.mjs.map