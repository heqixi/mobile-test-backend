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
    useHistoryStore: ()=>useHistoryStore
});
const external_zustand_namespaceObject = require("zustand");
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
function history_ownKeys(object, enumerableOnly) {
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
    else history_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const { create } = external_zustand_namespaceObject;
const HISTORY_KEY = 'midscene-prompt-history-v2';
const LAST_SELECTED_TYPE_KEY = 'midscene-last-selected-type';
const getHistoryFromLocalStorage = ()=>{
    const historyString = localStorage.getItem(HISTORY_KEY);
    return historyString ? JSON.parse(historyString) : {};
};
const getLastSelectedType = ()=>localStorage.getItem(LAST_SELECTED_TYPE_KEY) || 'aiAct';
const setLastSelectedType = (type)=>{
    localStorage.setItem(LAST_SELECTED_TYPE_KEY, type);
};
const useHistoryStore = create((set, get)=>({
        history: getHistoryFromLocalStorage(),
        lastSelectedType: getLastSelectedType(),
        clearHistory: (type)=>{
            const newHistory = _object_spread({}, get().history);
            delete newHistory[type];
            set({
                history: newHistory
            });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        },
        addHistory: (historyItem)=>{
            const { type } = historyItem;
            const currentHistory = get().history;
            const typeHistory = currentHistory[type] || [];
            const stringifiedNewItem = JSON.stringify({
                prompt: historyItem.prompt,
                params: historyItem.params
            });
            const newTypeHistory = [
                historyItem,
                ...typeHistory.filter((h)=>{
                    const stringifiedOldItem = JSON.stringify({
                        prompt: h.prompt,
                        params: h.params
                    });
                    return stringifiedOldItem !== stringifiedNewItem;
                })
            ];
            if (newTypeHistory.length > 10) newTypeHistory.length = 10;
            const newHistory = _object_spread_props(_object_spread({}, currentHistory), {
                [type]: newTypeHistory
            });
            set({
                history: newHistory
            });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        },
        getHistoryForType: (type)=>get().history[type] || [],
        setLastSelectedType: (type)=>{
            set({
                lastSelectedType: type
            });
            setLastSelectedType(type);
        }
    }));
exports.useHistoryStore = __webpack_exports__.useHistoryStore;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "useHistoryStore"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
