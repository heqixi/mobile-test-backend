function getDeviceCapabilities(deviceType) {
    return {
        supportsImeStrategy: 'android' === deviceType,
        supportsKeyboardDismissStrategy: 'android' === deviceType || 'harmony' === deviceType,
        supportsAutoDismissKeyboard: 'android' === deviceType || 'ios' === deviceType || 'harmony' === deviceType,
        supportsAlwaysRefreshScreenInfo: 'android' === deviceType
    };
}
function hasDeviceSpecificConfig(deviceType) {
    const capabilities = getDeviceCapabilities(deviceType);
    return Object.values(capabilities).some(Boolean);
}
export { getDeviceCapabilities, hasDeviceSpecificConfig };
