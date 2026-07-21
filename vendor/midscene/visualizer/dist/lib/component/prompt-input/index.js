"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
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
    PromptInput: ()=>PromptInput
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const icons_namespaceObject = require("@ant-design/icons");
const external_antd_namespaceObject = require("antd");
const external_react_namespaceObject = require("react");
var external_react_default = /*#__PURE__*/ __webpack_require__.n(external_react_namespaceObject);
const useMinimalTypeGate_js_namespaceObject = require("../../hooks/useMinimalTypeGate.js");
const action_chevron_js_namespaceObject = require("../../icons/action-chevron.js");
var action_chevron_js_default = /*#__PURE__*/ __webpack_require__.n(action_chevron_js_namespaceObject);
const prompt_history_js_namespaceObject = require("../../icons/prompt-history.js");
var prompt_history_js_default = /*#__PURE__*/ __webpack_require__.n(prompt_history_js_namespaceObject);
const history_js_namespaceObject = require("../../store/history.js");
const external_types_js_namespaceObject = require("../../types.js");
const action_label_js_namespaceObject = require("../../utils/action-label.js");
const constants_js_namespaceObject = require("../../utils/constants.js");
const device_capabilities_js_namespaceObject = require("../../utils/device-capabilities.js");
const playground_utils_js_namespaceObject = require("../../utils/playground-utils.js");
const prompt_input_utils_js_namespaceObject = require("../../utils/prompt-input-utils.js");
const prompt_placeholder_js_namespaceObject = require("../../utils/prompt-placeholder.js");
const index_js_namespaceObject = require("../config-selector/index.js");
const external_form_field_index_js_namespaceObject = require("../form-field/index.js");
const external_history_selector_index_js_namespaceObject = require("../history-selector/index.js");
require("./index.css");
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = null != arguments[i] ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if ("function" == typeof Object.getOwnPropertySymbols) ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
            return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
const { TextArea } = external_antd_namespaceObject.Input;
const STUDIO_MINIMAL_PROMPT_ICONS = {
    action: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAASdJREFUeAHtlt3NgjAUhg8/CVx+G8gGX5xAnUDdQMcgkIgJBLbQEXQD3MAR6gZewgXgOUn9iRp6vAC96JM07YG36Zv+nBZAwySO4ymWgUoXRdEfaYGJyRElSbKyLGuHJVdpHcc5khb7RMCAZcA0TU82PYZ8IPsoZ4ttoEu0ga8bMB6DNE1X8H6jTUBuLmQL7SxkLbDkzz/ruhZBEKxfDGRZNm2aZgc9UFXVLAzDPbVvS1AUxQGrE3SPwHK8BganBy7NBuTU+r5vKLSNbG5RuwQF+hRoA9rA76RifMl4+JjI4Z5yu0KUZTnE8c4U3GbAdd3/HgYnPNu2R9eg98uIvmOGfL2M2tCpWBv4BQPiqW7j9IGWZ4CODT7X5pRAVFrUjEn7eNQ0bVwAyWpjMDlJKpAAAAAASUVORK5CYII=',
    actionChevron: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAUxJREFUeAHtUztOw0AQ3V1SuLCldP4VuEyHuQE34Aqho0tugHKCwBFyApwTYEoqyAlwCsufKkgu3NjmjfkoCDu7KSP5SaNZ774Zv9nZYWzAgH2MAdu2z4+J4apEy7I8uBDWlGV5uQNU4gRTBOd8CUfqPU3THlXjzlRIUH8HdwuLYB8wX9d1XhRFKIuVXpHjONd1XQdN0+yEED48h72iojGOr9I0fT4ULyTKPSR/aJVwPk+SZIuEET6n33uBrOmyHoTs694XSLz62cyybI3k96iEqgjodbFjAWVLVNDAnvo4dEYc4vZxOiswTXMGdXMsIyidsn7cwLbExU9mXQTeocqDe28POffo3tkBuK57UVXVG63RLz/P8w3rq2BvmH6byiSI43hD3DaZEP/68WcODMOg9z5BySs0dcEUgXl4wVzQ0h+NRhN8r9mAAaeDT7K0eaMcqhtVAAAAAElFTkSuQmCC',
    settings: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAaFJREFUeAHtlt9tgzAQxi8EJa/pBMkIHYENygalG7RvSQQKlfjz2I5ANkg3oBukG6QbtI9IIPq5ihHQOBXmFImqPwnZBvtsf9ydTfQPA77vz4IguCENDGJgOp3ux+PxLgxDnzrCsgAw/zZmGPOO48iUFci4wE42xITKXlEUO9d1X34s4NjZISZU9qCSjeKqastKWZYpMaKyNxqNto02MRDHcXmsJqvV6q7LWBYnxK4+SBOTeHDw2HAwn4aGlg9EUfQE2e+xYwchtaUeaPmAmFyUyH4W9aThA9jZ7alOiN39crl8O/FpoRpzjrq96hcgj2/wwVcNQlxb6/X6VdRrYaeNtGfUVvXbgE9iRNprOCHktPF/Z+3OeZ4fPM9LZbumgHjX2Qnr9rSioE/ma6MVBZDvWWQ/cbLR0GE5jEQoQhFLpGIkpvcuY1nOAkyeiBKJSRSXPw37UCkgbrWmaSZwsBkxoLInHBgJ6EG2KwUgn801+Tl78hyRVApkWfaIexxp4rRfqOzBUdN6+29cyYAMvQN1hCUMIbc1mUyu4VzDz4wX5wvRfah9kIOcwwAAAABJRU5ErkJggg=='
};
function PromptStopSquareIcon() {
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
        "aria-hidden": "true",
        className: "prompt-stop-square-icon"
    });
}
const PromptInput = ({ runButtonEnabled, form, serviceMode, selectedType, dryMode, stoppable, loading, onRun, onStop, clearPromptAfterRun = true, actionSpace, hideDomAndScreenshotOptions = false, deviceType, chrome })=>{
    var _chrome_icons, _chrome_icons1, _chrome_icons2, _chrome_icons3;
    const [hoveringSettings, setHoveringSettings] = (0, external_react_namespaceObject.useState)(false);
    const [promptValue, setPromptValue] = (0, external_react_namespaceObject.useState)('');
    const placeholder = (0, prompt_placeholder_js_namespaceObject.getPlaceholderForType)(selectedType);
    const isMinimalChrome = (null == chrome ? void 0 : chrome.variant) === 'minimal';
    const resolvedPlaceholder = (null == chrome ? void 0 : chrome.placeholder) || placeholder;
    const actionButtonLabel = (0, action_label_js_namespaceObject.getPromptInputActionLabel)(selectedType, null == chrome ? void 0 : chrome.primaryActionLabel);
    var _chrome_settingsPlacement;
    const settingsPlacement = null != (_chrome_settingsPlacement = null == chrome ? void 0 : chrome.settingsPlacement) ? _chrome_settingsPlacement : 'toolbar';
    const textAreaRef = (0, external_react_namespaceObject.useRef)(null);
    const modeRadioGroupRef = (0, external_react_namespaceObject.useRef)(null);
    const params = external_antd_namespaceObject.Form.useWatch('params', form);
    const lastHistoryRef = (0, external_react_namespaceObject.useRef)(null);
    const history = (0, history_js_namespaceObject.useHistoryStore)((state)=>state.history);
    const lastSelectedType = (0, history_js_namespaceObject.useHistoryStore)((state)=>state.lastSelectedType);
    const addHistory = (0, history_js_namespaceObject.useHistoryStore)((state)=>state.addHistory);
    const setLastSelectedType = (0, history_js_namespaceObject.useHistoryStore)((state)=>state.setLastSelectedType);
    const historyForSelectedType = (0, external_react_namespaceObject.useMemo)(()=>history[selectedType] || [], [
        history,
        selectedType
    ]);
    const handleMinimalTypeGateReset = (0, external_react_namespaceObject.useCallback)(()=>{
        lastHistoryRef.current = null;
        setPromptValue('');
    }, []);
    const { markExplicitSelection, skipNextRestore, shouldSkipRestoreOnce } = (0, useMinimalTypeGate_js_namespaceObject.useMinimalTypeGate)({
        enabled: isMinimalChrome,
        form,
        selectedType,
        onAfterReset: handleMinimalTypeGateReset
    });
    const needsStructuredParams = (0, external_react_namespaceObject.useMemo)(()=>{
        if (actionSpace) {
            const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
            if (!(null == action ? void 0 : action.paramSchema)) return false;
            if ((0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) {
                const schema = action.paramSchema;
                const shape = schema.shape || {};
                const shapeKeys = Object.keys(shape);
                return shapeKeys.length > 0;
            }
            return true;
        }
        return false;
    }, [
        selectedType,
        actionSpace
    ]);
    const needsAnyInput = (0, external_react_namespaceObject.useMemo)(()=>{
        if (actionSpace && actionSpace.length > 0) {
            const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
            if (action) {
                if (action.paramSchema && (0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) {
                    const schema = action.paramSchema;
                    const shape = schema.shape || {};
                    const hasRequiredFields = Object.keys(shape).some((key)=>{
                        const field = shape[key];
                        const { isOptional } = (0, external_types_js_namespaceObject.unwrapZodType)(field);
                        return !isOptional;
                    });
                    return hasRequiredFields;
                }
                return !!action.paramSchema;
            }
        }
        return true;
    }, [
        selectedType,
        actionSpace
    ]);
    const showDataExtractionOptions = (0, external_react_namespaceObject.useMemo)(()=>{
        const dataExtractionMethods = [
            'aiQuery',
            'aiBoolean',
            'aiNumber',
            'aiString',
            'aiAsk',
            'aiAssert'
        ];
        return dataExtractionMethods.includes(selectedType);
    }, [
        selectedType
    ]);
    const showDeepLocateOption = (0, external_react_namespaceObject.useMemo)(()=>{
        if ('aiAct' === selectedType || 'aiLocate' === selectedType) return true;
        if (actionSpace) {
            const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
            if ((null == action ? void 0 : action.paramSchema) && (0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) {
                const schema = action.paramSchema;
                const shape = schema.shape || {};
                const hasLocateField = Object.keys(shape).some((key)=>{
                    const field = shape[key];
                    const { actualField } = (0, external_types_js_namespaceObject.unwrapZodType)(field);
                    return (0, external_types_js_namespaceObject.isLocateField)(actualField);
                });
                return hasLocateField;
            }
        }
        return false;
    }, [
        selectedType,
        actionSpace
    ]);
    const showDeepThinkOption = (0, external_react_namespaceObject.useMemo)(()=>'aiAct' === selectedType, [
        selectedType
    ]);
    const hasConfigOptions = (0, external_react_namespaceObject.useMemo)(()=>{
        const hasTracking = 'In-Browser-Extension' === serviceMode;
        const hasDeepLocate = showDeepLocateOption;
        const hasDeepThink = showDeepThinkOption;
        const hasDataExtraction = showDataExtractionOptions && !hideDomAndScreenshotOptions;
        const hasDeviceOptions = (0, device_capabilities_js_namespaceObject.hasDeviceSpecificConfig)(deviceType);
        return hasTracking || hasDeepLocate || hasDeepThink || hasDataExtraction || hasDeviceOptions;
    }, [
        serviceMode,
        showDeepLocateOption,
        showDeepThinkOption,
        showDataExtractionOptions,
        hideDomAndScreenshotOptions,
        deviceType
    ]);
    const availableDropdownMethods = (0, external_react_namespaceObject.useMemo)(()=>(0, prompt_input_utils_js_namespaceObject.getAvailablePromptActionTypes)(actionSpace), [
        actionSpace
    ]);
    const hiddenDropdownAPIs = (0, external_react_namespaceObject.useMemo)(()=>availableDropdownMethods.filter((api)=>!constants_js_namespaceObject.defaultMainButtons.includes(api)), [
        availableDropdownMethods
    ]);
    const handleTypeSelect = (0, external_react_namespaceObject.useCallback)((api)=>{
        markExplicitSelection();
        form.setFieldValue('type', api);
    }, [
        form,
        markExplicitSelection
    ]);
    const apiGroupDefinitions = (0, external_react_namespaceObject.useMemo)(()=>[
            {
                key: 'interaction-group',
                label: 'Interaction APIs',
                match: (api)=>{
                    var _apiMetadata_api;
                    return (null == (_apiMetadata_api = constants_js_namespaceObject.apiMetadata[api]) ? void 0 : _apiMetadata_api.group) === 'interaction';
                }
            },
            {
                key: 'extraction-group',
                label: 'Data Extraction APIs',
                match: (api)=>{
                    var _apiMetadata_api;
                    return (null == (_apiMetadata_api = constants_js_namespaceObject.apiMetadata[api]) ? void 0 : _apiMetadata_api.group) === 'extraction';
                }
            },
            {
                key: 'validation-group',
                label: 'Validation APIs',
                match: (api)=>{
                    var _apiMetadata_api;
                    return (null == (_apiMetadata_api = constants_js_namespaceObject.apiMetadata[api]) ? void 0 : _apiMetadata_api.group) === 'validation';
                }
            },
            {
                key: 'device-specific-group',
                label: 'Device-Specific APIs',
                match: (api)=>!constants_js_namespaceObject.apiMetadata[api]
            }
        ], []);
    const buildApiMenuItem = (0, external_react_namespaceObject.useCallback)((api)=>{
        var _apiMetadata_api;
        return {
            key: api,
            label: (0, playground_utils_js_namespaceObject.actionNameForType)(api),
            title: (null == (_apiMetadata_api = constants_js_namespaceObject.apiMetadata[api]) ? void 0 : _apiMetadata_api.title) || '',
            onClick: ()=>handleTypeSelect(api)
        };
    }, [
        handleTypeSelect
    ]);
    const hiddenApiGroupItems = (0, external_react_namespaceObject.useMemo)(()=>{
        const items = [];
        for (const group of apiGroupDefinitions){
            const apisInGroup = hiddenDropdownAPIs.filter(group.match);
            if (0 !== apisInGroup.length) items.push({
                key: group.key,
                type: 'group',
                label: group.label,
                children: apisInGroup.map(buildApiMenuItem)
            });
        }
        return items;
    }, [
        apiGroupDefinitions,
        hiddenDropdownAPIs,
        buildApiMenuItem
    ]);
    const actionDropdownMenu = (0, external_react_namespaceObject.useMemo)(()=>{
        const primaryActions = constants_js_namespaceObject.defaultMainButtons.filter((api)=>availableDropdownMethods.includes(api));
        const items = [];
        if (primaryActions.length > 0) items.push({
            key: 'primary-group',
            type: 'group',
            label: 'Primary APIs',
            children: primaryActions.map(buildApiMenuItem)
        });
        items.push(...hiddenApiGroupItems);
        return {
            items
        };
    }, [
        availableDropdownMethods,
        buildApiMenuItem,
        hiddenApiGroupItems
    ]);
    const moreApisDropdownMenu = (0, external_react_namespaceObject.useMemo)(()=>({
            items: hiddenApiGroupItems
        }), [
        hiddenApiGroupItems
    ]);
    const getDefaultParams = (0, external_react_namespaceObject.useCallback)(()=>{
        if (!needsStructuredParams || !actionSpace) return {};
        const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
        if ((null == action ? void 0 : action.paramSchema) && (0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) {
            const defaultParams = {};
            const schema = action.paramSchema;
            const shape = schema.shape || {};
            Object.keys(shape).forEach((key)=>{
                const field = shape[key];
                const defaultValue = (0, external_types_js_namespaceObject.extractDefaultValue)(field);
                if (void 0 !== defaultValue) defaultParams[key] = defaultValue;
            });
            return defaultParams;
        }
        return {};
    }, [
        selectedType,
        needsStructuredParams,
        actionSpace
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (!isMinimalChrome && !form.getFieldValue('type') && lastSelectedType) form.setFieldValue('type', lastSelectedType);
    }, [
        form,
        isMinimalChrome,
        lastSelectedType
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (!isMinimalChrome && selectedType && selectedType !== lastSelectedType) setLastSelectedType(selectedType);
    }, [
        selectedType,
        isMinimalChrome,
        lastSelectedType,
        setLastSelectedType
    ]);
    const scrollToSelectedItem = (0, external_react_namespaceObject.useCallback)(()=>{
        const container = modeRadioGroupRef.current;
        if (!container) return;
        let targetElement = null;
        const selectedRadioButton = container.querySelector('.ant-radio-button-wrapper-checked');
        const dropdownButton = container.querySelector('.more-apis-button.selected-from-dropdown');
        if (selectedRadioButton) targetElement = selectedRadioButton;
        else if (dropdownButton) targetElement = dropdownButton;
        if (targetElement) {
            const containerRect = container.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            const targetLeft = targetRect.left - containerRect.left + container.scrollLeft;
            const targetWidth = targetRect.width;
            const containerWidth = containerRect.width;
            const optimalScrollLeft = targetLeft - (containerWidth - targetWidth) / 2;
            container.scrollTo({
                left: Math.max(0, optimalScrollLeft),
                behavior: 'smooth'
            });
        }
    }, []);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (shouldSkipRestoreOnce()) return;
        if (isMinimalChrome) {
            const defaultParams = getDefaultParams();
            form.setFieldsValue({
                prompt: '',
                params: defaultParams
            });
            setPromptValue('');
            lastHistoryRef.current = null;
            return;
        }
        const lastHistory = historyForSelectedType[0];
        if (lastHistory && lastHistoryRef.current && lastHistory.timestamp === lastHistoryRef.current.timestamp) return;
        if (lastHistory) {
            form.setFieldsValue({
                type: lastHistory.type,
                prompt: lastHistory.prompt || '',
                params: lastHistory.params
            });
            setPromptValue(lastHistory.prompt || '');
            lastHistoryRef.current = lastHistory;
        } else {
            const defaultParams = getDefaultParams();
            form.setFieldsValue({
                prompt: '',
                params: defaultParams
            });
            setPromptValue('');
            lastHistoryRef.current = null;
        }
    }, [
        selectedType,
        historyForSelectedType,
        form,
        getDefaultParams,
        isMinimalChrome,
        shouldSkipRestoreOnce
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        const timeoutId = setTimeout(()=>{
            scrollToSelectedItem();
        }, 100);
        return ()=>clearTimeout(timeoutId);
    }, [
        selectedType,
        scrollToSelectedItem
    ]);
    const formPromptValue = external_antd_namespaceObject.Form.useWatch('prompt', form);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (formPromptValue !== promptValue) setPromptValue(formPromptValue || '');
    }, [
        formPromptValue,
        promptValue
    ]);
    const handleSelectHistory = (0, external_react_namespaceObject.useCallback)((historyItem)=>{
        markExplicitSelection();
        if (historyItem.type !== selectedType) skipNextRestore();
        form.setFieldsValue({
            prompt: historyItem.prompt,
            type: historyItem.type,
            params: historyItem.params
        });
        setPromptValue(historyItem.prompt);
    }, [
        form,
        markExplicitSelection,
        selectedType,
        skipNextRestore
    ]);
    const handlePromptChange = (0, external_react_namespaceObject.useCallback)((e)=>{
        const value = e.target.value;
        setPromptValue(value);
    }, []);
    const hasSingleStructuredParam = (0, external_react_namespaceObject.useMemo)(()=>{
        if (!needsStructuredParams || !actionSpace) return false;
        const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
        if ((null == action ? void 0 : action.paramSchema) && (0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) {
            const schema = action.paramSchema;
            const shape = schema.shape || {};
            return 1 === Object.keys(shape).length;
        }
        return false;
    }, [
        selectedType,
        needsStructuredParams,
        actionSpace
    ]);
    const minimalInlineFieldConfig = (0, external_react_namespaceObject.useMemo)(()=>isMinimalChrome ? (0, prompt_input_utils_js_namespaceObject.getInlineStructuredFieldConfig)(actionSpace, selectedType) : null, [
        actionSpace,
        isMinimalChrome,
        selectedType
    ]);
    const isRunButtonEnabled = (0, external_react_namespaceObject.useMemo)(()=>(0, playground_utils_js_namespaceObject.isRunButtonEnabled)(runButtonEnabled, !!needsStructuredParams, params, actionSpace, selectedType, promptValue), [
        runButtonEnabled,
        needsStructuredParams,
        selectedType,
        actionSpace,
        promptValue,
        params
    ]);
    const isPromptInputEmpty = needsAnyInput && !needsStructuredParams && !promptValue.trim() && !loading && !stoppable;
    const handleRunWithHistory = (0, external_react_namespaceObject.useCallback)(()=>{
        const values = form.getFieldsValue();
        let historyPrompt = '';
        if (needsStructuredParams && values.params && actionSpace) {
            const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
            if ((null == action ? void 0 : action.paramSchema) && (0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) {
                let locateValue = '';
                const otherValues = [];
                const schema = action.paramSchema;
                const shape = schema.shape || {};
                Object.keys(shape).forEach((key)=>{
                    var _values_params;
                    const paramValue = null == (_values_params = values.params) ? void 0 : _values_params[key];
                    if (null != paramValue && '' !== paramValue) {
                        const field = shape[key];
                        const { actualField } = (0, external_types_js_namespaceObject.unwrapZodType)(field);
                        if ((0, external_types_js_namespaceObject.isLocateField)(actualField)) locateValue = String(paramValue);
                        else if ('distance' === key) otherValues.push(`${paramValue}`);
                        else otherValues.push(String(paramValue));
                    }
                });
                const mainPart = otherValues.join(' ');
                historyPrompt = locateValue ? `${locateValue} - ${mainPart}` : mainPart;
            } else historyPrompt = values.prompt || '';
        } else historyPrompt = values.prompt || '';
        const newHistoryItem = {
            type: values.type,
            prompt: historyPrompt,
            params: values.params,
            timestamp: Date.now()
        };
        addHistory(newHistoryItem);
        onRun();
        if (clearPromptAfterRun) {
            lastHistoryRef.current = newHistoryItem;
            setPromptValue('');
            if (needsStructuredParams) {
                const defaultParams = getDefaultParams();
                form.setFieldValue('params', defaultParams);
            } else form.setFieldValue('prompt', '');
        }
    }, [
        form,
        addHistory,
        onRun,
        needsStructuredParams,
        selectedType,
        clearPromptAfterRun,
        actionSpace,
        getDefaultParams
    ]);
    const handleKeyDown = (0, external_react_namespaceObject.useCallback)((e)=>{
        if ('Enter' === e.key && e.metaKey && isRunButtonEnabled) {
            handleRunWithHistory();
            e.preventDefault();
            e.stopPropagation();
        } else if ('Enter' === e.key) setTimeout(()=>{
            if (textAreaRef.current) {
                var _textAreaRef_current_resizableTextArea;
                const textarea = null == (_textAreaRef_current_resizableTextArea = textAreaRef.current.resizableTextArea) ? void 0 : _textAreaRef_current_resizableTextArea.textArea;
                if (textarea) {
                    const selectionStart = textarea.selectionStart;
                    const value = textarea.value;
                    const lastNewlineIndex = value.lastIndexOf('\n');
                    const isAtLastLine = -1 === lastNewlineIndex || selectionStart > lastNewlineIndex;
                    if (isAtLastLine) textarea.scrollTop = textarea.scrollHeight;
                }
            }
        }, 0);
    }, [
        handleRunWithHistory,
        isRunButtonEnabled
    ]);
    const handleStructuredKeyDown = (0, external_react_namespaceObject.useCallback)((e)=>{
        if ('Enter' === e.key && e.metaKey && isRunButtonEnabled) {
            handleRunWithHistory();
            e.preventDefault();
            e.stopPropagation();
        }
    }, [
        handleRunWithHistory,
        isRunButtonEnabled
    ]);
    const renderStructuredParams = (0, external_react_namespaceObject.useCallback)(()=>{
        if (!needsStructuredParams) return null;
        if (actionSpace) {
            const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
            if ((null == action ? void 0 : action.paramSchema) && (0, external_types_js_namespaceObject.isZodObjectSchema)(action.paramSchema)) {
                const schema = action.paramSchema;
                const shape = schema.shape || {};
                const schemaKeys = Object.keys(shape);
                if (1 === schemaKeys.length) {
                    const key = schemaKeys[0];
                    const field = shape[key];
                    const { actualField } = (0, external_types_js_namespaceObject.unwrapZodType)(field);
                    const isLocateFieldFlag = (0, external_types_js_namespaceObject.isLocateField)(actualField);
                    const placeholderText = (()=>{
                        var _fieldWithRuntime__def;
                        const fieldWithRuntime = actualField;
                        if (null == (_fieldWithRuntime__def = fieldWithRuntime._def) ? void 0 : _fieldWithRuntime__def.description) return fieldWithRuntime._def.description;
                        if (fieldWithRuntime.description) return fieldWithRuntime.description;
                        if (actionSpace) {
                            const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
                            if ((null == action ? void 0 : action.paramSchema) && 'object' == typeof action.paramSchema && 'shape' in action.paramSchema) {
                                var _fieldDef__def;
                                const shape = action.paramSchema.shape || {};
                                const fieldDef = shape[key];
                                if (null == fieldDef ? void 0 : null == (_fieldDef__def = fieldDef._def) ? void 0 : _fieldDef__def.description) return fieldDef._def.description;
                                if (null == fieldDef ? void 0 : fieldDef.description) return fieldDef.description;
                            }
                        }
                        if (isLocateFieldFlag) return 'Describe the element you want to interact with';
                        if ('keyName' === key) return 'Enter key name or text to type';
                        if ('value' === key) return 'Enter text to input';
                        return `Enter ${key}`;
                    })();
                    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
                        name: [
                            'params',
                            key
                        ],
                        style: {
                            margin: 0
                        },
                        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Input.TextArea, {
                            className: "main-side-console-input-textarea",
                            rows: 3,
                            placeholder: placeholderText,
                            autoFocus: true,
                            onKeyDown: handleStructuredKeyDown
                        })
                    });
                }
                const fields = [];
                const sortedKeys = schemaKeys.sort((keyA, keyB)=>{
                    const fieldSchemaA = shape[keyA];
                    const fieldSchemaB = shape[keyB];
                    const { isOptional: isOptionalA } = (0, external_types_js_namespaceObject.unwrapZodType)(fieldSchemaA);
                    const { isOptional: isOptionalB } = (0, external_types_js_namespaceObject.unwrapZodType)(fieldSchemaB);
                    if (!isOptionalA && isOptionalB) return -1;
                    if (isOptionalA && !isOptionalB) return 1;
                    return 0;
                });
                sortedKeys.forEach((key, index)=>{
                    var _actualField__def, _actualField__def1, _actualField__def2;
                    const fieldSchema = shape[key];
                    const { actualField, isOptional } = (0, external_types_js_namespaceObject.unwrapZodType)(fieldSchema);
                    const isLocateFieldFlag = (0, external_types_js_namespaceObject.isLocateField)(actualField);
                    const label = key.charAt(0).toUpperCase() + key.slice(1);
                    const isRequired = !isOptional;
                    const marginBottom = index === sortedKeys.length - 1 ? 0 : 12;
                    const placeholder = (()=>{
                        var _fieldWithRuntime__def;
                        const fieldWithRuntime = actualField;
                        if (null == (_fieldWithRuntime__def = fieldWithRuntime._def) ? void 0 : _fieldWithRuntime__def.description) return fieldWithRuntime._def.description;
                        if (fieldWithRuntime.description) return fieldWithRuntime.description;
                        if (actionSpace) {
                            const action = actionSpace.find((a)=>a.interfaceAlias === selectedType || a.name === selectedType);
                            if ((null == action ? void 0 : action.paramSchema) && 'object' == typeof action.paramSchema && 'shape' in action.paramSchema) {
                                var _fieldDef__def;
                                const shape = action.paramSchema.shape || {};
                                const fieldDef = shape[key];
                                if (null == fieldDef ? void 0 : null == (_fieldDef__def = fieldDef._def) ? void 0 : _fieldDef__def.description) return fieldDef._def.description;
                                if (null == fieldDef ? void 0 : fieldDef.description) return fieldDef.description;
                            }
                        }
                        if (isLocateFieldFlag) return 'Describe the element you want to interact with';
                    })();
                    const fieldProps = {
                        name: key,
                        label,
                        fieldSchema: actualField,
                        isRequired,
                        marginBottom,
                        placeholder
                    };
                    if (isLocateFieldFlag) fields.push(/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_form_field_index_js_namespaceObject.LocateField, _object_spread({}, fieldProps), key));
                    else if ((null == (_actualField__def = actualField._def) ? void 0 : _actualField__def.typeName) === 'ZodEnum') fields.push(/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_form_field_index_js_namespaceObject.EnumField, _object_spread({}, fieldProps), key));
                    else if ((null == (_actualField__def1 = actualField._def) ? void 0 : _actualField__def1.typeName) === 'ZodNumber') fields.push(/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_form_field_index_js_namespaceObject.NumberField, _object_spread({}, fieldProps), key));
                    else if ((null == (_actualField__def2 = actualField._def) ? void 0 : _actualField__def2.typeName) === 'ZodBoolean') fields.push(/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_form_field_index_js_namespaceObject.BooleanField, _object_spread({}, fieldProps), key));
                    else fields.push(/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_form_field_index_js_namespaceObject.TextField, _object_spread({}, fieldProps), key));
                });
                if ('aiScroll' === selectedType) {
                    const directionField = fields.find((field)=>/*#__PURE__*/ external_react_default().isValidElement(field) && 'direction' === field.props.name);
                    const distanceField = fields.find((field)=>/*#__PURE__*/ external_react_default().isValidElement(field) && 'distance' === field.props.name);
                    const otherFields = fields.filter((field)=>/*#__PURE__*/ external_react_default().isValidElement(field) && 'direction' !== field.props.name && 'distance' !== field.props.name);
                    if (directionField && distanceField) return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        className: "structured-params",
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                style: {
                                    display: 'flex',
                                    gap: 12,
                                    marginBottom: 12
                                },
                                children: [
                                    directionField,
                                    distanceField
                                ]
                            }),
                            otherFields
                        ]
                    });
                }
                return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                    className: "structured-params",
                    children: fields
                });
            }
        }
        return null;
    }, [
        selectedType,
        needsStructuredParams,
        actionSpace,
        handleStructuredKeyDown
    ]);
    const handleMouseEnter = (0, external_react_namespaceObject.useCallback)(()=>{
        setHoveringSettings(true);
    }, []);
    const handleMouseLeave = (0, external_react_namespaceObject.useCallback)(()=>{
        setHoveringSettings(false);
    }, []);
    const renderActionButton = (0, external_react_namespaceObject.useCallback)(()=>{
        const runButton = (text)=>/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
                type: "primary",
                icon: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.SendOutlined, {}),
                style: {
                    borderRadius: 20,
                    zIndex: 999
                },
                onClick: handleRunWithHistory,
                disabled: !isRunButtonEnabled,
                loading: loading,
                children: text
            });
        if (dryMode) return 'aiAct' === selectedType ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
            title: "Start executing until some interaction actions need to be performed. You can see the process of planning and locating.",
            children: runButton('Dry Run')
        }) : runButton('Run');
        if (stoppable) return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
            className: "prompt-stop-button",
            icon: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(PromptStopSquareIcon, {}),
            onClick: onStop,
            style: {
                borderRadius: 20,
                zIndex: 999
            },
            children: "Stop"
        });
        return runButton('Run');
    }, [
        dryMode,
        loading,
        handleRunWithHistory,
        onStop,
        isRunButtonEnabled,
        selectedType,
        stoppable
    ]);
    const renderMinimalActionButton = (0, external_react_namespaceObject.useCallback)(()=>{
        const runButton = (ariaLabel)=>/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
                "aria-label": ariaLabel,
                className: "minimal-run-trigger",
                type: "primary",
                icon: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.ArrowUpOutlined, {}),
                onClick: handleRunWithHistory,
                disabled: !isRunButtonEnabled,
                loading: loading
            });
        if (dryMode) return 'aiAct' === selectedType ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
            title: "Start executing until some interaction actions need to be performed. You can see the process of planning and locating.",
            children: runButton('Dry run')
        }) : runButton('Run');
        if (stoppable) return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
            "aria-label": "Stop running",
            className: "minimal-run-trigger minimal-run-trigger-stop prompt-stop-button",
            icon: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(PromptStopSquareIcon, {}),
            onClick: onStop
        });
        return runButton('Run');
    }, [
        dryMode,
        loading,
        handleRunWithHistory,
        isRunButtonEnabled,
        onStop,
        selectedType,
        stoppable
    ]);
    var _chrome_icons_action;
    const minimalActionIconSrc = null != (_chrome_icons_action = null == chrome ? void 0 : null == (_chrome_icons = chrome.icons) ? void 0 : _chrome_icons.action) ? _chrome_icons_action : STUDIO_MINIMAL_PROMPT_ICONS.action;
    const minimalActionChevronSrc = null == chrome ? void 0 : null == (_chrome_icons1 = chrome.icons) ? void 0 : _chrome_icons1.actionChevron;
    var _chrome_icons_settings;
    const minimalSettingsIconSrc = null != (_chrome_icons_settings = null == chrome ? void 0 : null == (_chrome_icons2 = chrome.icons) ? void 0 : _chrome_icons2.settings) ? _chrome_icons_settings : STUDIO_MINIMAL_PROMPT_ICONS.settings;
    const minimalHistoryIconSrc = null == chrome ? void 0 : null == (_chrome_icons3 = chrome.icons) ? void 0 : _chrome_icons3.history;
    const renderInputSettingsAction = (0, external_react_namespaceObject.useCallback)(()=>{
        if (!hasConfigOptions || 'input' !== settingsPlacement) return null;
        return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
            className: hoveringSettings ? 'settings-wrapper settings-wrapper-hover' : 'settings-wrapper',
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(index_js_namespaceObject.ConfigSelector, {
                enableTracking: 'In-Browser-Extension' === serviceMode,
                showDeepLocateOption: showDeepLocateOption,
                showDeepThinkOption: showDeepThinkOption,
                showDataExtractionOptions: showDataExtractionOptions,
                hideDomAndScreenshotOptions: hideDomAndScreenshotOptions,
                deviceType: deviceType,
                popupPlacement: "topLeft",
                trigger: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("button", {
                    "aria-label": "Open run configuration",
                    className: "input-icon-trigger",
                    type: "button",
                    children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("img", {
                        alt: "",
                        className: "input-toolbar-icon",
                        src: minimalSettingsIconSrc
                    })
                })
            })
        });
    }, [
        deviceType,
        handleMouseEnter,
        handleMouseLeave,
        hasConfigOptions,
        hideDomAndScreenshotOptions,
        hoveringSettings,
        minimalSettingsIconSrc,
        serviceMode,
        settingsPlacement,
        showDataExtractionOptions,
        showDeepLocateOption,
        showDeepThinkOption
    ]);
    const inputContent = needsAnyInput ? needsStructuredParams ? minimalInlineFieldConfig ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
        name: [
            'params',
            minimalInlineFieldConfig.name
        ],
        style: {
            margin: 0
        },
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(TextArea, {
            className: "main-side-console-input-textarea",
            disabled: !runButtonEnabled,
            rows: 3,
            placeholder: 'prompt' === minimalInlineFieldConfig.name ? resolvedPlaceholder : minimalInlineFieldConfig.placeholder,
            autoFocus: true,
            onKeyDown: handleStructuredKeyDown
        })
    }) : hasSingleStructuredParam ? renderStructuredParams() : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: "structured-params-container",
        children: renderStructuredParams()
    }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
        name: "prompt",
        style: {
            margin: 0
        },
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(TextArea, {
            className: "main-side-console-input-textarea",
            disabled: !runButtonEnabled,
            rows: 3,
            placeholder: resolvedPlaceholder,
            autoFocus: true,
            onKeyDown: handleKeyDown,
            onChange: handlePromptChange,
            ref: textAreaRef
        })
    }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
        className: "no-input-method",
        children: [
            'Click "Run" to execute ',
            (0, playground_utils_js_namespaceObject.actionNameForType)(selectedType)
        ]
    });
    if (isMinimalChrome) return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
        className: "prompt-input-wrapper prompt-input-wrapper-minimal",
        children: [
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
                hidden: true,
                name: "type",
                style: {
                    margin: 0
                },
                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Input, {})
            }),
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                className: `main-side-console-input minimal-main-side-console-input ${!runButtonEnabled ? 'disabled' : ''} ${loading ? 'loading' : ''} ${isPromptInputEmpty ? 'prompt-input-empty' : ''}`,
                children: [
                    inputContent,
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        className: "minimal-toolbar-row",
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                className: "minimal-toolbar-left",
                                children: [
                                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Dropdown, {
                                        menu: actionDropdownMenu,
                                        placement: "topLeft",
                                        trigger: [
                                            'click'
                                        ],
                                        disabled: !runButtonEnabled,
                                        overlayClassName: "more-apis-dropdown",
                                        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("button", {
                                            "aria-label": `Select action type (current: ${actionButtonLabel})`,
                                            className: "minimal-action-trigger",
                                            disabled: !runButtonEnabled,
                                            type: "button",
                                            children: [
                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("img", {
                                                    alt: "",
                                                    className: "minimal-action-icon",
                                                    src: minimalActionIconSrc
                                                }),
                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                                                    className: "minimal-action-label",
                                                    children: actionButtonLabel
                                                }),
                                                minimalActionChevronSrc ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("img", {
                                                    alt: "",
                                                    className: "minimal-action-chevron",
                                                    src: minimalActionChevronSrc
                                                }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(action_chevron_js_default(), {
                                                    "aria-hidden": "true",
                                                    className: "minimal-action-chevron",
                                                    focusable: "false"
                                                })
                                            ]
                                        })
                                    }),
                                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_history_selector_index_js_namespaceObject.HistorySelector, {
                                        onSelect: handleSelectHistory,
                                        history: historyForSelectedType,
                                        currentType: selectedType,
                                        popupPlacement: "top",
                                        trigger: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("button", {
                                            "aria-label": "Open prompt history",
                                            className: "minimal-icon-trigger",
                                            type: "button",
                                            children: minimalHistoryIconSrc ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("img", {
                                                alt: "",
                                                className: "minimal-toolbar-icon minimal-toolbar-icon-history",
                                                src: minimalHistoryIconSrc
                                            }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(prompt_history_js_default(), {
                                                "aria-hidden": "true",
                                                className: "minimal-toolbar-icon minimal-toolbar-icon-history",
                                                focusable: "false"
                                            })
                                        })
                                    }),
                                    hasConfigOptions && 'hidden' !== settingsPlacement ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                        className: hoveringSettings ? 'settings-wrapper settings-wrapper-hover' : 'settings-wrapper',
                                        onMouseEnter: handleMouseEnter,
                                        onMouseLeave: handleMouseLeave,
                                        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(index_js_namespaceObject.ConfigSelector, {
                                            enableTracking: 'In-Browser-Extension' === serviceMode,
                                            showDeepLocateOption: showDeepLocateOption,
                                            showDeepThinkOption: showDeepThinkOption,
                                            showDataExtractionOptions: showDataExtractionOptions,
                                            hideDomAndScreenshotOptions: hideDomAndScreenshotOptions,
                                            deviceType: deviceType,
                                            popupPlacement: "topRight",
                                            trigger: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("button", {
                                                "aria-label": "Open run configuration",
                                                className: "minimal-icon-trigger",
                                                type: "button",
                                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("img", {
                                                    alt: "",
                                                    className: "minimal-toolbar-icon",
                                                    src: minimalSettingsIconSrc
                                                })
                                            })
                                        })
                                    }) : null
                                ]
                            }),
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                className: "form-controller-wrapper",
                                children: [
                                    null == chrome ? void 0 : chrome.inputActions,
                                    renderMinimalActionButton()
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
        className: "prompt-input-wrapper",
        children: [
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                className: "mode-radio-group-wrapper",
                children: [
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        className: "mode-radio-group",
                        ref: modeRadioGroupRef,
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Form.Item, {
                                name: "type",
                                style: {
                                    margin: 0
                                },
                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio.Group, {
                                    buttonStyle: "solid",
                                    disabled: !runButtonEnabled,
                                    children: constants_js_namespaceObject.defaultMainButtons.map((apiType)=>{
                                        var _apiMetadata_apiType;
                                        return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
                                            title: (null == (_apiMetadata_apiType = constants_js_namespaceObject.apiMetadata[apiType]) ? void 0 : _apiMetadata_apiType.title) || '',
                                            children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio.Button, {
                                                value: apiType,
                                                children: (0, playground_utils_js_namespaceObject.actionNameForType)(apiType)
                                            })
                                        }, apiType);
                                    })
                                })
                            }),
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Dropdown, {
                                menu: moreApisDropdownMenu,
                                placement: "bottomLeft",
                                trigger: [
                                    'click'
                                ],
                                disabled: !runButtonEnabled,
                                overlayClassName: "more-apis-dropdown",
                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)(external_antd_namespaceObject.Button, {
                                    className: `more-apis-button ${!constants_js_namespaceObject.defaultMainButtons.includes(selectedType) ? 'selected-from-dropdown' : ''}`,
                                    children: [
                                        selectedType && !constants_js_namespaceObject.defaultMainButtons.includes(selectedType) ? (0, playground_utils_js_namespaceObject.actionNameForType)(selectedType) : 'more',
                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.DownOutlined, {
                                            style: {
                                                fontSize: '10px',
                                                marginLeft: '2px'
                                            }
                                        })
                                    ]
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        className: "action-icons",
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_history_selector_index_js_namespaceObject.HistorySelector, {
                                onSelect: handleSelectHistory,
                                history: historyForSelectedType,
                                currentType: selectedType
                            }),
                            hasConfigOptions && 'toolbar' === settingsPlacement && /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                className: hoveringSettings ? 'settings-wrapper settings-wrapper-hover' : 'settings-wrapper',
                                onMouseEnter: handleMouseEnter,
                                onMouseLeave: handleMouseLeave,
                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(index_js_namespaceObject.ConfigSelector, {
                                    enableTracking: 'In-Browser-Extension' === serviceMode,
                                    showDeepLocateOption: showDeepLocateOption,
                                    showDeepThinkOption: showDeepThinkOption,
                                    showDataExtractionOptions: showDataExtractionOptions,
                                    hideDomAndScreenshotOptions: hideDomAndScreenshotOptions,
                                    deviceType: deviceType
                                })
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                className: `main-side-console-input ${!runButtonEnabled ? 'disabled' : ''} ${loading ? 'loading' : ''} ${isPromptInputEmpty ? 'prompt-input-empty' : ''}`,
                children: [
                    inputContent,
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        className: "form-controller-wrapper",
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                className: "input-actions-wrapper",
                                children: [
                                    renderInputSettingsAction(),
                                    null == chrome ? void 0 : chrome.inputActions
                                ]
                            }),
                            renderActionButton()
                        ]
                    })
                ]
            })
        ]
    });
};
exports.PromptInput = __webpack_exports__.PromptInput;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "PromptInput"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
