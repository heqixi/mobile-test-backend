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
    FPS: ()=>FPS,
    calculateFrameMap: ()=>calculateFrameMap
});
const FPS = 30;
function calculateFrameMap(scripts, options) {
    let baseImageWidth = (null == options ? void 0 : options.imageWidth) || 1920;
    let baseImageHeight = (null == options ? void 0 : options.imageHeight) || 1080;
    for (const s of scripts)if (('img' === s.type || 'insight' === s.type) && s.img) {
        baseImageWidth = s.imageWidth || baseImageWidth;
        baseImageHeight = s.imageHeight || baseImageHeight;
        break;
    }
    const scriptFrames = [];
    let currentFrame = 0;
    for (const script of scripts){
        const durationMs = script.duration;
        switch(script.type){
            case 'sleep':
                {
                    const frames = Math.ceil(durationMs / 1000 * FPS);
                    scriptFrames.push({
                        type: 'sleep',
                        startFrame: currentFrame,
                        durationInFrames: frames,
                        title: script.title,
                        subTitle: script.subTitle,
                        taskId: script.taskId
                    });
                    currentFrame += frames;
                    break;
                }
            case 'img':
                {
                    const frames = Math.max(Math.ceil(durationMs / 1000 * FPS), 1);
                    const camera = script.camera;
                    const iw = script.imageWidth || baseImageWidth;
                    const ih = script.imageHeight || baseImageHeight;
                    const sf = {
                        type: 'img',
                        startFrame: currentFrame,
                        durationInFrames: frames,
                        img: script.img,
                        imageWidth: iw,
                        imageHeight: ih,
                        title: script.title,
                        subTitle: script.subTitle,
                        taskId: script.taskId
                    };
                    if (camera) {
                        var _camera_pointerLeft, _camera_pointerTop;
                        sf.cameraTarget = {
                            left: camera.left,
                            top: camera.top,
                            width: camera.width,
                            pointerLeft: null != (_camera_pointerLeft = camera.pointerLeft) ? _camera_pointerLeft : Math.round(iw / 2),
                            pointerTop: null != (_camera_pointerTop = camera.pointerTop) ? _camera_pointerTop : Math.round(ih / 2)
                        };
                    }
                    scriptFrames.push(sf);
                    currentFrame += frames;
                    break;
                }
            case 'insight':
                {
                    const insightPhaseFrames = Math.max(Math.ceil(durationMs / 1000 * FPS), 1);
                    const cameraDurationMs = script.insightCameraDuration || 0;
                    const cameraPhaseFrames = Math.ceil(cameraDurationMs / 1000 * FPS);
                    const totalFrames = insightPhaseFrames + cameraPhaseFrames;
                    const iw = script.imageWidth || baseImageWidth;
                    const ih = script.imageHeight || baseImageHeight;
                    const camera = script.camera;
                    const sf = {
                        type: 'insight',
                        startFrame: currentFrame,
                        durationInFrames: totalFrames,
                        img: script.img,
                        imageWidth: iw,
                        imageHeight: ih,
                        insightPhaseFrames,
                        cameraPhaseFrames,
                        highlightElement: script.highlightElement,
                        searchArea: script.searchArea,
                        title: script.title,
                        subTitle: script.subTitle,
                        taskId: script.taskId
                    };
                    if (camera) {
                        var _camera_pointerLeft1, _camera_pointerTop1;
                        sf.cameraTarget = {
                            left: camera.left,
                            top: camera.top,
                            width: camera.width,
                            pointerLeft: null != (_camera_pointerLeft1 = camera.pointerLeft) ? _camera_pointerLeft1 : Math.round(iw / 2),
                            pointerTop: null != (_camera_pointerTop1 = camera.pointerTop) ? _camera_pointerTop1 : Math.round(ih / 2)
                        };
                    }
                    scriptFrames.push(sf);
                    currentFrame += totalFrames;
                    break;
                }
            case 'clear-insight':
                {
                    const frames = Math.max(Math.ceil(durationMs / 1000 * FPS), 1);
                    scriptFrames.push({
                        type: 'clear-insight',
                        startFrame: currentFrame,
                        durationInFrames: frames,
                        title: script.title,
                        subTitle: script.subTitle,
                        taskId: script.taskId
                    });
                    currentFrame += frames;
                    break;
                }
            case 'spinning-pointer':
                {
                    const frames = Math.max(Math.ceil(durationMs / 1000 * FPS), 1);
                    scriptFrames.push({
                        type: 'spinning-pointer',
                        startFrame: currentFrame,
                        durationInFrames: frames,
                        title: script.title,
                        subTitle: script.subTitle,
                        taskId: script.taskId
                    });
                    currentFrame += frames;
                    break;
                }
            case 'pointer':
                scriptFrames.push({
                    type: 'pointer',
                    startFrame: currentFrame,
                    durationInFrames: 0,
                    pointerImg: script.img,
                    title: script.title,
                    subTitle: script.subTitle,
                    taskId: script.taskId
                });
                break;
        }
    }
    const stepsDurationInFrames = Math.max(currentFrame, 1);
    return {
        scriptFrames,
        totalDurationInFrames: stepsDurationInFrames,
        fps: FPS,
        stepsDurationInFrames,
        imageWidth: baseImageWidth,
        imageHeight: baseImageHeight
    };
}
exports.FPS = __webpack_exports__.FPS;
exports.calculateFrameMap = __webpack_exports__.calculateFrameMap;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "FPS",
    "calculateFrameMap"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
