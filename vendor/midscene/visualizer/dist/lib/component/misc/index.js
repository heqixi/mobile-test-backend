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
    timeCostStrElement: ()=>timeCostStrElement,
    errorMessageServerNotReady: ()=>errorMessageServerNotReady,
    iconForStatus: ()=>iconForStatus,
    emptyResultTip: ()=>emptyResultTip,
    serverLaunchTip: ()=>serverLaunchTip
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const icons_namespaceObject = require("@ant-design/icons");
const external_antd_namespaceObject = require("antd");
const index_js_namespaceObject = require("../shiny-text/index.js");
var index_js_default = /*#__PURE__*/ __webpack_require__.n(index_js_namespaceObject);
function timeCostStrElement(timeCost) {
    let str;
    str = 'number' != typeof timeCost ? '-' : `${(timeCost / 1000).toFixed(2)}s`;
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
        style: {
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: 'tnum'
        },
        children: str
    });
}
const iconForStatus = (status)=>{
    switch(status){
        case 'finished':
        case 'passed':
        case 'success':
        case 'connected':
            return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                style: {
                    color: '#00AD4B'
                },
                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.CheckOutlined, {})
            });
        case 'finishedWithWarning':
            return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                style: {
                    color: '#f7bb05'
                },
                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.WarningOutlined, {})
            });
        case 'failed':
        case 'closed':
        case 'timedOut':
        case 'interrupted':
            return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                style: {
                    color: '#FF0A0A'
                },
                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.CloseOutlined, {})
            });
        case 'pending':
            return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.ClockCircleOutlined, {});
        case 'cancelled':
        case 'skipped':
            return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                style: {
                    color: '#8c8c8c'
                },
                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.LogoutOutlined, {})
            });
        case 'running':
            return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.ArrowRightOutlined, {});
        default:
            return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.MinusOutlined, {});
    }
};
const errorMessageServerNotReady = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("span", {
    children: [
        "Don't worry, just one more step to launch the playground server.",
        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("br", {}),
        "Please run one of the commands under the midscene project directory:",
        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("br", {}),
        "a. ",
        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("strong", {
            children: "npx midscene-playground"
        }),
        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("br", {}),
        "b. ",
        /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("strong", {
            children: "npx --yes @midscene/web"
        })
    ]
});
const serverLaunchTip = (notReadyMessage = errorMessageServerNotReady)=>/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: "server-tip",
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Alert, {
            message: "Playground Server Not Ready",
            description: notReadyMessage,
            type: "warning"
        })
    });
const emptyResultTip = /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
    className: "result-empty-tip",
    style: {
        textAlign: 'center'
    },
    children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(index_js_default(), {
        disabled: true,
        text: "The result will be shown here"
    })
});
exports.emptyResultTip = __webpack_exports__.emptyResultTip;
exports.errorMessageServerNotReady = __webpack_exports__.errorMessageServerNotReady;
exports.iconForStatus = __webpack_exports__.iconForStatus;
exports.serverLaunchTip = __webpack_exports__.serverLaunchTip;
exports.timeCostStrElement = __webpack_exports__.timeCostStrElement;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "emptyResultTip",
    "errorMessageServerNotReady",
    "iconForStatus",
    "serverLaunchTip",
    "timeCostStrElement"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
