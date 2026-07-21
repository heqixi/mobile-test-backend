import { IndexedDBStorageProvider, MemoryStorageProvider, NoOpStorageProvider } from "./indexeddb-storage-provider.mjs";
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
function storage_provider_ownKeys(object, enumerableOnly) {
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
    else storage_provider_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
class LocalStorageProvider {
    checkStorageSpace() {
        try {
            const testKey = 'storage-test';
            const testData = 'x'.repeat(102400);
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }
    saveMessages(messages) {
        return _async_to_generator(function*() {
            try {
                if (!this.checkStorageSpace()) {
                    console.warn('Low storage space detected, clearing old data...');
                    yield this.handleQuotaExceeded();
                }
                const messagesToSave = messages.slice(-this.maxStorageItems);
                const lightMessages = messagesToSave.map((msg)=>_object_spread_props(_object_spread({}, msg), {
                        result: 'result' === msg.type ? void 0 : msg.result
                    }));
                const messageData = JSON.stringify(lightMessages);
                localStorage.setItem(this.messagesKey, messageData);
            } catch (error) {
                if (error instanceof DOMException && 'QuotaExceededError' === error.name) {
                    console.warn('LocalStorage quota exceeded, attempting to clear old data and retry...');
                    yield this.handleQuotaExceeded();
                    try {
                        const recentMessages = messages.slice(-10);
                        const lightRecentMessages = recentMessages.map((msg)=>_object_spread_props(_object_spread({}, msg), {
                                result: 'result' === msg.type ? void 0 : msg.result
                            }));
                        const messageData = JSON.stringify(lightRecentMessages);
                        localStorage.setItem(this.messagesKey, messageData);
                        console.info('Successfully saved recent messages after clearing storage');
                    } catch (retryError) {
                        console.error('Failed to save even after clearing storage:', retryError);
                        yield this.clearMessages();
                    }
                } else console.error('Failed to save messages to localStorage:', error);
            }
        }).call(this);
    }
    loadMessages() {
        return _async_to_generator(function*() {
            try {
                const stored = localStorage.getItem(this.messagesKey);
                if (!stored) return [];
                const messages = JSON.parse(stored);
                const restoredMessages = yield Promise.all(messages.map((msg)=>_async_to_generator(function*() {
                        if ('result' === msg.type && msg.id) {
                            const resultKey = `${this.resultsKey}-${msg.id}`;
                            const storedResult = localStorage.getItem(resultKey);
                            if (storedResult) try {
                                const resultItem = JSON.parse(storedResult);
                                return _object_spread({}, msg, resultItem);
                            } catch (e) {
                                console.warn('Failed to parse stored result:', e);
                            }
                        }
                        return msg;
                    }).call(this)));
                return restoredMessages;
            } catch (error) {
                console.error('Failed to load messages from localStorage:', error);
                return [];
            }
        }).call(this);
    }
    clearMessages() {
        return _async_to_generator(function*() {
            try {
                localStorage.removeItem(this.messagesKey);
                const keys = Object.keys(localStorage);
                keys.forEach((key)=>{
                    if (key.startsWith(this.resultsKey)) localStorage.removeItem(key);
                });
            } catch (error) {
                console.error('Failed to clear messages from localStorage:', error);
            }
        }).call(this);
    }
    saveResult(id, result) {
        return _async_to_generator(function*() {
            try {
                const resultKey = `${this.resultsKey}-${id}`;
                localStorage.setItem(resultKey, JSON.stringify(result));
            } catch (error) {
                if (error instanceof DOMException && 'QuotaExceededError' === error.name) {
                    console.warn('LocalStorage quota exceeded when saving result, clearing old results...');
                    yield this.handleQuotaExceeded();
                    try {
                        const resultKey = `${this.resultsKey}-${id}`;
                        localStorage.setItem(resultKey, JSON.stringify(result));
                    } catch (retryError) {
                        console.error('Failed to save result even after clearing storage:', retryError);
                    }
                } else console.error('Failed to save result to localStorage:', error);
            }
        }).call(this);
    }
    handleQuotaExceeded() {
        return _async_to_generator(function*() {
            try {
                const keys = Object.keys(localStorage);
                const resultKeys = keys.filter((key)=>key.startsWith(this.resultsKey));
                const keysToRemove = resultKeys.slice(0, Math.max(1, Math.floor(resultKeys.length / 2)));
                keysToRemove.forEach((key)=>{
                    localStorage.removeItem(key);
                });
                console.info(`Cleared ${keysToRemove.length} old result entries to free up storage space`);
                const playgroundKeys = keys.filter((key)=>key.includes('playground') || key.includes('agent') || key.startsWith('midscene'));
                if (playgroundKeys.length > 10) {
                    const additionalKeysToRemove = playgroundKeys.slice(0, Math.floor(playgroundKeys.length / 3));
                    additionalKeysToRemove.forEach((key)=>{
                        if (key !== this.messagesKey) localStorage.removeItem(key);
                    });
                    console.info(`Cleared ${additionalKeysToRemove.length} additional playground-related entries`);
                }
            } catch (error) {
                console.error('Failed to handle quota exceeded:', error);
            }
        }).call(this);
    }
    constructor(namespace = 'playground'){
        _define_property(this, "messagesKey", void 0);
        _define_property(this, "resultsKey", void 0);
        _define_property(this, "maxStorageItems", 50);
        this.messagesKey = `${namespace}-messages`;
        this.resultsKey = `${namespace}-results`;
    }
}
class storage_provider_MemoryStorageProvider {
    saveMessages(messages) {
        return _async_to_generator(function*() {
            this.messages = [
                ...messages
            ];
        }).call(this);
    }
    loadMessages() {
        return _async_to_generator(function*() {
            return [
                ...this.messages
            ];
        }).call(this);
    }
    clearMessages() {
        return _async_to_generator(function*() {
            this.messages = [];
            this.results.clear();
        }).call(this);
    }
    saveResult(id, result) {
        return _async_to_generator(function*() {
            this.results.set(id, result);
        }).call(this);
    }
    constructor(){
        _define_property(this, "messages", []);
        _define_property(this, "results", new Map());
    }
}
class storage_provider_NoOpStorageProvider {
    saveMessages(_messages) {
        return _async_to_generator(function*() {})();
    }
    loadMessages() {
        return _async_to_generator(function*() {
            return [];
        })();
    }
    clearMessages() {
        return _async_to_generator(function*() {})();
    }
    saveResult(_id, _result) {
        return _async_to_generator(function*() {})();
    }
}
var storage_provider_StorageType = /*#__PURE__*/ function(StorageType) {
    StorageType["INDEXEDDB"] = "indexeddb";
    StorageType["LOCALSTORAGE"] = "localStorage";
    StorageType["MEMORY"] = "memory";
    StorageType["NONE"] = "none";
    return StorageType;
}({});
function createStorageProvider(type = "indexeddb", namespace = 'playground') {
    switch(type){
        case "indexeddb":
            if ('undefined' != typeof indexedDB) return new IndexedDBStorageProvider(namespace);
            console.warn('IndexedDB not available, falling back to localStorage');
            return createStorageProvider("localStorage", namespace);
        case "localStorage":
            if ('undefined' != typeof localStorage) return new LocalStorageProvider(namespace);
            console.warn('localStorage not available, falling back to memory storage');
            return createStorageProvider("memory", namespace);
        case "memory":
            return new storage_provider_MemoryStorageProvider();
        case "none":
            return new storage_provider_NoOpStorageProvider();
        default:
            throw new Error(`Unknown storage type: ${type}`);
    }
}
function detectBestStorageType() {
    if ('undefined' != typeof indexedDB) try {
        indexedDB.open('test', 1).onerror = ()=>{};
        return "indexeddb";
    } catch (e) {}
    if ('undefined' != typeof localStorage) try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return "localStorage";
    } catch (e) {}
    return "memory";
}
export { MemoryStorageProvider as IndexedDBMemoryStorageProvider, NoOpStorageProvider as IndexedDBNoOpStorageProvider, IndexedDBStorageProvider, LocalStorageProvider, storage_provider_MemoryStorageProvider as MemoryStorageProvider, storage_provider_NoOpStorageProvider as NoOpStorageProvider, storage_provider_StorageType as StorageType, createStorageProvider, detectBestStorageType };
