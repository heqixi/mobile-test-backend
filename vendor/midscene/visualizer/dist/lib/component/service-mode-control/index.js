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
    ServiceModeControl: ()=>ServiceModeControl
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const playground_namespaceObject = require("@midscene/playground");
const external_antd_namespaceObject = require("antd");
const external_react_namespaceObject = require("react");
const useSafeOverrideAIConfig_js_namespaceObject = require("../../hooks/useSafeOverrideAIConfig.js");
const useServerValid_js_namespaceObject = require("../../hooks/useServerValid.js");
const store_js_namespaceObject = require("../../store/store.js");
const index_js_namespaceObject = require("../../utils/index.js");
const external_env_config_index_js_namespaceObject = require("../env-config/index.js");
const external_misc_index_js_namespaceObject = require("../misc/index.js");
const TITLE_TEXT = {
    Server: 'Server Status',
    'In-Browser': 'In-Browser'
};
const SWITCH_BUTTON_TEXT = {
    Server: 'Switch to In-Browser Mode',
    'In-Browser': 'Switch to Server Mode'
};
const ServiceModeControl = ({ serviceMode })=>{
    const { setServiceMode, config } = (0, store_js_namespaceObject.useEnvConfig)();
    const serverValid = (0, useServerValid_js_namespaceObject.useServerValid)('Server' === serviceMode);
    const renderServerTip = ()=>{
        if (serverValid) return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
            title: "Connected",
            children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                className: "server-tip",
                children: (0, external_misc_index_js_namespaceObject.iconForStatus)('connected')
            })
        });
        return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
            title: "Connection failed",
            children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                className: "server-tip",
                children: (0, external_misc_index_js_namespaceObject.iconForStatus)('failed')
            })
        });
    };
    const renderSwitchButton = ()=>{
        const nextMode = 'Server' === serviceMode ? 'In-Browser' : 'Server';
        const buttonText = SWITCH_BUTTON_TEXT[serviceMode];
        return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
            title: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("span", {
                children: [
                    "Server Mode: send the request through the server ",
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("br", {}),
                    "In-Browser Mode: send the request through the browser fetch API (The AI service should support CORS in this case)"
                ]
            }),
            children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
                type: "link",
                onClick: (e)=>{
                    e.preventDefault();
                    setServiceMode(nextMode);
                },
                children: buttonText
            })
        });
    };
    (0, external_react_namespaceObject.useEffect)(()=>{
        (0, useSafeOverrideAIConfig_js_namespaceObject.safeOverrideAIConfig)(config, false, false);
        if ('Server' === serviceMode) {
            const playgroundSDK = new playground_namespaceObject.PlaygroundSDK({
                type: 'remote-execution'
            });
            playgroundSDK.overrideConfig(config).catch((error)=>{
                (0, index_js_namespaceObject.notifyError)(error, {
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
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)(jsx_runtime_namespaceObject.Fragment, {
        children: [
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                },
                children: [
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("h3", {
                        style: {
                            whiteSpace: 'nowrap',
                            margin: 0,
                            flexShrink: 0
                        },
                        children: title
                    }),
                    statusContent,
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_env_config_index_js_namespaceObject.EnvConfig, {
                        showTooltipWhenEmpty: 'Server' !== serviceMode
                    })
                ]
            }),
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                className: "switch-btn-wrapper",
                children: renderSwitchButton()
            })
        ]
    });
};
exports.ServiceModeControl = __webpack_exports__.ServiceModeControl;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "ServiceModeControl"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
