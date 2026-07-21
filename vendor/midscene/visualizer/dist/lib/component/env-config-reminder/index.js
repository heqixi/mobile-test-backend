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
    EnvConfigReminder: ()=>EnvConfigReminder
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const icons_namespaceObject = require("@ant-design/icons");
const store_js_namespaceObject = require("../../store/store.js");
const index_js_namespaceObject = require("../env-config/index.js");
require("./index.css");
const EnvConfigReminder = ({ className = '' })=>{
    const { config } = (0, store_js_namespaceObject.useEnvConfig)();
    const configAlreadySet = Object.keys(config || {}).length >= 1;
    if (configAlreadySet) return null;
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("div", {
        className: `env-config-reminder ${className}`,
        children: [
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(icons_namespaceObject.ExclamationCircleFilled, {
                className: "reminder-icon"
            }),
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("span", {
                className: "reminder-text",
                children: "Please set up your environment variables before using."
            }),
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)(index_js_namespaceObject.EnvConfig, {
                mode: "text",
                showTooltipWhenEmpty: false
            })
        ]
    });
};
exports.EnvConfigReminder = __webpack_exports__.EnvConfigReminder;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "EnvConfigReminder"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
