// Options page script for Prevent Duplicate Tabs extension

import { getExtensionSettings, setExtensionEnabled, setDuplicateStrategy, setUrlSensitivity, initializeDefaultSettings } from '../src/functions/utils/storageUtils.mjs';
import { WhitelistManager } from '../src/components/ui/whitelistManager.mjs';

console.log('Prevent Duplicate Tabs extension options page loaded');

// DOM elements
const extensionEnabledCheckbox = document.getElementById('extensionEnabled');
const duplicateStrategyRadios = document.querySelectorAll('input[name="duplicateStrategy"]');
const urlSensitivityRadios = document.querySelectorAll('input[name="urlSensitivity"]');
const resetSettingsButton = document.getElementById('resetSettings');
const toastContainer = document.getElementById('toastContainer');
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
        
        // Initialize whitelist manager
        console.log('Options: Initializing whitelist manager...');
        const whitelistContainer = document.getElementById('whitelistContainer');
        console.log('Options: Whitelist container found:', whitelistContainer);
        
        if (whitelistContainer) {
            const whitelistManager = new WhitelistManager('whitelistContainer');
            console.log('Options: Whitelist manager created:', whitelistManager);
        } else {
            console.error('Options: Whitelist container not found!');
        }
        
        // Welcome message logged to console instead of showing toast
        console.log('Welcome to Prevent Duplicate Tabs settings!');
        
        console.log('Options page initialized with settings:', settings);
    } catch (error) {
        console.error('Error initializing options:', error);
        showToast('Error loading settings', 'error', 5000);
        
        // Hide loading overlay and show options form even on error
        loadingOverlay.style.display = 'none';
        optionsForm.style.display = 'flex';
    }
}

// Toast notification system - Instant replacement, no flickering
function showToast(message, type = 'info', duration = 4000) {
    // Check if there's an existing notification
    const existingToast = toastContainer.querySelector('.toast-notification');
    
    if (existingToast && existingToast.classList.contains('show')) {
        // Update existing visible notification instantly (no flickering)
        updateExistingToast(existingToast, message, type, duration);
        return existingToast;
    } else {
        // Create new notification if none exists or if existing one is hidden
        if (existingToast) {
            // Remove hidden notification before creating new one
            hideToast(existingToast);
        }
        return createNewToast(message, type, duration);
    }
}

// Update existing toast without flickering
function updateExistingToast(existingToast, message, type, duration) {
    // Update content and type instantly
    existingToast.className = `toast-notification ${type}`;
    existingToast.querySelector('span').textContent = message;
    
    // Clear any existing timer
    if (existingToast.autoHideTimeout) {
        clearTimeout(existingToast.autoHideTimeout);
        existingToast.autoHideTimeout = null;
    }
    
    // Always set new auto-hide timer for the full duration
    if (duration > 0) {
        existingToast.autoHideTimeout = setTimeout(() => {
            hideToast(existingToast);
        }, duration);
    }
    
    // Add a subtle refresh animation
    existingToast.style.animation = 'none';
    existingToast.offsetHeight; // Trigger reflow
    existingToast.style.animation = 'toast-refresh 0.3s ease';
    
    // Ensure the toast is visible
    existingToast.classList.add('show');
}

// Create new toast notification
function createNewToast(message, type, duration) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    
    // Create message text
    const messageText = document.createElement('span');
    messageText.textContent = message;
    
    // Assemble toast
    toast.appendChild(closeBtn);
    toast.appendChild(messageText);
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show toast with animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto-hide functionality
    if (duration > 0) {
        toast.autoHideTimeout = setTimeout(() => {
            hideToast(toast);
        }, duration);
    }
    
    // Close button functionality
    closeBtn.addEventListener('click', () => {
        if (toast.autoHideTimeout) {
            clearTimeout(toast.autoHideTimeout);
        }
        hideToast(toast);
    });
    
    // Return toast reference for manual control
    return toast;
}

// Hide toast with animation
function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Clear all existing toasts
function clearAllToasts() {
    const toasts = document.querySelectorAll('.toast-notification');
    toasts.forEach(toast => {
        if (toast.autoHideTimeout) {
            clearTimeout(toast.autoHideTimeout);
        }
        hideToast(toast);
    });
}

// Legacy function for backward compatibility
function showStatus(message, type = 'info') {
    return showToast(message, type, 4000);
}

// Make showToast globally available for other components
window.showToast = showToast;

// Handle extension enabled/disabled toggle
extensionEnabledCheckbox.addEventListener('change', async (event) => {
    try {
        const enabled = event.target.checked;
        await setExtensionEnabled(enabled);
        const status = enabled ? 'enabled' : 'disabled';
        showToast(`Extension ${status}`, enabled ? 'success' : 'error', 3000);
    } catch (error) {
        console.error('Error updating extension enabled setting:', error);
        showToast('Error updating setting', 'error', 5000);
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
            const strategyLabels = {
            'closeNewStayCurrent': 'Close new tab, stay on current',
            'closeNewGoToOriginal': 'Close new tab, go to original',
            'closeExistingStayCurrent': 'Close existing tab, stay on current',
            'closeExistingGoToNew': 'Close existing tab, go to new tab'
        };
        const selectedLabel = strategyLabels[strategy] || strategy;
        showToast(`Strategy: ${selectedLabel}`, 'success', 3000);
        } catch (error) {
            console.error('Error updating duplicate strategy setting:', error);
            showToast('Error updating strategy', 'error', 5000);
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
            const sensitivityLabels = {
            'exactUrl': 'Exact same URL',
            'ignoreParameters': 'Ignore parameters',
            'exactDomain': 'Exact domain only'
        };
        const selectedLabel = sensitivityLabels[sensitivity] || sensitivity;
        showToast(`URL Sensitivity: ${selectedLabel}`, 'success', 3000);
        } catch (error) {
            console.error('Error updating URL sensitivity setting:', error);
            showToast('Error updating sensitivity', 'error', 5000);
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
        
        showToast('All settings reset to default values', 'success', 4000);
    } catch (error) {
        console.error('Error resetting settings:', error);
        showToast('Error resetting settings', 'error', 5000);
    } finally {
        resetSettingsButton.disabled = false;
        resetSettingsButton.textContent = 'Reset to Defaults';
    }
});

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptions);
