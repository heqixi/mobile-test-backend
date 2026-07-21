import type { InfoListItem, StorageProvider } from '../../../types';
/**
 * IndexedDB Storage implementation for playground message persistence
 * Provides much larger storage capacity compared to localStorage
 */
export declare class IndexedDBStorageProvider implements StorageProvider {
    private dbManager;
    private namespace;
    private messagesCleanup;
    private resultsCleanup;
    constructor(namespace?: string);
    /**
     * Save messages to IndexedDB
     */
    saveMessages(messages: InfoListItem[]): Promise<void>;
    /**
     * Load messages from IndexedDB
     */
    loadMessages(): Promise<InfoListItem[]>;
    /**
     * Clear all messages from IndexedDB
     */
    clearMessages(): Promise<void>;
    /**
     * Save a single result to IndexedDB with compression
     */
    saveResult(id: string, result: InfoListItem): Promise<void>;
    /**
     * Load a single result from IndexedDB
     */
    loadResult(id: string): Promise<InfoListItem | null>;
    /**
     * Compress result data for storage while preserving playback functionality
     */
    private compressResultForStorage;
    private compressExecutionTasks;
    /**
     * Compress screenshot if it exceeds size threshold
     */
    private compressScreenshotIfNeeded;
    /**
     * Get storage statistics
     */
    getStorageStats(): Promise<{
        messageCount: number;
        resultCount: number;
    }>;
    /**
     * Manually trigger cleanup
     */
    cleanup(): Promise<void>;
}
/**
 * Memory-based storage provider for IndexedDB fallback
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
 * No-op storage provider for disabled storage
 */
export declare class NoOpStorageProvider implements StorageProvider {
    saveMessages(_messages: InfoListItem[]): Promise<void>;
    loadMessages(): Promise<InfoListItem[]>;
    clearMessages(): Promise<void>;
    saveResult(_id: string, _result: InfoListItem): Promise<void>;
}
