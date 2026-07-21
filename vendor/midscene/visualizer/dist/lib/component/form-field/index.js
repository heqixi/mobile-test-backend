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
    EnumField: ()=>EnumField,
    NumberField: ()=>NumberField,
    LocateField: ()=>LocateField,
    TextField: ()=>TextField,
    BooleanField: ()=>BooleanField
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const external_antd_namespaceObject = require("antd");
const { TextArea } = external_antd_namespaceObject.Input;
const renderLabel = (label, isOptional)=>`${label}${isOptional ? ' (Optional)' : ''}`;
const TextField = ({ name, label, isRequired, marginBottom, placeholder: customPlaceholder })=>{
    const placeholder = customPlaceholder || `Enter ${name}`;
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
        name: [
            'params',
            name
        ],
        label: renderLabel(label, !isRequired),
        rules: isRequired ? [
            {
                required: true,
                message: `Please input ${name}`
            }
        ] : [],
        style: {
            marginBottom
        },
        colon: false,
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Input, {
            placeholder: placeholder
        })
    }, name);
};
const LocateField = ({ name, label, isRequired, marginBottom, placeholder: customPlaceholder })=>{
    const placeholder = customPlaceholder || `Describe the ${name}, use natural language`;
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
        name: [
            'params',
            name
        ],
        label: renderLabel(label, !isRequired),
        rules: isRequired ? [
            {
                required: true,
                message: `The ${name} is required`
            }
        ] : [],
        style: {
            marginBottom
        },
        colon: false,
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(TextArea, {
            rows: 2,
            placeholder: placeholder
        })
    }, name);
};
const EnumField = ({ name, label, fieldSchema, isRequired, marginBottom, placeholder: customPlaceholder })=>{
    var _fieldSchema__def;
    const enumValues = (null == (_fieldSchema__def = fieldSchema._def) ? void 0 : _fieldSchema__def.values) || [];
    const selectOptions = enumValues.map((value)=>({
            value,
            label: value.charAt(0).toUpperCase() + value.slice(1)
        }));
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
        name: [
            'params',
            name
        ],
        label: label,
        rules: isRequired ? [
            {
                required: true,
                message: `Please select ${name}`
            }
        ] : [],
        style: {
            marginBottom
        },
        colon: false,
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Select, {
            placeholder: customPlaceholder || `Select ${name}`,
            options: selectOptions
        })
    }, name);
};
const NumberField = ({ name, label, isRequired, marginBottom, placeholder: customPlaceholder })=>{
    const defaultPlaceholder = 'distance' === name ? 500 : 0;
    const placeholderValue = customPlaceholder ? Number(customPlaceholder) || defaultPlaceholder : defaultPlaceholder;
    const min = 0;
    const max = 'distance' === name ? 10000 : void 0;
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
        name: [
            'params',
            name
        ],
        label: `${label}${'distance' === name ? ' (px)' : ''}`,
        rules: isRequired ? [
            {
                required: true,
                message: `Please input ${name}`
            },
            {
                type: 'number',
                min,
                message: `${label} must be at least ${min}`
            }
        ] : [
            {
                type: 'number',
                min,
                message: `${label} must be at least ${min}`
            }
        ],
        style: {
            flex: 'distance' === name ? 1 : void 0,
            marginBottom
        },
        colon: false,
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.InputNumber, {
            placeholder: placeholderValue.toString(),
            min: min,
            max: max,
            step: 'distance' === name ? 10 : 1,
            style: {
                width: '100%'
            }
        })
    }, name);
};
const BooleanField = ({ name, label, isRequired, marginBottom, placeholder: customPlaceholder })=>{
    const selectOptions = [
        {
            value: true,
            label: 'True'
        },
        {
            value: false,
            label: 'False'
        }
    ];
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
        name: [
            'params',
            name
        ],
        label: renderLabel(label, !isRequired),
        rules: isRequired ? [
            {
                required: true,
                message: `Please select ${name}`
            }
        ] : [],
        style: {
            marginBottom
        },
        colon: false,
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Select, {
            placeholder: customPlaceholder || `Select ${name}`,
            options: selectOptions
        })
    }, name);
};
exports.BooleanField = __webpack_exports__.BooleanField;
exports.EnumField = __webpack_exports__.EnumField;
exports.LocateField = __webpack_exports__.LocateField;
exports.NumberField = __webpack_exports__.NumberField;
exports.TextField = __webpack_exports__.TextField;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "BooleanField",
    "EnumField",
    "LocateField",
    "NumberField",
    "TextField"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
