import { create } from "zustand";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports, '__esModule', {
            value: true
        });
    };
})();
var external_zustand_namespaceObject = {};
__webpack_require__.r(external_zustand_namespaceObject);
__webpack_require__.d(external_zustand_namespaceObject, {
    create: ()=>create
});
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
const { create: history_create } = external_zustand_namespaceObject;
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
const useHistoryStore = history_create((set, get)=>({
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
export { useHistoryStore };
