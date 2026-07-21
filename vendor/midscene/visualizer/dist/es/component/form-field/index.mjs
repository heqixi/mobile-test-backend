import { jsx } from "react/jsx-runtime";
import { Form, Input, InputNumber, Select } from "antd";
const { TextArea } = Input;
const renderLabel = (label, isOptional)=>`${label}${isOptional ? ' (Optional)' : ''}`;
const TextField = ({ name, label, isRequired, marginBottom, placeholder: customPlaceholder })=>{
    const placeholder = customPlaceholder || `Enter ${name}`;
    return /*#__PURE__*/ jsx(Form.Item, {
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
        children: /*#__PURE__*/ jsx(Input, {
            placeholder: placeholder
        })
    }, name);
};
const LocateField = ({ name, label, isRequired, marginBottom, placeholder: customPlaceholder })=>{
    const placeholder = customPlaceholder || `Describe the ${name}, use natural language`;
    return /*#__PURE__*/ jsx(Form.Item, {
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
        children: /*#__PURE__*/ jsx(TextArea, {
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
    return /*#__PURE__*/ jsx(Form.Item, {
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
        children: /*#__PURE__*/ jsx(Select, {
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
    return /*#__PURE__*/ jsx(Form.Item, {
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
        children: /*#__PURE__*/ jsx(InputNumber, {
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
    return /*#__PURE__*/ jsx(Form.Item, {
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
        children: /*#__PURE__*/ jsx(Select, {
            placeholder: customPlaceholder || `Select ${name}`,
            options: selectOptions
        })
    }, name);
};
export { BooleanField, EnumField, LocateField, NumberField, TextField };
