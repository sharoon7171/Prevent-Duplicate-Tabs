// Duplicate tab prevention utility functions
import { getExtensionSettings } from './storageUtils.mjs';

// Helper function to compare URLs based on sensitivity setting
function compareUrls(url1, url2, sensitivity) {
    try {
        if (!url1 || !url2) return false;
        
        switch (sensitivity) {
            case 'exactUrl':
                // Exact match - compare full URLs
                return url1 === url2;
                
            case 'ignoreParameters':
                // Ignore query parameters and fragments, but keep path
                const url1Clean = url1.split('?')[0].split('#')[0];
                const url2Clean = url2.split('?')[0].split('#')[0];
                return url1Clean === url2Clean;
                
            case 'exactDomain':
                // Only compare domain, ignore path, parameters, and fragments
                const url1Obj = new URL(url1);
                const url2Obj = new URL(url2);
                return url1Obj.hostname === url2Obj.hostname;
                
            default:
                return url1 === url2;
        }
    } catch (error) {
        console.error('Error comparing URLs:', error);
        return false;
    }
}

export async function checkAndCloseDuplicateTabs(newTabId, newTabUrl) {
    try {
        const settings = await getExtensionSettings();
        
        // If extension is disabled, don't do anything
        if (!settings.extensionEnabled) {
            return;
        }
        
        // Get all tabs
        const allTabs = await chrome.tabs.query({});
        
        // Find duplicate tabs based on URL sensitivity setting
        const duplicateTabs = allTabs.filter(tab => 
            tab.id !== newTabId && 
            compareUrls(tab.url, newTabUrl, settings.urlSensitivity) && 
            !tab.pinned
        );
        
        if (duplicateTabs.length > 0) {
            console.log(`Found ${duplicateTabs.length} duplicate tabs using ${settings.urlSensitivity} sensitivity, applying strategy: ${settings.duplicateStrategy}`);

            
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
        
        // Group tabs by URL based on sensitivity setting
        const urlGroups = {};
        allTabs.forEach(tab => {
            if (!tab.pinned && tab.url) {
                let groupKey;
                
                switch (settings.urlSensitivity) {
                    case 'exactUrl':
                        groupKey = tab.url;
                        break;
                    case 'ignoreParameters':
                        groupKey = tab.url.split('?')[0].split('#')[0];
                        break;
                    case 'exactDomain':
                        try {
                            const urlObj = new URL(tab.url);
                            groupKey = urlObj.hostname;
                        } catch (error) {
                            groupKey = tab.url;
                        }
                        break;
                    default:
                        groupKey = tab.url;
                }
                
                if (!urlGroups[groupKey]) {
                    urlGroups[groupKey] = [];
                }
                urlGroups[groupKey].push(tab);
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
            console.log(`Closed ${totalClosed} duplicate tabs using ${settings.urlSensitivity} sensitivity and strategy: ${settings.duplicateStrategy}`);

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
        
        // Check if URL already exists in other tabs based on sensitivity setting
        return allTabs.some(tab => compareUrls(tab.url, url, settings.urlSensitivity));
    } catch (error) {
        console.error('Error checking if tab is duplicate:', error);
        return false;
    }
}
