// Import the reusable components and storage utilities
import { Header } from '../src/components/ui/header.mjs';
import { OptionGroup } from '../src/components/ui/optionGroup.mjs';
import { ToggleSwitch } from '../src/components/ui/toggleSwitch.mjs';
import { RadioGroup } from '../src/components/ui/radioGroup.mjs';
import { LoadingSpinner } from '../src/components/ui/loadingSpinner.mjs';
import { Button } from '../src/components/ui/button.mjs';
import { getExtensionSettings, setExtensionEnabled, setDuplicateStrategy, setUrlSensitivity } from '../src/functions/utils/storageUtils.mjs';
import { resetAllSettings } from '../src/functions/utils/resetUtils.mjs';
import { storageListener } from '../src/functions/utils/storageListener.mjs';
import { STORAGE_KEYS } from '../src/constants/config/extensionSettings.mjs';

console.log('Prevent Duplicate Tabs extension popup loaded');

// Component instances
let finalEnableToggle, finalStrategyRadios, finalSensitivityRadios, loadingSpinner, resetButton;

// Initialize the popup
async function initializePopup() {
    try {
        console.log('Starting popup initialization...');
        
        // Check if we're in a Chrome extension context
        if (typeof chrome === 'undefined' || !chrome.storage) {
            throw new Error('Chrome extension APIs not available');
        }
        
        console.log('Chrome extension APIs available');
        
        // Initialize loading spinner
        loadingSpinner = new LoadingSpinner('loadingSpinnerContainer', {
            message: 'Loading settings...',
            size: 'small',
            color: '#3498db',
            showMessage: true
        });
        
        // Show loading spinner
        loadingSpinner.show();
        
        // Load current settings
        console.log('Loading extension settings...');
        const settings = await getExtensionSettings();
        console.log('Current settings loaded:', settings);
        
        // Initialize the header component
        console.log('Initializing header...');
        const header = new Header('headerContainer', {
            title: 'Prevent Duplicate Tabs',
            subtitle: 'Quick Settings',
            showIcon: true,
            iconPath: '../assets/icons/icon48.png'
        });
        console.log('Header initialized');
        
        // Initialize Option Group 1: Enable Extension
        console.log('Initializing enable group...');
        const enableGroup = new OptionGroup('enableGroupContainer', {
            title: 'Enable Extension',
            type: 'default'
        });
        console.log('Enable group initialized');
        
        // Add the toggle switch to the option group and get the container ID
        console.log('Adding toggle switch...');
        const toggleContainerId = enableGroup.addToggleSwitch();
        console.log('Toggle container ID:', toggleContainerId);
        
        // Create the toggle switch in the proper container
        console.log('Creating toggle switch...');
        finalEnableToggle = new ToggleSwitch(toggleContainerId, {
            id: 'extensionEnabled',
            checked: settings.extensionEnabled,
            onChange: async (checked) => {
                try {
                    console.log('Toggle changed to:', checked);
                    await setExtensionEnabled(checked);
                    console.log('Extension enabled:', checked);
                } catch (error) {
                    console.error('Error updating extension state:', error);
                    // Revert the toggle if there was an error
                    finalEnableToggle.setChecked(!checked);
                }
            }
        });
        console.log('Toggle switch created');
        
        // Initialize Option Group 2: Duplicate Strategy
        console.log('Initializing strategy group...');
        const strategyGroup = new OptionGroup('strategyGroupContainer', {
            title: 'Duplicate Handling Strategy',
            type: 'strategy'
        });
        console.log('Strategy group initialized');
        
        // Add the radio group to the option group and get the container ID
        console.log('Adding strategy radio group...');
        const strategyContainerId = strategyGroup.addRadioGroup();
        console.log('Strategy container ID:', strategyContainerId);
        
        // Create the radio group in the proper container
        console.log('Creating strategy radio group...');
        finalStrategyRadios = new RadioGroup(strategyContainerId, {
            name: 'duplicateStrategy',
            selectedValue: settings.duplicateStrategy,
            onChange: async (value) => {
                try {
                    console.log('Strategy changed to:', value);
                    await setDuplicateStrategy(value);
                    console.log('Strategy selected:', value);
                } catch (error) {
                    console.error('Error updating strategy:', error);
                    // Revert the selection if there was an error
                    finalStrategyRadios.setSelectedValue(settings.duplicateStrategy);
                }
            },
            options: [
                {
                    value: 'closeNewStayCurrent',
                    label: 'Close new tab, stay on current tab'
                },
                {
                    value: 'closeNewGoToOriginal',
                    label: 'Close new tab, navigate to original tab'
                },
                {
                    value: 'closeExistingStayCurrent',
                    label: 'Close existing tab, stay on current tab'
                },
                {
                    value: 'closeExistingGoToNew',
                    label: 'Close existing tab, navigate to new tab'
                }
            ]
        });
        console.log('Strategy radio group created');
        
        // Initialize Option Group 3: URL Sensitivity
        console.log('Initializing sensitivity group...');
        const sensitivityGroup = new OptionGroup('sensitivityGroupContainer', {
            title: 'URL Sensitivity',
            type: 'sensitivity'
        });
        console.log('Sensitivity group initialized');
        
        // Add the radio group to the option group and get the container ID
        console.log('Adding sensitivity radio group...');
        const sensitivityContainerId = sensitivityGroup.addRadioGroup();
        console.log('Sensitivity container ID:', sensitivityContainerId);
        
        // Create the radio group in the proper container
        console.log('Creating sensitivity radio group...');
        finalSensitivityRadios = new RadioGroup(sensitivityContainerId, {
            name: 'urlSensitivity',
            selectedValue: settings.urlSensitivity,
            onChange: async (value) => {
                try {
                    console.log('Sensitivity changed to:', value);
                    await setUrlSensitivity(value);
                    console.log('Sensitivity selected:', value);
                } catch (error) {
                    console.error('Error updating sensitivity:', error);
                    // Revert the selection if there was an error
                    finalSensitivityRadios.setSelectedValue(settings.urlSensitivity);
                }
            },
            options: [
                {
                    value: 'exactUrl',
                    label: 'Exact same URL'
                },
                {
                    value: 'ignoreParameters',
                    label: 'Ignore parameters'
                },
                {
                    value: 'exactDomain',
                    label: 'Complete domain'
                }
            ]
        });
        console.log('Sensitivity radio group created');
        
        // Initialize Reset Button
        resetButton = new Button('resetButtonContainer', {
            text: 'Reset to Defaults',
            type: 'secondary',
            onClick: async () => {
                try {
                    resetButton.setDisabled(true);
                    resetButton.setText('Resetting...');
                    
                    // Reset all settings
                    const resetSettings = await resetAllSettings();
                    
                    // Update UI with reset settings
                    finalEnableToggle.setChecked(resetSettings.extensionEnabled);
                    finalStrategyRadios.setSelectedValue(resetSettings.duplicateStrategy);
                    finalSensitivityRadios.setSelectedValue(resetSettings.urlSensitivity);
                    
                    console.log('Settings reset to default values');
                } catch (error) {
                    console.error('Error resetting settings:', error);
                } finally {
                    resetButton.setDisabled(false);
                    resetButton.setText('Reset to Defaults');
                }
            }
        });

        // Initialize Options Button
        const optionsButton = new Button('optionsButtonContainer', {
            text: 'Open Options',
            type: 'primary',
            onClick: () => {
                try {
                    console.log('Opening options page...');
                    // Open the options page in a new tab
                    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
                    // Close the popup after opening options
                    window.close();
                } catch (error) {
                    console.error('Error opening options page:', error);
                }
            }
        });
        
        // Initialize storage listener for real-time syncing
        console.log('Initializing storage listener...');
        storageListener.init();
        
        // Set up storage change listeners for real-time updates
        storageListener.addListener(STORAGE_KEYS.EXTENSION_ENABLED, (newValue) => {
            if (finalEnableToggle && newValue !== undefined) {
                finalEnableToggle.setChecked(newValue);
                console.log('Extension enabled updated via storage:', newValue);
            }
        });
        
        storageListener.addListener(STORAGE_KEYS.DUPLICATE_STRATEGY, (newValue) => {
            if (finalStrategyRadios && newValue !== undefined) {
                finalStrategyRadios.setSelectedValue(newValue);
                console.log('Strategy updated via storage:', newValue);
            }
        });
        
        storageListener.addListener(STORAGE_KEYS.URL_SENSITIVITY, (newValue) => {
            if (finalSensitivityRadios && newValue !== undefined) {
                finalSensitivityRadios.setSelectedValue(newValue);
                console.log('Sensitivity updated via storage:', newValue);
            }
        });
        
        console.log('Popup initialization completed successfully!');
        
        // Hide loading spinner
        loadingSpinner.hide();
        
    } catch (error) {
        console.error('Error initializing popup:', error);
        
        // Show error details in the popup
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            padding: 20px;
            margin: 20px;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 6px;
            color: #721c24;
        `;
        errorDiv.innerHTML = `
            <h3>Popup Initialization Error</h3>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Stack:</strong> ${error.stack}</p>
            <p>Please check the console for more details.</p>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Initialize popup when DOM is loaded
console.log('Adding DOMContentLoaded listener...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing popup...');
    initializePopup();
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('DOM still loading, waiting for DOMContentLoaded...');
} else {
    console.log('DOM already loaded, initializing immediately...');
    initializePopup();
}

// Cleanup storage listeners when popup is closed
window.addEventListener('beforeunload', () => {
    storageListener.destroy();
});
