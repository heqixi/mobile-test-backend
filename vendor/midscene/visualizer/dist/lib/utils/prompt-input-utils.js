"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    getAvailablePromptActionTypes: ()=>getAvailablePromptActionTypes,
    shouldOffsetEmptyStateForPromptInput: ()=>shouldOffsetEmptyStateForPromptInput,
    getInlineStructuredFieldConfig: ()=>getInlineStructuredFieldConfig
});
const external_types_js_namespaceObject = require("../types.js");
const external_constants_js_namespaceObject = require("./constants.js");
const getAvailablePromptActionTypes = (actionSpace)=>{
    const metadataMethods = Object.keys(external_constants_js_namespaceObject.apiMetadata);
    if (!(null == actionSpace ? void 0 : actionSpace.length)) return metadataMethods;
    const availableMethods = actionSpace.map((action)=>action.interfaceAlias || action.name);
    const finalMethods = new Set();
    metadataMethods.forEach((method)=>{
        const methodInfo = external_constants_js_namespaceObject.apiMetadata[method];
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
    if (!(null == action ? void 0 : action.paramSchema) || !(0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) return null;
    const schema = action.paramSchema;
    const shape = schema.shape || {};
    const keys = Object.keys(shape);
    if (1 !== keys.length) return null;
    const [name] = keys;
    const field = shape[name];
    const { actualField } = (0, external_types_js_namespaceObject.unwrapZodType)(field);
    const isLocate = (0, external_types_js_namespaceObject.isLocateField)(actualField);
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
    if (!(null == action ? void 0 : action.paramSchema) || !(0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) return false;
    const schema = action.paramSchema;
    return Object.keys(schema.shape || {}).length > 1;
};
exports.getAvailablePromptActionTypes = __webpack_exports__.getAvailablePromptActionTypes;
exports.getInlineStructuredFieldConfig = __webpack_exports__.getInlineStructuredFieldConfig;
exports.shouldOffsetEmptyStateForPromptInput = __webpack_exports__.shouldOffsetEmptyStateForPromptInput;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "getAvailablePromptActionTypes",
    "getInlineStructuredFieldConfig",
    "shouldOffsetEmptyStateForPromptInput"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
