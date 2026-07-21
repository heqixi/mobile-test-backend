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
    EnvConfig: ()=>EnvConfig
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const icons_namespaceObject = require("@ant-design/icons");
const external_antd_namespaceObject = require("antd");
const external_react_namespaceObject = require("react");
const store_js_namespaceObject = require("../../store/store.js");
const index_js_namespaceObject = require("../../utils/index.js");
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) resolve(value);
    else Promise.resolve(value).then(_next, _throw);
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(void 0);
        });
    };
}
function EnvConfig({ showTooltipWhenEmpty = true, showModelName = true, tooltipPlacement = 'bottom', mode = 'icon', playgroundSDK }) {
    const { message } = external_antd_namespaceObject.App.useApp();
    const { config, configString, loadConfig, syncFromStorage } = (0, store_js_namespaceObject.useEnvConfig)();
    const [isModalOpen, setIsModalOpen] = (0, external_react_namespaceObject.useState)(false);
    const [tempConfigString, setTempConfigString] = (0, external_react_namespaceObject.useState)(configString);
    const [connectivityResult, setConnectivityResult] = (0, external_react_namespaceObject.useState)(null);
    const [connectivityLoading, setConnectivityLoading] = (0, external_react_namespaceObject.useState)(false);
    const midsceneModelName = config.MIDSCENE_MODEL_NAME;
    const canRunConnectivityTest = !!(null == playgroundSDK ? void 0 : playgroundSDK.runConnectivityTest);
    const componentRef = (0, external_react_namespaceObject.useRef)(null);
    const closeTimerRef = (0, external_react_namespaceObject.useRef)(null);
    const clearCloseTimer = ()=>{
        if (null !== closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };
    const showModal = (e)=>{
        syncFromStorage();
        clearCloseTimer();
        setIsModalOpen(true);
        e.preventDefault();
        e.stopPropagation();
    };
    const handleOk = ()=>{
        clearCloseTimer();
        setIsModalOpen(false);
        loadConfig(tempConfigString);
    };
    const handleSaveAndRun = ()=>_async_to_generator(function*() {
            const sdk = playgroundSDK;
            if (!(null == sdk ? void 0 : sdk.runConnectivityTest)) return;
            try {
                setConnectivityLoading(true);
                setConnectivityResult(null);
                const nextConfig = (0, store_js_namespaceObject.parseConfig)(tempConfigString);
                const result = yield sdk.runConnectivityTest(nextConfig);
                setConnectivityResult(result);
                if (result.passed) {
                    loadConfig(tempConfigString);
                    message.success('Model verification passed');
                    clearCloseTimer();
                    closeTimerRef.current = window.setTimeout(()=>{
                        setIsModalOpen(false);
                        closeTimerRef.current = null;
                    }, 2000);
                } else message.warning('Model verification found issues');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                (0, index_js_namespaceObject.notifyError)(error, {
                    title: 'Model verification failed'
                });
                setConnectivityResult({
                    passed: false,
                    message: errorMessage
                });
            } finally{
                setConnectivityLoading(false);
            }
        })();
    const handleCancel = ()=>{
        clearCloseTimer();
        setIsModalOpen(false);
    };
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (isModalOpen) {
            setTempConfigString(configString);
            setConnectivityResult(null);
        }
    }, [
        isModalOpen,
        configString
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>()=>{
            clearCloseTimer();
        }, []);
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
        style: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            alignItems: 'center',
            height: '100%',
            minHeight: '32px'
        },
        ref: componentRef,
        children: [
            showModelName ? midsceneModelName : null,
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
                title: "Please set up your environment variables before using.",
                placement: tooltipPlacement,
                align: {
                    offset: [
                        -10,
                        5
                    ]
                },
                getPopupContainer: ()=>componentRef.current,
                open: isModalOpen ? false : showTooltipWhenEmpty ? 0 === Object.keys(config).length : void 0,
                children: 'icon' === mode ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.SettingOutlined, {
                    onClick: showModal
                }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                    onClick: showModal,
                    style: {
                        color: '#006AFF',
                        cursor: 'pointer'
                    },
                    children: "set up"
                })
            }),
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)(external_antd_namespaceObject.Modal, {
                title: "Model Env Config",
                open: isModalOpen,
                onOk: handleOk,
                onCancel: handleCancel,
                footer: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                    style: {
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 8
                    },
                    children: [
                        canRunConnectivityTest ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
                            type: "primary",
                            ghost: true,
                            loading: connectivityLoading,
                            onClick: handleSaveAndRun,
                            children: "Verify and Save Model"
                        }, "save-and-run") : null,
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
                            type: "primary",
                            onClick: handleOk,
                            children: "Save"
                        }, "save")
                    ]
                }),
                style: {
                    width: '800px',
                    height: '100%',
                    marginTop: '10%'
                },
                destroyOnClose: true,
                maskClosable: true,
                centered: true,
                children: [
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Input.TextArea, {
                        rows: 7,
                        placeholder: 'MIDSCENE_MODEL_API_KEY=sk-...\nMIDSCENE_MODEL_NAME=gpt-4o-2024-08-06\n...',
                        value: tempConfigString,
                        onChange: (e)=>setTempConfigString(e.target.value),
                        style: {
                            whiteSpace: 'nowrap',
                            wordWrap: 'break-word'
                        }
                    }),
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("p", {
                                children: "The format is KEY=VALUE and separated by new lines."
                            }),
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("p", {
                                children: [
                                    "These data will be saved ",
                                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("strong", {
                                        children: "locally in your browser"
                                    }),
                                    "."
                                ]
                            })
                        ]
                    }),
                    connectivityResult ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Alert, {
                        type: connectivityResult.passed ? 'success' : 'warning',
                        showIcon: true,
                        message: connectivityResult.passed ? 'Model verification passed' : 'Model verification failed',
                        description: connectivityResult.passed ? void 0 : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                            style: {
                                whiteSpace: 'pre-wrap'
                            },
                            children: connectivityResult.message || 'Connectivity test failed without details.'
                        }),
                        style: {
                            marginTop: 16
                        }
                    }) : null
                ]
            })
        ]
    });
}
exports.EnvConfig = __webpack_exports__.EnvConfig;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "EnvConfig"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
