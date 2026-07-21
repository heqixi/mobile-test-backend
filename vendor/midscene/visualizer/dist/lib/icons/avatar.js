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
    default: ()=>avatar
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
require("react");
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
function avatar_ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) symbols = symbols.filter(function(sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = null != source ? source : {};
    if (Object.getOwnPropertyDescriptors) Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    else avatar_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const SvgAvatar = (props)=>/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsxs)("svg", _object_spread_props(_object_spread({
        xmlns: "http://www.w3.org/2000/svg",
        width: 20,
        height: 20,
        fill: "none",
        "aria-label": "Playground",
        viewBox: "0 0 20 20"
    }, props), {
        children: [
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("rect", {
                width: 20,
                height: 20,
                fill: "#2B83FF",
                rx: 10
            }),
            /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("path", {
                fill: "#2B83FF",
                stroke: "#fff",
                strokeLinejoin: "round",
                strokeWidth: 1.125,
                d: "M6.866 5.882a.56.56 0 0 1 .667-.078l3.248 1.875 3.247 1.875a.563.563 0 0 1 0 .974l-3.247 1.875-3.248 1.875a.563.563 0 0 1-.784-.74l1.749-3.497-1.75-3.498a.56.56 0 0 1 .118-.661Z"
            })
        ]
    }));
const avatar = SvgAvatar;
exports["default"] = __webpack_exports__["default"];
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "default"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
