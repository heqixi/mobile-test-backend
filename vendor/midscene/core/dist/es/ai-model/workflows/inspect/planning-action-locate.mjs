import { getDebug } from "@midscene/shared/logger";
import { assert } from "@midscene/shared/utils";
import { z } from "zod";
import { getMidsceneLocationSchema } from "../../../common.mjs";
import { ScreenshotItem } from "../../../screenshot-item.mjs";
import { ConversationHistory } from "../../conversation-history.mjs";
import { AIResponseParseError } from "../../service-caller/index.mjs";
import { runCustomPlanning } from "../planning/custom-planning.mjs";
const debugInspect = getDebug('ai:inspect');
const planningActionLocatorActionSpace = [
    {
        name: 'Tap',
        description: 'Tap the element',
        paramSchema: z.object({
            locate: getMidsceneLocationSchema()
        }),
        call: async ()=>void 0
    }
];
async function buildPlanningTapLocatorPlanOptions(locateRequest) {
    const { options, locateImage } = locateRequest;
    const { context } = options;
    return {
        ...options,
        context: {
            ...context,
            screenshot: ScreenshotItem.create(locateImage.imageBase64, context.screenshot.capturedAt),
            shotSize: {
                width: locateImage.width,
                height: locateImage.height
            }
        },
        actionSpace: planningActionLocatorActionSpace,
        conversationHistory: new ConversationHistory(),
        includeLocateInPlanning: true,
        referenceImageMessages: locateRequest.referenceImageMessages
    };
}
function resolvePlanningTapLocator(definition, planner) {
    const locatorPlanner = {
        ...planner,
        messages: {
            ...planner.messages,
            buildSystemPrompt: definition.buildSystemPrompt,
            buildUserInstruction: (instruction)=>`Tap: ${instruction}`
        }
    };
    return async (elementDescription, options, locateRequest)=>{
        assert(elementDescription, "cannot find the target element description");
        let errors = [];
        let reasoningContent = '';
        let rawResponse = '';
        let rawChoiceMessage;
        let usage;
        try {
            const locatePlanOptions = await buildPlanningTapLocatorPlanOptions(locateRequest);
            const planningResponse = await runCustomPlanning(elementDescription, locatePlanOptions, locatorPlanner);
            rawResponse = planningResponse.rawResponse ?? '';
            rawChoiceMessage = planningResponse.rawChoiceMessage;
            usage = planningResponse.usage;
            reasoningContent = planningResponse.log;
            debugInspect('planning-tap-locator rawResponse:', rawResponse);
            const locatedPixelBbox = definition.getLocatedPixelBbox(planningResponse.actions ?? []);
            if (!locatedPixelBbox) throw new Error('No locatedPixelBbox found in planner response');
            return {
                locatedPixelBbox,
                rawResponse,
                rawChoiceMessage,
                usage,
                reasoningContent
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (error instanceof AIResponseParseError) {
                rawResponse = error.rawResponse;
                rawChoiceMessage = error.rawChoiceMessage;
                usage = error.usage;
            }
            errors = [
                errorMessage || 'Failed to parse planning tap locator response'
            ];
            debugInspect('planning-tap-locator parse error:', errors[0]);
        }
        return {
            rawResponse,
            rawChoiceMessage,
            usage,
            reasoningContent,
            errors
        };
    };
}
export { resolvePlanningTapLocator };

//# sourceMappingURL=planning-action-locate.mjs.map