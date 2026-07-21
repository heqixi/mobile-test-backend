function shouldRestartPlaybackFromBeginning(currentFrame, effectiveEndFrame) {
    return effectiveEndFrame > 0 && currentFrame >= effectiveEndFrame;
}
export { shouldRestartPlaybackFromBeginning };
