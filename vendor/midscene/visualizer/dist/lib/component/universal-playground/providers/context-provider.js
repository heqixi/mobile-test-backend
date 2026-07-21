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
    AgentContextProvider: ()=>AgentContextProvider,
    BaseContextProvider: ()=>BaseContextProvider,
    NoOpContextProvider: ()=>NoOpContextProvider,
    StaticContextProvider: ()=>StaticContextProvider
});
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
class BaseContextProvider {
    refreshContext() {
        return _async_to_generator(function*() {
            this.cachedContext = void 0;
            return yield this.getUIContext();
        }).call(this);
    }
    constructor(){
        _define_property(this, "cachedContext", void 0);
    }
}
class AgentContextProvider extends BaseContextProvider {
    getUIContext() {
        return _async_to_generator(function*() {
            if (this.cachedContext) return this.cachedContext;
            const agent = this.getAgent();
            if (!(null == agent ? void 0 : agent.getUIContext)) throw new Error('Agent does not support getUIContext');
            const context = yield agent.getUIContext();
            this.cachedContext = context;
            return context;
        }).call(this);
    }
    constructor(getAgent, options){
        super(), _define_property(this, "getAgent", void 0), _define_property(this, "options", void 0), this.getAgent = getAgent, this.options = options;
    }
}
class StaticContextProvider extends BaseContextProvider {
    getUIContext() {
        return _async_to_generator(function*() {
            return this.context;
        }).call(this);
    }
    refreshContext() {
        return _async_to_generator(function*() {
            return this.context;
        }).call(this);
    }
    constructor(context){
        super(), _define_property(this, "context", void 0), this.context = context;
    }
}
class NoOpContextProvider {
    getUIContext() {
        return _async_to_generator(function*() {
            throw new Error('Context preview is disabled');
        })();
    }
    refreshContext() {
        return _async_to_generator(function*() {
            throw new Error('Context preview is disabled');
        })();
    }
}
exports.AgentContextProvider = __webpack_exports__.AgentContextProvider;
exports.BaseContextProvider = __webpack_exports__.BaseContextProvider;
exports.NoOpContextProvider = __webpack_exports__.NoOpContextProvider;
exports.StaticContextProvider = __webpack_exports__.StaticContextProvider;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "AgentContextProvider",
    "BaseContextProvider",
    "NoOpContextProvider",
    "StaticContextProvider"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
