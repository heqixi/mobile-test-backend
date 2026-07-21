import type { DeviceType } from '../types';
export interface DeviceCapabilities {
    supportsImeStrategy: boolean;
    supportsKeyboardDismissStrategy: boolean;
    supportsAutoDismissKeyboard: boolean;
    supportsAlwaysRefreshScreenInfo: boolean;
}
export declare function getDeviceCapabilities(deviceType?: DeviceType): DeviceCapabilities;
export declare function hasDeviceSpecificConfig(deviceType?: DeviceType): boolean;
