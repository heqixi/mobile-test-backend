import type React from 'react';
import type { ReactNode } from 'react';
import type { DeviceType } from '../../types';
interface ConfigSelectorProps {
    showDeepLocateOption: boolean;
    showDeepThinkOption: boolean;
    enableTracking: boolean;
    showDataExtractionOptions: boolean;
    hideDomAndScreenshotOptions?: boolean;
    deviceType?: DeviceType;
    trigger?: ReactNode;
    popupPlacement?: 'top' | 'topLeft' | 'topRight' | 'bottomRight';
}
export declare const ConfigSelector: React.FC<ConfigSelectorProps>;
export {};
