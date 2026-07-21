import type { BaseElement, Rect, UIContext } from '@midscene/core';
import React from 'react';
import './index.less';
export declare const Blackboard: (props: {
    uiContext: UIContext | undefined | null;
    highlightElements?: BaseElement[];
    highlightRect?: Rect;
    hideController?: boolean;
}) => React.JSX.Element;
export default Blackboard;
