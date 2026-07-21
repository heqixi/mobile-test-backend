import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Button, Input, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import icons_close from "../../icons/close.mjs";
import icons_history from "../../icons/history.mjs";
import magnifying_glass from "../../icons/magnifying-glass.mjs";
import { useHistoryStore } from "../../store/history.mjs";
import "./index.css";
const { Text } = Typography;
const HISTORY_MODAL_WIDTH = 320;
const HISTORY_MODAL_HEIGHT = 400;
const HISTORY_MODAL_GUTTER = 16;
const HISTORY_MODAL_OFFSET = 8;
const HistorySelector = ({ onSelect, history, currentType, trigger, popupPlacement = 'bottom', title = 'History', showClear = true, onClear, searchPlaceholder = 'Search', emptyText = 'No history record', noMatchText = 'No matching history record', renderItemActions, renderItemLabel, overlayClassName, popupWidth = HISTORY_MODAL_WIDTH, popupHeight = HISTORY_MODAL_HEIGHT, portalContainerSelector })=>{
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [scrollVersion, setScrollVersion] = useState(0);
    const clearHistory = useHistoryStore((state)=>state.clearHistory);
    const modalRef = useRef(null);
    const triggerRef = useRef(null);
    const [overlayPosition, setOverlayPosition] = useState(null);
    const [overlayTarget, setOverlayTarget] = useState(null);
    const [isOverlayInContainer, setIsOverlayInContainer] = useState(false);
    const groupedHistory = useMemo(()=>{
        const now = Date.now();
        const sevenDaysAgo = now - 604800000;
        const oneYearAgo = now - 31536000000;
        const filteredHistory = history.filter((item)=>item.prompt.toLowerCase().includes(searchText.toLowerCase()));
        const groups = {
            recent7Days: filteredHistory.filter((item)=>item.timestamp >= sevenDaysAgo),
            recent1Year: filteredHistory.filter((item)=>item.timestamp < sevenDaysAgo && item.timestamp >= oneYearAgo),
            older: filteredHistory.filter((item)=>item.timestamp < oneYearAgo)
        };
        return groups;
    }, [
        history,
        searchText
    ]);
    const handleHistoryClick = (item)=>{
        onSelect(item);
        setIsModalOpen(false);
    };
    const closeModal = ()=>{
        setIsModalOpen(false);
    };
    const handleClearHistory = ()=>{
        if (onClear) onClear();
        else clearHistory(currentType);
        setSearchText('');
        setIsModalOpen(false);
    };
    useEffect(()=>{
        if (!isModalOpen) return;
        const updateOverlayPosition = ()=>{
            if (!triggerRef.current) return;
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const portalContainer = portalContainerSelector ? triggerRef.current.closest(portalContainerSelector) : null;
            const boundaryRect = null == portalContainer ? void 0 : portalContainer.getBoundingClientRect();
            var _boundaryRect_width;
            const boundaryWidth = null != (_boundaryRect_width = null == boundaryRect ? void 0 : boundaryRect.width) ? _boundaryRect_width : window.innerWidth;
            var _boundaryRect_height;
            const boundaryHeight = null != (_boundaryRect_height = null == boundaryRect ? void 0 : boundaryRect.height) ? _boundaryRect_height : window.innerHeight;
            const triggerRight = boundaryRect ? triggerRect.right - boundaryRect.left : triggerRect.right;
            const triggerTop = boundaryRect ? triggerRect.top - boundaryRect.top : triggerRect.top;
            const triggerBottom = boundaryRect ? triggerRect.bottom - boundaryRect.top : triggerRect.bottom;
            const maxLeft = Math.max(HISTORY_MODAL_GUTTER, boundaryWidth - popupWidth - HISTORY_MODAL_GUTTER);
            const maxTop = Math.max(HISTORY_MODAL_GUTTER, boundaryHeight - popupHeight - HISTORY_MODAL_GUTTER);
            const left = Math.min(Math.max(HISTORY_MODAL_GUTTER, triggerRight - popupWidth), maxLeft);
            const preferredTop = 'top' === popupPlacement ? triggerTop - popupHeight - HISTORY_MODAL_OFFSET : triggerBottom + HISTORY_MODAL_OFFSET;
            const top = Math.min(Math.max(HISTORY_MODAL_GUTTER, preferredTop), maxTop);
            setOverlayPosition({
                left,
                top
            });
            setOverlayTarget(null != portalContainer ? portalContainer : document.body);
            setIsOverlayInContainer(Boolean(portalContainer));
        };
        const handleClickOutside = (event)=>{
            if (modalRef.current && !modalRef.current.contains(event.target) && triggerRef.current && !triggerRef.current.contains(event.target)) setIsModalOpen(false);
        };
        updateOverlayPosition();
        const timer = setTimeout(()=>{
            document.addEventListener('click', handleClickOutside);
        }, 100);
        window.addEventListener('resize', updateOverlayPosition);
        window.addEventListener('scroll', updateOverlayPosition, true);
        return ()=>{
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
            window.removeEventListener('resize', updateOverlayPosition);
            window.removeEventListener('scroll', updateOverlayPosition, true);
        };
    }, [
        isModalOpen,
        popupHeight,
        popupPlacement,
        popupWidth,
        portalContainerSelector
    ]);
    const renderHistoryGroup = (title, items)=>{
        if (0 === items.length) return null;
        return /*#__PURE__*/ jsxs("div", {
            className: "history-group",
            children: [
                /*#__PURE__*/ jsx("div", {
                    className: "history-group-title",
                    children: title
                }),
                items.map((item, index)=>/*#__PURE__*/ jsxs("div", {
                        className: "history-item",
                        onClick: ()=>handleHistoryClick(item),
                        children: [
                            /*#__PURE__*/ jsx("span", {
                                className: "history-item-label",
                                children: renderItemLabel ? renderItemLabel(item, {
                                    close: closeModal
                                }) : item.prompt
                            }),
                            renderItemActions ? /*#__PURE__*/ jsx("span", {
                                className: "history-item-actions",
                                onClick: (event)=>event.stopPropagation(),
                                children: renderItemActions(item, {
                                    close: closeModal,
                                    scrollVersion
                                })
                            }) : null
                        ]
                    }, `${item.timestamp}-${index}`))
            ]
        }, title);
    };
    return /*#__PURE__*/ jsxs("div", {
        className: "history-selector-wrapper",
        children: [
            /*#__PURE__*/ jsx("div", {
                className: "selector-trigger",
                onClick: ()=>setIsModalOpen((current)=>!current),
                ref: triggerRef,
                children: null != trigger ? trigger : /*#__PURE__*/ jsx(icons_history, {
                    width: 24,
                    height: 24
                })
            }),
            isModalOpen && overlayPosition && overlayTarget && /*#__PURE__*/ createPortal(/*#__PURE__*/ jsx("div", {
                className: overlayClassName ? `history-modal-overlay ${overlayClassName}${isOverlayInContainer ? ' history-modal-overlay-in-container' : ''}` : `history-modal-overlay${isOverlayInContainer ? ' history-modal-overlay-in-container' : ''}`,
                ref: modalRef,
                style: overlayPosition,
                children: /*#__PURE__*/ jsxs("div", {
                    className: "history-modal-container",
                    children: [
                        /*#__PURE__*/ jsxs("div", {
                            className: "history-modal-header",
                            children: [
                                /*#__PURE__*/ jsxs(Text, {
                                    strong: true,
                                    style: {
                                        fontSize: '16px'
                                    },
                                    children: [
                                        title,
                                        " (",
                                        history.length,
                                        ")"
                                    ]
                                }),
                                /*#__PURE__*/ jsx(Button, {
                                    size: "small",
                                    type: "text",
                                    icon: /*#__PURE__*/ jsx(icons_close, {
                                        width: 16,
                                        height: 16
                                    }),
                                    onClick: ()=>setIsModalOpen(false),
                                    className: "close-button"
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx("div", {
                            className: "history-search-section",
                            children: /*#__PURE__*/ jsxs("div", {
                                className: "search-input-wrapper",
                                children: [
                                    /*#__PURE__*/ jsx(Input, {
                                        placeholder: searchPlaceholder,
                                        value: searchText,
                                        onChange: (e)=>setSearchText(e.target.value),
                                        prefix: /*#__PURE__*/ jsx(magnifying_glass, {
                                            width: 18,
                                            height: 18
                                        }),
                                        className: "search-input",
                                        allowClear: true
                                    }),
                                    showClear ? /*#__PURE__*/ jsx(Button, {
                                        type: "link",
                                        onClick: handleClearHistory,
                                        className: "clear-button",
                                        disabled: 0 === history.length,
                                        children: "Clear"
                                    }) : null
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsx("div", {
                            className: "history-content",
                            onScroll: ()=>{
                                setScrollVersion((current)=>current + 1);
                            },
                            children: 0 === history.length ? /*#__PURE__*/ jsx("div", {
                                className: "no-results",
                                children: /*#__PURE__*/ jsx(Text, {
                                    type: "secondary",
                                    children: emptyText
                                })
                            }) : /*#__PURE__*/ jsxs(Fragment, {
                                children: [
                                    renderHistoryGroup('Last 7 days', groupedHistory.recent7Days),
                                    renderHistoryGroup('Last 1 year', groupedHistory.recent1Year),
                                    renderHistoryGroup('Earlier', groupedHistory.older),
                                    searchText && 0 === groupedHistory.recent7Days.length && 0 === groupedHistory.recent1Year.length && 0 === groupedHistory.older.length && /*#__PURE__*/ jsx("div", {
                                        className: "no-results",
                                        children: /*#__PURE__*/ jsx(Text, {
                                            type: "secondary",
                                            children: noMatchText
                                        })
                                    })
                                ]
                            })
                        })
                    ]
                })
            }), overlayTarget)
        ]
    });
};
export { HistorySelector };
