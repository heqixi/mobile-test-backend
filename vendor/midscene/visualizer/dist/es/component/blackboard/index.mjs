"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import react from "react";
import { getCenterHighlightBox } from "../../utils/highlight-element.mjs";
import { normalizeBlackboardHighlights } from "./highlights.mjs";
import "./index.css";
const Blackboard = (props)=>{
    var _props_uiContext;
    const highlightElements = props.highlightElements || [];
    const highlightRect = props.highlightRect;
    const shotSize = null == (_props_uiContext = props.uiContext) ? void 0 : _props_uiContext.shotSize;
    if (!shotSize) return /*#__PURE__*/ jsx("div", {
        className: "blackboard",
        children: /*#__PURE__*/ jsx("div", {
            className: "blackboard-main-content",
            style: {
                padding: '20px'
            },
            children: "No UI context available"
        })
    });
    const context = props.uiContext;
    const screenWidth = shotSize.width;
    const screenHeight = shotSize.height;
    const highlightOverlays = react.useMemo(()=>normalizeBlackboardHighlights(highlightElements), [
        highlightElements
    ]);
    const screenshotBase64 = react.useMemo(()=>{
        var _context_screenshot;
        return (null == context ? void 0 : null == (_context_screenshot = context.screenshot) ? void 0 : _context_screenshot.base64) || '';
    }, [
        context
    ]);
    const highlightBoxes = highlightOverlays.map((highlight)=>getCenterHighlightBox(highlight));
    let bottomTipA = null;
    if (1 === highlightBoxes.length) bottomTipA = /*#__PURE__*/ jsx("div", {
        className: "bottom-tip",
        children: /*#__PURE__*/ jsxs("div", {
            className: "bottom-tip-item",
            children: [
                "Element: ",
                JSON.stringify(highlightBoxes[0])
            ]
        })
    });
    else if (highlightBoxes.length > 1) bottomTipA = /*#__PURE__*/ jsx("div", {
        className: "bottom-tip",
        children: /*#__PURE__*/ jsxs("div", {
            className: "bottom-tip-item",
            children: [
                "Element: ",
                JSON.stringify(highlightBoxes)
            ]
        })
    });
    return /*#__PURE__*/ jsxs("div", {
        className: "blackboard",
        children: [
            /*#__PURE__*/ jsxs("div", {
                className: "blackboard-main-content",
                style: {
                    width: 'fit-content',
                    maxWidth: '100%',
                    position: 'relative'
                },
                children: [
                    screenshotBase64 && /*#__PURE__*/ jsx("img", {
                        src: screenshotBase64,
                        alt: "screenshot",
                        className: "blackboard-screenshot",
                        draggable: false
                    }),
                    /*#__PURE__*/ jsxs("div", {
                        className: "blackboard-overlay",
                        style: {
                            aspectRatio: `${screenWidth}/${screenHeight}`,
                            '--ui-scale': Math.max(1, Math.sqrt(screenWidth / 1920))
                        },
                        children: [
                            highlightRect && /*#__PURE__*/ jsx("div", {
                                className: "blackboard-rect blackboard-rect-search",
                                style: {
                                    left: `${highlightRect.left / screenWidth * 100}%`,
                                    top: `${highlightRect.top / screenHeight * 100}%`,
                                    width: `${highlightRect.width / screenWidth * 100}%`,
                                    height: `${highlightRect.height / screenHeight * 100}%`
                                },
                                children: /*#__PURE__*/ jsx("span", {
                                    className: "blackboard-rect-label",
                                    children: "Search Area"
                                })
                            }),
                            highlightOverlays.map((el)=>{
                                const highlightBox = getCenterHighlightBox(el);
                                return /*#__PURE__*/ jsx("div", {
                                    className: "blackboard-rect blackboard-rect-highlight",
                                    style: {
                                        left: `${highlightBox.left / screenWidth * 100}%`,
                                        top: `${highlightBox.top / screenHeight * 100}%`,
                                        width: `${highlightBox.width / screenWidth * 100}%`,
                                        height: `${highlightBox.height / screenHeight * 100}%`
                                    }
                                }, `${el.key}-rect`);
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsx("div", {
                className: "bottom-tip",
                style: {
                    display: props.hideController ? 'none' : 'block'
                },
                children: bottomTipA
            })
        ]
    });
};
const blackboard = Blackboard;
export { Blackboard, blackboard as default };
