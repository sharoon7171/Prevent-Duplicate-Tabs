// Whitelist configuration constants
export const WHITELIST_TYPES = {
    EXACT_URL: 'exactUrl',
    IGNORE_PARAMETERS: 'ignoreParameters',
    COMPLETE_DOMAIN: 'completeDomain'
};

export const WHITELIST_TYPE_LABELS = {
    [WHITELIST_TYPES.EXACT_URL]: 'Exact URL',
    [WHITELIST_TYPES.IGNORE_PARAMETERS]: 'Ignore Parameters',
    [WHITELIST_TYPES.COMPLETE_DOMAIN]: 'Complete Domain'
};

export const WHITELIST_TYPE_DESCRIPTIONS = {
    [WHITELIST_TYPES.EXACT_URL]: 'Exact URL match - ignores this specific URL completely',
    [WHITELIST_TYPES.IGNORE_PARAMETERS]: 'Domain + path match - ignores query parameters and fragments',
    [WHITELIST_TYPES.COMPLETE_DOMAIN]: 'Complete domain match - ignores all pages on this domain'
};

export const STORAGE_KEYS = {
    WHITELIST_ENTRIES: 'whitelistEntries'
};

export const DEFAULT_WHITELIST = [];
