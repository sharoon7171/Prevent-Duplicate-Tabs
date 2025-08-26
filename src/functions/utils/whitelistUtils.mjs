// Whitelist utility functions for storage and management
import { STORAGE_KEYS, DEFAULT_WHITELIST } from '../../constants/config/whitelistConfig.mjs';

/**
 * Get all whitelist entries from storage
 * @returns {Promise<Array>} Array of whitelist entries
 */
export async function getWhitelistEntries() {
    try {
        // Check if Chrome storage API is available
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
            console.warn('Chrome storage API not available, returning default whitelist');
            return DEFAULT_WHITELIST;
        }
        
        const result = await chrome.storage.sync.get([STORAGE_KEYS.WHITELIST_ENTRIES]);
        return result[STORAGE_KEYS.WHITELIST_ENTRIES] || DEFAULT_WHITELIST;
    } catch (error) {
        console.error('Error getting whitelist entries:', error);
        return DEFAULT_WHITELIST;
    }
}

/**
 * Add a new whitelist entry
 * @param {Object} entry - Whitelist entry object
 * @param {string} entry.url - URL or domain to whitelist
 * @param {string} entry.type - Type of whitelist (exactUrl, ignoreParameters, completeDomain)
 * @returns {Promise<boolean>} Success status
 */
export async function addWhitelistEntry(entry) {
    try {
        // Check if Chrome storage API is available
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
            throw new Error('Chrome storage API not available');
        }
        
        const entries = await getWhitelistEntries();
        
        // Validate entry
        if (!entry.url || !entry.type) {
            throw new Error('Invalid whitelist entry: missing URL or type');
        }
        
        // Normalize URL for better duplicate detection
        const normalizedUrl = normalizeUrl(entry.url);
        
        // Check for duplicates
        const isDuplicate = entries.some(existing => 
            normalizeUrl(existing.url) === normalizedUrl && existing.type === entry.type
        );
        
        if (isDuplicate) {
            throw new Error('Whitelist entry already exists');
        }
        
        // Add new entry with ID and timestamp
        const newEntry = {
            id: generateId(),
            url: entry.url.trim(),
            type: entry.type,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        const updatedEntries = [...entries, newEntry];
        await chrome.storage.sync.set({ [STORAGE_KEYS.WHITELIST_ENTRIES]: updatedEntries });
        
        console.log('Whitelist entry added:', newEntry);
        return true;
    } catch (error) {
        console.error('Error adding whitelist entry:', error);
        throw error;
    }
}

/**
 * Update an existing whitelist entry
 * @param {string} id - Entry ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateWhitelistEntry(id, updates) {
    try {
        const entries = await getWhitelistEntries();
        const entryIndex = entries.findIndex(entry => entry.id === id);
        
        if (entryIndex === -1) {
            throw new Error('Whitelist entry not found');
        }
        
        // Update entry
        entries[entryIndex] = {
            ...entries[entryIndex],
            ...updates,
            updatedAt: Date.now()
        };
        
        await chrome.storage.sync.set({ [STORAGE_KEYS.WHITELIST_ENTRIES]: entries });
        
        console.log('Whitelist entry updated:', entries[entryIndex]);
        return true;
    } catch (error) {
        console.error('Error updating whitelist entry:', error);
        throw error;
    }
}

/**
 * Remove a whitelist entry by ID
 * @param {string} id - Entry ID to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeWhitelistEntry(id) {
    try {
        const entries = await getWhitelistEntries();
        const filteredEntries = entries.filter(entry => entry.id !== id);
        
        if (filteredEntries.length === entries.length) {
            throw new Error('Whitelist entry not found');
        }
        
        await chrome.storage.sync.set({ [STORAGE_KEYS.WHITELIST_ENTRIES]: filteredEntries });
        
        console.log('Whitelist entry removed:', id);
        return true;
    } catch (error) {
        console.error('Error removing whitelist entry:', error);
        throw error;
    }
}

/**
 * Clear all whitelist entries
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllWhitelistEntries() {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEYS.WHITELIST_ENTRIES]: DEFAULT_WHITELIST });
        console.log('All whitelist entries cleared');
        return true;
    } catch (error) {
        console.error('Error clearing whitelist entries:', error);
        throw error;
    }
}

/**
 * Check if a URL is whitelisted
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} True if URL is whitelisted
 */
export async function isUrlWhitelisted(url) {
    try {
        const entries = await getWhitelistEntries();
        
        return entries.some(entry => {
            switch (entry.type) {
                case 'exactUrl':
                    // Use normalizeUrl for consistent comparison
                    const normalizedUrl = normalizeUrl(url);
                    const normalizedEntry = normalizeUrl(entry.url);
                    return normalizedUrl === normalizedEntry;
                    
                case 'ignoreParameters':
                    // Use normalizeUrl for consistent comparison
                    const normalizedUrlIgnore = normalizeUrl(url);
                    const normalizedEntryIgnore = normalizeUrl(entry.url);
                    return normalizedUrlIgnore === normalizedEntryIgnore;
                    
                case 'completeDomain':
                    try {
                        const urlObj = new URL(url);
                        const entryObj = new URL(entry.url);
                        // Both hostnames are already normalized by extractHostname
                        return urlObj.hostname.replace(/^www\./, '') === entryObj.hostname.replace(/^www\./, '');
                    } catch (error) {
                        // If entry is not a valid URL, try direct domain comparison
                        const urlHostname = extractHostname(url);
                        const entryHostname = extractHostname(entry.url);
                        
                        // Both hostnames are already normalized (no www)
                        return urlHostname === entryHostname;
                    }
                    
                default:
                    return false;
            }
        });
    } catch (error) {
        console.error('Error checking if URL is whitelisted:', error);
        return false;
    }
}

/**
 * Generate a unique ID for whitelist entries
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Normalize URL for consistent comparison
 * @param {string} url - URL or domain string
 * @returns {string} Normalized URL
 */
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

/**
 * Extract hostname from URL or domain string
 * @param {string} url - URL or domain string
 * @returns {string} Hostname
 */
function extractHostname(url) {
    try {
        // If it's a valid URL, extract hostname
        const urlObj = new URL(url);
        // Remove www prefix for consistent comparison
        return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
        // If it's not a valid URL, assume it's a domain
        // Remove protocol if present
        const cleanUrl = url.replace(/^https?:\/\//, '');
        // Remove path and query parameters
        const hostname = cleanUrl.split('/')[0].split('?')[0].split('#')[0];
        
        // Handle empty hostname
        if (!hostname || hostname === '') {
            return url; // Return original if we can't extract hostname
        }
        
        // Remove www prefix for consistent comparison
        return hostname.replace(/^www\./, '');
    }
}

/**
 * Validate whitelist entry data
 * @param {Object} entry - Entry to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateWhitelistEntry(entry) {
    const errors = [];
    
    if (!entry.url || typeof entry.url !== 'string') {
        errors.push('URL is required and must be a string');
    } else if (entry.url.trim() === '') {
        errors.push('URL cannot be empty');
    }
    
    if (!entry.type || !['exactUrl', 'ignoreParameters', 'completeDomain'].includes(entry.type)) {
        errors.push('Valid type is required');
    }
    
    // Validate URL format based on type
    if (entry.url && entry.type) {
        try {
            if (entry.type === 'completeDomain') {
                // For complete domain, ensure it's a valid domain
                const hostname = extractHostname(entry.url);
                if (!hostname || hostname.includes(' ')) {
                    errors.push('Invalid domain format');
                }
            } else {
                // For other types, try to validate URL but be more flexible
                try {
                    new URL(entry.url);
                } catch (urlError) {
                    // If not a valid URL, check if it's a valid domain
                    const hostname = extractHostname(entry.url);
                    if (!hostname || hostname.includes(' ')) {
                        errors.push('Invalid URL or domain format');
                    }
                }
            }
        } catch (error) {
            errors.push('Invalid URL or domain format');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
