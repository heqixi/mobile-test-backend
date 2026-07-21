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
    default: ()=>show_marker
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
function show_marker_ownKeys(object, enumerableOnly) {
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
    else show_marker_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const SvgShowMarker = (props)=>/*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("svg", _object_spread_props(_object_spread({
        xmlns: "http://www.w3.org/2000/svg",
        width: 16,
        height: 16,
        fill: "none",
        viewBox: "0 0 16 16"
    }, props), {
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("path", {
            fill: "currentColor",
            d: "M13 1.835a2.165 2.165 0 0 1 .665 4.225v3.88a2.166 2.166 0 1 1-2.725 2.725H5.06a2.165 2.165 0 1 1-2.725-2.726V6.06A2.165 2.165 0 1 1 5.06 3.336h5.88c.281-.87 1.097-1.5 2.06-1.5m-10 9.33a.835.835 0 1 0 0 1.67.835.835 0 0 0 0-1.67m10 0a.835.835 0 1 0 0 1.67.835.835 0 0 0 0-1.67m-7.94-6.5A2.17 2.17 0 0 1 3.665 6.06v3.88c.66.213 1.181.734 1.395 1.395h5.88a2.17 2.17 0 0 1 1.395-1.396V6.06a2.17 2.17 0 0 1-1.395-1.394zM3 3.165a.835.835 0 1 0 0 1.67.835.835 0 0 0 0-1.67m10 0a.835.835 0 1 0 0 1.67.835.835 0 0 0 0-1.67"
        })
    }));
const show_marker = SvgShowMarker;
exports["default"] = __webpack_exports__["default"];
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "default"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
