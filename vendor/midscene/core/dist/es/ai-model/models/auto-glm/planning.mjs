import { assert } from "@midscene/shared/utils";
import { createCoordinateDistanceToPixels } from "../../shared/model-locate-result/index.mjs";
import { transformAutoGLMAction } from "./actions.mjs";
import { parseAutoGLMPlanningResponse } from "./parser.mjs";
import { getAutoGLMChinesePlanPrompt, getAutoGLMMultilingualPlanPrompt } from "./prompt.mjs";
function createAutoGlmPlanner(isMultilingual) {
    return {
        messages: {
            systemPromptPlacement: 'system-message',
            buildSystemPrompt: ()=>isMultilingual ? getAutoGLMMultilingualPlanPrompt() : getAutoGLMChinesePlanPrompt(),
            historyImageLimit: 1,
            buildAssistantContent: (parsedResponse)=>`<think>${parsedResponse.response.think}</think><answer>${parsedResponse.response.content}</answer>`
        },
        coordinates: {
            shape: 'point',
            order: 'xy',
            normalizedBy: 1000
        },
        parseResponse: (rawResponse)=>parseAutoGLMPlanningResponse(rawResponse),
        transformActions: (parsedResponse, { options, coordinateSystem })=>{
            assert(coordinateSystem, 'Auto-GLM planning requires coordinate system');
            return transformAutoGLMAction(parsedResponse.action, {
                actionSpace: options.actionSpace,
                coordinateDistanceToPixels: createCoordinateDistanceToPixels(options.context.shotSize, coordinateSystem)
            });
        },
        shouldContinuePlanning: (parsedResponse)=>'finish' !== parsedResponse.action._metadata,
        buildResponseLog: (_parsedResponse, rawResponse)=>rawResponse
    };
}
export { createAutoGlmPlanner };

//# sourceMappingURL=planning.mjs.map