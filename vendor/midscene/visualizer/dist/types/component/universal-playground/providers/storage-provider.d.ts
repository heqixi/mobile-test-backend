import type { InfoListItem, StorageProvider } from '../../../types';
import { MemoryStorageProvider as IndexedDBMemoryStorageProvider, NoOpStorageProvider as IndexedDBNoOpStorageProvider, IndexedDBStorageProvider } from './indexeddb-storage-provider';
/**
 * Local Storage implementation for playground message persistence
 */
export declare class LocalStorageProvider implements StorageProvider {
    private readonly messagesKey;
    private readonly resultsKey;
    private readonly maxStorageItems;
    constructor(namespace?: string);
    /**
     * Check available storage space
     */
    private checkStorageSpace;
    saveMessages(messages: InfoListItem[]): Promise<void>;
    loadMessages(): Promise<InfoListItem[]>;
    clearMessages(): Promise<void>;
    saveResult(id: string, result: InfoListItem): Promise<void>;
    /**
     * Handle quota exceeded by clearing old data
     */
    private handleQuotaExceeded;
}
/**
 * Memory-only storage implementation for non-persistent scenarios
 */
export declare class MemoryStorageProvider implements StorageProvider {
    private messages;
    private results;
    saveMessages(messages: InfoListItem[]): Promise<void>;
    loadMessages(): Promise<InfoListItem[]>;
    clearMessages(): Promise<void>;
    saveResult(id: string, result: InfoListItem): Promise<void>;
}
/**
 * No-op storage implementation for cases where persistence is disabled
 */
export declare class NoOpStorageProvider implements StorageProvider {
    saveMessages(_messages: InfoListItem[]): Promise<void>;
    loadMessages(): Promise<InfoListItem[]>;
    clearMessages(): Promise<void>;
    saveResult(_id: string, _result: InfoListItem): Promise<void>;
}
/**
 * Storage type enumeration
 */
export declare enum StorageType {
    INDEXEDDB = "indexeddb",
    LOCALSTORAGE = "localStorage",
    MEMORY = "memory",
    NONE = "none"
}
/**
 * Factory function to create the appropriate storage provider
 */
export declare function createStorageProvider(type?: StorageType, namespace?: string): StorageProvider;
export declare function detectBestStorageType(): StorageType;
export { IndexedDBStorageProvider, IndexedDBMemoryStorageProvider, IndexedDBNoOpStorageProvider, };
