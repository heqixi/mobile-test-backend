import { isLocateField, isZodObjectSchema, unwrapZodType } from "../types.mjs";
import { apiMetadata } from "./constants.mjs";
const getAvailablePromptActionTypes = (actionSpace)=>{
    const metadataMethods = Object.keys(apiMetadata);
    if (!(null == actionSpace ? void 0 : actionSpace.length)) return metadataMethods;
    const availableMethods = actionSpace.map((action)=>action.interfaceAlias || action.name);
    const finalMethods = new Set();
    metadataMethods.forEach((method)=>{
        const methodInfo = apiMetadata[method];
        if ('aiAct' === method) return void finalMethods.add(method);
        if ((null == methodInfo ? void 0 : methodInfo.group) === 'extraction' || (null == methodInfo ? void 0 : methodInfo.group) === 'validation') return void finalMethods.add(method);
        if (availableMethods.includes(method)) finalMethods.add(method);
    });
    availableMethods.forEach((method)=>{
        finalMethods.add(method);
    });
    return Array.from(finalMethods);
};
const getInlineStructuredFieldConfig = (actionSpace, selectedType)=>{
    var _actualField__def, _actualField__def1;
    if (!(null == actionSpace ? void 0 : actionSpace.length) || !selectedType) return null;
    const action = actionSpace.find((item)=>item.interfaceAlias === selectedType || item.name === selectedType);
    if (!(null == action ? void 0 : action.paramSchema) || !isZodObjectSchema(action.paramSchema)) return null;
    const schema = action.paramSchema;
    const shape = schema.shape || {};
    const keys = Object.keys(shape);
    if (1 !== keys.length) return null;
    const [name] = keys;
    const field = shape[name];
    const { actualField } = unwrapZodType(field);
    const isLocate = isLocateField(actualField);
    const fieldType = null == (_actualField__def = actualField._def) ? void 0 : _actualField__def.typeName;
    const isInlineField = 'ZodString' === fieldType || isLocate;
    if (!isInlineField) return null;
    const placeholder = (null == (_actualField__def1 = actualField._def) ? void 0 : _actualField__def1.description) || actualField.description || (isLocate ? 'Describe the element you want to interact with' : `Enter ${name}`);
    return {
        name,
        placeholder
    };
};
const shouldOffsetEmptyStateForPromptInput = (actionSpace, selectedType)=>{
    if (!(null == actionSpace ? void 0 : actionSpace.length) || !selectedType) return false;
    if (getInlineStructuredFieldConfig(actionSpace, selectedType)) return false;
    const action = actionSpace.find((item)=>item.interfaceAlias === selectedType || item.name === selectedType);
    if (!(null == action ? void 0 : action.paramSchema) || !isZodObjectSchema(action.paramSchema)) return false;
    const schema = action.paramSchema;
    return Object.keys(schema.shape || {}).length > 1;
};
export { getAvailablePromptActionTypes, getInlineStructuredFieldConfig, shouldOffsetEmptyStateForPromptInput };
