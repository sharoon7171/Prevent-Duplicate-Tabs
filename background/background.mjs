// Background service worker for Prevent Duplicate Tabs extension

import { initializeDefaultSettings } from '../src/functions/utils/storageUtils.mjs';
import { checkAndCloseDuplicateTabs, removeAllDuplicateTabs } from '../src/functions/utils/duplicatePrevention.mjs';

console.log('Prevent Duplicate Tabs extension background service worker loaded');

// Initialize default settings when extension loads
initializeDefaultSettings();

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension event:', details.reason);
    
    if (details.reason === 'install') {
        console.log('Extension installed - opening options page');
        // Open options page when extension is first installed
        chrome.tabs.create({
            url: chrome.runtime.getURL('options/options.html')
        });
    } else if (details.reason === 'update') {
        console.log('Extension updated - opening options page');
        // Open options page when extension is updated
        chrome.tabs.create({
            url: chrome.runtime.getURL('options/options.html')
        });
    }
});

// Listen for extension startup
chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension started - checking if options page should be opened');
    // Remove any existing duplicate tabs on startup
    await removeAllDuplicateTabs();
});

// Listen for new tab creation - check for duplicates instantly
chrome.tabs.onCreated.addListener(async (tab) => {
    console.log('New tab created:', tab.url);
    if (tab.url && tab.url !== 'chrome://newtab/') {
        // Check and close duplicate tabs instantly
        await checkAndCloseDuplicateTabs(tab.id, tab.url);
    }
});

// Listen for tab updates - check for duplicates when URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.url && tab.url !== 'chrome://newtab/') {
        console.log('Tab URL updated:', tab.url);
        // Check and close duplicate tabs instantly
        await checkAndCloseDuplicateTabs(tabId, tab.url);
    }
});

// Listen for storage changes - execute duplicate removal when settings change
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'sync') {
        console.log('Storage changed:', changes);
        
        // If extension settings changed, remove all existing duplicates
        if (changes.extensionEnabled) {
            console.log('Extension settings changed - removing existing duplicates');
            await removeAllDuplicateTabs();
        }
    }
});

// Listen for messages from options page (currently no actions needed)
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('Message received:', message);
    // No actions currently needed from options page
});
