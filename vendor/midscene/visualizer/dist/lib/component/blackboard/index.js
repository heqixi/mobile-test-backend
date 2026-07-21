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
    Blackboard: ()=>Blackboard,
    default: ()=>blackboard
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const external_react_namespaceObject = require("react");
var external_react_default = /*#__PURE__*/ __webpack_require__.n(external_react_namespaceObject);
const highlight_element_js_namespaceObject = require("../../utils/highlight-element.js");
const external_highlights_js_namespaceObject = require("./highlights.js");
require("./index.css");
const Blackboard = (props)=>{
    var _props_uiContext;
    const highlightElements = props.highlightElements || [];
    const highlightRect = props.highlightRect;
    const shotSize = null == (_props_uiContext = props.uiContext) ? void 0 : _props_uiContext.shotSize;
    if (!shotSize) return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: "blackboard",
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
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
    const highlightOverlays = external_react_default().useMemo(()=>(0, external_highlights_js_namespaceObject.normalizeBlackboardHighlights)(highlightElements), [
        highlightElements
    ]);
    const screenshotBase64 = external_react_default().useMemo(()=>{
        var _context_screenshot;
        return (null == context ? void 0 : null == (_context_screenshot = context.screenshot) ? void 0 : _context_screenshot.base64) || '';
    }, [
        context
    ]);
    const highlightBoxes = highlightOverlays.map((highlight)=>(0, highlight_element_js_namespaceObject.getCenterHighlightBox)(highlight));
    let bottomTipA = null;
    if (1 === highlightBoxes.length) bottomTipA = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: "bottom-tip",
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
            className: "bottom-tip-item",
            children: [
                "Element: ",
                JSON.stringify(highlightBoxes[0])
            ]
        })
    });
    else if (highlightBoxes.length > 1) bottomTipA = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: "bottom-tip",
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
            className: "bottom-tip-item",
            children: [
                "Element: ",
                JSON.stringify(highlightBoxes)
            ]
        })
    });
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
        className: "blackboard",
        children: [
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                className: "blackboard-main-content",
                style: {
                    width: 'fit-content',
                    maxWidth: '100%',
                    position: 'relative'
                },
                children: [
                    screenshotBase64 && /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("img", {
                        src: screenshotBase64,
                        alt: "screenshot",
                        className: "blackboard-screenshot",
                        draggable: false
                    }),
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                        className: "blackboard-overlay",
                        style: {
                            aspectRatio: `${screenWidth}/${screenHeight}`,
                            '--ui-scale': Math.max(1, Math.sqrt(screenWidth / 1920))
                        },
                        children: [
                            highlightRect && /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                                className: "blackboard-rect blackboard-rect-search",
                                style: {
                                    left: `${highlightRect.left / screenWidth * 100}%`,
                                    top: `${highlightRect.top / screenHeight * 100}%`,
                                    width: `${highlightRect.width / screenWidth * 100}%`,
                                    height: `${highlightRect.height / screenHeight * 100}%`
                                },
                                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                                    className: "blackboard-rect-label",
                                    children: "Search Area"
                                })
                            }),
                            highlightOverlays.map((el)=>{
                                const highlightBox = (0, highlight_element_js_namespaceObject.getCenterHighlightBox)(el);
                                return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
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
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
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
exports.Blackboard = __webpack_exports__.Blackboard;
exports["default"] = __webpack_exports__["default"];
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "Blackboard",
    "default"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
