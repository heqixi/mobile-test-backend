import { jsx, jsxs } from "react/jsx-runtime";
import { InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Spin, Tooltip } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";
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
function ScreenshotViewer({ getScreenshot, getInterfaceInfo, serverOnline, isUserOperating = false, mjpegUrl, mode = 'default', contentRef }) {
    const [screenshot, setScreenshot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(0);
    const [interfaceInfo, setInterfaceInfo] = useState(null);
    const [mjpegRetryToken, setMjpegRetryToken] = useState(()=>String(Date.now()));
    const mjpegImageRef = useRef(null);
    const isMjpeg = Boolean(mjpegUrl && serverOnline);
    const showChrome = 'screen-only' !== mode;
    const rootClassName = [
        'screenshot-viewer',
        'screen-only' === mode && 'screen-only'
    ].filter(Boolean).join(' ');
    const pollingIntervalRef = useRef(null);
    const isPollingPausedRef = useRef(false);
    useEffect(()=>{
        if (!isMjpeg) return;
        const retryIfFrameIsBlank = ()=>{
            const image = mjpegImageRef.current;
            if (!image || image.naturalWidth > 0 || image.naturalHeight > 0) return;
            setMjpegRetryToken(String(Date.now()));
        };
        const initialTimer = window.setTimeout(retryIfFrameIsBlank, 2500);
        const healthTimer = window.setInterval(retryIfFrameIsBlank, 2500);
        return ()=>{
            window.clearTimeout(initialTimer);
            window.clearInterval(healthTimer);
        };
    }, [
        isMjpeg,
        mjpegRetryToken,
        mjpegUrl
    ]);
    const fetchScreenshot = useCallback((isManual = false)=>_async_to_generator(function*() {
            if (!serverOnline) return;
            setLoading(true);
            if (isManual) setError(null);
            try {
                const result = yield getScreenshot();
                console.log('Screenshot API response:', result);
                if (null == result ? void 0 : result.screenshot) {
                    const screenshotData = result.screenshot.toString().trim();
                    if (screenshotData) {
                        setScreenshot(screenshotData);
                        setError(null);
                        setLastUpdateTime(Date.now());
                    } else setError('Empty screenshot data received');
                } else setError('No screenshot data in response');
            } catch (err) {
                console.error('Screenshot fetch error:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch screenshot');
            } finally{
                setLoading(false);
            }
        })(), [
        getScreenshot,
        serverOnline
    ]);
    const fetchInterfaceInfo = useCallback(()=>_async_to_generator(function*() {
            if (!serverOnline || !getInterfaceInfo) return;
            try {
                const info = yield getInterfaceInfo();
                if (info) setInterfaceInfo(info);
            } catch (err) {
                console.error('Interface info fetch error:', err);
            }
        })(), [
        getInterfaceInfo,
        serverOnline
    ]);
    const startPolling = useCallback(()=>{
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        console.log('Starting screenshot polling (5s interval)');
        pollingIntervalRef.current = setInterval(()=>{
            if (!isPollingPausedRef.current && serverOnline) fetchScreenshot(false);
        }, 5000);
    }, [
        fetchScreenshot,
        serverOnline
    ]);
    const stopPolling = useCallback(()=>{
        if (pollingIntervalRef.current) {
            console.log('Stopping screenshot polling');
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);
    const pausePolling = useCallback(()=>{
        console.log('Pausing screenshot polling');
        isPollingPausedRef.current = true;
    }, []);
    const resumePolling = useCallback(()=>{
        console.log('Resuming screenshot polling');
        isPollingPausedRef.current = false;
    }, []);
    const handleManualRefresh = useCallback(()=>{
        fetchScreenshot(true);
    }, [
        fetchScreenshot
    ]);
    useEffect(()=>{
        if (!serverOnline) {
            setScreenshot(null);
            setError(null);
            setInterfaceInfo(null);
            stopPolling();
            return;
        }
        fetchInterfaceInfo();
        if (isMjpeg) return void stopPolling();
        fetchScreenshot(false);
        startPolling();
        return ()=>{
            stopPolling();
        };
    }, [
        serverOnline,
        isMjpeg,
        startPolling,
        stopPolling,
        fetchScreenshot,
        fetchInterfaceInfo
    ]);
    useEffect(()=>{
        if (!serverOnline || isMjpeg) return;
        if (isUserOperating) pausePolling();
        else {
            resumePolling();
            fetchScreenshot(false);
        }
    }, [
        isUserOperating,
        pausePolling,
        resumePolling,
        fetchScreenshot,
        serverOnline,
        isMjpeg
    ]);
    useEffect(()=>()=>{
            stopPolling();
        }, [
        stopPolling
    ]);
    if (!serverOnline) return /*#__PURE__*/ jsx("div", {
        className: `${rootClassName} offline`,
        children: /*#__PURE__*/ jsxs("div", {
            className: "screenshot-placeholder",
            children: [
                /*#__PURE__*/ jsx("h3", {
                    children: "\uD83D\uDCF1 Screen Preview"
                }),
                /*#__PURE__*/ jsx("p", {
                    children: "Start the playground server to see real-time screenshots"
                })
            ]
        })
    });
    if (!isMjpeg && loading && !screenshot) return /*#__PURE__*/ jsxs("div", {
        className: `${rootClassName} loading`,
        children: [
            /*#__PURE__*/ jsx(Spin, {
                size: "large"
            }),
            /*#__PURE__*/ jsx("p", {
                children: "Loading screenshot..."
            })
        ]
    });
    if (!isMjpeg && error && !screenshot) return /*#__PURE__*/ jsx("div", {
        className: `${rootClassName} error`,
        children: /*#__PURE__*/ jsxs("div", {
            className: "screenshot-placeholder",
            children: [
                /*#__PURE__*/ jsx("h3", {
                    children: "\uD83D\uDCF1 Screen Preview"
                }),
                /*#__PURE__*/ jsx("p", {
                    className: "error-message",
                    children: error
                })
            ]
        })
    });
    const formatLastUpdateTime = (timestamp)=>{
        if (!timestamp) return '';
        const now = Date.now();
        const diff = Math.floor((now - timestamp) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return new Date(timestamp).toLocaleTimeString();
    };
    const screenshotContent = /*#__PURE__*/ jsx("div", {
        className: "screenshot-content",
        ref: contentRef,
        children: isMjpeg ? /*#__PURE__*/ jsx("div", {
            className: "screenshot-image-shell",
            children: /*#__PURE__*/ jsx("img", {
                ref: mjpegImageRef,
                src: mjpegRetryToken ? `${mjpegUrl}${(null == mjpegUrl ? void 0 : mjpegUrl.includes('?')) ? '&' : '?'}_mjpegRetry=${encodeURIComponent(mjpegRetryToken)}` : mjpegUrl,
                alt: "Device Live Stream",
                className: "screenshot-image",
                onError: ()=>{
                    window.setTimeout(()=>setMjpegRetryToken(String(Date.now())), 500);
                }
            }, mjpegRetryToken || 'initial')
        }) : screenshot ? /*#__PURE__*/ jsx("div", {
            className: "screenshot-image-shell",
            children: /*#__PURE__*/ jsx("img", {
                src: screenshot.startsWith('data:image/') ? screenshot : `data:image/png;base64,${screenshot}`,
                alt: "Device Screenshot",
                className: "screenshot-image",
                onLoad: ()=>console.log('Screenshot image loaded successfully'),
                onError: (e)=>{
                    console.error('Screenshot image load error:', e);
                    console.error('Screenshot data preview:', screenshot.substring(0, 100));
                    setError('Failed to load screenshot image');
                }
            })
        }) : /*#__PURE__*/ jsx("div", {
            className: "screenshot-placeholder",
            children: /*#__PURE__*/ jsx("p", {
                children: "No screenshot available"
            })
        })
    });
    if (!showChrome) return /*#__PURE__*/ jsx("div", {
        className: rootClassName,
        children: screenshotContent
    });
    return /*#__PURE__*/ jsxs("div", {
        className: rootClassName,
        children: [
            /*#__PURE__*/ jsx("div", {
                className: "screenshot-header",
                children: /*#__PURE__*/ jsx("div", {
                    className: "screenshot-title",
                    children: /*#__PURE__*/ jsx("h3", {
                        children: (null == interfaceInfo ? void 0 : interfaceInfo.type) ? interfaceInfo.type : 'Device Name'
                    })
                })
            }),
            /*#__PURE__*/ jsxs("div", {
                className: "screenshot-container",
                children: [
                    /*#__PURE__*/ jsxs("div", {
                        className: "screenshot-overlay",
                        children: [
                            /*#__PURE__*/ jsxs("div", {
                                className: "device-name-overlay",
                                children: [
                                    "Device Name",
                                    /*#__PURE__*/ jsx(Tooltip, {
                                        title: null == interfaceInfo ? void 0 : interfaceInfo.description,
                                        children: /*#__PURE__*/ jsx(InfoCircleOutlined, {
                                            size: 16,
                                            className: "info-icon"
                                        })
                                    })
                                ]
                            }),
                            !isMjpeg && /*#__PURE__*/ jsxs("div", {
                                className: "screenshot-controls",
                                children: [
                                    lastUpdateTime > 0 && /*#__PURE__*/ jsxs("span", {
                                        className: "last-update-time",
                                        children: [
                                            "Last updated ",
                                            formatLastUpdateTime(lastUpdateTime)
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx(Tooltip, {
                                        title: "Refresh screenshot",
                                        children: /*#__PURE__*/ jsx(Button, {
                                            icon: /*#__PURE__*/ jsx(ReloadOutlined, {}),
                                            onClick: handleManualRefresh,
                                            loading: loading,
                                            size: "small"
                                        })
                                    }),
                                    isUserOperating && /*#__PURE__*/ jsxs("span", {
                                        className: "operation-indicator",
                                        children: [
                                            /*#__PURE__*/ jsx(Spin, {
                                                size: "small"
                                            }),
                                            " Operating..."
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    screenshotContent
                ]
            })
        ]
    });
}
export { ScreenshotViewer as default };
