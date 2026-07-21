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
    ConfigSelector: ()=>ConfigSelector
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const external_antd_namespaceObject = require("antd");
const setting_js_namespaceObject = require("../../icons/setting.js");
var setting_js_default = /*#__PURE__*/ __webpack_require__.n(setting_js_namespaceObject);
const store_js_namespaceObject = require("../../store/store.js");
const constants_js_namespaceObject = require("../../utils/constants.js");
const device_capabilities_js_namespaceObject = require("../../utils/device-capabilities.js");
const ConfigSelector = ({ showDeepLocateOption = false, showDeepThinkOption = false, enableTracking = false, showDataExtractionOptions = false, hideDomAndScreenshotOptions = false, deviceType, trigger, popupPlacement = 'bottomRight' })=>{
    const forceSameTabNavigation = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.forceSameTabNavigation);
    const setForceSameTabNavigation = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setForceSameTabNavigation);
    const deepLocate = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.deepLocate);
    const setDeepLocate = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setDeepLocate);
    const deepThink = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.deepThink);
    const setDeepThink = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setDeepThink);
    const screenshotIncluded = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.screenshotIncluded);
    const setScreenshotIncluded = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setScreenshotIncluded);
    const domIncluded = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.domIncluded);
    const setDomIncluded = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setDomIncluded);
    const imeStrategy = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.imeStrategy);
    const setImeStrategy = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setImeStrategy);
    const autoDismissKeyboard = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.autoDismissKeyboard);
    const setAutoDismissKeyboard = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setAutoDismissKeyboard);
    const keyboardDismissStrategy = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.keyboardDismissStrategy);
    const setKeyboardDismissStrategy = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setKeyboardDismissStrategy);
    const alwaysRefreshScreenInfo = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.alwaysRefreshScreenInfo);
    const setAlwaysRefreshScreenInfo = (0, store_js_namespaceObject.useEnvConfig)((state)=>state.setAlwaysRefreshScreenInfo);
    const deviceCapabilities = (0, device_capabilities_js_namespaceObject.getDeviceCapabilities)(deviceType);
    const hasDeviceOptions = (0, device_capabilities_js_namespaceObject.hasDeviceSpecificConfig)(deviceType);
    if (!enableTracking && !showDeepLocateOption && !showDeepThinkOption && !showDataExtractionOptions && !hasDeviceOptions) return null;
    const configItems = buildConfigItems();
    const dropdownTrigger = null != trigger ? trigger : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("button", {
        "aria-label": "Open run configuration",
        className: "selector-trigger-button",
        type: "button",
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(setting_js_default(), {
            width: 24,
            height: 24
        })
    });
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: "selector-trigger",
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Dropdown, {
            getPopupContainer: (triggerNode)=>triggerNode.ownerDocument.body,
            menu: {
                items: configItems
            },
            overlayClassName: "config-selector-dropdown",
            overlayStyle: {
                zIndex: 10010
            },
            placement: popupPlacement,
            trigger: [
                'click'
            ],
            children: dropdownTrigger
        })
    });
    function buildConfigItems() {
        const items = [];
        if (enableTracking) items.push({
            label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Checkbox, {
                onChange: (e)=>setForceSameTabNavigation(e.target.checked),
                checked: forceSameTabNavigation,
                children: constants_js_namespaceObject.trackingTip
            }),
            key: 'track-config'
        });
        if (showDeepLocateOption) items.push({
            label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Checkbox, {
                onChange: (e)=>{
                    setDeepLocate(e.target.checked);
                },
                checked: deepLocate,
                children: constants_js_namespaceObject.deepLocateTip
            }),
            key: 'deep-locate-config'
        });
        if (showDeepThinkOption) items.push({
            label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                style: {
                    padding: '4px 0'
                },
                children: [
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                        style: {
                            marginBottom: '4px',
                            fontSize: '14px'
                        },
                        children: constants_js_namespaceObject.deepThinkTip
                    }),
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)(external_antd_namespaceObject.Radio.Group, {
                        size: "small",
                        value: deepThink,
                        onChange: (e)=>setDeepThink(e.target.value),
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
                                title: "Controlled by MIDSCENE_MODEL_REASONING_ENABLED env variable",
                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                    value: 'unset',
                                    children: "Auto"
                                })
                            }),
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                value: true,
                                children: "On"
                            }),
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                value: false,
                                children: "Off"
                            })
                        ]
                    })
                ]
            }),
            key: 'deep-think-config'
        });
        if (showDataExtractionOptions && !hideDomAndScreenshotOptions) {
            items.push({
                label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Checkbox, {
                    onChange: (e)=>{
                        setScreenshotIncluded(e.target.checked);
                    },
                    checked: screenshotIncluded,
                    children: constants_js_namespaceObject.screenshotIncludedTip
                }),
                key: 'screenshot-included-config'
            });
            items.push({
                label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                    style: {
                        padding: '4px 0'
                    },
                    children: [
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                            style: {
                                marginBottom: '4px',
                                fontSize: '14px'
                            },
                            children: constants_js_namespaceObject.domIncludedTip
                        }),
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)(external_antd_namespaceObject.Radio.Group, {
                            size: "small",
                            value: domIncluded,
                            onChange: (e)=>setDomIncluded(e.target.value),
                            children: [
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                    value: false,
                                    children: "Off"
                                }),
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                    value: true,
                                    children: "All"
                                }),
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                    value: 'visible-only',
                                    children: "Visible only"
                                })
                            ]
                        })
                    ]
                }),
                key: 'dom-included-config'
            });
        }
        if (deviceCapabilities.supportsImeStrategy) {
            items.push({
                label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                    style: {
                        padding: '4px 0'
                    },
                    children: [
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                            style: {
                                marginBottom: '4px',
                                fontSize: '14px'
                            },
                            children: constants_js_namespaceObject.imeStrategyTip
                        }),
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)(external_antd_namespaceObject.Radio.Group, {
                            size: "small",
                            value: imeStrategy,
                            onChange: (e)=>setImeStrategy(e.target.value),
                            children: [
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                    value: "always-yadb",
                                    children: "Always YADB"
                                }),
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                    value: "yadb-for-non-ascii",
                                    children: "YADB for non-ASCII"
                                })
                            ]
                        })
                    ]
                }),
                key: 'ime-strategy-config'
            });
            if (deviceCapabilities.supportsAutoDismissKeyboard) items.push({
                label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Checkbox, {
                    onChange: (e)=>setAutoDismissKeyboard(e.target.checked),
                    checked: autoDismissKeyboard,
                    children: constants_js_namespaceObject.autoDismissKeyboardTip
                }),
                key: 'auto-dismiss-keyboard-config'
            });
            if (deviceCapabilities.supportsKeyboardDismissStrategy) items.push({
                label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                    style: {
                        padding: '4px 0'
                    },
                    children: [
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                            style: {
                                marginBottom: '4px',
                                fontSize: '14px'
                            },
                            children: constants_js_namespaceObject.keyboardDismissStrategyTip
                        }),
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)(external_antd_namespaceObject.Radio.Group, {
                            size: "small",
                            value: keyboardDismissStrategy,
                            onChange: (e)=>setKeyboardDismissStrategy(e.target.value),
                            children: [
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                    value: "esc-first",
                                    children: "ESC first"
                                }),
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Radio, {
                                    value: "back-first",
                                    children: "Back first"
                                })
                            ]
                        })
                    ]
                }),
                key: 'keyboard-dismiss-strategy-config'
            });
            if (deviceCapabilities.supportsAlwaysRefreshScreenInfo) items.push({
                label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Checkbox, {
                    onChange: (e)=>setAlwaysRefreshScreenInfo(e.target.checked),
                    checked: alwaysRefreshScreenInfo,
                    children: constants_js_namespaceObject.alwaysRefreshScreenInfoTip
                }),
                key: 'always-refresh-screen-info-config'
            });
        }
        if (!deviceCapabilities.supportsImeStrategy && deviceCapabilities.supportsAutoDismissKeyboard) items.push({
            label: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Checkbox, {
                onChange: (e)=>setAutoDismissKeyboard(e.target.checked),
                checked: autoDismissKeyboard,
                children: constants_js_namespaceObject.autoDismissKeyboardTip
            }),
            key: 'auto-dismiss-keyboard-config'
        });
        return items;
    }
};
exports.ConfigSelector = __webpack_exports__.ConfigSelector;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "ConfigSelector"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
