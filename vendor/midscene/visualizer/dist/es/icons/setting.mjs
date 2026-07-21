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
function setting_ownKeys(object, enumerableOnly) {
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
    else setting_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const SvgSetting = (props)=>/*#__PURE__*/ jsx("svg", _object_spread_props(_object_spread({
        xmlns: "http://www.w3.org/2000/svg",
        width: 27,
        height: 27,
        fill: "none",
        viewBox: "0 0 27 27"
    }, props), {
        children: /*#__PURE__*/ jsx("path", {
            stroke: "currentColor",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeOpacity: 0.85,
            strokeWidth: 1.333,
            d: "M19.527 8.855h-2M14.86 7.522v2.667M14.86 8.855H7.527M10.194 13.522H7.527M12.86 12.189v2.666M20.193 13.522H12.86M19.527 18.189h-2M14.86 16.855v2.667M14.86 18.189H7.527"
        })
    }));
const setting = SvgSetting;
export { setting as default };
