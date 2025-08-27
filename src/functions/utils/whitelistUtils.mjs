// Whitelist utility functions for storage and management
import { STORAGE_KEYS, DEFAULT_WHITELIST } from '../../constants/config/whitelistConfig.mjs';

/**
 * Get all whitelist entries with backward compatibility
 * @returns {Promise<Array>} Array of whitelist entries
 */
export async function getWhitelistEntries() {
    try {
        // Check if Chrome storage API is available
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
            console.warn('Chrome storage API not available, returning default whitelist');
            return DEFAULT_WHITELIST;
        }
        
        const result = await chrome.storage.sync.get(STORAGE_KEYS.WHITELIST_ENTRIES);
        let entries = result[STORAGE_KEYS.WHITELIST_ENTRIES] || DEFAULT_WHITELIST;
        
        // Migration: Remove type field from existing entries for backward compatibility
        let needsMigration = false;
        entries = entries.map(entry => {
            if (entry.type) {
                needsMigration = true;
                // Remove type field and keep only essential fields
                const { type, ...cleanEntry } = entry;
                return cleanEntry;
            }
            return entry;
        });
        
        // If migration was needed, save the cleaned entries
        if (needsMigration) {
            await chrome.storage.sync.set({ [STORAGE_KEYS.WHITELIST_ENTRIES]: entries });
            console.log('Migrated whitelist entries to new format (removed type field)');
        }
        
        return entries;
    } catch (error) {
        console.error('Error getting whitelist entries:', error);
        return DEFAULT_WHITELIST;
    }
}

/**
 * Add a new whitelist entry
 * @param {Object} entry - Whitelist entry object
 * @param {string} entry.url - URL or domain to whitelist
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
        if (!entry.url) {
            throw new Error('Invalid whitelist entry: missing URL');
        }
        
        // Normalize URL for better duplicate detection
        const normalizedUrl = normalizeUrl(entry.url);
        
        // Check for duplicates (all entries are now domain-only)
        const isDuplicate = entries.some(existing => 
            normalizeUrl(existing.url) === normalizedUrl
        );
        
        if (isDuplicate) {
            throw new Error('Whitelist entry already exists');
        }
        
        // Add new entry with ID and timestamp (no type field)
        const newEntry = {
            id: generateId(),
            url: entry.url.trim(),
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
        console.error('Error clearing all whitelist entries:', error);
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
            // All entries are now domain-only whitelists
            // Complete domain match (ignores path, parameters, and fragments)
            try {
                const urlObj = new URL(url);
                const entryObj = new URL(entry.url);
                const urlHostname = urlObj.hostname.replace(/^www\./, '');
                const entryHostname = entryObj.hostname.replace(/^www\./, '');
                return urlHostname === entryHostname;
            } catch (error) {
                // If entry is not a valid URL, try direct domain comparison
                const urlHostname = extractHostname(url);
                const entryHostname = extractHostname(entry.url);
                return urlHostname === entryHostname;
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
export function normalizeUrl(url) {
    try {
        // If it's a valid URL, normalize it
        const urlObj = new URL(url);
        // Remove www prefix and normalize hostname only (domain-only whitelists)
        return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
        // If it's not a valid URL, assume it's a domain
        // Remove protocol if present
        const cleanUrl = url.replace(/^https?:\/\//, '');
        // Remove www prefix and return only hostname
        return cleanUrl.replace(/^www\./, '').split('/')[0];
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
    
    if (!entry.url || entry.url.trim() === '') {
        errors.push('URL cannot be empty');
    }
    
    // Validate URL format (all entries are now domain-only)
    if (entry.url) {
        try {
            // For all entries, ensure it's a valid domain
            const hostname = extractHostname(entry.url);
            if (!hostname || hostname.includes(' ')) {
                errors.push('Invalid domain format');
            }
        } catch (error) {
            errors.push('Invalid domain format');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Check if a new whitelist entry would be redundant or duplicate
 * @param {Object} newEntry - New whitelist entry to check
 * @returns {Promise<Object>} Object with isRedundant flag and reason
 */
export async function checkWhitelistRedundancy(newEntry) {
    try {
        const entries = await getWhitelistEntries();
        
        for (const existingEntry of entries) {
            // Check if new entry is already covered by existing entry
            if (isEntryCoveredBy(newEntry, existingEntry)) {
                return {
                    isRedundant: true,
                    reason: `This entry is already covered by existing rule: ${existingEntry.url}`,
                    existingEntry
                };
            }
            
            // Check if new entry would cover existing entry
            if (isEntryCoveredBy(existingEntry, newEntry)) {
                return {
                    isRedundant: true,
                    reason: `This entry would make existing rule redundant: ${existingEntry.url}`,
                    existingEntry,
                    suggestion: 'Consider removing the existing rule instead'
                };
            }
        }
        
        return { isRedundant: false };
    } catch (error) {
        console.error('Error checking whitelist redundancy:', error);
        return { isRedundant: false, error: error.message };
    }
}

/**
 * Check if one entry is covered by another entry
 * @param {Object} entry1 - First entry to check
 * @param {Object} entry2 - Second entry to check
 * @returns {boolean} True if entry1 is covered by entry2
 */
function isEntryCoveredBy(entry1, entry2) {
    try {
        // All entries are now domain-only whitelists
        // Check if entry1's domain is covered by entry2's domain
        const entry1Hostname = extractHostname(entry1.url);
        const entry2Hostname = extractHostname(entry2.url);
        return entry1Hostname === entry2Hostname;
    } catch (error) {
        console.error('Error checking if entry is covered by another:', error);
        return false;
    }
}
