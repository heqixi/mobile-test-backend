import { StaticPage, StaticPageAgent } from "@midscene/web/static";
import { isZodObjectSchema, unwrapZodType } from "../types.mjs";
import { actionNameForType } from "./action-label.mjs";
import { getPlaceholderForType } from "./prompt-placeholder.mjs";
const staticAgentFromContext = (context)=>{
    const page = new StaticPage(context);
    return new StaticPageAgent(page);
};
const isRunButtonEnabled = (runButtonEnabled, needsStructuredParams, params, actionSpace, selectedType, promptValue)=>{
    if (!runButtonEnabled) return false;
    const needsAnyInput = (()=>{
        if (actionSpace) {
            const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
            if (action) {
                if (!action.paramSchema) return false;
                if ('object' == typeof action.paramSchema && 'shape' in action.paramSchema) {
                    const shape = action.paramSchema.shape || {};
                    const shapeKeys = Object.keys(shape);
                    return shapeKeys.length > 0;
                }
            }
        }
        return true;
    })();
    if (!needsAnyInput) return true;
    if (needsStructuredParams) {
        const currentParams = params || {};
        const action = null == actionSpace ? void 0 : actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
        if ((null == action ? void 0 : action.paramSchema) && isZodObjectSchema(action.paramSchema)) {
            const schema = action.paramSchema;
            const shape = schema.shape || {};
            return Object.keys(shape).every((key)=>{
                const field = shape[key];
                const { isOptional } = unwrapZodType(field);
                const value = currentParams[key];
                return isOptional || void 0 !== value && '' !== value && null !== value;
            });
        }
        return true;
    }
    return promptValue.trim().length > 0;
};
export { actionNameForType, getPlaceholderForType, isRunButtonEnabled, staticAgentFromContext };
