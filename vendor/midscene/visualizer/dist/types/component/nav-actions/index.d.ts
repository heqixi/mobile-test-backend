import type { PlaygroundSDKLike } from '../../types';
import './style.less';
export interface NavActionsProps {
    showEnvConfig?: boolean;
    showTooltipWhenEmpty?: boolean;
    showModelName?: boolean;
    githubUrl?: string;
    helpUrl?: string;
    className?: string;
    playgroundSDK?: PlaygroundSDKLike | null;
}
export declare function NavActions({ showEnvConfig, showTooltipWhenEmpty, showModelName, githubUrl, helpUrl, className, playgroundSDK, }: NavActionsProps): import("react").JSX.Element;
