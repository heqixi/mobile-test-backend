import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import icons, { ArrowDownOutlined, ClearOutlined, LoadingOutlined, UpOutlined } from "@ant-design/icons";
import { Alert, Button, Form, List, Tooltip } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlaygroundExecution } from "../../hooks/usePlaygroundExecution.mjs";
import { usePlaygroundState } from "../../hooks/usePlaygroundState.mjs";
import { useTextTruncation } from "../../hooks/useTextTruncation.mjs";
import { useEnvConfig } from "../../store/store.mjs";
import { notifyError } from "../../utils/index.mjs";
import { ContextPreview } from "../context-preview/index.mjs";
import { EnvConfigReminder } from "../env-config-reminder/index.mjs";
import { PlaygroundResultView } from "../playground-result/index.mjs";
import "./index.css";
import avatar from "../../icons/avatar.mjs";
import { defaultMainButtons } from "../../utils/constants.mjs";
import { calculateEmptyStatePromptScrollTop } from "../../utils/empty-state-scroll.mjs";
import { defaultProgressErrorIcon, resolveProgressActionIcon } from "../../utils/progress-action-icon.mjs";
import { shouldOffsetEmptyStateForPromptInput } from "../../utils/prompt-input-utils.mjs";
import { PromptInput } from "../prompt-input/index.mjs";
import shiny_text from "../shiny-text/index.mjs";
import { shouldRenderCustomEmptyState } from "./empty-state.mjs";
import { preparePlaygroundExecution, shouldExecuteExternalRunRequest } from "./external-run.mjs";
import { getLastProgressItemIdsByGroup } from "./progress-groups.mjs";
import { createStorageProvider, detectBestStorageType } from "./providers/storage-provider.mjs";
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
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = null != arguments[i] ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if ("function" == typeof Object.getOwnPropertySymbols) ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
            return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
const handledExternalRunRequestIds = new Set();
const MAX_HANDLED_EXTERNAL_RUN_REQUEST_IDS = 100;
function getSDKId(sdk) {
    if (!sdk) return 'playground-default';
    if (sdk.id && 'string' == typeof sdk.id) return `agent-${sdk.id}`;
    return 'playground-default';
}
function ErrorMessage({ error }) {
    if (!error) return null;
    const cleanError = error.replace(/^(Error:\s*)+/, 'Error: ');
    return /*#__PURE__*/ jsx(Alert, {
        message: /*#__PURE__*/ jsx("span", {
            style: {
                color: '#ff4d4f'
            },
            children: cleanError
        }),
        type: "error",
        showIcon: true
    });
}
function ProgressRowContent({ action, content, description, error, shouldShowLoading }) {
    const { ref, truncated } = useTextTruncation(content, 'multi-line');
    const copy = /*#__PURE__*/ jsxs("div", {
        className: "progress-row-content",
        children: [
            /*#__PURE__*/ jsxs("div", {
                className: "progress-row-copy",
                ref: ref,
                children: [
                    action ? /*#__PURE__*/ jsx("span", {
                        className: "progress-action-item",
                        children: action
                    }) : null,
                    description ? /*#__PURE__*/ jsx("div", {
                        className: "progress-description-wrap",
                        children: shouldShowLoading ? /*#__PURE__*/ jsx(shiny_text, {
                            text: description,
                            className: "progress-description"
                        }) : /*#__PURE__*/ jsx("span", {
                            className: "progress-description",
                            children: description
                        })
                    }) : null
                ]
            }),
            error && /*#__PURE__*/ jsx(ErrorMessage, {
                error: error
            })
        ]
    });
    return truncated ? /*#__PURE__*/ jsx(Tooltip, {
        title: content,
        children: copy
    }) : copy;
}
function UniversalPlayground({ playgroundSDK, storage, contextProvider, config: componentConfig = {}, branding = {}, className = '', dryMode = false, showContextPreview = true }) {
    const [form] = Form.useForm();
    const { config } = useEnvConfig();
    const [sdkReady, setSdkReady] = useState(false);
    const lastExternalRunRequestIdRef = useRef(null);
    useEffect(()=>{
        const initializeSDK = ()=>_async_to_generator(function*() {
                if (playgroundSDK && 'function' == typeof playgroundSDK.checkStatus) try {
                    yield playgroundSDK.checkStatus();
                    setSdkReady(true);
                } catch (error) {
                    console.warn('Failed to initialize SDK, using default namespace:', error);
                    setSdkReady(true);
                }
                else setSdkReady(true);
            })();
        initializeSDK();
    }, [
        playgroundSDK
    ]);
    const configuredStorageNamespace = componentConfig.storageNamespace;
    const sdkStorageNamespace = configuredStorageNamespace ? void 0 : getSDKId(playgroundSDK);
    const effectiveStorage = useMemo(()=>{
        if (false === componentConfig.persistMessages) return null;
        if (storage) return storage;
        if (!sdkReady) return null;
        const namespace = configuredStorageNamespace || sdkStorageNamespace;
        const bestStorageType = detectBestStorageType();
        console.log(`Using ${bestStorageType} storage for namespace: ${namespace}`);
        return createStorageProvider(bestStorageType, namespace);
    }, [
        storage,
        sdkReady,
        configuredStorageNamespace,
        componentConfig.persistMessages,
        sdkStorageNamespace
    ]);
    const { loading, setLoading, infoList, setInfoList, actionSpace, actionSpaceLoading, uiContextPreview, setUiContextPreview, showScrollToBottomButton, verticalMode, replayCounter, setReplayCounter, messagesInitialized, infoListRef, currentRunningIdRef, interruptedFlagRef, clearInfoList, handleScrollToBottom } = usePlaygroundState(playgroundSDK, effectiveStorage, contextProvider, branding.targetName, false !== componentConfig.persistMessages && !componentConfig.storageNamespace);
    const { handleRun: executeAction, handleStop, cancelCurrentExecution, canStop } = usePlaygroundExecution({
        playgroundSDK,
        storage: effectiveStorage,
        actionSpace,
        loading,
        setLoading,
        setInfoList,
        replayCounter,
        setReplayCounter,
        verticalMode,
        currentRunningIdRef,
        interruptedFlagRef,
        deviceType: componentConfig.deviceType
    });
    const cancelCurrentExecutionRef = useRef(cancelCurrentExecution);
    const onExecutionStatusChangeRef = useRef(componentConfig.onExecutionStatusChange);
    const onBeforeExecutionStartRef = useRef(componentConfig.onBeforeExecutionStart);
    var _componentConfig_executionScopeKey;
    const executionScopeKey = null != (_componentConfig_executionScopeKey = componentConfig.executionScopeKey) ? _componentConfig_executionScopeKey : null;
    const previousExecutionScopeKeyRef = useRef(executionScopeKey);
    useEffect(()=>{
        cancelCurrentExecutionRef.current = cancelCurrentExecution;
    }, [
        cancelCurrentExecution
    ]);
    useEffect(()=>{
        onExecutionStatusChangeRef.current = componentConfig.onExecutionStatusChange;
    }, [
        componentConfig.onExecutionStatusChange
    ]);
    useEffect(()=>{
        onBeforeExecutionStartRef.current = componentConfig.onBeforeExecutionStart;
    }, [
        componentConfig.onBeforeExecutionStart
    ]);
    const prepareExecution = useCallback(()=>preparePlaygroundExecution({
            clearTimeline: clearInfoList,
            clearTimelineBeforeRun: componentConfig.clearTimelineBeforeRun,
            onBeforeExecutionStart: onBeforeExecutionStartRef.current
        }), [
        clearInfoList,
        componentConfig.clearTimelineBeforeRun
    ]);
    useEffect(()=>{
        var _componentConfig_onExecutionStatusChange;
        null == (_componentConfig_onExecutionStatusChange = componentConfig.onExecutionStatusChange) || _componentConfig_onExecutionStatusChange.call(componentConfig, {
            running: loading,
            stoppable: canStop,
            stop: handleStop
        });
    }, [
        canStop,
        componentConfig.onExecutionStatusChange,
        handleStop,
        loading
    ]);
    useEffect(()=>()=>{
            var _onExecutionStatusChangeRef_current;
            cancelCurrentExecutionRef.current();
            null == (_onExecutionStatusChangeRef_current = onExecutionStatusChangeRef.current) || _onExecutionStatusChangeRef_current.call(onExecutionStatusChangeRef, {
                running: false,
                stoppable: false,
                stop: ()=>void 0
            });
        }, []);
    useEffect(()=>{
        if (previousExecutionScopeKeyRef.current === executionScopeKey) return;
        previousExecutionScopeKeyRef.current = executionScopeKey;
        cancelCurrentExecution();
    }, [
        cancelCurrentExecution,
        executionScopeKey
    ]);
    useEffect(()=>{
        if ((null == playgroundSDK ? void 0 : playgroundSDK.overrideConfig) && config) playgroundSDK.overrideConfig(config).catch((error)=>{
            console.error('Failed to override SDK config:', error);
            if (!componentConfig.suppressConfigErrorToast) notifyError(error, {
                title: 'Failed to apply AI configuration'
            });
        });
    }, [
        playgroundSDK,
        config,
        componentConfig.suppressConfigErrorToast
    ]);
    const handleFormRun = useCallback(()=>_async_to_generator(function*() {
            try {
                const value = form.getFieldsValue();
                yield prepareExecution();
                yield executeAction(value);
            } catch (error) {
                notifyError(error, {
                    title: 'Execution failed'
                });
            }
        })(), [
        form,
        executeAction,
        prepareExecution
    ]);
    useEffect(()=>{
        const request = componentConfig.externalRunRequest;
        if (!request || !shouldExecuteExternalRunRequest({
            request,
            handledRequestIds: handledExternalRunRequestIds,
            lastRequestId: lastExternalRunRequestIdRef.current,
            sdkReady,
            messagesInitialized
        })) return;
        lastExternalRunRequestIdRef.current = request.id;
        handledExternalRunRequestIds.add(request.id);
        if (handledExternalRunRequestIds.size > MAX_HANDLED_EXTERNAL_RUN_REQUEST_IDS) {
            const oldestRequestId = handledExternalRunRequestIds.values().next().value;
            if (oldestRequestId) handledExternalRunRequestIds.delete(oldestRequestId);
        }
        (()=>_async_to_generator(function*() {
                yield prepareExecution();
                yield executeAction(request.value, _object_spread({
                    displayContent: request.displayContent
                }, request.reportDisplay ? {
                    reportDisplay: request.reportDisplay
                } : {}));
            })())().catch((error)=>{
            notifyError(error, {
                title: 'Execution failed'
            });
        });
    }, [
        componentConfig.externalRunRequest,
        executeAction,
        messagesInitialized,
        prepareExecution,
        sdkReady
    ]);
    const configAlreadySet = Object.keys(config || {}).length >= 1;
    const runButtonEnabled = componentConfig.serverMode || !dryMode && !actionSpaceLoading && configAlreadySet;
    const watchedType = Form.useWatch('type', form);
    const selectedType = watchedType || defaultMainButtons["0"];
    const serviceMode = useMemo(()=>{
        if (!playgroundSDK || 'function' != typeof playgroundSDK.getServiceMode) return 'Server';
        return playgroundSDK.getServiceMode();
    }, [
        playgroundSDK
    ]);
    const finalShowContextPreview = showContextPreview && false !== componentConfig.showContextPreview;
    const layout = componentConfig.layout || 'vertical';
    const showVersionInfo = false !== componentConfig.showVersionInfo;
    const deviceType = componentConfig.deviceType;
    var _componentConfig_executionFlow;
    const executionFlowConfig = null != (_componentConfig_executionFlow = componentConfig.executionFlow) ? _componentConfig_executionFlow : {};
    const collapsibleProgressGroup = true === executionFlowConfig.collapsible;
    var _executionFlowConfig_label;
    const progressGroupLabel = null != (_executionFlowConfig_label = executionFlowConfig.label) ? _executionFlowConfig_label : 'Execution Flow';
    const [collapsedProgressGroups, setCollapsedProgressGroups] = useState(()=>new Set());
    const toggleProgressGroup = useCallback((groupId)=>{
        setCollapsedProgressGroups((prev)=>{
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    }, []);
    const { firstInProgressGroup, visibleInfoList } = useMemo(()=>{
        const firstIds = new Set();
        const visible = [];
        let currentGroupFirstId = null;
        const hideWelcome = infoList.length > 1;
        for (const item of infoList)if (!hideWelcome || 'welcome' !== item.id) if ('progress' === item.type) {
            if (null === currentGroupFirstId) {
                currentGroupFirstId = item.id;
                firstIds.add(item.id);
                visible.push(item);
                continue;
            }
            if (!collapsibleProgressGroup || !collapsedProgressGroups.has(currentGroupFirstId)) visible.push(item);
        } else {
            currentGroupFirstId = null;
            visible.push(item);
        }
        return {
            firstInProgressGroup: firstIds,
            visibleInfoList: visible
        };
    }, [
        collapsedProgressGroups,
        collapsibleProgressGroup,
        infoList
    ]);
    const latestProgressId = useMemo(()=>{
        for(let i = infoList.length - 1; i >= 0; i--)if ('progress' === infoList[i].type) return infoList[i].id;
        return null;
    }, [
        infoList
    ]);
    const lastVisibleProgressIds = useMemo(()=>getLastProgressItemIdsByGroup(visibleInfoList), [
        visibleInfoList
    ]);
    const renderCustomEmptyState = shouldRenderCustomEmptyState(visibleInfoList, componentConfig.emptyState);
    const shouldOffsetEmptyStateForPrompt = useMemo(()=>renderCustomEmptyState && shouldOffsetEmptyStateForPromptInput(actionSpace, selectedType), [
        actionSpace,
        renderCustomEmptyState,
        selectedType
    ]);
    useEffect(()=>{
        if (!shouldOffsetEmptyStateForPrompt) return;
        const adjustEmptyStateScroll = ()=>{
            const container = infoListRef.current;
            if (!container) return;
            const wrapper = container.querySelector('.playground-empty-state-wrapper');
            const contentStart = null == wrapper ? void 0 : wrapper.querySelector('[data-playground-empty-state-content-start]');
            const contentEnd = null == wrapper ? void 0 : wrapper.querySelector('[data-playground-empty-state-content-end]');
            if (!(contentStart instanceof HTMLElement) || !(contentEnd instanceof HTMLElement)) return;
            const containerRect = container.getBoundingClientRect();
            const startRect = contentStart.getBoundingClientRect();
            const endRect = contentEnd.getBoundingClientRect();
            const top = calculateEmptyStatePromptScrollTop({
                currentScrollTop: container.scrollTop,
                maxScrollTop: Math.max(0, container.scrollHeight - container.clientHeight),
                containerTop: containerRect.top,
                containerBottom: containerRect.bottom,
                contentStartTop: startRect.top,
                contentEndBottom: endRect.bottom
            });
            container.scrollTo({
                top,
                behavior: 'auto'
            });
        };
        const animationFrameId = window.requestAnimationFrame(adjustEmptyStateScroll);
        const timeoutId = window.setTimeout(adjustEmptyStateScroll, 160);
        return ()=>{
            window.cancelAnimationFrame(animationFrameId);
            window.clearTimeout(timeoutId);
        };
    }, [
        infoListRef,
        selectedType,
        shouldOffsetEmptyStateForPrompt
    ]);
    const emptyStateWrapperClassName = [
        'playground-empty-state-wrapper',
        shouldOffsetEmptyStateForPrompt ? 'playground-empty-state-wrapper-offset-for-prompt' : ''
    ].filter(Boolean).join(' ');
    const showClearButton = false !== componentConfig.showClearButton;
    const handleClearInfoList = useCallback(()=>{
        cancelCurrentExecution().finally(()=>{
            clearInfoList();
        });
    }, [
        cancelCurrentExecution,
        clearInfoList
    ]);
    const timelineHeaderAction = showClearButton ? /*#__PURE__*/ jsx("div", {
        className: "clear-button-container",
        children: /*#__PURE__*/ jsx(Button, {
            size: "small",
            icon: /*#__PURE__*/ jsx(ClearOutlined, {}),
            onClick: handleClearInfoList,
            type: "text",
            className: "clear-button"
        })
    }) : null;
    var _componentConfig_timelineWrapper;
    const wrapTimeline = null != (_componentConfig_timelineWrapper = componentConfig.timelineWrapper) ? _componentConfig_timelineWrapper : (content, _state)=>content;
    const promptInputSection = componentConfig.hidePromptInput ? null : /*#__PURE__*/ jsxs("div", {
        className: "bottom-input-section",
        children: [
            componentConfig.showEnvConfigReminder ? /*#__PURE__*/ jsx(EnvConfigReminder, {}) : null,
            /*#__PURE__*/ jsx(PromptInput, {
                runButtonEnabled: runButtonEnabled,
                form: form,
                serviceMode: serviceMode,
                selectedType: selectedType,
                dryMode: dryMode,
                stoppable: canStop,
                loading: loading,
                onRun: handleFormRun,
                onStop: handleStop,
                actionSpace: actionSpace,
                chrome: componentConfig.promptInputChrome,
                deviceType: deviceType
            })
        ]
    });
    const renderPromptBeforeTimeline = 'before-timeline' === componentConfig.promptInputPlacement;
    return /*#__PURE__*/ jsx("div", {
        className: `playground-container ${layout}-mode ${className}`.trim(),
        children: /*#__PURE__*/ jsxs(Form, {
            form: form,
            onFinish: handleFormRun,
            className: "command-form",
            initialValues: {
                type: defaultMainButtons["0"]
            },
            children: [
                finalShowContextPreview && /*#__PURE__*/ jsx("div", {
                    className: "context-preview-section",
                    children: /*#__PURE__*/ jsx(ContextPreview, {
                        uiContextPreview: uiContextPreview,
                        setUiContextPreview: setUiContextPreview,
                        showContextPreview: finalShowContextPreview
                    })
                }),
                renderPromptBeforeTimeline ? promptInputSection : null,
                /*#__PURE__*/ jsx("div", {
                    className: "playground-timeline-region",
                    children: wrapTimeline(/*#__PURE__*/ jsxs("div", {
                        className: [
                            'middle-dialog-area',
                            renderCustomEmptyState ? 'middle-dialog-area-empty' : ''
                        ].filter(Boolean).join(' '),
                        children: [
                            componentConfig.timelineHeader,
                            /*#__PURE__*/ jsx("div", {
                                ref: infoListRef,
                                className: [
                                    'info-list-container',
                                    renderCustomEmptyState ? 'info-list-container-empty' : ''
                                ].filter(Boolean).join(' '),
                                children: renderCustomEmptyState ? /*#__PURE__*/ jsx("div", {
                                    className: emptyStateWrapperClassName,
                                    children: componentConfig.emptyState
                                }) : /*#__PURE__*/ jsx(List, {
                                    itemLayout: "vertical",
                                    dataSource: visibleInfoList,
                                    renderItem: (item)=>{
                                        const isFirstInProgressGroup = collapsibleProgressGroup && firstInProgressGroup.has(item.id);
                                        const isCollapsedHeader = isFirstInProgressGroup && collapsedProgressGroups.has(item.id);
                                        return /*#__PURE__*/ jsxs(List.Item, {
                                            className: "list-item",
                                            children: [
                                                isFirstInProgressGroup ? /*#__PURE__*/ jsxs("button", {
                                                    type: "button",
                                                    className: `progress-group-toggle ${collapsedProgressGroups.has(item.id) ? 'is-collapsed' : 'is-expanded'}`,
                                                    "aria-expanded": !collapsedProgressGroups.has(item.id),
                                                    onClick: ()=>toggleProgressGroup(item.id),
                                                    children: [
                                                        /*#__PURE__*/ jsx("span", {
                                                            className: "progress-group-toggle-label",
                                                            children: progressGroupLabel
                                                        }),
                                                        /*#__PURE__*/ jsx(UpOutlined, {
                                                            className: "progress-group-toggle-chevron"
                                                        })
                                                    ]
                                                }) : null,
                                                isCollapsedHeader ? null : 'user' === item.type ? /*#__PURE__*/ jsx("div", {
                                                    className: "user-message-container",
                                                    children: /*#__PURE__*/ jsx("div", {
                                                        className: "user-message-bubble",
                                                        children: item.content
                                                    })
                                                }) : 'progress' === item.type ? /*#__PURE__*/ jsx("div", {
                                                    children: (()=>{
                                                        var _parts_, _item_result, _item_result1;
                                                        const parts = item.content.split(' - ');
                                                        const action = null == (_parts_ = parts[0]) ? void 0 : _parts_.trim();
                                                        const description = parts.slice(1).join(' - ').trim();
                                                        const isLatestProgress = item.id === latestProgressId;
                                                        const isLastVisibleProgress = lastVisibleProgressIds.has(item.id);
                                                        const shouldShowLoading = loading && isLatestProgress;
                                                        const state = shouldShowLoading ? 'loading' : (null == (_item_result = item.result) ? void 0 : _item_result.error) ? 'error' : 'completed';
                                                        const domainIcon = 'completed' === state ? resolveProgressActionIcon(item.actionKind, executionFlowConfig.resolveActionIcon) : null;
                                                        return /*#__PURE__*/ jsxs("div", {
                                                            className: `progress-row ${isLastVisibleProgress ? 'progress-row-last' : ''}`,
                                                            children: [
                                                                action ? /*#__PURE__*/ jsx("span", {
                                                                    className: `progress-status-icon ${state}`,
                                                                    children: 'loading' === state ? /*#__PURE__*/ jsx(LoadingOutlined, {
                                                                        spin: true
                                                                    }) : 'error' === state ? defaultProgressErrorIcon() : null !== domainIcon ? domainIcon : '✓'
                                                                }) : null,
                                                                /*#__PURE__*/ jsx(ProgressRowContent, {
                                                                    action: action,
                                                                    content: item.content,
                                                                    description: description,
                                                                    error: null == (_item_result1 = item.result) ? void 0 : _item_result1.error,
                                                                    shouldShowLoading: shouldShowLoading
                                                                })
                                                            ]
                                                        });
                                                    })()
                                                }) : /*#__PURE__*/ jsxs("div", {
                                                    className: "system-message-container",
                                                    children: [
                                                        false !== componentConfig.showSystemMessageHeader && /*#__PURE__*/ jsxs("div", {
                                                            className: "system-message-header",
                                                            children: [
                                                                /*#__PURE__*/ jsx(icons, {
                                                                    component: branding.icon || avatar,
                                                                    style: {
                                                                        fontSize: 20
                                                                    }
                                                                }),
                                                                /*#__PURE__*/ jsx("span", {
                                                                    className: "system-message-title",
                                                                    children: branding.title || 'Playground'
                                                                })
                                                            ]
                                                        }),
                                                        (item.content || item.result) && /*#__PURE__*/ jsx("div", {
                                                            className: "system-message-content",
                                                            children: 'result' === item.type ? /*#__PURE__*/ jsx(PlaygroundResultView, {
                                                                result: item.result || null,
                                                                loading: item.loading || false,
                                                                serverValid: true,
                                                                serviceMode: serviceMode,
                                                                replayScriptsInfo: item.replayScriptsInfo || null,
                                                                replayCounter: item.replayCounter || 0,
                                                                loadingProgressText: item.loadingProgressText || '',
                                                                verticalMode: item.verticalMode || false,
                                                                fitMode: "width",
                                                                actionType: item.actionType,
                                                                onDownloadReport: componentConfig.onDownloadReport,
                                                                playerPresentation: "timeline"
                                                            }) : /*#__PURE__*/ jsxs(Fragment, {
                                                                children: [
                                                                    /*#__PURE__*/ jsx("div", {
                                                                        className: "system-message-text",
                                                                        children: item.content
                                                                    }),
                                                                    item.loading && item.loadingProgressText && /*#__PURE__*/ jsx("div", {
                                                                        className: "loading-progress-text",
                                                                        children: /*#__PURE__*/ jsx("span", {
                                                                            children: item.loadingProgressText
                                                                        })
                                                                    })
                                                                ]
                                                            })
                                                        })
                                                    ]
                                                })
                                            ]
                                        }, item.id);
                                    }
                                })
                            }),
                            showScrollToBottomButton && false !== componentConfig.enableScrollToBottom && /*#__PURE__*/ jsx(Button, {
                                className: "scroll-to-bottom-button",
                                type: "primary",
                                shape: "circle",
                                icon: /*#__PURE__*/ jsx(ArrowDownOutlined, {}),
                                onClick: handleScrollToBottom,
                                size: "large"
                            })
                        ]
                    }), {
                        empty: renderCustomEmptyState,
                        headerAction: timelineHeaderAction
                    })
                }),
                renderPromptBeforeTimeline ? null : promptInputSection,
                showVersionInfo && branding.version && /*#__PURE__*/ jsx("div", {
                    className: "version-info-section",
                    children: /*#__PURE__*/ jsxs("span", {
                        className: "version-text",
                        children: [
                            "Midscene.js version: ",
                            branding.version
                        ]
                    })
                })
            ]
        })
    });
}
const universal_playground = UniversalPlayground;
export { UniversalPlayground, universal_playground as default };
