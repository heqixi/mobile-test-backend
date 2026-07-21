"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import { CaretRightOutlined, CompressOutlined, DownloadOutlined, ExpandOutlined, ExportOutlined, FontSizeOutlined, PauseOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { App, Button, Dropdown, Progress, Switch, Tooltip } from "antd";
import global_perspective from "../../icons/global-perspective.mjs";
import player_setting from "../../icons/player-setting.mjs";
import { useGlobalPreference } from "../../store/store.mjs";
import { notifyError } from "../../utils/index.mjs";
import { shouldRestartPlaybackFromBeginning } from "./playback-controls.mjs";
import { triggerReportDownload } from "./report-download.mjs";
import { StepsTimeline } from "./scenes/StepScene.mjs";
import { exportBrandedVideo } from "./scenes/export-branded-video.mjs";
import { calculateFrameMap } from "./scenes/frame-calculator.mjs";
import { getPlaybackFrameState } from "./scenes/playback-frame.mjs";
import { useFramePlayer } from "./use-frame-player.mjs";
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
    const { message } = App.useApp();
    const { autoZoom, setAutoZoom, playbackSpeed, setPlaybackSpeed, subtitleEnabled, setSubtitleEnabled } = useGlobalPreference();
    useEffect(()=>{
        if ((null == props ? void 0 : props.autoZoom) !== void 0) setAutoZoom(props.autoZoom);
    }, [
        null == props ? void 0 : props.autoZoom,
        setAutoZoom
    ]);
    const scripts = null == props ? void 0 : props.replayScripts;
    const frameMap = useMemo(()=>{
        if (!scripts || 0 === scripts.length) return null;
        return calculateFrameMap(scripts, {
            imageWidth: null == props ? void 0 : props.imageWidth,
            imageHeight: null == props ? void 0 : props.imageHeight
        });
    }, [
        null == props ? void 0 : props.imageHeight,
        null == props ? void 0 : props.imageWidth,
        scripts
    ]);
    const containerRef = useRef(null);
    const renderLayerRef = useRef(null);
    const lastTaskIdRef = useRef(null);
    const [containerSize, setContainerSize] = useState({
        width: 0,
        height: 0
    });
    useEffect(()=>{
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
    const player = useFramePlayer({
        durationInFrames: Math.max(null != (_frameMap_totalDurationInFrames = null == frameMap ? void 0 : frameMap.totalDurationInFrames) ? _frameMap_totalDurationInFrames : 1, 1),
        fps: null != (_frameMap_fps = null == frameMap ? void 0 : frameMap.fps) ? _frameMap_fps : 30,
        autoPlay: null != (_props_autoPlay = null == props ? void 0 : props.autoPlay) ? _props_autoPlay : true,
        loop: false,
        playbackRate: playbackSpeed
    });
    const effectiveEndFrame = useMemo(()=>{
        if (!frameMap) return 0;
        for(let i = frameMap.scriptFrames.length - 1; i >= 0; i--){
            const sf = frameMap.scriptFrames[i];
            if (sf.taskId) return sf.startFrame + sf.durationInFrames - 1;
        }
        return Math.max(0, frameMap.totalDurationInFrames - 1);
    }, [
        frameMap
    ]);
    const handlePlaybackToggle = useCallback(()=>{
        if (player.playing) return void player.pause();
        if (shouldRestartPlaybackFromBeginning(player.currentFrame, effectiveEndFrame)) player.seekTo(0);
        player.play();
    }, [
        effectiveEndFrame,
        player.currentFrame,
        player.pause,
        player.play,
        player.playing,
        player.seekTo
    ]);
    useEffect(()=>{
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
    useEffect(()=>{
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
    const currentFrameState = useMemo(()=>{
        if (!frameMap) return null;
        return getPlaybackFrameState(frameMap, player.currentFrame);
    }, [
        frameMap,
        player.currentFrame
    ]);
    const handleDownloadReport = useCallback(()=>_async_to_generator(function*() {
            if ((null == props ? void 0 : props.reportFormat) === 'html-and-external-assets' && props.reportUrl) return void globalThis.open(props.reportUrl, '_blank', 'noopener,noreferrer');
            try {
                let content = null == props ? void 0 : props.reportFileContent;
                if (!content && (null == props ? void 0 : props.reportUrl)) {
                    const response = yield fetch(props.reportUrl);
                    if (!response.ok) throw new Error(`Report request failed (${response.status})`);
                    content = yield response.text();
                }
                if (!content) return;
                yield triggerReportDownload({
                    content,
                    onDownloadReport: null == props ? void 0 : props.onDownloadReport
                });
            } catch (error) {
                notifyError(error, {
                    title: 'Failed to download report'
                });
            }
        })(), [
        null == props ? void 0 : props.onDownloadReport,
        null == props ? void 0 : props.reportFileContent,
        null == props ? void 0 : props.reportFormat,
        null == props ? void 0 : props.reportUrl
    ]);
    const subtitle = useMemo(()=>{
        if (!currentFrameState) return null;
        if (!currentFrameState.title && !currentFrameState.subTitle) return null;
        return {
            title: currentFrameState.title,
            subTitle: currentFrameState.subTitle
        };
    }, [
        currentFrameState
    ]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const exportInFlightRef = useRef(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimerRef = useRef(null);
    const showControls = useCallback(()=>{
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isExporting) return;
        hideTimerRef.current = setTimeout(()=>setControlsVisible(false), 3000);
    }, [
        isExporting
    ]);
    const onMouseEnter = useCallback(()=>{
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }, []);
    const onMouseLeave = useCallback(()=>{
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isExporting) return;
        hideTimerRef.current = setTimeout(()=>setControlsVisible(false), 1000);
    }, [
        isExporting
    ]);
    useEffect(()=>{
        if (!isExporting) return;
        setControlsVisible(true);
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, [
        isExporting
    ]);
    useEffect(()=>{
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
    const seekBarRef = useRef(null);
    const handleSeekPointerDown = useCallback((e)=>{
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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const toggleFullscreen = useCallback(()=>{
        const el = containerRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen().then(()=>setIsFullscreen(false));
        else el.requestFullscreen().then(()=>setIsFullscreen(true));
    }, []);
    useEffect(()=>{
        const handler = ()=>setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return ()=>document.removeEventListener('fullscreenchange', handler);
    }, []);
    const handleExportVideo = useCallback(()=>_async_to_generator(function*() {
            if (!frameMap || exportInFlightRef.current) return;
            exportInFlightRef.current = true;
            setIsExporting(true);
            setExportProgress(0);
            try {
                yield exportBrandedVideo(frameMap, {
                    autoZoom
                }, (pct)=>setExportProgress(Math.round(100 * pct)));
                message.success('Video exported');
            } catch (e) {
                console.error('Export failed:', e);
                notifyError(e, {
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
    const chapterMarkers = useMemo(()=>{
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
        if (hasReport && canDownloadReport) return /*#__PURE__*/ jsx("div", {
            className: "player-container player-container-empty",
            "data-presentation": presentation,
            children: /*#__PURE__*/ jsxs("div", {
                className: "player-empty-state",
                children: [
                    /*#__PURE__*/ jsx("span", {
                        className: "player-empty-text",
                        children: "No replay available"
                    }),
                    /*#__PURE__*/ jsx(Button, {
                        icon: /*#__PURE__*/ jsx(DownloadOutlined, {}),
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
    return /*#__PURE__*/ jsx("div", {
        className: "player-container",
        "data-fit-mode": null == props ? void 0 : props.fitMode,
        "data-presentation": presentation,
        children: /*#__PURE__*/ jsxs("div", {
            className: "canvas-container",
            ref: containerRef,
            onMouseMove: showControls,
            onMouseEnter: onMouseEnter,
            onMouseLeave: onMouseLeave,
            children: [
                /*#__PURE__*/ jsx("div", {
                    className: "player-wrapper",
                    "data-portrait": isPortraitCanvas ? '' : void 0,
                    style: {
                        aspectRatio: `${compositionWidth}/${compositionHeight}`
                    },
                    children: /*#__PURE__*/ jsx("div", {
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
                            return /*#__PURE__*/ jsx("div", {
                                style: {
                                    width: compositionWidth * scale,
                                    height: compositionHeight * scale,
                                    flexShrink: 0,
                                    position: 'relative',
                                    overflow: 'hidden'
                                },
                                children: /*#__PURE__*/ jsx("div", {
                                    style: {
                                        width: compositionWidth,
                                        height: compositionHeight,
                                        transformOrigin: '0 0',
                                        transform: `scale(${scale})`
                                    },
                                    children: /*#__PURE__*/ jsx(StepsTimeline, {
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
                subtitleEnabled && subtitle && /*#__PURE__*/ jsxs("div", {
                    className: "player-subtitle",
                    children: [
                        subtitle.title && /*#__PURE__*/ jsx("span", {
                            className: "player-subtitle-badge",
                            children: subtitle.title
                        }),
                        subtitle.subTitle && /*#__PURE__*/ jsx("span", {
                            className: "player-subtitle-text",
                            children: subtitle.subTitle
                        })
                    ]
                }),
                !(null == props ? void 0 : props.hideControls) && /*#__PURE__*/ jsxs("div", {
                    className: `control-bar ${controlsVisible ? '' : 'hidden'}`,
                    onClick: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ jsx("div", {
                            className: "status-icon",
                            onClick: handlePlaybackToggle,
                            children: player.playing ? /*#__PURE__*/ jsx(PauseOutlined, {}) : /*#__PURE__*/ jsx(CaretRightOutlined, {})
                        }),
                        /*#__PURE__*/ jsxs("span", {
                            className: "time-display",
                            children: [
                                formatTime(Math.min(player.currentFrame, effectiveEndFrame), frameMap.fps),
                                ' ',
                                "/ ",
                                formatTime(effectiveEndFrame + 1, frameMap.fps)
                            ]
                        }),
                        /*#__PURE__*/ jsxs("div", {
                            className: "seek-bar-track",
                            ref: seekBarRef,
                            onPointerDown: handleSeekPointerDown,
                            children: [
                                /*#__PURE__*/ jsx("div", {
                                    className: "seek-bar-fill",
                                    style: {
                                        width: `${seekPercent}%`
                                    }
                                }),
                                /*#__PURE__*/ jsx("div", {
                                    className: "seek-bar-knob",
                                    style: {
                                        left: `${seekPercent}%`
                                    }
                                }),
                                chapterMarkers.map((marker)=>/*#__PURE__*/ jsx(Tooltip, {
                                        title: marker.title,
                                        overlayClassName: "chapter-tooltip",
                                        children: /*#__PURE__*/ jsx("div", {
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
                        /*#__PURE__*/ jsxs("div", {
                            className: "player-custom-controls",
                            children: [
                                hasReport && canDownloadReport ? /*#__PURE__*/ jsx(Tooltip, {
                                    title: reportActionLabel,
                                    children: /*#__PURE__*/ jsx("div", {
                                        className: "status-icon",
                                        onClick: ()=>{
                                            handleDownloadReport();
                                        },
                                        children: /*#__PURE__*/ jsx(DownloadOutlined, {})
                                    })
                                }) : null,
                                /*#__PURE__*/ jsx(Dropdown, {
                                    trigger: [
                                        'hover',
                                        'click'
                                    ],
                                    placement: "topRight",
                                    overlayStyle: {
                                        minWidth: '148px'
                                    },
                                    dropdownRender: ()=>/*#__PURE__*/ jsxs("div", {
                                            className: "player-settings-dropdown",
                                            children: [
                                                /*#__PURE__*/ jsxs("div", {
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
                                                        /*#__PURE__*/ jsx("span", {
                                                            style: {
                                                                width: 16,
                                                                height: 16,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            },
                                                            children: isExporting ? /*#__PURE__*/ jsx(Progress, {
                                                                type: "circle",
                                                                percent: exportProgress,
                                                                size: 16,
                                                                strokeWidth: 14,
                                                                showInfo: false,
                                                                strokeColor: "#1677ff",
                                                                trailColor: "rgba(0, 0, 0, 0.12)"
                                                            }) : /*#__PURE__*/ jsx(ExportOutlined, {
                                                                style: {
                                                                    width: '16px',
                                                                    height: '16px'
                                                                }
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx("span", {
                                                            className: "player-export-label",
                                                            children: isExporting ? `Exporting ${exportProgress}%` : 'Export video'
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsx("div", {
                                                    className: "player-settings-divider"
                                                }),
                                                /*#__PURE__*/ jsxs("div", {
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
                                                        /*#__PURE__*/ jsxs("div", {
                                                            style: {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ jsx(global_perspective, {
                                                                    style: {
                                                                        width: '16px',
                                                                        height: '16px'
                                                                    }
                                                                }),
                                                                /*#__PURE__*/ jsx("span", {
                                                                    style: {
                                                                        fontSize: '14px',
                                                                        marginRight: '16px'
                                                                    },
                                                                    children: "Focus on cursor"
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ jsx(Switch, {
                                                            size: "small",
                                                            checked: autoZoom,
                                                            onChange: (checked)=>setAutoZoom(checked)
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsxs("div", {
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
                                                        /*#__PURE__*/ jsxs("div", {
                                                            style: {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ jsx(FontSizeOutlined, {
                                                                    style: {
                                                                        width: '16px',
                                                                        height: '16px'
                                                                    }
                                                                }),
                                                                /*#__PURE__*/ jsx("span", {
                                                                    style: {
                                                                        fontSize: '14px',
                                                                        marginRight: '16px'
                                                                    },
                                                                    children: "Subtitle"
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ jsx(Switch, {
                                                            size: "small",
                                                            checked: subtitleEnabled,
                                                            onChange: (checked)=>setSubtitleEnabled(checked)
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsx("div", {
                                                    className: "player-settings-divider"
                                                }),
                                                /*#__PURE__*/ jsxs("div", {
                                                    style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        height: '32px',
                                                        padding: '0 8px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ jsx(ThunderboltOutlined, {
                                                            style: {
                                                                width: '16px',
                                                                height: '16px'
                                                            }
                                                        }),
                                                        /*#__PURE__*/ jsx("span", {
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
                                                ].map((speed)=>/*#__PURE__*/ jsxs("div", {
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
                                    children: /*#__PURE__*/ jsx("div", {
                                        className: "status-icon",
                                        children: /*#__PURE__*/ jsx(player_setting, {
                                            style: {
                                                width: '16px',
                                                height: '16px'
                                            }
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx("div", {
                                    className: "status-icon",
                                    onClick: toggleFullscreen,
                                    children: isFullscreen ? /*#__PURE__*/ jsx(CompressOutlined, {}) : /*#__PURE__*/ jsx(ExpandOutlined, {})
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
}
export { Player };
