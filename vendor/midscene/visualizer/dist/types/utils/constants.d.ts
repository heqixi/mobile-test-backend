import type { InfoListItem, PlaygroundResult } from '../types';
export declare const trackingTip = "Limit popup to current tab";
export declare const deepLocateTip = "Deep Locate";
export declare const deepThinkTip = "Deep Think";
export declare const screenshotIncludedTip = "Include screenshot in request";
export declare const domIncludedTip = "Include DOM info in request";
export declare const imeStrategyTip = "IME strategy";
export declare const autoDismissKeyboardTip = "Auto dismiss keyboard";
export declare const keyboardDismissStrategyTip = "Keyboard dismiss strategy";
export declare const alwaysRefreshScreenInfoTip = "Always refresh screen info";
export declare const apiMetadata: {
    aiAct: {
        group: string;
        title: string;
    };
    aiTap: {
        group: string;
        title: string;
    };
    aiDoubleClick: {
        group: string;
        title: string;
    };
    aiHover: {
        group: string;
        title: string;
    };
    aiInput: {
        group: string;
        title: string;
    };
    aiRightClick: {
        group: string;
        title: string;
    };
    aiKeyboardPress: {
        group: string;
        title: string;
    };
    aiScroll: {
        group: string;
        title: string;
    };
    aiLocate: {
        group: string;
        title: string;
    };
    aiQuery: {
        group: string;
        title: string;
    };
    aiBoolean: {
        group: string;
        title: string;
    };
    aiNumber: {
        group: string;
        title: string;
    };
    aiString: {
        group: string;
        title: string;
    };
    aiAsk: {
        group: string;
        title: string;
    };
    aiAssert: {
        group: string;
        title: string;
    };
    aiWaitFor: {
        group: string;
        title: string;
    };
};
export declare const defaultMainButtons: string[];
export declare const getWelcomeMessageTemplate: (targetName?: string) => Omit<InfoListItem, "id" | "timestamp">;
export declare const WELCOME_MESSAGE_TEMPLATE: Omit<InfoListItem, 'id' | 'timestamp'>;
export declare const BLANK_RESULT: PlaygroundResult;
