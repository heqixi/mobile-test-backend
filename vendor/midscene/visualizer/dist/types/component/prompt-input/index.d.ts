import type { DeviceAction } from '@midscene/core';
import React from 'react';
import type { DeviceType, RunType } from '../../types';
import type { PromptInputChromeConfig, ServiceModeType } from '../../types';
import './index.less';
interface PromptInputProps {
    runButtonEnabled: boolean;
    form: any;
    serviceMode: ServiceModeType;
    selectedType: RunType;
    dryMode: boolean;
    stoppable: boolean;
    loading: boolean;
    onRun: () => void;
    onStop: () => void;
    clearPromptAfterRun?: boolean;
    hideDomAndScreenshotOptions?: boolean;
    actionSpace: DeviceAction<any>[];
    deviceType?: DeviceType;
    chrome?: PromptInputChromeConfig;
}
export declare const PromptInput: React.FC<PromptInputProps>;
export {};
