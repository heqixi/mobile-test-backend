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
function highlight_element_ownKeys(object, enumerableOnly) {
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
    else highlight_element_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const REPORT_HIGHLIGHT_EDGE_SIZE = 8;
const getCenterHighlightBox = (element)=>{
    const centerX = Math.round(element.center[0]);
    const centerY = Math.round(element.center[1]);
    const offset = Math.ceil(REPORT_HIGHLIGHT_EDGE_SIZE / 2) - 1;
    return {
        left: Math.max(centerX - offset, 0),
        top: Math.max(centerY - offset, 0),
        width: REPORT_HIGHLIGHT_EDGE_SIZE,
        height: REPORT_HIGHLIGHT_EDGE_SIZE
    };
};
const normalizeHighlightElementForReport = (element)=>_object_spread_props(_object_spread({}, element), {
        center: [
            Math.round(element.center[0]),
            Math.round(element.center[1])
        ],
        rect: getCenterHighlightBox(element)
    });
export { getCenterHighlightBox, normalizeHighlightElementForReport };
