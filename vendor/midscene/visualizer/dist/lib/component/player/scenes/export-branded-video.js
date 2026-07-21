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
    exportBrandedVideo: ()=>exportBrandedVideo,
    isExportRenderStalled: ()=>isExportRenderStalled,
    projectNativeRectToExportViewport: ()=>projectNativeRectToExportViewport,
    resolveExportCamera: ()=>resolveExportCamera
});
const index_js_namespaceObject = require("../../../utils/index.js");
const highlight_element_js_namespaceObject = require("../../../utils/highlight-element.js");
const external_derive_frame_state_js_namespaceObject = require("./derive-frame-state.js");
const external_playback_layout_js_namespaceObject = require("./playback-layout.js");
const external_pointer_layout_js_namespaceObject = require("./pointer-layout.js");
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
function export_branded_video_ownKeys(object, enumerableOnly) {
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
    else export_branded_video_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const W = 960;
const H = 540;
const POINTER_PHASE = 0.375;
const CROSSFADE_FRAMES = 10;
const EXPORT_STALL_GRACE_MS = 2000;
const EXPORT_STALL_GRACE_FRAMES = 10;
let activeExport = false;
function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function isExportRenderStalled(elapsedSinceLastFrameMs, frameDurationMs) {
    return elapsedSinceLastFrameMs > Math.max(EXPORT_STALL_GRACE_MS, frameDurationMs * EXPORT_STALL_GRACE_FRAMES);
}
function resolveExportCamera(prevCamera, camera, imageWidth, progress, autoZoom) {
    if (!autoZoom) return {
        camLeft: 0,
        camTop: 0,
        camWidth: imageWidth
    };
    return {
        camLeft: lerp(prevCamera.left, camera.left, progress),
        camTop: lerp(prevCamera.top, camera.top, progress),
        camWidth: lerp(prevCamera.width, camera.width, progress)
    };
}
function loadImage(src) {
    return new Promise((resolve, reject)=>{
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = ()=>resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
function projectNativeRectToExportViewport(rect, cameraTransform, viewport) {
    const scaleX = viewport.contentWidth / viewport.imageWidth;
    const scaleY = viewport.contentHeight / viewport.imageHeight;
    return {
        left: viewport.offsetX + (rect.left * scaleX + cameraTransform.tx) * cameraTransform.zoom,
        top: viewport.offsetY + (rect.top * scaleY + cameraTransform.ty) * cameraTransform.zoom,
        width: rect.width * scaleX * cameraTransform.zoom,
        height: rect.height * scaleY * cameraTransform.zoom
    };
}
function drawInsightOverlays(ctx, insights, cameraTransform, viewport) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.offsetX, viewport.offsetY, viewport.contentWidth, viewport.contentHeight);
    ctx.clip();
    for (const insight of insights)if (!(insight.alpha <= 0)) {
        ctx.save();
        ctx.globalAlpha *= insight.alpha;
        if (insight.highlightElement) {
            const highlightBox = (0, highlight_element_js_namespaceObject.getCenterHighlightBox)(insight.highlightElement);
            const projected = projectNativeRectToExportViewport(highlightBox, cameraTransform, viewport);
            ctx.fillStyle = 'rgba(253, 89, 7, 0.4)';
            ctx.fillRect(projected.left, projected.top, projected.width, projected.height);
            ctx.strokeStyle = '#fd5907';
            ctx.lineWidth = 1;
            ctx.strokeRect(projected.left, projected.top, projected.width, projected.height);
            ctx.shadowColor = 'rgba(51, 51, 51, 0.4)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            ctx.strokeRect(projected.left, projected.top, projected.width, projected.height);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        if (insight.searchArea) {
            const projected = projectNativeRectToExportViewport(insight.searchArea, cameraTransform, viewport);
            ctx.fillStyle = 'rgba(2, 131, 145, 0.4)';
            ctx.fillRect(projected.left, projected.top, projected.width, projected.height);
            ctx.strokeStyle = '#028391';
            ctx.lineWidth = 1;
            ctx.strokeRect(projected.left, projected.top, projected.width, projected.height);
        }
        ctx.restore();
    }
    ctx.restore();
}
function drawSpinningPointer(ctx, img, x, y, layout, elapsedMs) {
    const progress = (Math.sin(elapsedMs / 500 - Math.PI / 2) + 1) / 2;
    const rotation = progress * Math.PI * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(img, -layout.centerOffsetX, -layout.centerOffsetY, layout.width, layout.height);
    ctx.restore();
}
function drawSteps(ctx, stepsFrame, frameMap, imgCache, pointerCache, spinnerImg, autoZoom) {
    const { scriptFrames, imageWidth: baseW, imageHeight: baseH, fps } = frameMap;
    const st = (0, external_derive_frame_state_js_namespaceObject.deriveFrameState)(scriptFrames, stepsFrame, baseW, baseH, fps);
    if (!st.img) return;
    const { img, prevImg, imageWidth: imgW, imageHeight: imgH, camera, prevCamera, pointerMoved, imageChanged, rawProgress, frameInScript: fInScript, spinning, spinningElapsedMs, currentPointerImg, pointerVisible, insights } = st;
    const pT = autoZoom ? pointerMoved ? Math.min(rawProgress / POINTER_PHASE, 1) : rawProgress : 1;
    const cT = pointerMoved ? rawProgress <= POINTER_PHASE ? 0 : Math.min((rawProgress - POINTER_PHASE) / (1 - POINTER_PHASE), 1) : rawProgress;
    const { camLeft: camL, camTop: camT2, camWidth: camW } = resolveExportCamera(prevCamera, camera, imgW, cT, autoZoom);
    const ptrX = lerp(prevCamera.pointerLeft, camera.pointerLeft, pT);
    const ptrY = lerp(prevCamera.pointerTop, camera.pointerTop, pT);
    const zoom = imgW / camW;
    const { offsetX, offsetY, contentWidth, contentHeight } = (0, external_playback_layout_js_namespaceObject.getPlaybackViewport)(W, H, imgW, imgH);
    const tx = contentWidth / imgW * -camL;
    const ty = contentHeight / imgH * -camT2;
    const crossAlpha = imageChanged ? clamp(fInScript / CROSSFADE_FRAMES, 0, 1) : 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const drawImg = (src, alpha)=>{
        const imgEl = imgCache.get(src);
        if (!imgEl || alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.clip();
        ctx.translate(offsetX + tx * zoom, offsetY + ty * zoom);
        ctx.scale(zoom, zoom);
        ctx.drawImage(imgEl, 0, 0, contentWidth, contentHeight);
        ctx.restore();
    };
    if (imageChanged && prevImg && crossAlpha < 1) drawImg(prevImg, 1 - crossAlpha);
    drawImg(img, imageChanged ? crossAlpha : 1);
    if (insights.length > 0) drawInsightOverlays(ctx, insights, {
        zoom,
        tx,
        ty
    }, {
        offsetX,
        offsetY,
        contentWidth,
        contentHeight,
        imageWidth: imgW,
        imageHeight: imgH
    });
    const camH = imgH / imgW * camW;
    const sX = offsetX + (ptrX - camL) / camW * contentWidth;
    const sY = offsetY + (ptrY - camT2) / camH * contentHeight;
    const pointerLayout = (0, external_pointer_layout_js_namespaceObject.resolveExportPointerLayout)(imgW, contentWidth);
    const spinnerLayout = (0, external_pointer_layout_js_namespaceObject.resolveSpinnerLayout)(pointerLayout);
    var _pointerCache_get;
    const cursorImg = null != (_pointerCache_get = pointerCache.get(currentPointerImg)) ? _pointerCache_get : pointerCache.get(index_js_namespaceObject.mousePointer);
    const showCursor = (0, external_derive_frame_state_js_namespaceObject.shouldRenderCursor)(pointerVisible, camera, prevCamera, imgW, imgH);
    if (spinning && spinnerImg) drawSpinningPointer(ctx, spinnerImg, sX, sY, _object_spread_props(_object_spread({}, pointerLayout), {
        width: spinnerLayout.size,
        height: spinnerLayout.size,
        centerOffsetX: spinnerLayout.centerOffset,
        centerOffsetY: spinnerLayout.centerOffset
    }), spinningElapsedMs);
    if (!spinning && showCursor && cursorImg) ctx.drawImage(cursorImg, sX - pointerLayout.hotspotX, sY - pointerLayout.hotspotY, pointerLayout.width, pointerLayout.height);
}
function exportBrandedVideo(frameMap, options, onProgress) {
    return _async_to_generator(function*() {
        if (activeExport) throw new Error('Video export is already in progress');
        activeExport = true;
        try {
            yield runExportBrandedVideo(frameMap, options, onProgress);
        } finally{
            activeExport = false;
        }
    })();
}
function runExportBrandedVideo(frameMap, options, onProgress) {
    return _async_to_generator(function*() {
        const { totalDurationInFrames: total, fps } = frameMap;
        var _options_autoZoom;
        const autoZoom = null != (_options_autoZoom = null == options ? void 0 : options.autoZoom) ? _options_autoZoom : true;
        const imgSrcs = new Set();
        for (const sf of frameMap.scriptFrames)if (sf.img) imgSrcs.add(sf.img);
        const imgCache = new Map();
        yield Promise.all([
            ...imgSrcs
        ].map((src)=>_async_to_generator(function*() {
                try {
                    imgCache.set(src, (yield loadImage(src)));
                } catch (e) {}
            })()));
        const pointerSrcs = new Set([
            index_js_namespaceObject.mousePointer
        ]);
        for (const sf of frameMap.scriptFrames)if (sf.pointerImg) pointerSrcs.add(sf.pointerImg);
        const pointerCache = new Map();
        yield Promise.all([
            ...pointerSrcs
        ].map((src)=>_async_to_generator(function*() {
                try {
                    pointerCache.set(src, (yield loadImage(src)));
                } catch (e) {}
            })()));
        let spinnerImg = null;
        try {
            spinnerImg = yield loadImage(index_js_namespaceObject.mouseLoading);
        } catch (e) {}
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        const stream = canvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, {
            mimeType: 'video/webm'
        });
        const chunks = [];
        recorder.ondataavailable = (e)=>{
            if (e.data.size > 0) chunks.push(e.data);
        };
        return new Promise((resolve, reject)=>{
            let stoppedByError = null;
            let settled = false;
            let nextFrame = 0;
            let nextFrameDueAt = performance.now();
            let lastFrameAt = nextFrameDueAt;
            let stopTimer = null;
            let renderTimer = null;
            const frameDuration = 1000 / fps;
            const cleanup = ()=>{
                if (stopTimer) clearTimeout(stopTimer);
                if (renderTimer) clearTimeout(renderTimer);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                stream.getTracks().forEach((track)=>track.stop());
            };
            const finishWithError = (error)=>{
                if (settled || stoppedByError) return;
                stoppedByError = error;
                if ('inactive' !== recorder.state) recorder.stop();
                else {
                    cleanup();
                    settled = true;
                    reject(error);
                }
            };
            const handleVisibilityChange = ()=>{
                if (document.hidden) finishWithError(new Error('Video export was interrupted because the report tab was hidden'));
            };
            recorder.onerror = ()=>{
                finishWithError(new Error('MediaRecorder error'));
            };
            recorder.onstop = ()=>{
                cleanup();
                if (settled) return;
                settled = true;
                if (stoppedByError) return void reject(stoppedByError);
                if (0 === chunks.length) return void reject(new Error('No video data'));
                const blob = new Blob(chunks, {
                    type: 'video/webm'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'midscene_replay.webm';
                a.click();
                setTimeout(()=>URL.revokeObjectURL(url), 1000);
                resolve();
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            recorder.start();
            const scheduleNextFrame = ()=>{
                const delay = Math.max(0, nextFrameDueAt - performance.now());
                renderTimer = setTimeout(()=>{
                    requestAnimationFrame(renderFrame);
                }, delay);
            };
            const renderFrame = (timestamp)=>{
                if (settled || 'inactive' === recorder.state) return;
                if (nextFrame > 0 && isExportRenderStalled(timestamp - lastFrameAt, frameDuration)) return void finishWithError(new Error('Video export was interrupted because rendering stalled'));
                lastFrameAt = timestamp;
                ctx.clearRect(0, 0, W, H);
                drawSteps(ctx, nextFrame, frameMap, imgCache, pointerCache, spinnerImg, autoZoom);
                null == onProgress || onProgress((nextFrame + 1) / total);
                nextFrame += 1;
                if (nextFrame < total) {
                    nextFrameDueAt += frameDuration;
                    scheduleNextFrame();
                } else stopTimer = setTimeout(()=>{
                    if ('inactive' !== recorder.state) recorder.stop();
                }, 2 * frameDuration);
            };
            requestAnimationFrame((timestamp)=>{
                lastFrameAt = timestamp;
                nextFrameDueAt = timestamp;
                renderFrame(timestamp);
            });
        });
    })();
}
exports.exportBrandedVideo = __webpack_exports__.exportBrandedVideo;
exports.isExportRenderStalled = __webpack_exports__.isExportRenderStalled;
exports.projectNativeRectToExportViewport = __webpack_exports__.projectNativeRectToExportViewport;
exports.resolveExportCamera = __webpack_exports__.resolveExportCamera;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "exportBrandedVideo",
    "isExportRenderStalled",
    "projectNativeRectToExportViewport",
    "resolveExportCamera"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
