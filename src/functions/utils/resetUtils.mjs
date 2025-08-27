// Reset utility functions for extension settings
import { getExtensionSettings, initializeDefaultSettings } from './storageUtils.mjs';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../../constants/config/extensionSettings.mjs';

/**
 * Reset all extension settings to default values
 * @returns {Promise<Object>} The reset settings
 */
export async function resetAllSettings() {
    try {
        // Create the correct storage object structure
        const resetSettings = {
            [STORAGE_KEYS.EXTENSION_ENABLED]: DEFAULT_SETTINGS.extensionEnabled,
            [STORAGE_KEYS.DUPLICATE_STRATEGY]: DEFAULT_SETTINGS.duplicateStrategy,
            [STORAGE_KEYS.URL_SENSITIVITY]: DEFAULT_SETTINGS.urlSensitivity
        };
        
        // Set each setting individually to trigger storage events
        await chrome.storage.sync.set(resetSettings);
        
        // Also reset whitelist entries (clear all)
        await resetWhitelist();
        
        // Get the reset settings
        const settings = await getExtensionSettings();
        
        console.log('All settings and whitelist reset to default values');
        return settings;
    } catch (error) {
        console.error('Error resetting settings:', error);
        throw error;
    }
}

/**
 * Reset specific setting to default value
 * @param {string} settingKey - The setting key to reset
 * @returns {Promise<any>} The reset value
 */
export async function resetSetting(settingKey) {
    try {
        // Get current settings
        const settings = await getExtensionSettings();
        
        // Get default settings
        const defaultSettings = await initializeDefaultSettings();
        
        // Reset specific setting
        const resetValue = defaultSettings[settingKey];
        await chrome.storage.sync.set({ [settingKey]: resetValue });
        
        console.log(`Setting '${settingKey}' reset to default value:`, resetValue);
        return resetValue;
    } catch (error) {
        console.error(`Error resetting setting '${settingKey}':`, error);
        throw error;
    }
}

/**
 * Reset whitelist entries (clear all)
 * @returns {Promise<void>}
 */
export async function resetWhitelist() {
    try {
        await chrome.storage.sync.remove('whitelistEntries');
        console.log('Whitelist entries reset (cleared)');
    } catch (error) {
        console.error('Error resetting whitelist:', error);
        throw error;
    }
}
