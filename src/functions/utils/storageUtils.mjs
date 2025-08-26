// Storage utility functions for extension settings
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../../constants/config/extensionSettings.mjs';

export async function getExtensionSettings() {
    try {
        const result = await chrome.storage.sync.get([STORAGE_KEYS.EXTENSION_ENABLED, STORAGE_KEYS.DUPLICATE_STRATEGY]);
        return {
            extensionEnabled: result.extensionEnabled ?? DEFAULT_SETTINGS.extensionEnabled,
            duplicateStrategy: result.duplicateStrategy ?? DEFAULT_SETTINGS.duplicateStrategy
        };
    } catch (error) {
        console.error('Error getting extension settings:', error);
        return DEFAULT_SETTINGS;
    }
}

export async function setExtensionEnabled(enabled) {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEYS.EXTENSION_ENABLED]: enabled });
        console.log('Extension enabled setting updated:', enabled);
        return true;
    } catch (error) {
        console.error('Error setting extension enabled:', error);
        return false;
    }
}

export async function setDuplicateStrategy(strategy) {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEYS.DUPLICATE_STRATEGY]: strategy });
        console.log('Duplicate strategy setting updated:', strategy);
        return true;
    } catch (error) {
        console.error('Error setting duplicate strategy:', error);
        return false;
    }
}



export async function initializeDefaultSettings() {
    try {
        const currentSettings = await getExtensionSettings();
        const needsUpdate = Object.keys(DEFAULT_SETTINGS).some(key => 
            currentSettings[key] === undefined
        );
        
        if (needsUpdate) {
            await chrome.storage.sync.set(DEFAULT_SETTINGS);
            console.log('Default settings initialized');
        }
        return true;
    } catch (error) {
        console.error('Error initializing default settings:', error);
        return false;
    }
}
