import { getTapLocatedPixelBbox } from "../../shared/planning-action.mjs";
import { getAutoGLMChineseLocatePrompt, getAutoGLMMultilingualLocatePrompt } from "./prompt.mjs";
function createAutoGlmPlanningTapLocator(isMultilingual) {
    return {
        buildSystemPrompt: ()=>isMultilingual ? getAutoGLMMultilingualLocatePrompt() : getAutoGLMChineseLocatePrompt(),
        getLocatedPixelBbox: getTapLocatedPixelBbox
    };
}
export { createAutoGlmPlanningTapLocator };

//# sourceMappingURL=locate.mjs.map