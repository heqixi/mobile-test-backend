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
    PlaygroundResultView: ()=>PlaygroundResultView
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const icons_namespaceObject = require("@ant-design/icons");
const playground_namespaceObject = require("@midscene/playground");
const external_antd_namespaceObject = require("antd");
const index_js_namespaceObject = require("../misc/index.js");
const external_player_index_js_namespaceObject = require("../player/index.js");
const external_shiny_text_index_js_namespaceObject = require("../shiny-text/index.js");
var external_shiny_text_index_js_default = /*#__PURE__*/ __webpack_require__.n(external_shiny_text_index_js_namespaceObject);
require("./index.css");
const PlaygroundResultView = ({ result, loading, serverValid, serviceMode, replayScriptsInfo, replayCounter, loadingProgressText, verticalMode = false, notReadyMessage, fitMode, autoZoom, actionType, canDownloadReport, onDownloadReport, playerPresentation })=>{
    let resultWrapperClassName = 'result-wrapper';
    if (verticalMode) resultWrapperClassName += ' vertical-mode-result';
    if (replayScriptsInfo && verticalMode) resultWrapperClassName += ' result-wrapper-compact';
    let resultDataToShow = index_js_namespaceObject.emptyResultTip;
    const shouldPrioritizeResult = actionType && playground_namespaceObject.noReplayAPIs.includes(actionType);
    if (serverValid || 'Server' !== serviceMode) {
        if (loading) resultDataToShow = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
            className: "loading-container",
            children: [
                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Spin, {
                    spinning: loading,
                    indicator: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.LoadingOutlined, {
                        spin: true
                    })
                }),
                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                    className: "loading-progress-text loading-progress-text-progress",
                    children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_shiny_text_index_js_default(), {
                        text: loadingProgressText,
                        speed: 3
                    })
                })
            ]
        });
        else if (null == result ? void 0 : result.error) {
            const errorNode = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
                style: {
                    color: '#ff4d4f',
                    whiteSpace: 'pre-wrap'
                },
                children: null == result ? void 0 : result.error
            });
            if (result.reportHTML || result.report || replayScriptsInfo) {
                var _result_report, _result_report1;
                resultDataToShow = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                    className: "combined-result-layout",
                    children: [
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                            style: {
                                flex: '0 0 auto',
                                maxHeight: '40%',
                                overflow: 'auto'
                            },
                            children: [
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                    style: {
                                        fontWeight: 'bold',
                                        marginBottom: '8px'
                                    },
                                    children: "Error:"
                                }),
                                errorNode
                            ]
                        }),
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                            className: "combined-result-section",
                            children: [
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                    style: {
                                        fontWeight: 'bold',
                                        marginBottom: '8px'
                                    },
                                    children: "Report:"
                                }),
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                    className: "combined-result-player",
                                    children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_player_index_js_namespaceObject.Player, {
                                        replayScripts: null == replayScriptsInfo ? void 0 : replayScriptsInfo.scripts,
                                        imageWidth: null == replayScriptsInfo ? void 0 : replayScriptsInfo.width,
                                        imageHeight: null == replayScriptsInfo ? void 0 : replayScriptsInfo.height,
                                        reportFileContent: result.reportHTML || null,
                                        reportUrl: null == (_result_report = result.report) ? void 0 : _result_report.url,
                                        reportFormat: null == (_result_report1 = result.report) ? void 0 : _result_report1.format,
                                        fitMode: fitMode,
                                        autoZoom: autoZoom,
                                        canDownloadReport: null != canDownloadReport ? canDownloadReport : 'In-Browser' !== serviceMode,
                                        onDownloadReport: onDownloadReport,
                                        presentation: playerPresentation
                                    }, replayCounter)
                                })
                            ]
                        })
                    ]
                });
            } else resultDataToShow = errorNode;
        } else if (shouldPrioritizeResult && (null == result ? void 0 : result.result) !== void 0 && replayScriptsInfo) {
            var _result_report2, _result_report3;
            const resultOutput = 'string' == typeof (null == result ? void 0 : result.result) ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
                children: null == result ? void 0 : result.result
            }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
                children: JSON.stringify(null == result ? void 0 : result.result, null, 2)
            });
            const reportContent = (null == result ? void 0 : result.reportHTML) || null;
            resultDataToShow = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                className: "combined-result-layout",
                children: [
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        style: {
                            flex: '0 0 auto'
                        },
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                },
                                children: "Output:"
                            }),
                            resultOutput
                        ]
                    }),
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        className: "combined-result-section",
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                },
                                children: "Report:"
                            }),
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                className: "combined-result-player",
                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_player_index_js_namespaceObject.Player, {
                                    replayScripts: replayScriptsInfo.scripts,
                                    imageWidth: replayScriptsInfo.width,
                                    imageHeight: replayScriptsInfo.height,
                                    reportFileContent: reportContent,
                                    reportUrl: null == (_result_report2 = result.report) ? void 0 : _result_report2.url,
                                    reportFormat: null == (_result_report3 = result.report) ? void 0 : _result_report3.format,
                                    fitMode: fitMode,
                                    autoZoom: autoZoom,
                                    canDownloadReport: null != canDownloadReport ? canDownloadReport : 'In-Browser' !== serviceMode,
                                    onDownloadReport: onDownloadReport,
                                    presentation: playerPresentation
                                }, replayCounter)
                            })
                        ]
                    })
                ]
            });
        } else if (replayScriptsInfo) {
            var _result_report4, _result_report5;
            const reportContent = (null == result ? void 0 : result.reportHTML) || null;
            resultDataToShow = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_player_index_js_namespaceObject.Player, {
                replayScripts: replayScriptsInfo.scripts,
                imageWidth: replayScriptsInfo.width,
                imageHeight: replayScriptsInfo.height,
                reportFileContent: reportContent,
                reportUrl: null == result ? void 0 : null == (_result_report4 = result.report) ? void 0 : _result_report4.url,
                reportFormat: null == result ? void 0 : null == (_result_report5 = result.report) ? void 0 : _result_report5.format,
                fitMode: fitMode,
                autoZoom: autoZoom,
                canDownloadReport: null != canDownloadReport ? canDownloadReport : 'In-Browser' !== serviceMode,
                onDownloadReport: onDownloadReport,
                presentation: playerPresentation
            }, replayCounter);
        } else if (shouldPrioritizeResult && (null == result ? void 0 : result.result) !== void 0 && ((null == result ? void 0 : result.reportHTML) || (null == result ? void 0 : result.report))) {
            var _result_report6, _result_report7;
            const resultOutput = 'string' == typeof (null == result ? void 0 : result.result) ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
                children: null == result ? void 0 : result.result
            }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
                children: JSON.stringify(null == result ? void 0 : result.result, null, 2)
            });
            resultDataToShow = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                className: "combined-result-layout",
                children: [
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        style: {
                            flex: '0 0 auto'
                        },
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                },
                                children: "Output:"
                            }),
                            resultOutput
                        ]
                    }),
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        className: "combined-result-section",
                        children: [
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                },
                                children: "Report:"
                            }),
                            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                className: "combined-result-player",
                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_player_index_js_namespaceObject.Player, {
                                    reportFileContent: result.reportHTML || null,
                                    reportUrl: null == (_result_report6 = result.report) ? void 0 : _result_report6.url,
                                    reportFormat: null == (_result_report7 = result.report) ? void 0 : _result_report7.format,
                                    fitMode: fitMode,
                                    autoZoom: autoZoom,
                                    canDownloadReport: null != canDownloadReport ? canDownloadReport : 'In-Browser' !== serviceMode,
                                    onDownloadReport: onDownloadReport,
                                    presentation: playerPresentation
                                }, replayCounter)
                            })
                        ]
                    })
                ]
            });
        } else if (shouldPrioritizeResult && (null == result ? void 0 : result.result) !== void 0) resultDataToShow = 'string' == typeof (null == result ? void 0 : result.result) ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
            children: null == result ? void 0 : result.result
        }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
            children: JSON.stringify(null == result ? void 0 : result.result, null, 2)
        });
        else if ((null == result ? void 0 : result.reportHTML) || (null == result ? void 0 : result.report)) {
            var _result_report8, _result_report9;
            resultDataToShow = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_player_index_js_namespaceObject.Player, {
                reportFileContent: result.reportHTML || null,
                reportUrl: null == (_result_report8 = result.report) ? void 0 : _result_report8.url,
                reportFormat: null == (_result_report9 = result.report) ? void 0 : _result_report9.format,
                fitMode: fitMode,
                autoZoom: autoZoom,
                canDownloadReport: null != canDownloadReport ? canDownloadReport : 'In-Browser' !== serviceMode,
                onDownloadReport: onDownloadReport,
                presentation: playerPresentation
            }, replayCounter);
        } else if ((null == result ? void 0 : result.result) !== void 0) resultDataToShow = 'string' == typeof (null == result ? void 0 : result.result) ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
            children: null == result ? void 0 : result.result
        }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("pre", {
            children: JSON.stringify(null == result ? void 0 : result.result, null, 2)
        });
    } else resultDataToShow = (0, index_js_namespaceObject.serverLaunchTip)(notReadyMessage);
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: resultWrapperClassName,
        style: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            justifyContent: 'center'
        },
        children: resultDataToShow
    });
};
exports.PlaygroundResultView = __webpack_exports__.PlaygroundResultView;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "PlaygroundResultView"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
