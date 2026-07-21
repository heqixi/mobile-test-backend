import './index.less';
import type { ReportDownloadHandler } from '../../types';
import type { AnimationScript } from '../../utils/replay-scripts';
export type PlayerPresentation = 'default' | 'timeline';
export declare function Player(props?: {
    replayScripts?: AnimationScript[];
    imageWidth?: number;
    imageHeight?: number;
    reportFileContent?: string | null;
    reportUrl?: string | null;
    reportFormat?: 'single-html' | 'html-and-external-assets';
    key?: string | number;
    fitMode?: 'width' | 'height';
    autoZoom?: boolean;
    canDownloadReport?: boolean;
    onDownloadReport?: ReportDownloadHandler;
    onTaskChange?: (taskId: string | null) => void;
    /** Start playback automatically on mount. Defaults to true. */
    autoPlay?: boolean;
    /** Hide the bottom playback control bar entirely. Defaults to false. */
    hideControls?: boolean;
    presentation?: PlayerPresentation;
}): import("react").JSX.Element | null;
