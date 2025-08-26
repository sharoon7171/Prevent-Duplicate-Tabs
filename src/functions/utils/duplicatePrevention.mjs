// Duplicate tab prevention utility functions
import { getExtensionSettings } from './storageUtils.mjs';
import { isUrlWhitelisted } from './whitelistUtils.mjs';

// Helper function to normalize URLs for consistent comparison
function normalizeUrl(url) {
    try {
        // If it's a valid URL, normalize it
        const urlObj = new URL(url);
        // Remove www prefix and normalize hostname
        const hostname = urlObj.hostname.replace(/^www\./, '');
        // Keep path but remove trailing slash
        const path = urlObj.pathname.replace(/\/$/, '');
        return hostname + path;
    } catch (error) {
        // If it's not a valid URL, assume it's a domain
        // Remove protocol if present
        const cleanUrl = url.replace(/^https?:\/\//, '');
        // Remove www prefix
        const withoutWww = cleanUrl.replace(/^www\./, '');
        // Keep path but remove query parameters, fragments, and trailing slash
        const normalized = withoutWww.split('?')[0].split('#')[0].replace(/\/$/, '');
        return normalized;
    }
}

// Helper function to compare URLs based on sensitivity setting
function compareUrls(url1, url2, sensitivity) {
    try {
        switch (sensitivity) {
            case 'exactUrl':
                // Use normalizeUrl for consistent comparison
                const normalizedUrl1 = normalizeUrl(url1);
                const normalizedUrl2 = normalizeUrl(url2);
                return normalizedUrl1 === normalizedUrl2;
                
            case 'ignoreParameters':
                // Use normalizeUrl for consistent comparison
                const normalizedUrl1Ignore = normalizeUrl(url1);
                const normalizedUrl2Ignore = normalizeUrl(url2);
                return normalizedUrl1Ignore === normalizedUrl2Ignore;
                
            case 'exactDomain':
                // Only compare domain, ignore path, parameters, and fragments
                const url1Obj = new URL(url1);
                const url2Obj = new URL(url2);
                // Remove www for consistent comparison
                return url1Obj.hostname.replace(/^www\./, '') === url2Obj.hostname.replace(/^www\./, '');
                
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
        
        // Check if the new URL is whitelisted
        const isWhitelisted = await isUrlWhitelisted(newTabUrl);
        if (isWhitelisted) {
            console.log('URL is whitelisted, allowing duplicate:', newTabUrl);
            return 0; // Allow the duplicate
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
        for (const tab of allTabs) {
            if (!tab.pinned && tab.url) {
                // Check if this tab's URL is whitelisted
                const isWhitelisted = await isUrlWhitelisted(tab.url);
                if (isWhitelisted) {
                    console.log('Skipping whitelisted URL in duplicate removal:', tab.url);
                    continue; // Skip whitelisted URLs
                }
                
                let groupKey;
                
                switch (settings.urlSensitivity) {
                    case 'exactUrl':
                        groupKey = normalizeUrl(tab.url);
                        break;
                    case 'ignoreParameters':
                        groupKey = normalizeUrl(tab.url);
                        break;
                    case 'exactDomain':
                        try {
                            const urlObj = new URL(tab.url);
                            // Remove www for consistent grouping
                            groupKey = urlObj.hostname.replace(/^www\./, '');
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
        }
        
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
        
        // Check if the URL is whitelisted
        const isWhitelisted = await isUrlWhitelisted(url);
        if (isWhitelisted) {
            return false; // Whitelisted URLs are never considered duplicates
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
