"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    BLANK_RESULT: ()=>BLANK_RESULT,
    WELCOME_MESSAGE_TEMPLATE: ()=>WELCOME_MESSAGE_TEMPLATE,
    alwaysRefreshScreenInfoTip: ()=>alwaysRefreshScreenInfoTip,
    apiMetadata: ()=>apiMetadata,
    autoDismissKeyboardTip: ()=>autoDismissKeyboardTip,
    deepLocateTip: ()=>deepLocateTip,
    deepThinkTip: ()=>deepThinkTip,
    defaultMainButtons: ()=>defaultMainButtons,
    domIncludedTip: ()=>domIncludedTip,
    getWelcomeMessageTemplate: ()=>getWelcomeMessageTemplate,
    imeStrategyTip: ()=>imeStrategyTip,
    keyboardDismissStrategyTip: ()=>keyboardDismissStrategyTip,
    screenshotIncludedTip: ()=>screenshotIncludedTip,
    trackingTip: ()=>trackingTip
});
const trackingTip = 'Limit popup to current tab';
const deepLocateTip = 'Deep Locate';
const deepThinkTip = 'Deep Think';
const screenshotIncludedTip = 'Include screenshot in request';
const domIncludedTip = 'Include DOM info in request';
const imeStrategyTip = 'IME strategy';
const autoDismissKeyboardTip = 'Auto dismiss keyboard';
const keyboardDismissStrategyTip = 'Keyboard dismiss strategy';
const alwaysRefreshScreenInfoTip = 'Always refresh screen info';
const apiMetadata = {
    aiAct: {
        group: 'interaction',
        title: 'Auto Planning: plan the steps and execute'
    },
    aiTap: {
        group: 'interaction',
        title: 'Click an element'
    },
    aiDoubleClick: {
        group: 'interaction',
        title: 'Double-click an element'
    },
    aiHover: {
        group: 'interaction',
        title: 'Hover over an element'
    },
    aiInput: {
        group: 'interaction',
        title: 'Input text into an element'
    },
    aiRightClick: {
        group: 'interaction',
        title: 'Right-click an element'
    },
    aiKeyboardPress: {
        group: 'interaction',
        title: 'Press keyboard keys'
    },
    aiScroll: {
        group: 'interaction',
        title: 'Scroll the page or element'
    },
    aiLocate: {
        group: 'interaction',
        title: 'Locate an element on the page'
    },
    aiQuery: {
        group: 'extraction',
        title: 'Extract data directly from the UI'
    },
    aiBoolean: {
        group: 'extraction',
        title: 'Get true/false answer'
    },
    aiNumber: {
        group: 'extraction',
        title: 'Extract numeric value'
    },
    aiString: {
        group: 'extraction',
        title: 'Extract text value'
    },
    aiAsk: {
        group: 'extraction',
        title: 'Ask a question about the UI'
    },
    aiAssert: {
        group: 'validation',
        title: 'Assert a condition is true'
    },
    aiWaitFor: {
        group: 'validation',
        title: 'Wait for a condition to be met'
    }
};
const defaultMainButtons = [
    'aiAct',
    'aiTap',
    'aiQuery',
    'aiAssert'
];
const getWelcomeMessageTemplate = (targetName = 'web page')=>({
        type: 'system',
        content: `
      Welcome to Midscene.js Playground!

      This is a panel for experimenting and testing Midscene.js features. You can use natural language instructions to operate the ${targetName}, such as clicking buttons, filling in forms, querying information, etc.

      Please enter your instructions in the input box below to start experiencing.
    `,
        loading: false,
        result: void 0,
        replayScriptsInfo: null,
        replayCounter: 0,
        loadingProgressText: '',
        verticalMode: false
    });
const WELCOME_MESSAGE_TEMPLATE = getWelcomeMessageTemplate();
const BLANK_RESULT = {
    result: void 0,
    dump: null,
    reportHTML: null,
    report: null,
    error: null
};
exports.BLANK_RESULT = __webpack_exports__.BLANK_RESULT;
exports.WELCOME_MESSAGE_TEMPLATE = __webpack_exports__.WELCOME_MESSAGE_TEMPLATE;
exports.alwaysRefreshScreenInfoTip = __webpack_exports__.alwaysRefreshScreenInfoTip;
exports.apiMetadata = __webpack_exports__.apiMetadata;
exports.autoDismissKeyboardTip = __webpack_exports__.autoDismissKeyboardTip;
exports.deepLocateTip = __webpack_exports__.deepLocateTip;
exports.deepThinkTip = __webpack_exports__.deepThinkTip;
exports.defaultMainButtons = __webpack_exports__.defaultMainButtons;
exports.domIncludedTip = __webpack_exports__.domIncludedTip;
exports.getWelcomeMessageTemplate = __webpack_exports__.getWelcomeMessageTemplate;
exports.imeStrategyTip = __webpack_exports__.imeStrategyTip;
exports.keyboardDismissStrategyTip = __webpack_exports__.keyboardDismissStrategyTip;
exports.screenshotIncludedTip = __webpack_exports__.screenshotIncludedTip;
exports.trackingTip = __webpack_exports__.trackingTip;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "BLANK_RESULT",
    "WELCOME_MESSAGE_TEMPLATE",
    "alwaysRefreshScreenInfoTip",
    "apiMetadata",
    "autoDismissKeyboardTip",
    "deepLocateTip",
    "deepThinkTip",
    "defaultMainButtons",
    "domIncludedTip",
    "getWelcomeMessageTemplate",
    "imeStrategyTip",
    "keyboardDismissStrategyTip",
    "screenshotIncludedTip",
    "trackingTip"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
