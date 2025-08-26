// Options page script for Prevent Duplicate Tabs extension

import { getExtensionSettings, setExtensionEnabled, initializeDefaultSettings } from '../src/functions/utils/storageUtils.mjs';

console.log('Prevent Duplicate Tabs extension options page loaded');

// DOM elements
const extensionEnabledCheckbox = document.getElementById('extensionEnabled');
const removeDuplicatesButton = document.getElementById('removeDuplicates');
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

// Handle extension enabled toggle
extensionEnabledCheckbox.addEventListener('change', async (event) => {
    try {
        const enabled = event.target.checked;
        await setExtensionEnabled(enabled);
        
        if (enabled) {
            showStatus('Extension enabled successfully', 'success');
        } else {
            showStatus('Extension disabled', 'info');
        }
    } catch (error) {
        console.error('Error updating extension enabled setting:', error);
        showStatus('Error updating setting', 'error');
        // Revert the checkbox
        event.target.checked = !event.target.checked;
    }
});



// Handle remove duplicates button
removeDuplicatesButton.addEventListener('click', async () => {
    try {
        removeDuplicatesButton.disabled = true;
        removeDuplicatesButton.textContent = 'Removing...';
        
        // Send message to background script to remove duplicates
        const response = await chrome.runtime.sendMessage({ action: 'removeDuplicates' });
        
        if (response && response.success) {
            showStatus(`Removed ${response.count} duplicate tabs`, 'success');
        } else {
            showStatus('No duplicate tabs found', 'info');
        }
    } catch (error) {
        console.error('Error removing duplicates:', error);
        showStatus('Error removing duplicates', 'error');
    } finally {
        removeDuplicatesButton.disabled = false;
        removeDuplicatesButton.textContent = 'Remove Existing Duplicates';
    }
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
