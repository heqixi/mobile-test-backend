import * as Z from 'zustand';
export type PlaybackSpeedType = 0.5 | 1 | 1.5 | 2;
export declare const useGlobalPreference: Z.UseBoundStore<Z.StoreApi<{
    backgroundVisible: boolean;
    elementsVisible: boolean;
    autoZoom: boolean;
    modelCallDetailsEnabled: boolean;
    darkModeEnabled: boolean;
    playbackSpeed: PlaybackSpeedType;
    subtitleEnabled: boolean;
    setBackgroundVisible: (visible: boolean) => void;
    setElementsVisible: (visible: boolean) => void;
    setAutoZoom: (enabled: boolean) => void;
    setModelCallDetailsEnabled: (enabled: boolean) => void;
    setDarkModeEnabled: (enabled: boolean) => void;
    setPlaybackSpeed: (speed: PlaybackSpeedType) => void;
    setSubtitleEnabled: (enabled: boolean) => void;
}>>;
export declare const parseConfig: (configString: string) => Record<string, string>;
/**
 * Service Mode
 *
 * - Server: use a node server to run the code
 * - In-Browser: use browser's fetch API to run the code
 * - In-Browser-Extension: use browser's fetch API to run the code, but the page is running in the extension context
 */
export type ServiceModeType = 'Server' | 'In-Browser' | 'In-Browser-Extension';
export type ImeStrategyType = 'always-yadb' | 'yadb-for-non-ascii';
export type KeyboardDismissStrategyType = 'esc-first' | 'back-first';
export declare const useEnvConfig: Z.UseBoundStore<Z.StoreApi<{
    serviceMode: ServiceModeType;
    setServiceMode: (serviceMode: ServiceModeType) => void;
    config: Record<string, string>;
    configString: string;
    setConfig: (config: Record<string, string>) => void;
    loadConfig: (configString: string) => void;
    syncFromStorage: () => void;
    forceSameTabNavigation: boolean;
    setForceSameTabNavigation: (forceSameTabNavigation: boolean) => void;
    deepLocate: boolean;
    setDeepLocate: (deepLocate: boolean) => void;
    deepThink: boolean | "unset";
    setDeepThink: (deepThink: boolean | "unset") => void;
    screenshotIncluded: boolean;
    setScreenshotIncluded: (screenshotIncluded: boolean) => void;
    domIncluded: boolean | "visible-only";
    setDomIncluded: (domIncluded: boolean | "visible-only") => void;
    popupTab: "playground" | "bridge" | "recorder";
    setPopupTab: (tab: "playground" | "bridge" | "recorder") => void;
    imeStrategy: ImeStrategyType;
    setImeStrategy: (imeStrategy: ImeStrategyType) => void;
    autoDismissKeyboard: boolean;
    setAutoDismissKeyboard: (autoDismissKeyboard: boolean) => void;
    keyboardDismissStrategy: KeyboardDismissStrategyType;
    setKeyboardDismissStrategy: (keyboardDismissStrategy: KeyboardDismissStrategyType) => void;
    alwaysRefreshScreenInfo: boolean;
    setAlwaysRefreshScreenInfo: (alwaysRefreshScreenInfo: boolean) => void;
}>>;
