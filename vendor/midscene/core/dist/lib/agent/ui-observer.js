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
    UIObserver: ()=>UIObserver
});
const img_namespaceObject = require("@midscene/shared/img");
const logger_namespaceObject = require("@midscene/shared/logger");
const utils_namespaceObject = require("@midscene/shared/utils");
const external_screenshot_item_js_namespaceObject = require("../screenshot-item.js");
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
const debug = (0, logger_namespaceObject.getDebug)('ui-observer');
const warnObserver = (0, logger_namespaceObject.getDebug)('ui-observer', {
    console: true
});
const DEFAULT_INTERVAL_MS = 1000;
const MIN_INTERVAL_MS = 200;
const DEFAULT_MAX_FRAMES = 30;
const FIRST_FRAME_TIMEOUT_MS = 3000;
const DEFAULT_WATCHDOG_MS = 300000;
const MAX_FRAMES_TO_MODEL = 50;
class UIObserver {
    get frameCount() {
        return this.frames.length;
    }
    async start() {
        (0, utils_namespaceObject.assert)(!this.loopPromise && !this.stopped, 'observer has already started');
        try {
            this.source = await this.deps.openFrameSource() ?? null;
        } catch (error) {
            debug(`frame source unavailable, using screenshot fallback: ${error}`);
            this.source = null;
        }
        this.usingFallback = !this.source;
        if (this.usingFallback) debug('no continuous frame source; sampling via plain screenshots');
        else {
            const waitStart = Date.now();
            while(!this.source.latest() && Date.now() - waitStart < FIRST_FRAME_TIMEOUT_MS)await new Promise((resolve)=>setTimeout(resolve, 50));
            if (!this.source.latest()) debug(`no first frame within ${FIRST_FRAME_TIMEOUT_MS}ms; starting anyway`);
        }
        await this.captureOnce();
        this.loopPromise = this.runLoop();
        if (this.watchdogMs > 0) {
            this.watchdogTimer = setTimeout(()=>{
                warnObserver(`UIObserver auto-stopped after ${this.watchdogMs}ms. Call observer.stop() explicitly to avoid this.`);
                debug(`watchdog fired after ${this.watchdogMs}ms, auto-stopping`);
                this.stop().catch(()=>{});
            }, this.watchdogMs);
            if ('function' == typeof this.watchdogTimer.unref) this.watchdogTimer.unref();
        }
    }
    async stop() {
        if (this.stopped) return;
        this.stopped = true;
        if (this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
        }
        await this.loopPromise;
        try {
            if (this.source && this.frames.length > 0) {
                const uniqueRefs = this.dedupeRefs(this.frames);
                this.preDecodePromise = this.source.decode(uniqueRefs).then(async (results)=>{
                    const shrunk = await this.shrinkAllIfNeeded(results);
                    uniqueRefs.forEach((ref, i)=>{
                        this.decodedCache.set(ref.ref, shrunk[i]);
                    });
                    debug(`pre-decoded ${uniqueRefs.length} frames`);
                }).catch((error)=>{
                    debug(`pre-decode failed, will retry at assert time: ${error}`);
                });
            }
            const representativePromise = this.deps.captureRepresentative();
            const [, representative] = await Promise.all([
                this.preDecodePromise,
                representativePromise
            ]);
            if (this.source && this.frames.length > 0) {
                const lastFrame = this.frames[this.frames.length - 1];
                const lastDecoded = this.decodedCache.get(lastFrame.ref);
                if (lastDecoded) {
                    representative.screenshot = external_screenshot_item_js_namespaceObject.ScreenshotItem.create(lastDecoded, lastFrame.capturedAt);
                    debug('representative screenshot aligned with last sampled frame');
                }
            }
            this.representative = representative;
        } finally{
            if (this.source) try {
                await this.source.stop();
            } catch (error) {
                debug(`error stopping frame source: ${error}`);
            }
            debug(`observation stopped with ${this.frames.length} buffered frames (+1 representative)`);
            this.deps.onStopped?.();
        }
    }
    async aiAssert(assertion, msg, opt) {
        const uiContext = await this.buildObservedUIContext();
        return this.deps.runAssert(assertion, uiContext, msg, opt);
    }
    async aiBoolean(prompt, opt) {
        const uiContext = await this.buildObservedUIContext();
        return this.deps.runBoolean(prompt, uiContext, opt);
    }
    async buildObservedUIContext() {
        (0, utils_namespaceObject.assert)(this.stopped && this.representative, 'call observer.stop() before asserting on the observed window');
        const representative = this.representative;
        if (this.preDecodePromise) {
            await this.preDecodePromise;
            this.preDecodePromise = null;
        }
        const sampled = this.frames;
        const uniqueRefs = this.dedupeRefs(sampled);
        const uncachedRefs = uniqueRefs.filter((r)=>!this.decodedCache.has(r.ref));
        if (uncachedRefs.length > 0) {
            const results = this.source ? await this.shrinkAllIfNeeded(await this.source.decode(uncachedRefs)) : uncachedRefs.map((f)=>f.ref);
            (0, utils_namespaceObject.assert)(results.length === uncachedRefs.length, 'frame source decode() must return one image per frame handle');
            uncachedRefs.forEach((ref, i)=>{
                this.decodedCache.set(ref.ref, results[i]);
            });
            debug(`decoded ${uncachedRefs.length} new frames (${uniqueRefs.length - uncachedRefs.length} from cache)`);
        }
        const indexByRef = new Map();
        uniqueRefs.forEach((ref, i)=>indexByRef.set(ref.ref, i));
        const sequence = sampled.map((frame)=>external_screenshot_item_js_namespaceObject.ScreenshotItem.create(this.decodedCache.get(frame.ref), frame.capturedAt));
        const totalFrames = sequence.length + 1;
        if (totalFrames > MAX_FRAMES_TO_MODEL) warnObserver(`WARNING: sending ${totalFrames} frames to the model (soft limit ${MAX_FRAMES_TO_MODEL}). Consider increasing intervalMs or decreasing maxFrames to reduce token cost.`);
        debug(`observed context: ${sequence.length}+1 frames (buffered: ${this.frames.length}, unique: ${uniqueRefs.length}, newly decoded: ${uncachedRefs.length})`);
        return {
            ...representative,
            screenshotSequence: [
                ...sequence,
                representative.screenshot
            ]
        };
    }
    async captureOnce() {
        try {
            if (this.source) {
                const frame = this.source.latest();
                if (frame) this.pushFrame(frame);
                return;
            }
            let base64 = await this.deps.screenshot();
            if (this.screenshotShrinkFactor > 1) {
                const { width, height } = await (0, img_namespaceObject.imageInfoOfBase64)(base64);
                base64 = await (0, img_namespaceObject.resizeImgBase64)(base64, {
                    width: Math.round(width / this.screenshotShrinkFactor),
                    height: Math.round(height / this.screenshotShrinkFactor)
                });
            }
            this.pushFrame({
                ref: base64,
                capturedAt: Date.now()
            });
        } catch (error) {
            debug(`frame capture failed, skipping tick: ${error}`);
        }
    }
    async shrinkAllIfNeeded(base64s) {
        if (this.screenshotShrinkFactor <= 1) return base64s;
        const factor = this.screenshotShrinkFactor;
        return Promise.all(base64s.map(async (b64)=>{
            const { width, height } = await (0, img_namespaceObject.imageInfoOfBase64)(b64);
            return (0, img_namespaceObject.resizeImgBase64)(b64, {
                width: Math.round(width / factor),
                height: Math.round(height / factor)
            });
        }));
    }
    async runLoop() {
        while(!this.stopped){
            const tickStart = Date.now();
            await this.captureOnce();
            while(!this.stopped && Date.now() - tickStart < this.intervalMs)await new Promise((resolve)=>setTimeout(resolve, 50));
        }
    }
    pushFrame(frame) {
        if (this.frames.length >= this.maxFrames) {
            this.frames = this.thinBuffer(this.frames);
            debug(`frame buffer thinned to ${this.frames.length} frames`);
        }
        this.frames.push(frame);
    }
    thinBuffer(frames) {
        if (frames.length <= 1) return frames;
        const isChangePoint = new Array(frames.length).fill(false);
        isChangePoint[0] = true;
        for(let i = 1; i < frames.length; i++)if (frames[i].ref !== frames[i - 1].ref) isChangePoint[i] = true;
        isChangePoint[frames.length - 1] = true;
        let result = [];
        let staticCounter = 0;
        for(let i = 0; i < frames.length; i++)if (isChangePoint[i]) {
            result.push(frames[i]);
            staticCounter = 0;
        } else if (staticCounter % 2 === 0) {
            result.push(frames[i]);
            staticCounter++;
        } else staticCounter++;
        if (result.length > this.maxFrames) {
            const step = result.length / this.maxFrames;
            const sampled = [];
            for(let i = 0; i < this.maxFrames; i++)sampled.push(result[Math.floor(i * step)]);
            sampled[this.maxFrames - 1] = result[result.length - 1];
            debug(`hard cap: uniformly sampled ${this.maxFrames} frames from ${result.length} change-point frames`);
            result = sampled;
        }
        return result;
    }
    dedupeRefs(frames) {
        const seen = new Set();
        const result = [];
        for (const frame of frames)if (!seen.has(frame.ref)) {
            seen.add(frame.ref);
            result.push(frame);
        }
        return result;
    }
    constructor(deps, opt){
        _define_property(this, "deps", void 0);
        _define_property(this, "frames", void 0);
        _define_property(this, "source", void 0);
        _define_property(this, "usingFallback", void 0);
        _define_property(this, "stopped", void 0);
        _define_property(this, "loopPromise", void 0);
        _define_property(this, "representative", void 0);
        _define_property(this, "watchdogTimer", void 0);
        _define_property(this, "decodedCache", void 0);
        _define_property(this, "preDecodePromise", void 0);
        _define_property(this, "intervalMs", void 0);
        _define_property(this, "maxFrames", void 0);
        _define_property(this, "watchdogMs", void 0);
        _define_property(this, "screenshotShrinkFactor", void 0);
        this.deps = deps;
        this.frames = [];
        this.source = null;
        this.usingFallback = false;
        this.stopped = false;
        this.loopPromise = null;
        this.representative = null;
        this.watchdogTimer = null;
        this.decodedCache = new Map();
        this.preDecodePromise = null;
        this.intervalMs = Math.max(MIN_INTERVAL_MS, opt?.intervalMs ?? DEFAULT_INTERVAL_MS);
        this.maxFrames = Math.max(2, opt?.maxFrames ?? DEFAULT_MAX_FRAMES);
        this.watchdogMs = opt?.watchdogMs ?? DEFAULT_WATCHDOG_MS;
        this.screenshotShrinkFactor = deps.screenshotShrinkFactor ?? 1;
    }
}
exports.UIObserver = __webpack_exports__.UIObserver;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "UIObserver"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=ui-observer.js.map