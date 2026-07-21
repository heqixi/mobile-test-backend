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
function action_chevron_ownKeys(object, enumerableOnly) {
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
    else action_chevron_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const SvgActionChevron = (props)=>/*#__PURE__*/ jsx("svg", _object_spread_props(_object_spread({
        xmlns: "http://www.w3.org/2000/svg",
        width: 6,
        height: 10,
        fill: "none",
        viewBox: "0 0 6 10"
    }, props), {
        children: /*#__PURE__*/ jsx("path", {
            fill: "#000",
            fillOpacity: 0.25,
            fillRule: "evenodd",
            d: "M.195 9.138a.667.667 0 0 1 0-.943l3.529-3.528L.195 1.138a.667.667 0 0 1 .943-.943l4 4c.26.26.26.683 0 .943l-4 4a.667.667 0 0 1-.943 0",
            clipRule: "evenodd"
        })
    }));
const action_chevron = SvgActionChevron;
export { action_chevron as default };
