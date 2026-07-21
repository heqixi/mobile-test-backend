import { IndexedDBManager, createCleanupFunction, withErrorHandling } from "@midscene/shared/baseDB";
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
function indexeddb_storage_provider_ownKeys(object, enumerableOnly) {
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
    else indexeddb_storage_provider_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
function isReportActionDump(dump) {
    return Array.isArray(null == dump ? void 0 : dump.executions);
}
const DB_NAME = 'midscene_playground';
const DB_VERSION = 1;
const MESSAGES_STORE = 'playground_messages';
const RESULTS_STORE = 'playground_results';
const MAX_STORED_MESSAGES = 100;
const MAX_STORED_RESULTS = 50;
class IndexedDBStorageProvider {
    saveMessages(messages) {
        return _async_to_generator(function*() {
            yield withErrorHandling(()=>_async_to_generator(function*() {
                    yield this.dbManager.clear(MESSAGES_STORE);
                    const messagesToSave = messages.slice(-MAX_STORED_MESSAGES);
                    yield Promise.all(messagesToSave.map((msg, index)=>{
                        const lightMessage = _object_spread_props(_object_spread({}, msg), {
                            result: 'result' === msg.type ? void 0 : msg.result
                        });
                        const data = {
                            id: msg.id || `msg-${index}`,
                            data: lightMessage,
                            timestamp: msg.timestamp ? msg.timestamp.getTime() : Date.now() + index
                        };
                        return this.dbManager.put(MESSAGES_STORE, data);
                    }));
                }).call(this), 'Failed to save messages to IndexedDB', void 0, this.messagesCleanup);
        }).call(this);
    }
    loadMessages() {
        return _async_to_generator(function*() {
            const result = yield withErrorHandling(()=>_async_to_generator(function*() {
                    const messages = yield this.dbManager.getAll(MESSAGES_STORE, true);
                    if (0 === messages.length) return [];
                    return Promise.all(messages.map((msg)=>_async_to_generator(function*() {
                            const item = msg.data;
                            const restoredItem = _object_spread_props(_object_spread({}, item), {
                                timestamp: new Date(item.timestamp)
                            });
                            if ('result' === item.type && item.id) {
                                const fullResult = yield this.loadResult(item.id);
                                if (fullResult) {
                                    restoredItem.result = fullResult.result;
                                    restoredItem.replayScriptsInfo = fullResult.replayScriptsInfo;
                                    restoredItem.replayCounter = fullResult.replayCounter;
                                    restoredItem.verticalMode = fullResult.verticalMode;
                                }
                            }
                            return restoredItem;
                        }).call(this)));
                }).call(this), 'Failed to load messages from IndexedDB', [], this.messagesCleanup);
            return result || [];
        }).call(this);
    }
    clearMessages() {
        return _async_to_generator(function*() {
            yield withErrorHandling(()=>_async_to_generator(function*() {
                    yield Promise.all([
                        this.dbManager.clear(MESSAGES_STORE),
                        this.dbManager.clear(RESULTS_STORE)
                    ]);
                }).call(this), 'Failed to clear messages from IndexedDB');
        }).call(this);
    }
    saveResult(id, result) {
        return _async_to_generator(function*() {
            yield withErrorHandling(()=>_async_to_generator(function*() {
                    const compressedResult = this.compressResultForStorage(result);
                    const data = {
                        id,
                        data: compressedResult,
                        timestamp: Date.now(),
                        size: JSON.stringify(compressedResult).length
                    };
                    yield this.dbManager.put(RESULTS_STORE, data);
                }).call(this), 'Failed to save result to IndexedDB', void 0, this.resultsCleanup);
        }).call(this);
    }
    loadResult(id) {
        return _async_to_generator(function*() {
            const result = yield withErrorHandling(()=>_async_to_generator(function*() {
                    const data = yield this.dbManager.get(RESULTS_STORE, id);
                    return (null == data ? void 0 : data.data) || null;
                }).call(this), 'Failed to load result from IndexedDB', null);
            return result || null;
        }).call(this);
    }
    compressResultForStorage(result) {
        const playgroundResult = result.result;
        const dump = null == playgroundResult ? void 0 : playgroundResult.dump;
        if (!playgroundResult || !dump) return result;
        if (isReportActionDump(dump)) return _object_spread_props(_object_spread({}, result), {
            result: _object_spread_props(_object_spread({}, playgroundResult), {
                dump: _object_spread_props(_object_spread({}, dump), {
                    executions: dump.executions.map((execution)=>_object_spread_props(_object_spread({}, execution), {
                            tasks: this.compressExecutionTasks(execution.tasks)
                        }))
                })
            })
        });
        if (!dump.tasks) return result;
        return _object_spread_props(_object_spread({}, result), {
            result: _object_spread_props(_object_spread({}, playgroundResult), {
                dump: _object_spread_props(_object_spread({}, dump), {
                    tasks: this.compressExecutionTasks(dump.tasks)
                })
            })
        });
    }
    compressExecutionTasks(tasks) {
        return tasks.map((task)=>{
            var _task_recorder;
            return _object_spread_props(_object_spread({}, task), {
                uiContext: task.uiContext ? _object_spread_props(_object_spread({}, task.uiContext), {
                    screenshot: task.uiContext.screenshot
                }) : task.uiContext,
                recorder: null == (_task_recorder = task.recorder) ? void 0 : _task_recorder.map((record)=>_object_spread_props(_object_spread({}, record), {
                        screenshot: record.screenshot
                    }))
            });
        });
    }
    compressScreenshotIfNeeded(screenshot) {
        if (!screenshot) return screenshot;
        if (screenshot.length > 1048576) {
            const sizeKB = Math.round(screenshot.length / 1024);
            return `[COMPRESSED: ${sizeKB}KB screenshot removed for storage]`;
        }
        return screenshot;
    }
    getStorageStats() {
        return _async_to_generator(function*() {
            const result = yield withErrorHandling(()=>_async_to_generator(function*() {
                    const [messageCount, resultCount] = yield Promise.all([
                        this.dbManager.count(MESSAGES_STORE),
                        this.dbManager.count(RESULTS_STORE)
                    ]);
                    return {
                        messageCount,
                        resultCount
                    };
                }).call(this), 'Failed to get storage statistics', {
                messageCount: 0,
                resultCount: 0
            });
            return result || {
                messageCount: 0,
                resultCount: 0
            };
        }).call(this);
    }
    cleanup() {
        return _async_to_generator(function*() {
            yield Promise.all([
                this.messagesCleanup(),
                this.resultsCleanup()
            ]);
        }).call(this);
    }
    constructor(namespace = 'playground'){
        _define_property(this, "dbManager", void 0);
        _define_property(this, "namespace", void 0);
        _define_property(this, "messagesCleanup", void 0);
        _define_property(this, "resultsCleanup", void 0);
        this.namespace = namespace;
        this.dbManager = new IndexedDBManager(`${DB_NAME}_${namespace}`, DB_VERSION, [
            {
                name: MESSAGES_STORE,
                keyPath: 'id'
            },
            {
                name: RESULTS_STORE,
                keyPath: 'id'
            }
        ]);
        this.messagesCleanup = createCleanupFunction(this.dbManager, MESSAGES_STORE, MAX_STORED_MESSAGES);
        this.resultsCleanup = createCleanupFunction(this.dbManager, RESULTS_STORE, MAX_STORED_RESULTS);
    }
}
class MemoryStorageProvider {
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
class NoOpStorageProvider {
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
export { IndexedDBStorageProvider, MemoryStorageProvider, NoOpStorageProvider };
