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
    useFramePlayer: ()=>useFramePlayer
});
const external_react_namespaceObject = require("react");
function useFramePlayer(options) {
    const { durationInFrames, fps, autoPlay = false, loop = false } = options;
    const [currentFrame, setCurrentFrame] = (0, external_react_namespaceObject.useState)(0);
    const [playing, setPlaying] = (0, external_react_namespaceObject.useState)(autoPlay);
    const playingRef = (0, external_react_namespaceObject.useRef)(playing);
    const frameRef = (0, external_react_namespaceObject.useRef)(currentFrame);
    var _options_playbackRate;
    const rateRef = (0, external_react_namespaceObject.useRef)(null != (_options_playbackRate = options.playbackRate) ? _options_playbackRate : 1);
    const durationRef = (0, external_react_namespaceObject.useRef)(durationInFrames);
    const fpsRef = (0, external_react_namespaceObject.useRef)(fps);
    const loopRef = (0, external_react_namespaceObject.useRef)(loop);
    playingRef.current = playing;
    frameRef.current = currentFrame;
    var _options_playbackRate1;
    rateRef.current = null != (_options_playbackRate1 = options.playbackRate) ? _options_playbackRate1 : 1;
    durationRef.current = durationInFrames;
    fpsRef.current = fps;
    loopRef.current = loop;
    (0, external_react_namespaceObject.useEffect)(()=>{
        if (!playing) return;
        let rafId;
        let lastTime = null;
        let accumulated = 0;
        const tick = (now)=>{
            if (null !== lastTime) {
                const delta = (now - lastTime) * rateRef.current;
                accumulated += delta;
                const frameDuration = 1000 / fpsRef.current;
                while(accumulated >= frameDuration){
                    accumulated -= frameDuration;
                    const next = frameRef.current + 1;
                    if (next >= durationRef.current) if (loopRef.current) {
                        frameRef.current = 0;
                        setCurrentFrame(0);
                    } else {
                        frameRef.current = durationRef.current - 1;
                        setCurrentFrame(durationRef.current - 1);
                        setPlaying(false);
                        return;
                    }
                    else {
                        frameRef.current = next;
                        setCurrentFrame(next);
                    }
                }
            }
            lastTime = now;
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return ()=>cancelAnimationFrame(rafId);
    }, [
        playing
    ]);
    const resetIfAtEnd = ()=>{
        if (frameRef.current >= durationRef.current - 1) {
            frameRef.current = 0;
            setCurrentFrame(0);
        }
    };
    const play = (0, external_react_namespaceObject.useCallback)(()=>{
        resetIfAtEnd();
        setPlaying(true);
    }, []);
    const pause = (0, external_react_namespaceObject.useCallback)(()=>setPlaying(false), []);
    const toggle = (0, external_react_namespaceObject.useCallback)(()=>{
        if (playingRef.current) setPlaying(false);
        else {
            resetIfAtEnd();
            setPlaying(true);
        }
    }, []);
    const seekTo = (0, external_react_namespaceObject.useCallback)((frame)=>{
        const clamped = Math.max(0, Math.min(frame, durationRef.current - 1));
        frameRef.current = clamped;
        setCurrentFrame(clamped);
    }, []);
    return {
        currentFrame,
        playing,
        play,
        pause,
        toggle,
        seekTo
    };
}
exports.useFramePlayer = __webpack_exports__.useFramePlayer;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "useFramePlayer"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
