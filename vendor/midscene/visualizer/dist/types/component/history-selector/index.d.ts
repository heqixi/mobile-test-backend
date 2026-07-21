import type React from 'react';
import type { ReactNode } from 'react';
import type { HistoryItem } from '../../store/history';
import './index.less';
interface HistorySelectorProps {
    onSelect: (history: HistoryItem) => void;
    history: HistoryItem[];
    currentType: string;
    trigger?: ReactNode;
    popupPlacement?: 'top' | 'bottom';
    title?: string;
    showClear?: boolean;
    onClear?: () => void;
    searchPlaceholder?: string;
    emptyText?: string;
    noMatchText?: string;
    renderItemActions?: (history: HistoryItem, controls: {
        close: () => void;
        scrollVersion: number;
    }) => ReactNode;
    renderItemLabel?: (history: HistoryItem, controls: {
        close: () => void;
    }) => ReactNode;
    overlayClassName?: string;
    popupWidth?: number;
    popupHeight?: number;
    portalContainerSelector?: string;
}
export declare const HistorySelector: React.FC<HistorySelectorProps>;
export {};
