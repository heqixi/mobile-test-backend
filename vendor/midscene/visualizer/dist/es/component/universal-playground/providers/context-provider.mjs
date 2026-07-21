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
export { AgentContextProvider, BaseContextProvider, NoOpContextProvider, StaticContextProvider };
