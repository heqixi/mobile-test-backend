import { createElement } from "react";
function CompletedActionIcon() {
    return /*#__PURE__*/ createElement('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        focusable: false
    }, /*#__PURE__*/ createElement('path', {
        d: 'M3 7.99984L6.33333 11.3332L13 4.6665',
        stroke: '#188F4D',
        strokeWidth: '1.2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
    }));
}
function FailedActionIcon() {
    return /*#__PURE__*/ createElement('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        focusable: false
    }, /*#__PURE__*/ createElement('path', {
        d: 'M5 5L11 11M11 5L5 11',
        stroke: '#FF4D4F',
        strokeWidth: '1.2',
        strokeLinecap: 'round'
    }));
}
function defaultProgressActionIcon(_kind) {
    return /*#__PURE__*/ createElement(CompletedActionIcon);
}
function defaultProgressErrorIcon() {
    return /*#__PURE__*/ createElement(FailedActionIcon);
}
function resolveProgressActionIcon(kind, override) {
    if (!kind) return null;
    if (override) {
        const custom = override(kind);
        if (void 0 !== custom) return custom;
    }
    return defaultProgressActionIcon(kind);
}
export { defaultProgressActionIcon, defaultProgressErrorIcon, resolveProgressActionIcon };
