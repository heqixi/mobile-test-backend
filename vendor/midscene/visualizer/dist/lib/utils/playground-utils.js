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
    staticAgentFromContext: ()=>staticAgentFromContext,
    actionNameForType: ()=>external_action_label_js_namespaceObject.actionNameForType,
    getPlaceholderForType: ()=>external_prompt_placeholder_js_namespaceObject.getPlaceholderForType,
    isRunButtonEnabled: ()=>isRunButtonEnabled
});
const static_namespaceObject = require("@midscene/web/static");
const external_types_js_namespaceObject = require("../types.js");
const external_action_label_js_namespaceObject = require("./action-label.js");
const external_prompt_placeholder_js_namespaceObject = require("./prompt-placeholder.js");
const staticAgentFromContext = (context)=>{
    const page = new static_namespaceObject.StaticPage(context);
    return new static_namespaceObject.StaticPageAgent(page);
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
        if ((null == action ? void 0 : action.paramSchema) && (0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) {
            const schema = action.paramSchema;
            const shape = schema.shape || {};
            return Object.keys(shape).every((key)=>{
                const field = shape[key];
                const { isOptional } = (0, external_types_js_namespaceObject.unwrapZodType)(field);
                const value = currentParams[key];
                return isOptional || void 0 !== value && '' !== value && null !== value;
            });
        }
        return true;
    }
    return promptValue.trim().length > 0;
};
exports.actionNameForType = __webpack_exports__.actionNameForType;
exports.getPlaceholderForType = __webpack_exports__.getPlaceholderForType;
exports.isRunButtonEnabled = __webpack_exports__.isRunButtonEnabled;
exports.staticAgentFromContext = __webpack_exports__.staticAgentFromContext;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "actionNameForType",
    "getPlaceholderForType",
    "isRunButtonEnabled",
    "staticAgentFromContext"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
