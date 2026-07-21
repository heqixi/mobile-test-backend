import { mousePointer } from "../../../utils/index.mjs";
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
function derive_frame_state_ownKeys(object, enumerableOnly) {
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
    else derive_frame_state_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
function createDefaultCameraState(imageWidth, imageHeight) {
    return {
        left: 0,
        top: 0,
        width: imageWidth,
        pointerLeft: Math.round(imageWidth / 2),
        pointerTop: Math.round(imageHeight / 2)
    };
}
function updateImage(acc, sf, baseW, baseH) {
    if (!sf.img) return;
    if (acc.img && sf.img !== acc.img) {
        acc.prevImg = acc.img;
        acc.imageChanged = true;
    }
    const nextImgW = sf.imageWidth || baseW;
    const nextImgH = sf.imageHeight || baseH;
    const dimensionsChanged = acc.imgW !== nextImgW || acc.imgH !== nextImgH;
    acc.img = sf.img;
    acc.imgW = nextImgW;
    acc.imgH = nextImgH;
    if (dimensionsChanged) {
        const resetCamera = createDefaultCameraState(nextImgW, nextImgH);
        acc.camera = _object_spread({}, resetCamera);
        acc.prevCamera = _object_spread({}, resetCamera);
        acc.pointerMoved = false;
    }
}
function checkPointerMoved(prev, cur) {
    return Math.abs(prev.pointerLeft - cur.pointerLeft) > 1 || Math.abs(prev.pointerTop - cur.pointerTop) > 1;
}
function shouldRenderCursor(pointerVisible, camera, prevCamera, imageWidth, imageHeight) {
    const centerX = Math.round(imageWidth / 2);
    const centerY = Math.round(imageHeight / 2);
    return pointerVisible || Math.abs(camera.pointerLeft - centerX) > 1 || Math.abs(camera.pointerTop - centerY) > 1 || Math.abs(prevCamera.pointerLeft - centerX) > 1 || Math.abs(prevCamera.pointerTop - centerY) > 1;
}
function handleImg(acc, sf, frame, baseW, baseH) {
    updateImage(acc, sf, baseW, baseH);
    const sfEnd = sf.startFrame + sf.durationInFrames;
    if (sf.cameraTarget) {
        acc.prevCamera = _object_spread({}, acc.camera);
        acc.camera = _object_spread({}, sf.cameraTarget);
        acc.pointerMoved = checkPointerMoved(acc.prevCamera, acc.camera);
    } else if (frame >= sfEnd) {
        acc.pointerMoved = false;
        acc.imageChanged = false;
    }
    acc.spinning = false;
}
function handleInsight(acc, sf, frame, baseW, baseH) {
    updateImage(acc, sf, baseW, baseH);
    const alreadyAdded = acc.insights.some((ai)=>ai.highlightElement === sf.highlightElement && ai.searchArea === sf.searchArea);
    if (!alreadyAdded) acc.insights.push({
        highlightElement: sf.highlightElement,
        searchArea: sf.searchArea,
        alpha: 1
    });
    if (sf.cameraTarget && void 0 !== sf.insightPhaseFrames) {
        const cameraStartFrame = sf.startFrame + sf.insightPhaseFrames;
        if (frame >= cameraStartFrame) {
            acc.prevCamera = _object_spread({}, acc.camera);
            acc.camera = _object_spread({}, sf.cameraTarget);
            const cameraFrameIn = frame - cameraStartFrame;
            const cameraDur = sf.cameraPhaseFrames || 1;
            acc.rawProgress = Math.min(cameraFrameIn / cameraDur, 1);
            acc.pointerMoved = checkPointerMoved(acc.prevCamera, acc.camera);
        }
    }
    acc.spinning = false;
}
function handleClearInsight(acc, sf, frame) {
    const sfEnd = sf.startFrame + sf.durationInFrames;
    const alpha = 1 - acc.rawProgress;
    acc.insights = acc.insights.map((ai)=>_object_spread_props(_object_spread({}, ai), {
            alpha
        }));
    if (frame >= sfEnd) acc.insights = [];
    acc.spinning = false;
}
function handleSpinningPointer(acc, fps) {
    acc.spinning = true;
    acc.spinningElapsedMs = acc.frameInScript / fps * 1000;
}
function deriveFrameState(scriptFrames, frame, baseW, baseH, fps) {
    const defaultCamera = createDefaultCameraState(baseW, baseH);
    const acc = {
        img: '',
        imgW: baseW,
        imgH: baseH,
        camera: _object_spread({}, defaultCamera),
        prevCamera: _object_spread({}, defaultCamera),
        prevImg: null,
        insights: [],
        spinning: false,
        spinningElapsedMs: 0,
        pointerImg: mousePointer,
        pointerVisible: false,
        title: '',
        subTitle: '',
        taskId: void 0,
        frameInScript: 0,
        scriptIndex: 0,
        imageChanged: false,
        pointerMoved: false,
        rawProgress: 0
    };
    for(let i = 0; i < scriptFrames.length; i++){
        const sf = scriptFrames[i];
        const sfEnd = sf.startFrame + sf.durationInFrames;
        if (0 === sf.durationInFrames) {
            if (sf.startFrame <= frame) {
                if ('pointer' === sf.type && sf.pointerImg) {
                    acc.pointerImg = sf.pointerImg;
                    acc.pointerVisible = true;
                }
                acc.title = sf.title || acc.title;
                acc.subTitle = sf.subTitle || acc.subTitle;
                var _sf_taskId;
                acc.taskId = null != (_sf_taskId = sf.taskId) ? _sf_taskId : acc.taskId;
                acc.scriptIndex = i;
            }
            continue;
        }
        if (frame < sf.startFrame) break;
        acc.title = sf.title || acc.title;
        acc.subTitle = sf.subTitle || acc.subTitle;
        var _sf_taskId1;
        acc.taskId = null != (_sf_taskId1 = sf.taskId) ? _sf_taskId1 : acc.taskId;
        acc.scriptIndex = i;
        acc.frameInScript = frame - sf.startFrame;
        acc.rawProgress = Math.min(acc.frameInScript / sf.durationInFrames, 1);
        switch(sf.type){
            case 'img':
                handleImg(acc, sf, frame, baseW, baseH);
                break;
            case 'insight':
                handleInsight(acc, sf, frame, baseW, baseH);
                break;
            case 'clear-insight':
                handleClearInsight(acc, sf, frame);
                break;
            case 'spinning-pointer':
                handleSpinningPointer(acc, fps);
                break;
            case 'sleep':
                acc.spinning = false;
                break;
        }
        if (frame >= sfEnd) {
            if ('clear-insight' !== sf.type) acc.imageChanged = false;
            acc.pointerMoved = false;
            acc.rawProgress = 1;
            if (sf.cameraTarget) acc.prevCamera = _object_spread({}, acc.camera);
        }
    }
    if (!acc.img) {
        const firstImgScript = scriptFrames.find((sf)=>'img' === sf.type && sf.img);
        if (firstImgScript) {
            acc.img = firstImgScript.img;
            acc.imgW = firstImgScript.imageWidth || baseW;
            acc.imgH = firstImgScript.imageHeight || baseH;
        }
    }
    return {
        img: acc.img,
        imageWidth: acc.imgW,
        imageHeight: acc.imgH,
        prevImg: acc.imageChanged ? acc.prevImg : null,
        camera: acc.camera,
        prevCamera: acc.prevCamera,
        insights: acc.insights,
        spinning: acc.spinning,
        spinningElapsedMs: acc.spinningElapsedMs,
        currentPointerImg: acc.pointerImg,
        pointerVisible: acc.pointerVisible,
        title: acc.title,
        subTitle: acc.subTitle,
        taskId: acc.taskId,
        frameInScript: acc.frameInScript,
        scriptIndex: acc.scriptIndex,
        imageChanged: acc.imageChanged,
        pointerMoved: acc.pointerMoved,
        rawProgress: acc.rawProgress
    };
}
export { deriveFrameState, shouldRenderCursor };
