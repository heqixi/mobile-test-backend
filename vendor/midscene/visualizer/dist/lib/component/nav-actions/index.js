"use strict";
var __webpack_require__ = {};
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
    NavActions: ()=>NavActions
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const icons_namespaceObject = require("@ant-design/icons");
const external_antd_namespaceObject = require("antd");
const index_js_namespaceObject = require("../env-config/index.js");
require("./style.css");
function NavActions({ showEnvConfig = true, showTooltipWhenEmpty = false, showModelName = false, githubUrl = 'https://github.com/web-infra-dev/midscene', helpUrl = 'https://midscenejs.com/quick-experience.html', className = '', playgroundSDK }) {
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
        className: `nav-actions ${className}`,
        children: [
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Typography.Link, {
                href: githubUrl,
                target: "_blank",
                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.GithubOutlined, {
                    className: "nav-icon"
                })
            }),
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(external_antd_namespaceObject.Typography.Link, {
                href: helpUrl,
                target: "_blank",
                children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.QuestionCircleOutlined, {
                    className: "nav-icon"
                })
            }),
            showEnvConfig && /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(index_js_namespaceObject.EnvConfig, {
                showTooltipWhenEmpty: showTooltipWhenEmpty,
                showModelName: showModelName,
                playgroundSDK: playgroundSDK
            })
        ]
    });
}
exports.NavActions = __webpack_exports__.NavActions;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "NavActions"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
