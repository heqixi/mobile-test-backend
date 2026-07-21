export interface PlaybackViewport {
    offsetX: number;
    offsetY: number;
    contentWidth: number;
    contentHeight: number;
}
export declare function getPlaybackViewport(containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number): PlaybackViewport;
