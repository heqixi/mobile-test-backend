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
    AgentProgressBus: ()=>AgentProgressBus
});
const logger_namespaceObject = require("@midscene/shared/logger");
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
const debugError = (0, logger_namespaceObject.getDebug)('agent-progress-bus', {
    console: true
});
class AgentProgressBus {
    subscribe(listener) {
        this.listeners.push(listener);
        return ()=>{
            this.unsubscribe(listener);
        };
    }
    unsubscribe(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) this.listeners.splice(index, 1);
    }
    clear() {
        this.listeners = [];
    }
    get listenerCount() {
        return this.listeners.length;
    }
    constructor(){
        _define_property(this, "listeners", []);
        _define_property(this, "sequence", 0);
        _define_property(this, "publish", async (scope, phase, data)=>{
            const event = {
                scope,
                phase,
                sequence: ++this.sequence,
                data
            };
            for (const listener of this.listeners)try {
                await listener(event);
            } catch (error) {
                debugError('error in progress listener', error);
            }
        });
    }
}
exports.AgentProgressBus = __webpack_exports__.AgentProgressBus;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "AgentProgressBus"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=progress-bus.js.map