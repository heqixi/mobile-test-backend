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
const { create: store_create } = external_zustand_namespaceObject;
const AUTO_ZOOM_KEY = 'midscene-auto-zoom';
const BACKGROUND_VISIBLE_KEY = 'midscene-background-visible';
const ELEMENTS_VISIBLE_KEY = 'midscene-elements-visible';
const MODEL_CALL_DETAILS_KEY = 'midscene-model-call-details';
const DARK_MODE_KEY = 'midscene-dark-mode';
const PLAYBACK_SPEED_KEY = 'midscene-playback-speed';
const SUBTITLE_ENABLED_KEY = 'midscene-subtitle-enabled';
const parseBooleanParam = (value)=>{
    if (null === value) return;
    const normalized = value.trim().toLowerCase();
    if ([
        '1',
        'true',
        'yes',
        'on'
    ].includes(normalized)) return true;
    if ([
        '0',
        'false',
        'no',
        'off'
    ].includes(normalized)) return false;
};
const getQueryPreference = (paramName)=>{
    if ('undefined' == typeof window) return;
    const searchParams = new URLSearchParams(window.location.search);
    return parseBooleanParam(searchParams.get(paramName));
};
const useGlobalPreference = store_create((set)=>{
    const savedAutoZoom = 'false' !== localStorage.getItem(AUTO_ZOOM_KEY);
    const savedBackgroundVisible = 'false' !== localStorage.getItem(BACKGROUND_VISIBLE_KEY);
    const savedElementsVisible = 'false' !== localStorage.getItem(ELEMENTS_VISIBLE_KEY);
    const savedModelCallDetails = 'true' === localStorage.getItem(MODEL_CALL_DETAILS_KEY);
    const savedDarkMode = 'true' === localStorage.getItem(DARK_MODE_KEY);
    const parsedPlaybackSpeed = Number.parseFloat(localStorage.getItem(PLAYBACK_SPEED_KEY) || '1');
    const savedPlaybackSpeed = Number.isNaN(parsedPlaybackSpeed) ? 1 : parsedPlaybackSpeed;
    const savedSubtitleEnabled = 'false' !== localStorage.getItem(SUBTITLE_ENABLED_KEY);
    const autoZoomFromQuery = getQueryPreference('focusOnCursor');
    const elementsVisibleFromQuery = getQueryPreference('showElementMarkers');
    const darkModeFromQuery = getQueryPreference('darkMode');
    const initialDarkMode = void 0 === darkModeFromQuery ? savedDarkMode : darkModeFromQuery;
    if (void 0 !== darkModeFromQuery) localStorage.setItem(DARK_MODE_KEY, initialDarkMode.toString());
    return {
        backgroundVisible: savedBackgroundVisible,
        elementsVisible: void 0 === elementsVisibleFromQuery ? savedElementsVisible : elementsVisibleFromQuery,
        autoZoom: void 0 === autoZoomFromQuery ? savedAutoZoom : autoZoomFromQuery,
        modelCallDetailsEnabled: savedModelCallDetails,
        darkModeEnabled: initialDarkMode,
        playbackSpeed: [
            0.5,
            1,
            1.5,
            2
        ].includes(savedPlaybackSpeed) ? savedPlaybackSpeed : 1,
        setBackgroundVisible: (visible)=>{
            set({
                backgroundVisible: visible
            });
            localStorage.setItem(BACKGROUND_VISIBLE_KEY, visible.toString());
        },
        setElementsVisible: (visible)=>{
            set({
                elementsVisible: visible
            });
            localStorage.setItem(ELEMENTS_VISIBLE_KEY, visible.toString());
        },
        setAutoZoom: (enabled)=>{
            set({
                autoZoom: enabled
            });
            localStorage.setItem(AUTO_ZOOM_KEY, enabled.toString());
        },
        setModelCallDetailsEnabled: (enabled)=>{
            set({
                modelCallDetailsEnabled: enabled
            });
            localStorage.setItem(MODEL_CALL_DETAILS_KEY, enabled.toString());
        },
        setDarkModeEnabled: (enabled)=>{
            set({
                darkModeEnabled: enabled
            });
            localStorage.setItem(DARK_MODE_KEY, enabled.toString());
        },
        setPlaybackSpeed: (speed)=>{
            set({
                playbackSpeed: speed
            });
            localStorage.setItem(PLAYBACK_SPEED_KEY, speed.toString());
        },
        subtitleEnabled: savedSubtitleEnabled,
        setSubtitleEnabled: (enabled)=>{
            set({
                subtitleEnabled: enabled
            });
            localStorage.setItem(SUBTITLE_ENABLED_KEY, enabled.toString());
        }
    };
});
const CONFIG_KEY = 'midscene-env-config';
const SERVICE_MODE_KEY = 'midscene-service-mode';
const TRACKING_ACTIVE_TAB_KEY = 'midscene-tracking-active-tab';
const DEEP_LOCATE_KEY = 'midscene-deep-locate';
const DEEP_THINK_KEY = 'midscene-deep-think';
const SCREENSHOT_INCLUDED_KEY = 'midscene-screenshot-included';
const DOM_INCLUDED_KEY = 'midscene-dom-included';
const IME_STRATEGY_KEY = 'midscene-ime-strategy';
const AUTO_DISMISS_KEYBOARD_KEY = 'midscene-auto-dismiss-keyboard';
const KEYBOARD_DISMISS_STRATEGY_KEY = 'midscene-keyboard-dismiss-strategy';
const ALWAYS_REFRESH_SCREEN_INFO_KEY = 'midscene-always-refresh-screen-info';
const getConfigStringFromLocalStorage = ()=>{
    const configString = localStorage.getItem(CONFIG_KEY);
    return configString || '';
};
const parseConfig = (configString)=>{
    const lines = configString.split('\n');
    const config = {};
    lines.forEach((line)=>{
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) return;
        const cleanLine = trimmed.replace(/^export\s+/i, '').replace(/;$/, '').trim();
        const match = cleanLine.match(/^(\w+)\s*=\s*(.*)$/);
        if (match) {
            const [, key, value] = match;
            let parsedValue = value.trim();
            if (parsedValue.startsWith("'") && parsedValue.endsWith("'") || parsedValue.startsWith('"') && parsedValue.endsWith('"')) parsedValue = parsedValue.slice(1, -1);
            config[key] = parsedValue;
        }
    });
    return config;
};
const useEnvConfig = store_create((set, get)=>{
    const configString = getConfigStringFromLocalStorage();
    const config = parseConfig(configString);
    const ifInExtension = window.location.href.startsWith('chrome-extension');
    const savedServiceMode = localStorage.getItem(SERVICE_MODE_KEY);
    const savedForceSameTabNavigation = 'false' !== localStorage.getItem(TRACKING_ACTIVE_TAB_KEY);
    const savedDeepLocate = 'true' === localStorage.getItem(DEEP_LOCATE_KEY);
    const savedDeepThinkRaw = localStorage.getItem(DEEP_THINK_KEY);
    const savedDeepThink = 'true' === savedDeepThinkRaw ? true : 'false' === savedDeepThinkRaw ? false : 'unset';
    const savedScreenshotIncluded = 'false' !== localStorage.getItem(SCREENSHOT_INCLUDED_KEY);
    const savedDomIncluded = localStorage.getItem(DOM_INCLUDED_KEY) || 'false';
    const savedImeStrategy = localStorage.getItem(IME_STRATEGY_KEY) || 'yadb-for-non-ascii';
    const savedAutoDismissKeyboard = 'false' !== localStorage.getItem(AUTO_DISMISS_KEYBOARD_KEY);
    const savedKeyboardDismissStrategy = localStorage.getItem(KEYBOARD_DISMISS_STRATEGY_KEY) || 'esc-first';
    const savedAlwaysRefreshScreenInfo = 'true' === localStorage.getItem(ALWAYS_REFRESH_SCREEN_INFO_KEY);
    return {
        serviceMode: ifInExtension ? 'In-Browser-Extension' : savedServiceMode || 'Server',
        setServiceMode: (serviceMode)=>{
            if (ifInExtension) throw new Error('serviceMode cannot be set in extension');
            set({
                serviceMode
            });
            localStorage.setItem(SERVICE_MODE_KEY, serviceMode);
        },
        config,
        configString,
        setConfig: (config)=>set({
                config
            }),
        loadConfig: (configString)=>{
            const config = parseConfig(configString);
            set({
                config,
                configString
            });
            localStorage.setItem(CONFIG_KEY, configString);
        },
        syncFromStorage: ()=>{
            const latestConfigString = getConfigStringFromLocalStorage();
            const latestConfig = parseConfig(latestConfigString);
            set({
                config: latestConfig,
                configString: latestConfigString
            });
        },
        forceSameTabNavigation: savedForceSameTabNavigation,
        setForceSameTabNavigation: (forceSameTabNavigation)=>{
            set({
                forceSameTabNavigation
            });
            localStorage.setItem(TRACKING_ACTIVE_TAB_KEY, forceSameTabNavigation.toString());
        },
        deepLocate: savedDeepLocate,
        setDeepLocate: (deepLocate)=>{
            set({
                deepLocate
            });
            localStorage.setItem(DEEP_LOCATE_KEY, deepLocate.toString());
        },
        deepThink: savedDeepThink,
        setDeepThink: (deepThink)=>{
            set({
                deepThink
            });
            localStorage.setItem(DEEP_THINK_KEY, deepThink.toString());
        },
        screenshotIncluded: savedScreenshotIncluded,
        setScreenshotIncluded: (screenshotIncluded)=>{
            set({
                screenshotIncluded
            });
            localStorage.setItem(SCREENSHOT_INCLUDED_KEY, screenshotIncluded.toString());
        },
        domIncluded: 'visible-only' === savedDomIncluded ? 'visible-only' : 'true' === savedDomIncluded,
        setDomIncluded: (domIncluded)=>{
            set({
                domIncluded
            });
            localStorage.setItem(DOM_INCLUDED_KEY, domIncluded.toString());
        },
        popupTab: 'playground',
        setPopupTab: (tab)=>{
            set({
                popupTab: tab
            });
        },
        imeStrategy: savedImeStrategy,
        setImeStrategy: (imeStrategy)=>{
            set({
                imeStrategy
            });
            localStorage.setItem(IME_STRATEGY_KEY, imeStrategy);
        },
        autoDismissKeyboard: savedAutoDismissKeyboard,
        setAutoDismissKeyboard: (autoDismissKeyboard)=>{
            set({
                autoDismissKeyboard
            });
            localStorage.setItem(AUTO_DISMISS_KEYBOARD_KEY, autoDismissKeyboard.toString());
        },
        keyboardDismissStrategy: savedKeyboardDismissStrategy,
        setKeyboardDismissStrategy: (keyboardDismissStrategy)=>{
            set({
                keyboardDismissStrategy
            });
            localStorage.setItem(KEYBOARD_DISMISS_STRATEGY_KEY, keyboardDismissStrategy);
        },
        alwaysRefreshScreenInfo: savedAlwaysRefreshScreenInfo,
        setAlwaysRefreshScreenInfo: (alwaysRefreshScreenInfo)=>{
            set({
                alwaysRefreshScreenInfo
            });
            localStorage.setItem(ALWAYS_REFRESH_SCREEN_INFO_KEY, alwaysRefreshScreenInfo.toString());
        }
    };
});
export { parseConfig, useEnvConfig, useGlobalPreference };
