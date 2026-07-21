import { useCallback, useEffect, useMemo, useRef, useState } from "react";
function useMinimalTypeGate(options) {
    const { enabled, form, selectedType, onAfterReset, defaultType = 'aiAct' } = options;
    const [hasExplicitSelection, setHasExplicitSelection] = useState(false);
    const skipNextRestoreRef = useRef(false);
    useEffect(()=>{
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
    const markExplicitSelection = useCallback(()=>{
        if (!enabled) return;
        setHasExplicitSelection(true);
    }, [
        enabled
    ]);
    const skipNextRestore = useCallback(()=>{
        skipNextRestoreRef.current = true;
    }, []);
    const shouldSkipRestoreOnce = useCallback(()=>{
        if (!skipNextRestoreRef.current) return false;
        skipNextRestoreRef.current = false;
        return true;
    }, []);
    return useMemo(()=>({
            markExplicitSelection,
            skipNextRestore,
            shouldSkipRestoreOnce
        }), [
        markExplicitSelection,
        skipNextRestore,
        shouldSkipRestoreOnce
    ]);
}
export { useMinimalTypeGate };
