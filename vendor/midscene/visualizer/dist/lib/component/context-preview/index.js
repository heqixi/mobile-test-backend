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
    ContextPreview: ()=>ContextPreview
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const external_antd_namespaceObject = require("antd");
const index_js_namespaceObject = require("../blackboard/index.js");
var index_js_default = /*#__PURE__*/ __webpack_require__.n(index_js_namespaceObject);
const external_misc_index_js_namespaceObject = require("../misc/index.js");
const playground_demo_ui_context_json_namespaceObject = require("../playground/playground-demo-ui-context.json");
var playground_demo_ui_context_json_default = /*#__PURE__*/ __webpack_require__.n(playground_demo_ui_context_json_namespaceObject);
require("./index.css");
const ContextPreview = ({ uiContextPreview, setUiContextPreview, showContextPreview })=>{
    if (!showContextPreview) return null;
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
        className: "form-part context-panel",
        children: [
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("h3", {
                children: "UI Context"
            }),
            uiContextPreview ? /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(index_js_default(), {
                uiContext: uiContextPreview,
                hideController: true
            }) : /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
                children: [
                    (0, external_misc_index_js_namespaceObject.iconForStatus)('failed'),
                    " No UI context",
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Button, {
                        type: "link",
                        onClick: (e)=>{
                            e.preventDefault();
                            setUiContextPreview(playground_demo_ui_context_json_default());
                        },
                        children: "Load Demo"
                    }),
                    /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
                        children: "To load the UI context, you can either use the demo data above, or click the 'Send to Playground' in the report page."
                    })
                ]
            })
        ]
    });
};
exports.ContextPreview = __webpack_exports__.ContextPreview;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "ContextPreview"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
