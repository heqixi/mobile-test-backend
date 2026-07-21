import { findAllMidsceneLocatorField } from "../../../common.mjs";
import { getDebug } from "@midscene/shared/logger";
import { assert } from "@midscene/shared/utils";
const debug = getDebug('planning');
function normalizePlanningActionLocateFields(actions, { actionSpace, includeLocateInPlanning, locateResultAdapter, locateResultContext }) {
    actions.forEach((action)=>{
        const actionInActionSpace = actionSpace.find((actionInSpace)=>actionInSpace.name === action.type);
        if (!actionInActionSpace) return void debug('skip locate normalization for action outside actionSpace', action);
        debug('actionInActionSpace matched', actionInActionSpace);
        const locateFields = findAllMidsceneLocatorField(actionInActionSpace.paramSchema);
        debug('locateFields', locateFields);
        locateFields.forEach((field)=>{
            const locateResult = action.param?.[field];
            if (!locateResult) return;
            if (!includeLocateInPlanning) {
                if ('object' == typeof locateResult) action.param[field] = {
                    prompt: locateResult.prompt
                };
                return;
            }
            assert(locateResultAdapter, 'planning locate normalization requires a locate result adapter');
            action.param[field] = {
                ...locateResult,
                locatedPixelBbox: locateResultAdapter.adaptPlanningParamToPixelBbox(locateResult, locateResultContext)
            };
        });
    });
}
export { normalizePlanningActionLocateFields };

//# sourceMappingURL=locate-normalization.mjs.map