interface UseFramePlayerOptions {
    durationInFrames: number;
    fps: number;
    autoPlay?: boolean;
    loop?: boolean;
    playbackRate?: number;
}
interface FramePlayer {
    currentFrame: number;
    playing: boolean;
    play: () => void;
    pause: () => void;
    toggle: () => void;
    seekTo: (frame: number) => void;
}
export declare function useFramePlayer(options: UseFramePlayerOptions): FramePlayer;
export {};
