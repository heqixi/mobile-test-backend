import * as Z from 'zustand';
export interface HistoryItem {
    type: string;
    prompt: string;
    params?: Record<string, any>;
    timestamp: number;
}
export type HistoryState = Record<string, HistoryItem[]>;
export declare const useHistoryStore: Z.UseBoundStore<Z.StoreApi<{
    history: HistoryState;
    lastSelectedType: string;
    clearHistory: (type: string) => void;
    addHistory: (historyItem: HistoryItem) => void;
    getHistoryForType: (type: string) => HistoryItem[];
    setLastSelectedType: (type: string) => void;
}>>;
