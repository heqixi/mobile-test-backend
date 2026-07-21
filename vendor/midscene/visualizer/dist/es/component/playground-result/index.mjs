import { jsx, jsxs } from "react/jsx-runtime";
import { LoadingOutlined } from "@ant-design/icons";
import { noReplayAPIs } from "@midscene/playground";
import { Spin } from "antd";
import { emptyResultTip, serverLaunchTip } from "../misc/index.mjs";
import { Player } from "../player/index.mjs";
import shiny_text from "../shiny-text/index.mjs";
import "./index.css";
const PlaygroundResultView = ({ result, loading, serverValid, serviceMode, replayScriptsInfo, replayCounter, loadingProgressText, verticalMode = false, notReadyMessage, fitMode, autoZoom, actionType, canDownloadReport, onDownloadReport, playerPresentation })=>{
    let resultWrapperClassName = 'result-wrapper';
    if (verticalMode) resultWrapperClassName += ' vertical-mode-result';
    if (replayScriptsInfo && verticalMode) resultWrapperClassName += ' result-wrapper-compact';
    let resultDataToShow = emptyResultTip;
    const shouldPrioritizeResult = actionType && noReplayAPIs.includes(actionType);
    if (serverValid || 'Server' !== serviceMode) {
        if (loading) resultDataToShow = /*#__PURE__*/ jsxs("div", {
            className: "loading-container",
            children: [
                /*#__PURE__*/ jsx(Spin, {
                    spinning: loading,
                    indicator: /*#__PURE__*/ jsx(LoadingOutlined, {
                        spin: true
                    })
                }),
                /*#__PURE__*/ jsx("div", {
                    className: "loading-progress-text loading-progress-text-progress",
                    children: /*#__PURE__*/ jsx(shiny_text, {
                        text: loadingProgressText,
                        speed: 3
                    })
                })
            ]
        });
        else if (null == result ? void 0 : result.error) {
            const errorNode = /*#__PURE__*/ jsx("pre", {
                style: {
                    color: '#ff4d4f',
                    whiteSpace: 'pre-wrap'
                },
                children: null == result ? void 0 : result.error
            });
            if (result.reportHTML || result.report || replayScriptsInfo) {
                var _result_report, _result_report1;
                resultDataToShow = /*#__PURE__*/ jsxs("div", {
                    className: "combined-result-layout",
                    children: [
                        /*#__PURE__*/ jsxs("div", {
                            style: {
                                flex: '0 0 auto',
                                maxHeight: '40%',
                                overflow: 'auto'
                            },
                            children: [
                                /*#__PURE__*/ jsx("div", {
                                    style: {
                                        fontWeight: 'bold',
                                        marginBottom: '8px'
                                    },
                                    children: "Error:"
                                }),
                                errorNode
                            ]
                        }),
                        /*#__PURE__*/ jsxs("div", {
                            className: "combined-result-section",
                            children: [
                                /*#__PURE__*/ jsx("div", {
                                    style: {
                                        fontWeight: 'bold',
                                        marginBottom: '8px'
                                    },
                                    children: "Report:"
                                }),
                                /*#__PURE__*/ jsx("div", {
                                    className: "combined-result-player",
                                    children: /*#__PURE__*/ jsx(Player, {
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
            const resultOutput = 'string' == typeof (null == result ? void 0 : result.result) ? /*#__PURE__*/ jsx("pre", {
                children: null == result ? void 0 : result.result
            }) : /*#__PURE__*/ jsx("pre", {
                children: JSON.stringify(null == result ? void 0 : result.result, null, 2)
            });
            const reportContent = (null == result ? void 0 : result.reportHTML) || null;
            resultDataToShow = /*#__PURE__*/ jsxs("div", {
                className: "combined-result-layout",
                children: [
                    /*#__PURE__*/ jsxs("div", {
                        style: {
                            flex: '0 0 auto'
                        },
                        children: [
                            /*#__PURE__*/ jsx("div", {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                },
                                children: "Output:"
                            }),
                            resultOutput
                        ]
                    }),
                    /*#__PURE__*/ jsxs("div", {
                        className: "combined-result-section",
                        children: [
                            /*#__PURE__*/ jsx("div", {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                },
                                children: "Report:"
                            }),
                            /*#__PURE__*/ jsx("div", {
                                className: "combined-result-player",
                                children: /*#__PURE__*/ jsx(Player, {
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
            resultDataToShow = /*#__PURE__*/ jsx(Player, {
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
            const resultOutput = 'string' == typeof (null == result ? void 0 : result.result) ? /*#__PURE__*/ jsx("pre", {
                children: null == result ? void 0 : result.result
            }) : /*#__PURE__*/ jsx("pre", {
                children: JSON.stringify(null == result ? void 0 : result.result, null, 2)
            });
            resultDataToShow = /*#__PURE__*/ jsxs("div", {
                className: "combined-result-layout",
                children: [
                    /*#__PURE__*/ jsxs("div", {
                        style: {
                            flex: '0 0 auto'
                        },
                        children: [
                            /*#__PURE__*/ jsx("div", {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                },
                                children: "Output:"
                            }),
                            resultOutput
                        ]
                    }),
                    /*#__PURE__*/ jsxs("div", {
                        className: "combined-result-section",
                        children: [
                            /*#__PURE__*/ jsx("div", {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                },
                                children: "Report:"
                            }),
                            /*#__PURE__*/ jsx("div", {
                                className: "combined-result-player",
                                children: /*#__PURE__*/ jsx(Player, {
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
        } else if (shouldPrioritizeResult && (null == result ? void 0 : result.result) !== void 0) resultDataToShow = 'string' == typeof (null == result ? void 0 : result.result) ? /*#__PURE__*/ jsx("pre", {
            children: null == result ? void 0 : result.result
        }) : /*#__PURE__*/ jsx("pre", {
            children: JSON.stringify(null == result ? void 0 : result.result, null, 2)
        });
        else if ((null == result ? void 0 : result.reportHTML) || (null == result ? void 0 : result.report)) {
            var _result_report8, _result_report9;
            resultDataToShow = /*#__PURE__*/ jsx(Player, {
                reportFileContent: result.reportHTML || null,
                reportUrl: null == (_result_report8 = result.report) ? void 0 : _result_report8.url,
                reportFormat: null == (_result_report9 = result.report) ? void 0 : _result_report9.format,
                fitMode: fitMode,
                autoZoom: autoZoom,
                canDownloadReport: null != canDownloadReport ? canDownloadReport : 'In-Browser' !== serviceMode,
                onDownloadReport: onDownloadReport,
                presentation: playerPresentation
            }, replayCounter);
        } else if ((null == result ? void 0 : result.result) !== void 0) resultDataToShow = 'string' == typeof (null == result ? void 0 : result.result) ? /*#__PURE__*/ jsx("pre", {
            children: null == result ? void 0 : result.result
        }) : /*#__PURE__*/ jsx("pre", {
            children: JSON.stringify(null == result ? void 0 : result.result, null, 2)
        });
    } else resultDataToShow = serverLaunchTip(notReadyMessage);
    return /*#__PURE__*/ jsx("div", {
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
export { PlaygroundResultView };
