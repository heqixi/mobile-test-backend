import React from 'react';
import './index.less';
export type ScreenshotViewerMode = 'default' | 'screen-only';
interface ScreenshotViewerProps {
    getScreenshot: () => Promise<{
        screenshot: string;
        timestamp: number;
    } | null>;
    getInterfaceInfo?: () => Promise<{
        type: string;
        description?: string;
        size?: {
            width: number;
            height: number;
        };
    } | null>;
    serverOnline: boolean;
    isUserOperating?: boolean;
    mjpegUrl?: string;
    mode?: ScreenshotViewerMode;
    contentRef?: React.Ref<HTMLDivElement>;
}
export default function ScreenshotViewer({ getScreenshot, getInterfaceInfo, serverOnline, isUserOperating, mjpegUrl, mode, contentRef, }: ScreenshotViewerProps): React.JSX.Element;
export {};
