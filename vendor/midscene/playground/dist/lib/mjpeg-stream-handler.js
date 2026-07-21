"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
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
    MjpegStreamHandler: ()=>MjpegStreamHandler
});
const external_node_http_namespaceObject = require("node:http");
var external_node_http_default = /*#__PURE__*/ __webpack_require__.n(external_node_http_namespaceObject);
const logger_namespaceObject = require("@midscene/shared/logger");
const external_mjpeg_hub_js_namespaceObject = require("./mjpeg-hub.js");
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
const debugMjpeg = (0, logger_namespaceObject.getDebug)('playground:mjpeg', {
    console: true
});
const NEGATIVE_CACHE_MS = 10000;
const NATIVE_PROBE_INTERVAL_MS = 3000;
const INTERFACE_MJPEG_INITIAL_FRAME_TIMEOUT_MS = 1500;
const INTERFACE_MJPEG_IDLE_STOP_MS = 2000;
const DEFAULT_FPS = 10;
const MAX_FPS = 30;
const MAX_ERROR_BACKOFF_MS = 3000;
const ERROR_LOG_THRESHOLD = 3;
function toMjpegFrameDataUrl(data, contentType) {
    if (data.startsWith('data:')) return data;
    return `data:${contentType || 'image/jpeg'};base64,${data}`;
}
class MjpegStreamHandler {
    reset() {
        this.nativeAvailable = null;
        this.nativeFailedAt = null;
        this.lastPollingFrame = void 0;
        this.interfaceMjpegHub.stopProducer();
    }
    shutdown() {
        this.interfaceMjpegHub.shutdown();
    }
    getLastFrameBase64() {
        const interfaceFrame = this.interfaceMjpegHub.getLastFrame();
        if (interfaceFrame) return toMjpegFrameDataUrl(interfaceFrame.data, interfaceFrame.contentType);
        return this.lastPollingFrame ? toMjpegFrameDataUrl(this.lastPollingFrame) : void 0;
    }
    async serve(req, res) {
        const nativeUrl = this.source.getNativeUrl();
        const recentlyFailed = false === this.nativeAvailable && null !== this.nativeFailedAt && Date.now() - this.nativeFailedAt < NEGATIVE_CACHE_MS;
        if (nativeUrl && !recentlyFailed) {
            const proxied = await this.probeAndProxyNative(nativeUrl, req, res);
            if (proxied) return;
        }
        const activeInterface = this.source.getActiveInterface();
        if (activeInterface) {
            const interfaceStreamStarted = await this.interfaceMjpegHub.streamRequest(req, res, activeInterface, async (startupError)=>await this.source.recoverFromPreviewError?.(startupError, 'interface MJPEG startup') ?? null);
            if (interfaceStreamStarted) return;
        }
        if (!this.source.canTakeScreenshot()) return void res.status(500).json({
            error: 'Screenshot method not available on current interface'
        });
        await this.streamPolling(req, res);
    }
    probeAndProxyNative(nativeUrl, req, res) {
        return new Promise((resolve)=>{
            debugMjpeg(`trying native stream from ${nativeUrl}`);
            const proxyReq = external_node_http_default().get(nativeUrl, (proxyRes)=>{
                const statusCode = proxyRes.statusCode ?? 0;
                if (statusCode >= 400) {
                    this.nativeAvailable = false;
                    this.nativeFailedAt = Date.now();
                    proxyRes.resume();
                    debugMjpeg(`native stream returned HTTP ${statusCode}, using polling mode`);
                    resolve(false);
                    return;
                }
                this.nativeAvailable = true;
                this.nativeFailedAt = null;
                debugMjpeg('streaming via native WDA MJPEG server');
                const contentType = proxyRes.headers['content-type'];
                if (contentType) res.setHeader('Content-Type', contentType);
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Connection', 'keep-alive');
                proxyRes.pipe(res);
                req.on('close', ()=>proxyReq.destroy());
                resolve(true);
            });
            proxyReq.on('error', (err)=>{
                this.nativeAvailable = false;
                this.nativeFailedAt = Date.now();
                debugMjpeg(`native stream unavailable (${err.message}), using polling mode`);
                resolve(false);
            });
        });
    }
    probeNativeLiveness(nativeUrl) {
        return new Promise((resolve)=>{
            const probe = external_node_http_default().get(nativeUrl, (probeRes)=>{
                const statusCode = probeRes.statusCode ?? 0;
                const reachable = statusCode >= 200 && statusCode < 400;
                probeRes.destroy();
                resolve(reachable);
            });
            probe.setTimeout(1000, ()=>{
                probe.destroy();
                resolve(false);
            });
            probe.on('error', ()=>resolve(false));
        });
    }
    async streamPolling(req, res) {
        const parsedFps = Number(req.query.fps);
        const fps = Math.min(Math.max(Number.isNaN(parsedFps) ? DEFAULT_FPS : parsedFps, 1), MAX_FPS);
        const interval = Math.round(1000 / fps);
        const boundary = 'mjpeg-boundary';
        debugMjpeg(`streaming via polling mode (${fps}fps)`);
        res.setHeader('Content-Type', `multipart/x-mixed-replace; boundary=${boundary}`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Connection', 'keep-alive');
        let stopped = false;
        let consecutiveErrors = 0;
        const nativeUrl = this.source.getNativeUrl();
        let probeTimer;
        if (nativeUrl) probeTimer = setInterval(async ()=>{
            if (stopped) return;
            const reachable = await this.probeNativeLiveness(nativeUrl);
            if (reachable && !stopped) {
                debugMjpeg('native stream came online, ending polling so client reconnects');
                this.nativeAvailable = true;
                this.nativeFailedAt = null;
                stopped = true;
                try {
                    res.destroy();
                } catch  {}
            }
        }, NATIVE_PROBE_INTERVAL_MS);
        req.on('close', ()=>{
            stopped = true;
            if (probeTimer) clearInterval(probeTimer);
        });
        while(!stopped){
            if (!this.source.isAgentReady()) {
                await new Promise((r)=>setTimeout(r, 200));
                continue;
            }
            const frameStart = Date.now();
            try {
                const base64 = await this.source.takeScreenshot();
                if (stopped) break;
                consecutiveErrors = 0;
                this.lastPollingFrame = base64;
                (0, external_mjpeg_hub_js_namespaceObject.writeMjpegFrame)(res, boundary, {
                    data: base64,
                    contentType: 'image/jpeg'
                });
            } catch (err) {
                if (stopped) break;
                const recoveredInterface = await this.source.recoverFromPreviewError?.(err, 'polling MJPEG frame capture');
                if (recoveredInterface) {
                    consecutiveErrors = 0;
                    continue;
                }
                consecutiveErrors++;
                if (consecutiveErrors <= ERROR_LOG_THRESHOLD) console.error('MJPEG frame error:', err);
                else if (consecutiveErrors === ERROR_LOG_THRESHOLD + 1) console.error('MJPEG: suppressing further errors, retrying silently...');
                const backoff = Math.min(1000 * consecutiveErrors, MAX_ERROR_BACKOFF_MS);
                await new Promise((r)=>setTimeout(r, backoff));
                continue;
            }
            const elapsed = Date.now() - frameStart;
            const remaining = interval - elapsed;
            if (remaining > 0) await new Promise((r)=>setTimeout(r, remaining));
        }
        if (probeTimer) clearInterval(probeTimer);
    }
    constructor(source){
        _define_property(this, "source", void 0);
        _define_property(this, "nativeAvailable", void 0);
        _define_property(this, "nativeFailedAt", void 0);
        _define_property(this, "lastPollingFrame", void 0);
        _define_property(this, "interfaceMjpegHub", void 0);
        this.source = source;
        this.nativeAvailable = null;
        this.nativeFailedAt = null;
        this.interfaceMjpegHub = (0, external_mjpeg_hub_js_namespaceObject.createInterfaceMjpegHub)({
            initialFrameTimeoutMs: INTERFACE_MJPEG_INITIAL_FRAME_TIMEOUT_MS,
            idleStopMs: INTERFACE_MJPEG_IDLE_STOP_MS,
            debug: debugMjpeg
        });
    }
}
exports.MjpegStreamHandler = __webpack_exports__.MjpegStreamHandler;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "MjpegStreamHandler"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=mjpeg-stream-handler.js.map