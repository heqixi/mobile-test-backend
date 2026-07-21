import { jsx, jsxs } from "react/jsx-runtime";
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
function prompt_history_ownKeys(object, enumerableOnly) {
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
    else prompt_history_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const SvgPromptHistory = (props)=>/*#__PURE__*/ jsxs("svg", _object_spread_props(_object_spread({
        xmlns: "http://www.w3.org/2000/svg",
        width: 16,
        height: 16,
        fill: "none",
        viewBox: "0 0 16 16"
    }, props), {
        children: [
            /*#__PURE__*/ jsx("path", {
                stroke: "#878787",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 1.33,
                d: "M1.505 4.164c-2.862 6.126 2.197 10.501 6.063 10.501a7 7 0 1 0-6.063-10.5"
            }),
            /*#__PURE__*/ jsx("path", {
                stroke: "#878787",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 1.33,
                d: "M7.57 3.465v4.203l2.967 2.968"
            })
        ]
    }));
const prompt_history = SvgPromptHistory;
export { prompt_history as default };
