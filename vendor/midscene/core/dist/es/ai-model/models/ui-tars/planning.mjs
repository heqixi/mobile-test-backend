import { transformUiTarsActions } from "./actions.mjs";
import { parseUiTarsPlanningResponse } from "./parser.mjs";
import { getSummary, getUiTarsPlanningPrompt } from "./prompt.mjs";
function createUiTarsPlanner(uiTarsModelVersion) {
    return {
        messages: {
            systemPromptPlacement: 'user-message',
            buildSystemPrompt: getUiTarsPlanningPrompt,
            buildUserInstruction: (instruction)=>`<user_instruction>${instruction}</user_instruction>`,
            buildAssistantContent: (_parsedResponse, rawResponse)=>getSummary(rawResponse)
        },
        coordinates: {
            shape: 'point',
            order: 'xy',
            normalizedBy: 1
        },
        parseResponse: (rawResponse, { options })=>parseUiTarsPlanningResponse(rawResponse, options.context.shotSize, uiTarsModelVersion),
        transformActions: (parsedPlanningResponse)=>transformUiTarsActions(parsedPlanningResponse),
        shouldContinuePlanning: (_parsedResponse, actions)=>actions.every((action)=>'Finished' !== action.type),
        buildResponseLog: (_parsedResponse, rawResponse)=>getSummary(rawResponse)
    };
}
export { createUiTarsPlanner };

//# sourceMappingURL=planning.mjs.map