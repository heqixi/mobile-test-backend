import { jsx, jsxs } from "react/jsx-runtime";
import { Checkbox, Dropdown, Radio, Tooltip } from "antd";
import setting from "../../icons/setting.mjs";
import { useEnvConfig } from "../../store/store.mjs";
import { alwaysRefreshScreenInfoTip, autoDismissKeyboardTip, deepLocateTip, deepThinkTip, domIncludedTip, imeStrategyTip, keyboardDismissStrategyTip, screenshotIncludedTip, trackingTip } from "../../utils/constants.mjs";
import { getDeviceCapabilities, hasDeviceSpecificConfig } from "../../utils/device-capabilities.mjs";
const ConfigSelector = ({ showDeepLocateOption = false, showDeepThinkOption = false, enableTracking = false, showDataExtractionOptions = false, hideDomAndScreenshotOptions = false, deviceType, trigger, popupPlacement = 'bottomRight' })=>{
    const forceSameTabNavigation = useEnvConfig((state)=>state.forceSameTabNavigation);
    const setForceSameTabNavigation = useEnvConfig((state)=>state.setForceSameTabNavigation);
    const deepLocate = useEnvConfig((state)=>state.deepLocate);
    const setDeepLocate = useEnvConfig((state)=>state.setDeepLocate);
    const deepThink = useEnvConfig((state)=>state.deepThink);
    const setDeepThink = useEnvConfig((state)=>state.setDeepThink);
    const screenshotIncluded = useEnvConfig((state)=>state.screenshotIncluded);
    const setScreenshotIncluded = useEnvConfig((state)=>state.setScreenshotIncluded);
    const domIncluded = useEnvConfig((state)=>state.domIncluded);
    const setDomIncluded = useEnvConfig((state)=>state.setDomIncluded);
    const imeStrategy = useEnvConfig((state)=>state.imeStrategy);
    const setImeStrategy = useEnvConfig((state)=>state.setImeStrategy);
    const autoDismissKeyboard = useEnvConfig((state)=>state.autoDismissKeyboard);
    const setAutoDismissKeyboard = useEnvConfig((state)=>state.setAutoDismissKeyboard);
    const keyboardDismissStrategy = useEnvConfig((state)=>state.keyboardDismissStrategy);
    const setKeyboardDismissStrategy = useEnvConfig((state)=>state.setKeyboardDismissStrategy);
    const alwaysRefreshScreenInfo = useEnvConfig((state)=>state.alwaysRefreshScreenInfo);
    const setAlwaysRefreshScreenInfo = useEnvConfig((state)=>state.setAlwaysRefreshScreenInfo);
    const deviceCapabilities = getDeviceCapabilities(deviceType);
    const hasDeviceOptions = hasDeviceSpecificConfig(deviceType);
    if (!enableTracking && !showDeepLocateOption && !showDeepThinkOption && !showDataExtractionOptions && !hasDeviceOptions) return null;
    const configItems = buildConfigItems();
    const dropdownTrigger = null != trigger ? trigger : /*#__PURE__*/ jsx("button", {
        "aria-label": "Open run configuration",
        className: "selector-trigger-button",
        type: "button",
        children: /*#__PURE__*/ jsx(setting, {
            width: 24,
            height: 24
        })
    });
    return /*#__PURE__*/ jsx("div", {
        className: "selector-trigger",
        children: /*#__PURE__*/ jsx(Dropdown, {
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
            label: /*#__PURE__*/ jsx(Checkbox, {
                onChange: (e)=>setForceSameTabNavigation(e.target.checked),
                checked: forceSameTabNavigation,
                children: trackingTip
            }),
            key: 'track-config'
        });
        if (showDeepLocateOption) items.push({
            label: /*#__PURE__*/ jsx(Checkbox, {
                onChange: (e)=>{
                    setDeepLocate(e.target.checked);
                },
                checked: deepLocate,
                children: deepLocateTip
            }),
            key: 'deep-locate-config'
        });
        if (showDeepThinkOption) items.push({
            label: /*#__PURE__*/ jsxs("div", {
                style: {
                    padding: '4px 0'
                },
                children: [
                    /*#__PURE__*/ jsx("div", {
                        style: {
                            marginBottom: '4px',
                            fontSize: '14px'
                        },
                        children: deepThinkTip
                    }),
                    /*#__PURE__*/ jsxs(Radio.Group, {
                        size: "small",
                        value: deepThink,
                        onChange: (e)=>setDeepThink(e.target.value),
                        children: [
                            /*#__PURE__*/ jsx(Tooltip, {
                                title: "Controlled by MIDSCENE_MODEL_REASONING_ENABLED env variable",
                                children: /*#__PURE__*/ jsx(Radio, {
                                    value: 'unset',
                                    children: "Auto"
                                })
                            }),
                            /*#__PURE__*/ jsx(Radio, {
                                value: true,
                                children: "On"
                            }),
                            /*#__PURE__*/ jsx(Radio, {
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
                label: /*#__PURE__*/ jsx(Checkbox, {
                    onChange: (e)=>{
                        setScreenshotIncluded(e.target.checked);
                    },
                    checked: screenshotIncluded,
                    children: screenshotIncludedTip
                }),
                key: 'screenshot-included-config'
            });
            items.push({
                label: /*#__PURE__*/ jsxs("div", {
                    style: {
                        padding: '4px 0'
                    },
                    children: [
                        /*#__PURE__*/ jsx("div", {
                            style: {
                                marginBottom: '4px',
                                fontSize: '14px'
                            },
                            children: domIncludedTip
                        }),
                        /*#__PURE__*/ jsxs(Radio.Group, {
                            size: "small",
                            value: domIncluded,
                            onChange: (e)=>setDomIncluded(e.target.value),
                            children: [
                                /*#__PURE__*/ jsx(Radio, {
                                    value: false,
                                    children: "Off"
                                }),
                                /*#__PURE__*/ jsx(Radio, {
                                    value: true,
                                    children: "All"
                                }),
                                /*#__PURE__*/ jsx(Radio, {
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
                label: /*#__PURE__*/ jsxs("div", {
                    style: {
                        padding: '4px 0'
                    },
                    children: [
                        /*#__PURE__*/ jsx("div", {
                            style: {
                                marginBottom: '4px',
                                fontSize: '14px'
                            },
                            children: imeStrategyTip
                        }),
                        /*#__PURE__*/ jsxs(Radio.Group, {
                            size: "small",
                            value: imeStrategy,
                            onChange: (e)=>setImeStrategy(e.target.value),
                            children: [
                                /*#__PURE__*/ jsx(Radio, {
                                    value: "always-yadb",
                                    children: "Always YADB"
                                }),
                                /*#__PURE__*/ jsx(Radio, {
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
                label: /*#__PURE__*/ jsx(Checkbox, {
                    onChange: (e)=>setAutoDismissKeyboard(e.target.checked),
                    checked: autoDismissKeyboard,
                    children: autoDismissKeyboardTip
                }),
                key: 'auto-dismiss-keyboard-config'
            });
            if (deviceCapabilities.supportsKeyboardDismissStrategy) items.push({
                label: /*#__PURE__*/ jsxs("div", {
                    style: {
                        padding: '4px 0'
                    },
                    children: [
                        /*#__PURE__*/ jsx("div", {
                            style: {
                                marginBottom: '4px',
                                fontSize: '14px'
                            },
                            children: keyboardDismissStrategyTip
                        }),
                        /*#__PURE__*/ jsxs(Radio.Group, {
                            size: "small",
                            value: keyboardDismissStrategy,
                            onChange: (e)=>setKeyboardDismissStrategy(e.target.value),
                            children: [
                                /*#__PURE__*/ jsx(Radio, {
                                    value: "esc-first",
                                    children: "ESC first"
                                }),
                                /*#__PURE__*/ jsx(Radio, {
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
                label: /*#__PURE__*/ jsx(Checkbox, {
                    onChange: (e)=>setAlwaysRefreshScreenInfo(e.target.checked),
                    checked: alwaysRefreshScreenInfo,
                    children: alwaysRefreshScreenInfoTip
                }),
                key: 'always-refresh-screen-info-config'
            });
        }
        if (!deviceCapabilities.supportsImeStrategy && deviceCapabilities.supportsAutoDismissKeyboard) items.push({
            label: /*#__PURE__*/ jsx(Checkbox, {
                onChange: (e)=>setAutoDismissKeyboard(e.target.checked),
                checked: autoDismissKeyboard,
                children: autoDismissKeyboardTip
            }),
            key: 'auto-dismiss-keyboard-config'
        });
        return items;
    }
};
export { ConfigSelector };
