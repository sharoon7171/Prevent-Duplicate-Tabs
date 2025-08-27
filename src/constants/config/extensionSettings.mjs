// Extension settings constants
export const EXTENSION_SETTINGS = {
    ENABLED: 'enabled',
    DISABLED: 'disabled'
};

export const DUPLICATE_STRATEGIES = {
    CLOSE_NEW_STAY_CURRENT: 'closeNewStayCurrent',
    CLOSE_NEW_GO_TO_ORIGINAL: 'closeNewGoToOriginal',
    CLOSE_EXISTING_STAY_CURRENT: 'closeExistingStayCurrent',
    CLOSE_EXISTING_GO_TO_NEW: 'closeExistingGoToNew'
};

export const URL_SENSITIVITY_OPTIONS = {
    EXACT_URL: 'exactUrl',
    EXACT_URL_IGNORE_PARAMS: 'exactUrlIgnoreParams'
};

export const URL_SENSITIVITY_LABELS = {
    [URL_SENSITIVITY_OPTIONS.EXACT_URL]: 'Exact URL with Parameters',
    [URL_SENSITIVITY_OPTIONS.EXACT_URL_IGNORE_PARAMS]: 'Exact URL Ignore Parameters'
};

export const URL_SENSITIVITY_DESCRIPTIONS = {
    [URL_SENSITIVITY_OPTIONS.EXACT_URL]: 'Exact same URL including parameters - only identical URLs are considered duplicates',
    [URL_SENSITIVITY_OPTIONS.EXACT_URL_IGNORE_PARAMS]: 'Same URL but ignores parameters - URLs with same path are considered duplicates'
};

export const STORAGE_KEYS = {
    EXTENSION_ENABLED: 'extensionEnabled',
    DUPLICATE_STRATEGY: 'duplicateStrategy',
    URL_SENSITIVITY: 'urlSensitivity'
};

export const DEFAULT_SETTINGS = {
    extensionEnabled: true,
    duplicateStrategy: 'closeNewStayCurrent',
    urlSensitivity: 'exactUrl'
};
