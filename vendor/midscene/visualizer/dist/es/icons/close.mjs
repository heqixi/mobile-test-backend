import { jsx } from "react/jsx-runtime";
import "react";
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
function close_ownKeys(object, enumerableOnly) {
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
    else close_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const SvgClose = (props)=>/*#__PURE__*/ jsx("svg", _object_spread_props(_object_spread({
        xmlns: "http://www.w3.org/2000/svg",
        width: 18,
        height: 16,
        fill: "none",
        viewBox: "0 0 18 16"
    }, props), {
        children: /*#__PURE__*/ jsx("path", {
            stroke: "#333",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 1.333,
            d: "m3.124 2.667 11.162 10.666M3.124 13.333 14.286 2.667"
        })
    }));
const icons_close = SvgClose;
export { icons_close as default };
