import { deriveFrameState } from "./derive-frame-state.mjs";
function getPlaybackFrameState(frameMap, frame) {
    const state = deriveFrameState(frameMap.scriptFrames, frame, frameMap.imageWidth, frameMap.imageHeight, frameMap.fps);
    return state.img ? state : null;
}
export { getPlaybackFrameState };
