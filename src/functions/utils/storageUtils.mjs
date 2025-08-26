// Storage utility functions for extension settings
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../../constants/config/extensionSettings.mjs';

export async function getExtensionSettings() {
    try {
        const result = await chrome.storage.sync.get([
            STORAGE_KEYS.EXTENSION_ENABLED, 
            STORAGE_KEYS.DUPLICATE_STRATEGY,
            STORAGE_KEYS.URL_SENSITIVITY
        ]);
        return {
            extensionEnabled: result.extensionEnabled ?? DEFAULT_SETTINGS.extensionEnabled,
            duplicateStrategy: result.duplicateStrategy ?? DEFAULT_SETTINGS.duplicateStrategy,
            urlSensitivity: result.urlSensitivity ?? DEFAULT_SETTINGS.urlSensitivity
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
        console.error('Error setting extension enabled setting:', error);
        return false;
    }
}

export async function setDuplicateStrategy(strategy) {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEYS.DUPLICATE_STRATEGY]: strategy });
        console.log('Duplicate strategy setting updated:', strategy);
        return true;
    } catch (error) {
        console.error('Error setting duplicate strategy setting:', error);
        return false;
    }
}

export async function setUrlSensitivity(sensitivity) {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEYS.URL_SENSITIVITY]: sensitivity });
        console.log('URL sensitivity setting updated:', sensitivity);
        return true;
    } catch (error) {
        console.error('Error setting URL sensitivity setting:', error);
        return false;
    }
}

export async function initializeDefaultSettings() {
    try {
        const currentSettings = await chrome.storage.sync.get(Object.values(STORAGE_KEYS));
        const settingsToSet = {};
        
        Object.entries(DEFAULT_SETTINGS).forEach(([key, defaultValue]) => {
            const storageKey = STORAGE_KEYS[key.toUpperCase()];
            if (currentSettings[storageKey] === undefined) {
                settingsToSet[storageKey] = defaultValue;
            }
        });
        
        if (Object.keys(settingsToSet).length > 0) {
            await chrome.storage.sync.set(settingsToSet);
            console.log('Default settings initialized:', settingsToSet);
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing default settings:', error);
        return false;
    }
}
