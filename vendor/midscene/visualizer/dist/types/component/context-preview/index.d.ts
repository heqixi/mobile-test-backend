import type { UIContext } from '@midscene/core';
import type React from 'react';
import './index.less';
interface ContextPreviewProps {
    uiContextPreview: UIContext | undefined;
    setUiContextPreview: (context: UIContext) => void;
    showContextPreview: boolean;
}
export declare const ContextPreview: React.FC<ContextPreviewProps>;
export {};
