"use strict";
"use client";
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
    Player: ()=>Player
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const external_react_namespaceObject = require("react");
require("./index.css");
const icons_namespaceObject = require("@ant-design/icons");
const external_antd_namespaceObject = require("antd");
const global_perspective_js_namespaceObject = require("../../icons/global-perspective.js");
var global_perspective_js_default = /*#__PURE__*/ __webpack_require__.n(global_perspective_js_namespaceObject);
const player_setting_js_namespaceObject = require("../../icons/player-setting.js");
var player_setting_js_default = /*#__PURE__*/ __webpack_require__.n(player_setting_js_namespaceObject);
const store_js_namespaceObject = require("../../store/store.js");
const index_js_namespaceObject = require("../../utils/index.js");
const external_playback_controls_js_namespaceObject = require("./playback-controls.js");
const external_report_download_js_namespaceObject = require("./report-download.js");
const StepScene_js_namespaceObject = require("./scenes/StepScene.js");
const export_branded_video_js_namespaceObject = require("./scenes/export-branded-video.js");
const frame_calculator_js_namespaceObject = require("./scenes/frame-calculator.js");
const playback_frame_js_namespaceObject = require("./scenes/playback-frame.js");
const external_use_frame_player_js_namespaceObject = require("./use-frame-player.js");
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
function deriveTaskId(scriptFrames, stepsFrame) {
    let taskId = null;
    for (const sf of scriptFrames){
        if (0 === sf.durationInFrames) {
            if (sf.startFrame <= stepsFrame) {
                var _sf_taskId;
                taskId = null != (_sf_taskId = sf.taskId) ? _sf_taskId : taskId;
            }
            continue;
        }
        if (stepsFrame < sf.startFrame) break;
        var _sf_taskId1;
        taskId = null != (_sf_taskId1 = sf.taskId) ? _sf_taskId1 : taskId;
    }
    return taskId;
}
function formatTime(frame, fps) {
    const totalSeconds = Math.floor(frame / fps);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function Player(props) {
    const { message } = external_antd_namespaceObject.App.useApp();
    const { autoZoom, setAutoZoom, playbackSpeed, setPlaybackSpeed, subtitleEnabled, setSubtitleEnabled } = (0, store_js_namespaceObject.useGlobalPreference)();
    (0, external_react_namespaceObject.useEffect)(()=>{
        if ((null == props ? void 0 : props.autoZoom) !== void 0) setAutoZoom(props.autoZoom);
    }, [
        null == props ? void 0 : props.autoZoom,
        setAutoZoom
    ]);
    const scripts = null == props ? void 0 : props.replayScripts;
    const frameMap = (0, external_react_namespaceObject.useMemo)(()=>{
        if (!scripts || 0 === scripts.length) return null;
        return (0, frame_calculator_js_namespaceObject.calculateFrameMap)(scripts, {
            imageWidth: null == props ? void 0 : props.imageWidth,
            imageHeight: null == props ? void 0 : props.imageHeight
        });
    }, [
        null == props ? void 0 : props.imageHeight,
        null == props ? void 0 : props.imageWidth,
        scripts
    ]);
    const containerRef = (0, external_react_namespaceObject.useRef)(null);
    const renderLayerRef = (0, external_react_namespaceObject.useRef)(null);
    const lastTaskIdRef = (0, external_react_namespaceObject.useRef)(null);
    const [containerSize, setContainerSize] = (0, external_react_namespaceObject.useState)({
        width: 0,
        height: 0
    });
    (0, external_react_namespaceObject.useEffect)(()=>{
        const el = renderLayerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries)=>{
            for (const entry of entries){
                const { width, height } = entry.contentRect;
                setContainerSize((prev)=>prev.width === width && prev.height === height ? prev : {
                        width,
                        height
                    });
            }
        });
        ro.observe(el);
        return ()=>ro.disconnect();
    }, []);
    var _frameMap_totalDurationInFrames, _frameMap_fps, _props_autoPlay;
    const player = (0, external_use_frame_player_js_namespaceObject.useFramePlayer)({
        durationInFrames: Math.max(null != (_frameMap_totalDurationInFrames = null == frameMap ? void 0 : frameMap.totalDurationInFrames) ? _frameMap_totalDurationInFrames : 1, 1),
        fps: null != (_frameMap_fps = null == frameMap ? void 0 : frameMap.fps) ? _frameMap_fps : 30,
        autoPlay: null != (_props_autoPlay = null == props ? void 0 : props.autoPlay) ? _props_autoPlay : true,
        loop: false,
        playbackRate: playbackSpeed
    });
    const effectiveEndFrame = (0, external_react_namespaceObject.useMemo)(()=>{
        if (!frameMap) return 0;
        for(let i = frameMap.scriptFrames.length - 1; i >= 0; i--){
            const sf = frameMap.scriptFrames[i];
            if (sf.taskId) return sf.startFrame + sf.durationInFrames - 1;
        }
        return Math.max(0, frameMap.totalDurationInFrames - 1);
    }, [
        frameMap
    ]);
    const handlePlaybackToggle = (0, external_react_namespaceObject.useCallback)(()=>{
        if (player.playing) return void player.pause();
        if ((0, external_playback_controls_js_namespaceObject.shouldRestartPlaybackFromBeginning)(player.currentFrame, effectiveEndFrame)) player.seekTo(0);
        player.play();
    }, [
        effectiveEndFrame,
        player.currentFrame,
        player.pause,
        player.play,
        player.playing,
        player.seekTo
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (!frameMap || player.playing) return;
        if (player.currentFrame < frameMap.totalDurationInFrames - 1) return;
        if (effectiveEndFrame > 0) player.seekTo(effectiveEndFrame);
    }, [
        effectiveEndFrame,
        frameMap,
        player.currentFrame,
        player.playing,
        player.seekTo
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (!frameMap || !(null == props ? void 0 : props.onTaskChange)) return;
        if (!player.playing) {
            if (null !== lastTaskIdRef.current) {
                lastTaskIdRef.current = null;
                props.onTaskChange(null);
            }
            return;
        }
        const taskId = deriveTaskId(frameMap.scriptFrames, player.currentFrame);
        if (taskId !== lastTaskIdRef.current) {
            lastTaskIdRef.current = taskId;
            props.onTaskChange(taskId);
        }
    }, [
        frameMap,
        null == props ? void 0 : props.onTaskChange,
        player.currentFrame,
        player.playing
    ]);
    const currentFrameState = (0, external_react_namespaceObject.useMemo)(()=>{
        if (!frameMap) return null;
        return (0, playback_frame_js_namespaceObject.getPlaybackFrameState)(frameMap, player.currentFrame);
    }, [
        frameMap,
        player.currentFrame
    ]);
    const handleDownloadReport = (0, external_react_namespaceObject.useCallback)(()=>_async_to_generator(function*() {
            if ((null == props ? void 0 : props.reportFormat) === 'html-and-external-assets' && props.reportUrl) return void globalThis.open(props.reportUrl, '_blank', 'noopener,noreferrer');
            try {
                let content = null == props ? void 0 : props.reportFileContent;
                if (!content && (null == props ? void 0 : props.reportUrl)) {
                    const response = yield fetch(props.reportUrl);
                    if (!response.ok) throw new Error(`Report request failed (${response.status})`);
                    content = yield response.text();
                }
                if (!content) return;
                yield (0, external_report_download_js_namespaceObject.triggerReportDownload)({
                    content,
                    onDownloadReport: null == props ? void 0 : props.onDownloadReport
                });
            } catch (error) {
                (0, index_js_namespaceObject.notifyError)(error, {
                    title: 'Failed to download report'
                });
            }
        })(), [
        null == props ? void 0 : props.onDownloadReport,
        null == props ? void 0 : props.reportFileContent,
        null == props ? void 0 : props.reportFormat,
        null == props ? void 0 : props.reportUrl
    ]);
    const subtitle = (0, external_react_namespaceObject.useMemo)(()=>{
        if (!currentFrameState) return null;
        if (!currentFrameState.title && !currentFrameState.subTitle) return null;
        return {
            title: currentFrameState.title,
            subTitle: currentFrameState.subTitle
        };
    }, [
        currentFrameState
    ]);
    const [isExporting, setIsExporting] = (0, external_react_namespaceObject.useState)(false);
    const [exportProgress, setExportProgress] = (0, external_react_namespaceObject.useState)(0);
    const exportInFlightRef = (0, external_react_namespaceObject.useRef)(false);
    const [controlsVisible, setControlsVisible] = (0, external_react_namespaceObject.useState)(true);
    const hideTimerRef = (0, external_react_namespaceObject.useRef)(null);
    const showControls = (0, external_react_namespaceObject.useCallback)(()=>{
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isExporting) return;
        hideTimerRef.current = setTimeout(()=>setControlsVisible(false), 3000);
    }, [
        isExporting
    ]);
    const onMouseEnter = (0, external_react_namespaceObject.useCallback)(()=>{
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }, []);
    const onMouseLeave = (0, external_react_namespaceObject.useCallback)(()=>{
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isExporting) return;
        hideTimerRef.current = setTimeout(()=>setControlsVisible(false), 1000);
    }, [
        isExporting
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (!isExporting) return;
        setControlsVisible(true);
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, [
        isExporting
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        const handleKeyDown = (e)=>{
            var _e_target;
            const tag = null == (_e_target = e.target) ? void 0 : _e_target.tagName;
            if ('INPUT' === tag || 'TEXTAREA' === tag || 'SELECT' === tag) return;
            if ('Space' === e.code) {
                e.preventDefault();
                handlePlaybackToggle();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return ()=>document.removeEventListener('keydown', handleKeyDown);
    }, [
        handlePlaybackToggle
    ]);
    const seekBarRef = (0, external_react_namespaceObject.useRef)(null);
    const handleSeekPointerDown = (0, external_react_namespaceObject.useCallback)((e)=>{
        if (!frameMap || !seekBarRef.current) return;
        const bar = seekBarRef.current;
        bar.setPointerCapture(e.pointerId);
        const seek = (clientX)=>{
            const rect = bar.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            player.seekTo(Math.round(ratio * effectiveEndFrame));
        };
        seek(e.clientX);
        const onMove = (ev)=>seek(ev.clientX);
        const onUp = ()=>{
            bar.removeEventListener('pointermove', onMove);
            bar.removeEventListener('pointerup', onUp);
        };
        bar.addEventListener('pointermove', onMove);
        bar.addEventListener('pointerup', onUp);
    }, [
        frameMap,
        player,
        effectiveEndFrame
    ]);
    const [isFullscreen, setIsFullscreen] = (0, external_react_namespaceObject.useState)(false);
    const toggleFullscreen = (0, external_react_namespaceObject.useCallback)(()=>{
        const el = containerRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen().then(()=>setIsFullscreen(false));
        else el.requestFullscreen().then(()=>setIsFullscreen(true));
    }, []);
    (0, external_react_namespaceObject.useEffect)(()=>{
        const handler = ()=>setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return ()=>document.removeEventListener('fullscreenchange', handler);
    }, []);
    const handleExportVideo = (0, external_react_namespaceObject.useCallback)(()=>_async_to_generator(function*() {
            if (!frameMap || exportInFlightRef.current) return;
            exportInFlightRef.current = true;
            setIsExporting(true);
            setExportProgress(0);
            try {
                yield (0, export_branded_video_js_namespaceObject.exportBrandedVideo)(frameMap, {
                    autoZoom
                }, (pct)=>setExportProgress(Math.round(100 * pct)));
                message.success('Video exported');
            } catch (e) {
                console.error('Export failed:', e);
                (0, index_js_namespaceObject.notifyError)(e, {
                    title: 'Video export failed'
                });
            } finally{
                exportInFlightRef.current = false;
                setIsExporting(false);
                setExportProgress(0);
            }
        })(), [
        autoZoom,
        frameMap
    ]);
    const chapterMarkers = (0, external_react_namespaceObject.useMemo)(()=>{
        if (!frameMap || effectiveEndFrame <= 0) return [];
        const markers = [];
        for (const sf of frameMap.scriptFrames){
            if ('img' !== sf.type && 'insight' !== sf.type || 0 === sf.durationInFrames) continue;
            const globalFrame = sf.startFrame;
            const percent = globalFrame / effectiveEndFrame * 100;
            if (percent > 1 && percent < 99) {
                const parts = [
                    sf.title,
                    sf.subTitle
                ].filter(Boolean);
                markers.push({
                    percent,
                    title: parts.length > 0 ? parts.join(': ') : `Chapter ${markers.length + 1}`,
                    frame: globalFrame
                });
            }
        }
        return markers;
    }, [
        frameMap,
        effectiveEndFrame
    ]);
    var _props_reportFileContent;
    const reportFileContent = null != (_props_reportFileContent = null == props ? void 0 : props.reportFileContent) ? _props_reportFileContent : null;
    const hasReport = Boolean(reportFileContent || (null == props ? void 0 : props.reportUrl));
    const reportActionLabel = (null == props ? void 0 : props.reportFormat) === 'html-and-external-assets' ? 'Open report' : 'Download report';
    const canDownloadReport = (null == props ? void 0 : props.canDownloadReport) !== false;
    var _props_presentation;
    const presentation = null != (_props_presentation = null == props ? void 0 : props.presentation) ? _props_presentation : 'default';
    if (!scripts || 0 === scripts.length || !frameMap) {
        if (hasReport && canDownloadReport) return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
            className: "player-container player-container-empty",
            "data-presentation": presentation,
            children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                className: "player-empty-state",
                children: [
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                        className: "player-empty-text",
                        children: "No replay available"
                    }),
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
                        icon: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.DownloadOutlined, {}),
                        onClick: ()=>{
                            handleDownloadReport();
                        },
                        children: reportActionLabel
                    })
                ]
            })
        });
        return null;
    }
    const compositionWidth = (null == currentFrameState ? void 0 : currentFrameState.imageWidth) || frameMap.imageWidth;
    const compositionHeight = (null == currentFrameState ? void 0 : currentFrameState.imageHeight) || frameMap.imageHeight;
    const isPortraitCanvas = compositionHeight > compositionWidth;
    const seekPercent = effectiveEndFrame > 0 ? Math.min(100, player.currentFrame / effectiveEndFrame * 100) : 0;
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: "player-container",
        "data-fit-mode": null == props ? void 0 : props.fitMode,
        "data-presentation": presentation,
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
            className: "canvas-container",
            ref: containerRef,
            onMouseMove: showControls,
            onMouseEnter: onMouseEnter,
            onMouseLeave: onMouseLeave,
            children: [
                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                    className: "player-wrapper",
                    "data-portrait": isPortraitCanvas ? '' : void 0,
                    style: {
                        aspectRatio: `${compositionWidth}/${compositionHeight}`
                    },
                    children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                        ref: renderLayerRef,
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden'
                        },
                        onClick: handlePlaybackToggle,
                        children: (()=>{
                            const scale = containerSize.width > 0 && containerSize.height > 0 ? Math.min(containerSize.width / compositionWidth, containerSize.height / compositionHeight) : 1;
                            return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                style: {
                                    width: compositionWidth * scale,
                                    height: compositionHeight * scale,
                                    flexShrink: 0,
                                    position: 'relative',
                                    overflow: 'hidden'
                                },
                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                    style: {
                                        width: compositionWidth,
                                        height: compositionHeight,
                                        transformOrigin: '0 0',
                                        transform: `scale(${scale})`
                                    },
                                    children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(StepScene_js_namespaceObject.StepsTimeline, {
                                        frameMap: frameMap,
                                        autoZoom: autoZoom && player.playing,
                                        frame: player.currentFrame,
                                        width: compositionWidth,
                                        height: compositionHeight,
                                        fps: frameMap.fps
                                    })
                                })
                            });
                        })()
                    })
                }),
                subtitleEnabled && subtitle && /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                    className: "player-subtitle",
                    children: [
                        subtitle.title && /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                            className: "player-subtitle-badge",
                            children: subtitle.title
                        }),
                        subtitle.subTitle && /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                            className: "player-subtitle-text",
                            children: subtitle.subTitle
                        })
                    ]
                }),
                !(null == props ? void 0 : props.hideControls) && /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                    className: `control-bar ${controlsVisible ? '' : 'hidden'}`,
                    onClick: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                            className: "status-icon",
                            onClick: handlePlaybackToggle,
                            children: player.playing ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.PauseOutlined, {}) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.CaretRightOutlined, {})
                        }),
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("span", {
                            className: "time-display",
                            children: [
                                formatTime(Math.min(player.currentFrame, effectiveEndFrame), frameMap.fps),
                                ' ',
                                "/ ",
                                formatTime(effectiveEndFrame + 1, frameMap.fps)
                            ]
                        }),
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                            className: "seek-bar-track",
                            ref: seekBarRef,
                            onPointerDown: handleSeekPointerDown,
                            children: [
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                    className: "seek-bar-fill",
                                    style: {
                                        width: `${seekPercent}%`
                                    }
                                }),
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                    className: "seek-bar-knob",
                                    style: {
                                        left: `${seekPercent}%`
                                    }
                                }),
                                chapterMarkers.map((marker)=>/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
                                        title: marker.title,
                                        overlayClassName: "chapter-tooltip",
                                        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                            className: "chapter-marker",
                                            style: {
                                                left: `${marker.percent}%`
                                            },
                                            onClick: (e)=>{
                                                e.stopPropagation();
                                                player.seekTo(marker.frame);
                                            }
                                        })
                                    }, marker.percent))
                            ]
                        }),
                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                            className: "player-custom-controls",
                            children: [
                                hasReport && canDownloadReport ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Tooltip, {
                                    title: reportActionLabel,
                                    children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                        className: "status-icon",
                                        onClick: ()=>{
                                            handleDownloadReport();
                                        },
                                        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.DownloadOutlined, {})
                                    })
                                }) : null,
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Dropdown, {
                                    trigger: [
                                        'hover',
                                        'click'
                                    ],
                                    placement: "topRight",
                                    overlayStyle: {
                                        minWidth: '148px'
                                    },
                                    dropdownRender: ()=>/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                            className: "player-settings-dropdown",
                                            children: [
                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                                    className: "player-settings-item",
                                                    style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        height: '32px',
                                                        padding: '0 8px',
                                                        borderRadius: '4px',
                                                        cursor: isExporting ? 'not-allowed' : 'pointer',
                                                        opacity: isExporting ? 0.5 : 1
                                                    },
                                                    onClick: isExporting ? void 0 : handleExportVideo,
                                                    children: [
                                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                                                            style: {
                                                                width: 16,
                                                                height: 16,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            },
                                                            children: isExporting ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Progress, {
                                                                type: "circle",
                                                                percent: exportProgress,
                                                                size: 16,
                                                                strokeWidth: 14,
                                                                showInfo: false,
                                                                strokeColor: "#1677ff",
                                                                trailColor: "rgba(0, 0, 0, 0.12)"
                                                            }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.ExportOutlined, {
                                                                style: {
                                                                    width: '16px',
                                                                    height: '16px'
                                                                }
                                                            })
                                                        }),
                                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                                                            className: "player-export-label",
                                                            children: isExporting ? `Exporting ${exportProgress}%` : 'Export video'
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                                    className: "player-settings-divider"
                                                }),
                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                                    className: "player-settings-item",
                                                    style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        height: '32px',
                                                        padding: '0 8px',
                                                        borderRadius: '4px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                                            style: {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(global_perspective_js_default(), {
                                                                    style: {
                                                                        width: '16px',
                                                                        height: '16px'
                                                                    }
                                                                }),
                                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                                                                    style: {
                                                                        fontSize: '14px',
                                                                        marginRight: '16px'
                                                                    },
                                                                    children: "Focus on cursor"
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Switch, {
                                                            size: "small",
                                                            checked: autoZoom,
                                                            onChange: (checked)=>setAutoZoom(checked)
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                                    className: "player-settings-item",
                                                    style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        height: '32px',
                                                        padding: '0 8px',
                                                        borderRadius: '4px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                                            style: {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.FontSizeOutlined, {
                                                                    style: {
                                                                        width: '16px',
                                                                        height: '16px'
                                                                    }
                                                                }),
                                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                                                                    style: {
                                                                        fontSize: '14px',
                                                                        marginRight: '16px'
                                                                    },
                                                                    children: "Subtitle"
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Switch, {
                                                            size: "small",
                                                            checked: subtitleEnabled,
                                                            onChange: (checked)=>setSubtitleEnabled(checked)
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                                    className: "player-settings-divider"
                                                }),
                                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                                    style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        height: '32px',
                                                        padding: '0 8px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.ThunderboltOutlined, {
                                                            style: {
                                                                width: '16px',
                                                                height: '16px'
                                                            }
                                                        }),
                                                        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                                                            style: {
                                                                fontSize: '14px'
                                                            },
                                                            children: "Playback speed"
                                                        })
                                                    ]
                                                }),
                                                [
                                                    0.5,
                                                    1,
                                                    1.5,
                                                    2
                                                ].map((speed)=>/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                                                        onClick: ()=>setPlaybackSpeed(speed),
                                                        style: {
                                                            height: '32px',
                                                            lineHeight: '32px',
                                                            padding: '0 8px 0 28px',
                                                            fontSize: '14px',
                                                            cursor: 'pointer',
                                                            borderRadius: '4px'
                                                        },
                                                        className: `player-speed-option${playbackSpeed === speed ? ' active' : ''}`,
                                                        children: [
                                                            speed,
                                                            "x"
                                                        ]
                                                    }, speed))
                                            ]
                                        }),
                                    menu: {
                                        items: []
                                    },
                                    children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                        className: "status-icon",
                                        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(player_setting_js_default(), {
                                            style: {
                                                width: '16px',
                                                height: '16px'
                                            }
                                        })
                                    })
                                }),
                                /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                    className: "status-icon",
                                    onClick: toggleFullscreen,
                                    children: isFullscreen ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.CompressOutlined, {}) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.ExpandOutlined, {})
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
}
exports.Player = __webpack_exports__.Player;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "Player"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
