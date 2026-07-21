import { useCallback, useLayoutEffect, useRef, useState } from "react";
function isTextTruncated(element, mode) {
    if (!element) return false;
    if ('multi-line' === mode) return element.scrollHeight - element.clientHeight > 1;
    return element.scrollWidth > element.clientWidth;
}
function useTextTruncation(content, mode) {
    const ref = useRef(null);
    const [truncated, setTruncated] = useState(false);
    const update = useCallback(()=>{
        setTruncated(isTextTruncated(ref.current, mode));
    }, [
        mode
    ]);
    useLayoutEffect(()=>{
        update();
        window.addEventListener('resize', update);
        if ('undefined' == typeof ResizeObserver || !ref.current) return ()=>window.removeEventListener('resize', update);
        const observer = new ResizeObserver(update);
        observer.observe(ref.current);
        return ()=>{
            window.removeEventListener('resize', update);
            observer.disconnect();
        };
    }, [
        content,
        update
    ]);
    return {
        ref,
        truncated
    };
}
export { isTextTruncated, useTextTruncation };
