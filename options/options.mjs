// Options page script for Prevent Duplicate Tabs extension

import { Header } from '../src/components/ui/header.mjs';
import { OptionGroup } from '../src/components/ui/optionGroup.mjs';
import { ToggleSwitch } from '../src/components/ui/toggleSwitch.mjs';
import { RadioGroup } from '../src/components/ui/radioGroup.mjs';
import { LoadingSpinner } from '../src/components/ui/loadingSpinner.mjs';
import { Button } from '../src/components/ui/button.mjs';
import { WhitelistManager } from '../src/components/ui/whitelistManager.mjs';
import { getExtensionSettings, initializeDefaultSettings, setExtensionEnabled, setDuplicateStrategy, setUrlSensitivity } from '../src/functions/utils/storageUtils.mjs';
import { resetAllSettings } from '../src/functions/utils/resetUtils.mjs';
import { storageListener } from '../src/functions/utils/storageListener.mjs';
import { STORAGE_KEYS } from '../src/constants/config/extensionSettings.mjs';
import { STORAGE_KEYS as WHITELIST_STORAGE_KEYS } from '../src/constants/config/whitelistConfig.mjs';

console.log('Prevent Duplicate Tabs extension options page loaded');

// DOM elements
const resetSettingsButton = document.getElementById('resetSettings');
const loadingOverlayContainer = document.getElementById('loadingOverlayContainer');
const optionsForm = document.getElementById('optionsForm');

// Component instances
let enableToggle, strategyRadios, sensitivityRadios, loadingSpinner, resetButton;

async function initializeOptions() {
    try {
        // Initialize loading spinner
        loadingSpinner = new LoadingSpinner('loadingOverlayContainer', {
            message: 'Loading settings...',
            size: 'medium',
            color: '#3498db',
            showMessage: true
        });
        
        // Show loading spinner
        loadingSpinner.show();
        optionsForm.style.display = 'none';
        
        // Load current settings
        const settings = await getExtensionSettings();
        console.log('Options: Current settings loaded:', settings);
        
        // Initialize Header
        const header = new Header('headerContainer', {
            title: 'Prevent Duplicate Tabs',
            subtitle: 'Settings',
            icon: '../assets/icons/icon48.png'
        });
        
        // Initialize Option Group 1: Enable Extension
        const enableGroup = new OptionGroup('enableGroupContainer', {
            title: 'Enable Extension',
            description: 'Turn extension on/off',
            type: 'default'
        });
        
        // Create the toggle switch in the proper container
        const enableContainerId = enableGroup.addToggleSwitch();
        enableToggle = new ToggleSwitch(enableContainerId, {
            id: 'enableToggle',
            checked: settings.extensionEnabled,
            onChange: async (checked) => {
                try {
                    await setExtensionEnabled(checked);
                    console.log('Extension enabled updated:', checked);
                } catch (error) {
                    console.error('Error updating extension enabled:', error);
                }
            }
        });
        
        // Initialize Option Group 2: Duplicate Strategy
        const strategyGroup = new OptionGroup('strategyGroupContainer', {
            title: 'Duplicate Handling Strategy',
            description: 'How to handle duplicates',
            type: 'strategy'
        });
        
        // Create the radio group in the proper container
        const strategyContainerId = strategyGroup.addRadioGroup();
        strategyRadios = new RadioGroup(strategyContainerId, {
            name: 'duplicateStrategy',
            selectedValue: settings.duplicateStrategy,
            onChange: async (value) => {
                try {
                    await setDuplicateStrategy(value);
                    console.log('Duplicate strategy updated:', value);
                } catch (error) {
                    console.error('Error updating duplicate strategy:', error);
                }
            },
            options: [
                { value: 'closeNewStayCurrent', label: 'Close new tab, stay on current tab', description: 'Prevents duplicate while keeping you on current page' },
                { value: 'closeNewGoToOriginal', label: 'Close new tab, navigate to original tab', description: 'Closes duplicate and takes you to original' },
                { value: 'closeExistingStayCurrent', label: 'Close existing tab, stay on current tab', description: 'Closes original duplicate, keeps you on new page' },
                { value: 'closeExistingGoToNew', label: 'Close existing tab, navigate to new tab', description: 'Closes original and takes you to new page' }
            ]
        });
        
        // Initialize Option Group 3: URL Sensitivity
        const sensitivityGroup = new OptionGroup('sensitivityGroupContainer', {
            title: 'URL Sensitivity',
            description: 'URL matching strictness',
            type: 'sensitivity'
        });
        
        // Create the radio group in the proper container
        const sensitivityContainerId = sensitivityGroup.addRadioGroup();
        sensitivityRadios = new RadioGroup(sensitivityContainerId, {
            name: 'urlSensitivity',
            selectedValue: settings.urlSensitivity,
            onChange: async (value) => {
                try {
                    await setUrlSensitivity(value);
                    console.log('URL sensitivity updated:', value);
                } catch (error) {
                    console.error('Error updating URL sensitivity:', error);
                }
            },
            options: [
                { value: 'exactUrl', label: 'Exact same URL', description: 'Only exact URL matches are considered duplicates' },
                { value: 'ignoreParameters', label: 'Ignore parameters', description: 'Ignores query parameters and fragments' },
                { value: 'exactDomain', label: 'Complete domain', description: 'Any page on the same domain is considered duplicate' }
            ]
        });
        
        // Initialize Reset Button
        resetButton = new Button('resetSettings', {
            text: 'Reset to Defaults',
            type: 'secondary',
            onClick: async () => {
                try {
                    resetButton.setDisabled(true);
                    resetButton.setText('Resetting...');
                    
                    // Reset all settings
                    const resetSettings = await resetAllSettings();
                    
                    // Update UI with reset settings
                    enableToggle.setChecked(resetSettings.extensionEnabled);
                    strategyRadios.setSelectedValue(resetSettings.duplicateStrategy);
                    sensitivityRadios.setSelectedValue(resetSettings.urlSensitivity);
                    
                    console.log('Settings reset to default values');
                } catch (error) {
                    console.error('Error resetting settings:', error);
                } finally {
                    resetButton.setDisabled(false);
                    resetButton.setText('Reset to Defaults');
                }
            }
        });
        
        // Hide loading overlay and show options form
        loadingSpinner.hide();
        optionsForm.style.display = 'flex';
        
        // Initialize whitelist manager
        console.log('Options: Initializing whitelist manager...');
        const whitelistContainer = document.getElementById('whitelistContainer');
        console.log('Options: Whitelist container found:', whitelistContainer);
        
        if (whitelistContainer) {
            window.whitelistManager = new WhitelistManager('whitelistContainer');
            console.log('Options: Whitelist manager created:', window.whitelistManager);
        } else {
            console.error('Options: Whitelist container not found!');
        }
        
        // Initialize storage listener for real-time syncing
        console.log('Options: Initializing storage listener...');
        storageListener.init();
        
        // Set up storage change listeners for real-time updates
        storageListener.addListener(STORAGE_KEYS.EXTENSION_ENABLED, (newValue) => {
            if (enableToggle && newValue !== undefined) {
                enableToggle.setChecked(newValue);
                console.log('Extension enabled updated via storage:', newValue);
            }
        });
        
        storageListener.addListener(STORAGE_KEYS.DUPLICATE_STRATEGY, (newValue) => {
            if (strategyRadios && newValue !== undefined) {
                strategyRadios.setSelectedValue(newValue);
                console.log('Strategy updated via storage:', newValue);
            }
        });
        
        storageListener.addListener(STORAGE_KEYS.URL_SENSITIVITY, (newValue) => {
            if (sensitivityRadios && newValue !== undefined) {
                sensitivityRadios.setSelectedValue(newValue);
                console.log('Sensitivity updated via storage:', newValue);
            }
        });

        // Add whitelist storage listener for real-time syncing
        storageListener.addListener(WHITELIST_STORAGE_KEYS.WHITELIST_ENTRIES, (newValue) => {
            console.log('Options: Whitelist entries updated via storage:', newValue);
            // Refresh the whitelist manager if it exists
            if (window.whitelistManager && typeof window.whitelistManager.refresh === 'function') {
                console.log('Options: Refreshing whitelist manager...');
                window.whitelistManager.refresh();
            } else {
                console.log('Options: Cannot refresh - whitelist manager not available or missing refresh method');
            }
        });
        
        // Welcome message logged to console instead of showing toast
        console.log('Welcome to Prevent Duplicate Tabs settings!');
        
        console.log('Options page initialized with settings:', settings);
    } catch (error) {
        console.error('Error initializing options:', error);
        
        // Hide loading overlay and show options form even on error
        if (loadingSpinner) {
            loadingSpinner.hide();
        }
        optionsForm.style.display = 'flex';
    }
}

// Toast notification system - REMOVED - No longer needed

// Handle reset settings button
// resetSettingsButton.addEventListener('click', async () => {
//     try {
//         resetSettingsButton.disabled = true;
//         resetSettingsButton.textContent = 'Resetting...';
        
//         // Reset to default settings
//         await chrome.storage.sync.clear();
//         await initializeDefaultSettings();
        
//         // Reload current settings
//         const settings = await getExtensionSettings();
        
//         // Update UI with current settings
//         enableToggle.setChecked(settings.extensionEnabled);
        
//         // Set the correct radio button for duplicate strategy
//         strategyRadios.setSelectedValue(settings.duplicateStrategy);
        
//         // Set the correct radio button for URL sensitivity
//         sensitivityRadios.setSelectedValue(settings.urlSensitivity);
        
//         console.log('Settings reset to default values');
//     } catch (error) {
//         console.error('Error resetting settings:', error);
//     } finally {
//         resetSettingsButton.disabled = false;
//         resetSettingsButton.textContent = 'Reset to Defaults';
//     }
// });

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptions);

// Cleanup storage listeners when page is unloaded
window.addEventListener('beforeunload', () => {
    storageListener.destroy();
});
