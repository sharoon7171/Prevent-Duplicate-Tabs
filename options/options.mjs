// Options page script for Prevent Duplicate Tabs extension

import { getExtensionSettings, setExtensionEnabled, setDuplicateStrategy, setUrlSensitivity, initializeDefaultSettings } from '../src/functions/utils/storageUtils.mjs';

console.log('Prevent Duplicate Tabs extension options page loaded');

// DOM elements
const extensionEnabledCheckbox = document.getElementById('extensionEnabled');
const duplicateStrategyRadios = document.querySelectorAll('input[name="duplicateStrategy"]');
const urlSensitivityRadios = document.querySelectorAll('input[name="urlSensitivity"]');
const resetSettingsButton = document.getElementById('resetSettings');
const statusMessage = document.getElementById('statusMessage');
const loadingOverlay = document.getElementById('loadingOverlay');
const optionsForm = document.getElementById('optionsForm');

// Initialize the options page
async function initializeOptions() {
    try {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        optionsForm.style.display = 'none';
        
        // Initialize default settings if needed
        await initializeDefaultSettings();
        
        // Load current settings
        const settings = await getExtensionSettings();
        
        // Update UI with current settings
        extensionEnabledCheckbox.checked = settings.extensionEnabled;
        
        // Set the correct radio button for duplicate strategy
        duplicateStrategyRadios.forEach(radio => {
            if (radio.value === settings.duplicateStrategy) {
                radio.checked = true;
            }
        });
        
        // Set the correct radio button for URL sensitivity
        urlSensitivityRadios.forEach(radio => {
            if (radio.value === settings.urlSensitivity) {
                radio.checked = true;
            }
        });
        
        // Hide loading overlay and show options form
        loadingOverlay.style.display = 'none';
        optionsForm.style.display = 'flex';
        
        console.log('Options page initialized with settings:', settings);
    } catch (error) {
        console.error('Error initializing options:', error);
        showStatus('Error loading settings', 'error');
        
        // Hide loading overlay and show options form even on error
        loadingOverlay.style.display = 'none';
        optionsForm.style.display = 'flex';
    }
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

// Handle extension enabled/disabled toggle
extensionEnabledCheckbox.addEventListener('change', async (event) => {
    try {
        const enabled = event.target.checked;
        await setExtensionEnabled(enabled);
        showStatus(`Extension ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
        console.error('Error updating extension enabled setting:', error);
        showStatus('Error updating setting', 'error');
        // Revert the checkbox
        event.target.checked = !event.target.checked;
    }
});

// Handle duplicate strategy change
duplicateStrategyRadios.forEach(radio => {
    radio.addEventListener('change', async (event) => {
        try {
            const strategy = event.target.value;
            await setDuplicateStrategy(strategy);
            showStatus('Duplicate handling strategy updated', 'success');
        } catch (error) {
            console.error('Error updating duplicate strategy setting:', error);
            showStatus('Error updating strategy', 'error');
            // Revert the radio button
            event.target.checked = false;
        }
    });
});

// Handle URL sensitivity change
urlSensitivityRadios.forEach(radio => {
    radio.addEventListener('change', async (event) => {
        try {
            const sensitivity = event.target.value;
            await setUrlSensitivity(sensitivity);
            showStatus('URL sensitivity updated', 'success');
        } catch (error) {
            console.error('Error updating URL sensitivity setting:', error);
            showStatus('Error updating sensitivity', 'error');
            // Revert the radio button
            event.target.checked = false;
        }
    });
});


// Handle reset settings button
resetSettingsButton.addEventListener('click', async () => {
    try {
        resetSettingsButton.disabled = true;
        resetSettingsButton.textContent = 'Resetting...';
        
        // Reset to default settings
        await chrome.storage.sync.clear();
        await initializeDefaultSettings();
        
        // Reload current settings
        const settings = await getExtensionSettings();
        extensionEnabledCheckbox.checked = settings.extensionEnabled;
        
        // Reset radio buttons
        duplicateStrategyRadios.forEach(radio => {
            if (radio.value === settings.duplicateStrategy) {
                radio.checked = true;
            }
        });
        
        // Reset URL sensitivity radio buttons
        urlSensitivityRadios.forEach(radio => {
            if (radio.value === settings.urlSensitivity) {
                radio.checked = true;
            }
        });
        
        showStatus('Settings reset to defaults', 'success');
    } catch (error) {
        console.error('Error resetting settings:', error);
        showStatus('Error resetting settings', 'error');
    } finally {
        resetSettingsButton.disabled = false;
        resetSettingsButton.textContent = 'Reset to Defaults';
    }
});

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptions);
