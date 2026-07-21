import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { PlaygroundSDK } from "@midscene/playground";
import { Button, Tooltip } from "antd";
import { useEffect } from "react";
import { safeOverrideAIConfig } from "../../hooks/useSafeOverrideAIConfig.mjs";
import { useServerValid } from "../../hooks/useServerValid.mjs";
import { useEnvConfig } from "../../store/store.mjs";
import { notifyError } from "../../utils/index.mjs";
import { EnvConfig } from "../env-config/index.mjs";
import { iconForStatus } from "../misc/index.mjs";
const TITLE_TEXT = {
    Server: 'Server Status',
    'In-Browser': 'In-Browser'
};
const SWITCH_BUTTON_TEXT = {
    Server: 'Switch to In-Browser Mode',
    'In-Browser': 'Switch to Server Mode'
};
const ServiceModeControl = ({ serviceMode })=>{
    const { setServiceMode, config } = useEnvConfig();
    const serverValid = useServerValid('Server' === serviceMode);
    const renderServerTip = ()=>{
        if (serverValid) return /*#__PURE__*/ jsx(Tooltip, {
            title: "Connected",
            children: /*#__PURE__*/ jsx("div", {
                className: "server-tip",
                children: iconForStatus('connected')
            })
        });
        return /*#__PURE__*/ jsx(Tooltip, {
            title: "Connection failed",
            children: /*#__PURE__*/ jsx("div", {
                className: "server-tip",
                children: iconForStatus('failed')
            })
        });
    };
    const renderSwitchButton = ()=>{
        const nextMode = 'Server' === serviceMode ? 'In-Browser' : 'Server';
        const buttonText = SWITCH_BUTTON_TEXT[serviceMode];
        return /*#__PURE__*/ jsx(Tooltip, {
            title: /*#__PURE__*/ jsxs("span", {
                children: [
                    "Server Mode: send the request through the server ",
                    /*#__PURE__*/ jsx("br", {}),
                    "In-Browser Mode: send the request through the browser fetch API (The AI service should support CORS in this case)"
                ]
            }),
            children: /*#__PURE__*/ jsx(Button, {
                type: "link",
                onClick: (e)=>{
                    e.preventDefault();
                    setServiceMode(nextMode);
                },
                children: buttonText
            })
        });
    };
    useEffect(()=>{
        safeOverrideAIConfig(config, false, false);
        if ('Server' === serviceMode) {
            const playgroundSDK = new PlaygroundSDK({
                type: 'remote-execution'
            });
            playgroundSDK.overrideConfig(config).catch((error)=>{
                notifyError(error, {
                    title: 'Failed to apply AI configuration'
                });
            });
        }
    }, [
        config,
        serviceMode,
        serverValid
    ]);
    const statusContent = 'Server' === serviceMode && renderServerTip();
    const title = TITLE_TEXT[serviceMode];
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsxs("div", {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                },
                children: [
                    /*#__PURE__*/ jsx("h3", {
                        style: {
                            whiteSpace: 'nowrap',
                            margin: 0,
                            flexShrink: 0
                        },
                        children: title
                    }),
                    statusContent,
                    /*#__PURE__*/ jsx(EnvConfig, {
                        showTooltipWhenEmpty: 'Server' !== serviceMode
                    })
                ]
            }),
            /*#__PURE__*/ jsx("div", {
                className: "switch-btn-wrapper",
                children: renderSwitchButton()
            })
        ]
    });
};
export { ServiceModeControl };
