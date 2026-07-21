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
    VALIDATION_CONSTANTS: ()=>VALIDATION_CONSTANTS,
    extractDefaultValue: ()=>extractDefaultValue,
    isLocateField: ()=>isLocateField,
    isZodObjectSchema: ()=>isZodObjectSchema,
    unwrapZodType: ()=>unwrapZodType
});
const VALIDATION_CONSTANTS = {
    ZOD_TYPES: {
        OPTIONAL: 'ZodOptional',
        DEFAULT: 'ZodDefault',
        NULLABLE: 'ZodNullable',
        OBJECT: 'ZodObject',
        ENUM: 'ZodEnum',
        NUMBER: 'ZodNumber',
        STRING: 'ZodString',
        BOOLEAN: 'ZodBoolean'
    },
    DEFAULT_VALUES: {
        ACTION_TYPE: 'aiAct',
        TIMEOUT_MS: 15000,
        CHECK_INTERVAL_MS: 3000
    }
};
const isZodObjectSchema = (schema)=>'object' == typeof schema && null !== schema && ('shape' in schema || 'ZodObject' === schema.type);
const isLocateField = (field)=>{
    var _field__def;
    const fieldWithRuntime = field;
    const hasMidsceneLocationInputShape = (shape)=>!!(null == shape ? void 0 : shape.prompt);
    if ((null == (_field__def = field._def) ? void 0 : _field__def.typeName) === VALIDATION_CONSTANTS.ZOD_TYPES.OBJECT) {
        var _field__def1;
        let shape;
        if (field._def.shape) shape = 'function' == typeof field._def.shape ? field._def.shape() : field._def.shape;
        if (!shape && fieldWithRuntime.shape) shape = fieldWithRuntime.shape;
        if (shape && 'prompt' in shape && shape.prompt) return true;
        if (hasMidsceneLocationInputShape(shape)) return true;
        const description = (null == (_field__def1 = field._def) ? void 0 : _field__def1.description) || fieldWithRuntime.description || '';
        if ('string' == typeof description && description.toLowerCase().includes('input field')) return true;
    }
    if ('object' == typeof field && null !== field) {
        var _fieldWithRuntime__def;
        const description = fieldWithRuntime.description || (null == (_fieldWithRuntime__def = fieldWithRuntime._def) ? void 0 : _fieldWithRuntime__def.description) || '';
        if ('string' == typeof description) {
            const desc = description.toLowerCase();
            if (desc.includes('input field') || desc.includes('element') || desc.includes('locate')) return true;
        }
        if ('ZodObject' === fieldWithRuntime.typeName || 'ZodObject' === fieldWithRuntime.type) {
            if (hasMidsceneLocationInputShape(fieldWithRuntime.shape)) return true;
            return 'string' == typeof description && description.toLowerCase().includes('input field');
        }
    }
    return false;
};
const unwrapZodType = (field)=>{
    var _actualField__def, _actualField__def1, _actualField__def2;
    let actualField = field;
    let isOptional = false;
    let hasDefault = false;
    while((null == (_actualField__def = actualField._def) ? void 0 : _actualField__def.typeName) === VALIDATION_CONSTANTS.ZOD_TYPES.OPTIONAL || (null == (_actualField__def1 = actualField._def) ? void 0 : _actualField__def1.typeName) === VALIDATION_CONSTANTS.ZOD_TYPES.DEFAULT || (null == (_actualField__def2 = actualField._def) ? void 0 : _actualField__def2.typeName) === VALIDATION_CONSTANTS.ZOD_TYPES.NULLABLE){
        var _actualField__def3, _actualField__def4;
        if ((null == (_actualField__def3 = actualField._def) ? void 0 : _actualField__def3.typeName) === VALIDATION_CONSTANTS.ZOD_TYPES.OPTIONAL) isOptional = true;
        if ((null == (_actualField__def4 = actualField._def) ? void 0 : _actualField__def4.typeName) === VALIDATION_CONSTANTS.ZOD_TYPES.DEFAULT) hasDefault = true;
        actualField = actualField._def.innerType || actualField;
    }
    return {
        actualField,
        isOptional,
        hasDefault
    };
};
const extractDefaultValue = (field)=>{
    var _currentField__def;
    let currentField = field;
    while(null == (_currentField__def = currentField._def) ? void 0 : _currentField__def.innerType){
        if (currentField._def.typeName === VALIDATION_CONSTANTS.ZOD_TYPES.DEFAULT) {
            if ('function' == typeof currentField._def.defaultValue) return currentField._def.defaultValue();
            if (void 0 !== currentField._def._serializedDefaultValue) return currentField._def._serializedDefaultValue;
        }
        currentField = currentField._def.innerType;
    }
};
exports.VALIDATION_CONSTANTS = __webpack_exports__.VALIDATION_CONSTANTS;
exports.extractDefaultValue = __webpack_exports__.extractDefaultValue;
exports.isLocateField = __webpack_exports__.isLocateField;
exports.isZodObjectSchema = __webpack_exports__.isZodObjectSchema;
exports.unwrapZodType = __webpack_exports__.unwrapZodType;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "VALIDATION_CONSTANTS",
    "extractDefaultValue",
    "isLocateField",
    "isZodObjectSchema",
    "unwrapZodType"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
