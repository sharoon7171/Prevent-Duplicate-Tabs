// Storage change listener utility for real-time synchronization
// This utility handles storage changes and notifies components
import { STORAGE_KEYS } from '../../constants/config/extensionSettings.mjs';

export class StorageListener {
    constructor() {
        this.listeners = new Map();
        this.isInitialized = false;
        this.boundHandleStorageChange = this.handleStorageChange.bind(this);
    }

    // Initialize storage change listener
    init() {
        if (this.isInitialized) {
            return;
        }

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener(this.boundHandleStorageChange);
            this.isInitialized = true;
            console.log('Storage listener initialized');
        } else {
            console.warn('Chrome storage API not available for listener');
        }
    }

    // Handle storage changes
    handleStorageChange(changes, namespace) {
        if (namespace !== 'sync') {
            return;
        }

        console.log('Storage changed:', changes);

        // Notify all registered listeners
        Object.keys(changes).forEach(key => {
            const change = changes[key];
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    try {
                        callback(change.newValue, change.oldValue);
                    } catch (error) {
                        console.error('Error in storage change callback:', error);
                    }
                });
            }
        });
    }

    // Register a listener for a specific storage key
    addListener(storageKey, callback) {
        if (!this.listeners.has(storageKey)) {
            this.listeners.set(storageKey, []);
        }
        this.listeners.get(storageKey).push(callback);
        console.log(`Listener added for ${storageKey}`);
    }

    // Remove a listener for a specific storage key
    removeListener(storageKey, callback) {
        if (this.listeners.has(storageKey)) {
            const callbacks = this.listeners.get(storageKey);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                console.log(`Listener removed for ${storageKey}`);
            }
        }
    }

    // Remove all listeners
    removeAllListeners() {
        this.listeners.clear();
        console.log('All listeners removed');
    }

    // Cleanup
    destroy() {
        if (this.isInitialized && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.removeListener(this.boundHandleStorageChange);
            this.isInitialized = false;
        }
        this.removeAllListeners();
        console.log('Storage listener destroyed');
    }
}

// Export singleton instance
export const storageListener = new StorageListener();
