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
    usePlaygroundState: ()=>usePlaygroundState
});
const external_react_namespaceObject = require("react");
const storage_provider_js_namespaceObject = require("../component/universal-playground/providers/storage-provider.js");
const constants_js_namespaceObject = require("../utils/constants.js");
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) resolve(value);
    else Promise.resolve(value).then(_next, _throw);
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(void 0);
        });
    };
}
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
function usePlaygroundState_ownKeys(object, enumerableOnly) {
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
    else usePlaygroundState_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
function usePlaygroundState(playgroundSDK, storage, contextProvider, targetName, loadDefaultNamespaceFallback = true) {
    const [loading, setLoading] = (0, external_react_namespaceObject.useState)(false);
    const [infoList, setInfoList] = (0, external_react_namespaceObject.useState)([]);
    const [actionSpace, setActionSpace] = (0, external_react_namespaceObject.useState)([]);
    const [actionSpaceLoading, setActionSpaceLoading] = (0, external_react_namespaceObject.useState)(true);
    const [uiContextPreview, setUiContextPreview] = (0, external_react_namespaceObject.useState)();
    const [showScrollToBottomButton, setShowScrollToBottomButton] = (0, external_react_namespaceObject.useState)(false);
    const [autoScrollEnabled, setAutoScrollEnabled] = (0, external_react_namespaceObject.useState)(true);
    const lastScrollTopRef = (0, external_react_namespaceObject.useRef)(0);
    const [verticalMode, setVerticalMode] = (0, external_react_namespaceObject.useState)(false);
    const [replayCounter, setReplayCounter] = (0, external_react_namespaceObject.useState)(0);
    const infoListRef = (0, external_react_namespaceObject.useRef)(null);
    const currentRunningIdRef = (0, external_react_namespaceObject.useRef)(null);
    const interruptedFlagRef = (0, external_react_namespaceObject.useRef)({});
    const initializedStorageRef = (0, external_react_namespaceObject.useRef)();
    const [, bumpMessagesInitialization] = (0, external_react_namespaceObject.useState)(0);
    (0, external_react_namespaceObject.useEffect)(()=>{
        let cancelled = false;
        const storageIdentity = null != storage ? storage : null;
        const markMessagesInitialized = ()=>{
            if (cancelled) return;
            initializedStorageRef.current = storageIdentity;
            bumpMessagesInitialization((version)=>version + 1);
        };
        const applyMessages = (messages)=>{
            if (!cancelled) setInfoList(messages);
        };
        const migrateFromOldNamespace = ()=>_async_to_generator(function*() {
                if (!loadDefaultNamespaceFallback) return [];
                const oldStorage = (0, storage_provider_js_namespaceObject.createStorageProvider)((0, storage_provider_js_namespaceObject.detectBestStorageType)(), 'playground-default');
                try {
                    if (null == oldStorage ? void 0 : oldStorage.loadMessages) {
                        const oldMessages = yield oldStorage.loadMessages();
                        if (oldMessages.length > 1) {
                            console.log('Found data in old namespace, migrating...');
                            if (null == storage ? void 0 : storage.saveMessages) yield storage.saveMessages(oldMessages);
                            if (oldStorage.clearMessages) yield oldStorage.clearMessages();
                            return oldMessages;
                        }
                    }
                } catch (error) {
                    console.debug('No data found in old namespace:', error);
                }
                return [];
            })();
        const initializeMessages = ()=>_async_to_generator(function*() {
                const welcomeMessage = _object_spread_props(_object_spread({}, (0, constants_js_namespaceObject.getWelcomeMessageTemplate)(targetName)), {
                    id: 'welcome',
                    timestamp: new Date()
                });
                if (null == storage ? void 0 : storage.loadMessages) try {
                    let storedMessages = yield storage.loadMessages();
                    if (0 === storedMessages.length) storedMessages = yield migrateFromOldNamespace();
                    const hasWelcomeMessage = storedMessages.some((msg)=>'welcome' === msg.id);
                    hasWelcomeMessage ? applyMessages(storedMessages) : applyMessages([
                        welcomeMessage,
                        ...storedMessages
                    ]);
                } catch (error) {
                    console.error('Failed to load messages:', error);
                    applyMessages([
                        welcomeMessage
                    ]);
                }
                else applyMessages([
                    welcomeMessage
                ]);
                markMessagesInitialized();
            })();
        if (initializedStorageRef.current !== storageIdentity) {
            if (storage || 0 === infoList.length) initializeMessages();
        }
        return ()=>{
            cancelled = true;
        };
    }, [
        loadDefaultNamespaceFallback,
        storage
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if ((null == storage ? void 0 : storage.saveMessages) && infoList.length > 1) storage.saveMessages(infoList).catch((error)=>{
            if (error instanceof DOMException && 'QuotaExceededError' === error.name) console.warn('Storage quota exceeded - some messages may not be saved persistently');
            else console.error('Failed to save messages:', error);
        });
    }, [
        infoList,
        storage
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (!(null == contextProvider ? void 0 : contextProvider.getUIContext) || uiContextPreview) return;
        contextProvider.getUIContext().then((context)=>setUiContextPreview(context)).catch((error)=>{
            console.error('Failed to get UI context:', error);
        });
    }, [
        contextProvider,
        uiContextPreview
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        const loadActionSpace = ()=>_async_to_generator(function*() {
                setActionSpaceLoading(true);
                try {
                    var _contextProvider_getUIContext;
                    if (!playgroundSDK) return void setActionSpace([]);
                    const context = uiContextPreview || (yield null == contextProvider ? void 0 : null == (_contextProvider_getUIContext = contextProvider.getUIContext) ? void 0 : _contextProvider_getUIContext.call(contextProvider));
                    const space = yield playgroundSDK.getActionSpace(context);
                    setActionSpace(space || []);
                } catch (error) {
                    console.error('Failed to load action space:', error);
                    setActionSpace([]);
                } finally{
                    setActionSpaceLoading(false);
                }
            })();
        loadActionSpace();
    }, [
        playgroundSDK,
        uiContextPreview,
        contextProvider
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        const sizeThreshold = 750;
        setVerticalMode(window.innerWidth < sizeThreshold);
        const handleResize = ()=>{
            setVerticalMode(window.innerWidth < sizeThreshold);
        };
        window.addEventListener('resize', handleResize);
        return ()=>window.removeEventListener('resize', handleResize);
    }, []);
    const scrollToBottom = (0, external_react_namespaceObject.useCallback)(()=>{
        setTimeout(()=>{
            if (infoListRef.current) infoListRef.current.scrollTop = infoListRef.current.scrollHeight;
        }, 100);
    }, []);
    const checkIfScrolledToBottom = (0, external_react_namespaceObject.useCallback)(()=>{
        if (infoListRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = infoListRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            setShowScrollToBottomButton(!isAtBottom);
            const scrollingUp = scrollTop < lastScrollTopRef.current;
            lastScrollTopRef.current = scrollTop;
            if (isAtBottom) setAutoScrollEnabled(true);
            else if (scrollingUp) setAutoScrollEnabled(false);
        }
    }, []);
    const handleScrollToBottom = (0, external_react_namespaceObject.useCallback)(()=>{
        if (infoListRef.current) {
            infoListRef.current.scrollTo({
                top: infoListRef.current.scrollHeight,
                behavior: 'smooth'
            });
            setShowScrollToBottomButton(false);
            setAutoScrollEnabled(true);
        }
    }, []);
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (infoList.length > 0 && autoScrollEnabled) scrollToBottom();
    }, [
        infoList,
        scrollToBottom,
        autoScrollEnabled
    ]);
    (0, external_react_namespaceObject.useEffect)(()=>{
        const container = infoListRef.current;
        if (container) {
            container.addEventListener('scroll', checkIfScrolledToBottom);
            checkIfScrolledToBottom();
            return ()=>{
                container.removeEventListener('scroll', checkIfScrolledToBottom);
            };
        }
    }, [
        checkIfScrolledToBottom
    ]);
    const clearInfoList = (0, external_react_namespaceObject.useCallback)(()=>_async_to_generator(function*() {
            const welcomeMessage = _object_spread_props(_object_spread({}, (0, constants_js_namespaceObject.getWelcomeMessageTemplate)(targetName)), {
                id: 'welcome',
                timestamp: new Date()
            });
            setInfoList([
                welcomeMessage
            ]);
            if (null == storage ? void 0 : storage.clearMessages) try {
                yield storage.clearMessages();
            } catch (error) {
                console.error('Failed to clear stored messages:', error);
            }
        })(), [
        storage,
        targetName
    ]);
    const refreshContext = (0, external_react_namespaceObject.useCallback)(()=>_async_to_generator(function*() {
            if (null == contextProvider ? void 0 : contextProvider.refreshContext) try {
                const newContext = yield contextProvider.refreshContext();
                setUiContextPreview(newContext);
            } catch (error) {
                console.error('Failed to refresh context:', error);
            }
        })(), [
        contextProvider
    ]);
    return {
        loading,
        setLoading,
        infoList,
        setInfoList,
        messagesInitialized: initializedStorageRef.current === (null != storage ? storage : null),
        actionSpace,
        actionSpaceLoading,
        uiContextPreview,
        setUiContextPreview,
        showScrollToBottomButton,
        verticalMode,
        replayCounter,
        setReplayCounter,
        infoListRef,
        currentRunningIdRef,
        interruptedFlagRef,
        clearInfoList,
        refreshContext,
        handleScrollToBottom,
        scrollToBottom
    };
}
exports.usePlaygroundState = __webpack_exports__.usePlaygroundState;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "usePlaygroundState"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
