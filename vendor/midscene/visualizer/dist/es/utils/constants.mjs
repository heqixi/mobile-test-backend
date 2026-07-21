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
export { BLANK_RESULT, WELCOME_MESSAGE_TEMPLATE, alwaysRefreshScreenInfoTip, apiMetadata, autoDismissKeyboardTip, deepLocateTip, deepThinkTip, defaultMainButtons, domIncludedTip, getWelcomeMessageTemplate, imeStrategyTip, keyboardDismissStrategyTip, screenshotIncludedTip, trackingTip };
