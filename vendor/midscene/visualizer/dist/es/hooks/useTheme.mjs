import { useEffect, useState } from "react";
function useTheme() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(()=>{
        const checkTheme = ()=>{
            var _document_querySelector;
            const theme = null == (_document_querySelector = document.querySelector('[data-theme]')) ? void 0 : _document_querySelector.getAttribute('data-theme');
            setIsDarkMode('dark' === theme);
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        const target = document.querySelector('[data-theme]') || document.documentElement;
        observer.observe(target, {
            attributes: true,
            attributeFilter: [
                'data-theme'
            ]
        });
        return ()=>observer.disconnect();
    }, []);
    return {
        isDarkMode
    };
}
export { useTheme };
