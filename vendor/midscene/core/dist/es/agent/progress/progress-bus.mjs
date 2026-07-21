import { getDebug } from "@midscene/shared/logger";
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
const debugError = getDebug('agent-progress-bus', {
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
export { AgentProgressBus };

//# sourceMappingURL=progress-bus.mjs.map