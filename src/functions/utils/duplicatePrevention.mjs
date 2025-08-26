// Duplicate tab prevention utility functions
import { getExtensionSettings } from './storageUtils.mjs';

export async function checkAndCloseDuplicateTabs(newTabId, newTabUrl) {
    try {
        const settings = await getExtensionSettings();
        
        // If extension is disabled, don't do anything
        if (!settings.extensionEnabled) {
            return;
        }
        
        // Get all tabs
        const allTabs = await chrome.tabs.query({});
        
        // Find duplicate tabs with the same URL
        const duplicateTabs = allTabs.filter(tab => 
            tab.id !== newTabId && 
            tab.url === newTabUrl && 
            !tab.pinned
        );
        
        // Close all duplicate tabs instantly
        if (duplicateTabs.length > 0) {
            console.log(`Found ${duplicateTabs.length} duplicate tabs, closing them instantly`);
            
            // Close all duplicate tabs simultaneously
            const closePromises = duplicateTabs.map(tab => chrome.tabs.remove(tab.id));
            await Promise.all(closePromises);
            
            console.log('All duplicate tabs closed successfully');
        }
        
        return duplicateTabs.length;
    } catch (error) {
        console.error('Error checking and closing duplicate tabs:', error);
        return 0;
    }
}

export async function removeAllDuplicateTabs() {
    try {
        const settings = await getExtensionSettings();
        
        // If extension is disabled, don't do anything
        if (!settings.extensionEnabled) {
            return 0;
        }
        
        // Get all tabs
        const allTabs = await chrome.tabs.query({});
        
        // Group tabs by URL
        const urlGroups = {};
        allTabs.forEach(tab => {
            if (!tab.pinned && tab.url) {
                if (!urlGroups[tab.url]) {
                    urlGroups[tab.url] = [];
                }
                urlGroups[tab.url].push(tab);
            }
        });
        
        // Find and close duplicate tabs
        let totalClosed = 0;
        const closePromises = [];
        
        Object.values(urlGroups).forEach(tabs => {
            if (tabs.length > 1) {
                // Keep the first tab, close the rest
                const tabsToClose = tabs.slice(1);
                totalClosed += tabsToClose.length;
                
                tabsToClose.forEach(tab => {
                    closePromises.push(chrome.tabs.remove(tab.id));
                });
            }
        });
        
        // Close all duplicate tabs simultaneously
        if (closePromises.length > 0) {
            await Promise.all(closePromises);
            console.log(`Closed ${totalClosed} duplicate tabs`);
        }
        
        return totalClosed;
    } catch (error) {
        console.error('Error removing all duplicate tabs:', error);
        return 0;
    }
}

export async function isDuplicateTab(url) {
    try {
        const settings = await getExtensionSettings();
        
        // If extension is disabled, nothing is a duplicate
        if (!settings.extensionEnabled) {
            return false;
        }
        
        // Get all tabs
        const allTabs = await chrome.tabs.query({});
        
        // Check if URL already exists in other tabs
        return allTabs.some(tab => tab.url === url);
    } catch (error) {
        console.error('Error checking if tab is duplicate:', error);
        return false;
    }
}
