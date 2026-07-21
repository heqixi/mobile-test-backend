import type React from 'react';
import type { PlaygroundResult as PlaygroundResultType, ReportDownloadHandler, ServiceModeType } from '../../types';
import type { ReplayScriptsInfo } from '../../utils/replay-scripts';
import { type PlayerPresentation } from '../player';
import './index.less';
interface PlaygroundResultProps {
    result: PlaygroundResultType | null;
    loading: boolean;
    serverValid?: boolean;
    serviceMode: ServiceModeType;
    replayScriptsInfo: ReplayScriptsInfo | null;
    replayCounter: number;
    loadingProgressText: string;
    verticalMode?: boolean;
    notReadyMessage?: React.ReactNode | string;
    fitMode?: 'width' | 'height';
    autoZoom?: boolean;
    actionType?: string;
    canDownloadReport?: boolean;
    onDownloadReport?: ReportDownloadHandler;
    playerPresentation?: PlayerPresentation;
}
export declare const PlaygroundResultView: React.FC<PlaygroundResultProps>;
export {};
