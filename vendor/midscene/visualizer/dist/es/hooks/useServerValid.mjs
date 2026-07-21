import { PlaygroundSDK } from "@midscene/playground";
import { useEffect, useState } from "react";
import { useEnvConfig } from "../store/store.mjs";
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
const useServerValid = (shouldRun = true)=>{
    const [serverValid, setServerValid] = useState(true);
    const { serviceMode } = useEnvConfig();
    useEffect(()=>{
        let interruptFlag = false;
        if (!shouldRun) return;
        Promise.resolve((()=>_async_to_generator(function*() {
                while(!interruptFlag){
                    const playgroundSDK = new PlaygroundSDK({
                        type: 'remote-execution'
                    });
                    const status = yield playgroundSDK.checkStatus();
                    status ? setServerValid(true) : setServerValid(false);
                    yield new Promise((resolve)=>setTimeout(resolve, 1000));
                }
            })())());
        return ()=>{
            interruptFlag = true;
        };
    }, [
        serviceMode,
        shouldRun
    ]);
    return serverValid;
};
export { useServerValid };
