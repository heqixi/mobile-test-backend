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
    useMinimalTypeGate: ()=>useMinimalTypeGate
});
const external_react_namespaceObject = require("react");
function useMinimalTypeGate(options) {
    const { enabled, form, selectedType, onAfterReset, defaultType = 'aiAct' } = options;
    const [hasExplicitSelection, setHasExplicitSelection] = (0, external_react_namespaceObject.useState)(false);
    const skipNextRestoreRef = (0, external_react_namespaceObject.useRef)(false);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (!enabled || hasExplicitSelection || !selectedType || selectedType === defaultType) return;
        skipNextRestoreRef.current = false;
        form.setFieldsValue({
            type: defaultType,
            prompt: '',
            params: {}
        });
        null == onAfterReset || onAfterReset();
    }, [
        enabled,
        hasExplicitSelection,
        selectedType,
        defaultType,
        form,
        onAfterReset
    ]);
    const markExplicitSelection = (0, external_react_namespaceObject.useCallback)(()=>{
        if (!enabled) return;
        setHasExplicitSelection(true);
    }, [
        enabled
    ]);
    const skipNextRestore = (0, external_react_namespaceObject.useCallback)(()=>{
        skipNextRestoreRef.current = true;
    }, []);
    const shouldSkipRestoreOnce = (0, external_react_namespaceObject.useCallback)(()=>{
        if (!skipNextRestoreRef.current) return false;
        skipNextRestoreRef.current = false;
        return true;
    }, []);
    return (0, external_react_namespaceObject.useMemo)(()=>({
            markExplicitSelection,
            skipNextRestore,
            shouldSkipRestoreOnce
        }), [
        markExplicitSelection,
        skipNextRestore,
        shouldSkipRestoreOnce
    ]);
}
exports.useMinimalTypeGate = __webpack_exports__.useMinimalTypeGate;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "useMinimalTypeGate"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
