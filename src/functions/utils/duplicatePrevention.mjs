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
        
        if (duplicateTabs.length > 0) {
            console.log(`Found ${duplicateTabs.length} duplicate tabs, applying strategy: ${settings.duplicateStrategy}`);
            
            // Get current active tab
            const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTabId = currentTab[0]?.id;
            
            // Apply the selected strategy
            switch (settings.duplicateStrategy) {
                case 'closeNewStayCurrent':
                    // Close new tab, stay on current tab
                    await chrome.tabs.remove(newTabId);
                    console.log('New duplicate tab closed, staying on current tab');
                    break;
                    
                case 'closeNewGoToOriginal':
                    // Close new tab, navigate to original tab
                    await chrome.tabs.remove(newTabId);
                    if (duplicateTabs.length > 0) {
                        await chrome.tabs.update(duplicateTabs[0].id, { active: true });
                        console.log('New duplicate tab closed, navigated to original tab');
                    }
                    break;
                    
                case 'closeExistingStayCurrent':
                    // Close existing tabs, stay on current tab
                    const closePromises = duplicateTabs.map(tab => chrome.tabs.remove(tab.id));
                    await Promise.all(closePromises);
                    console.log('Existing duplicate tabs closed, staying on current tab');
                    break;
                    
                case 'closeExistingGoToNew':
                    // Close existing tabs, navigate to new tab
                    const closeExistingPromises = duplicateTabs.map(tab => chrome.tabs.remove(tab.id));
                    await Promise.all(closeExistingPromises);
                    await chrome.tabs.update(newTabId, { active: true });
                    console.log('Existing duplicate tabs closed, navigated to new tab');
                    break;
                    
                default:
                    // Default: close new tab, stay on current
                    await chrome.tabs.remove(newTabId);
                    console.log('Default strategy: new duplicate tab closed');
                    break;
            }
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
        
        // Find and close duplicate tabs based on strategy
        let totalClosed = 0;
        const closePromises = [];
        
        Object.values(urlGroups).forEach(tabs => {
            if (tabs.length > 1) {
                // Apply strategy: keep the first tab, close the rest
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
            console.log(`Closed ${totalClosed} duplicate tabs using strategy: ${settings.duplicateStrategy}`);
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
