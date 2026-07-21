import type { PlaygroundSDKLike } from '../../types';
export declare function EnvConfig({ showTooltipWhenEmpty, showModelName, tooltipPlacement, mode, playgroundSDK, }: {
    showTooltipWhenEmpty?: boolean;
    showModelName?: boolean;
    tooltipPlacement?: 'bottom' | 'top';
    mode?: 'icon' | 'text';
    playgroundSDK?: PlaygroundSDKLike | null;
}): import("react").JSX.Element;
