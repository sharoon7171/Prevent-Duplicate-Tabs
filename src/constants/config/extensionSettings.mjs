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
    IGNORE_PARAMETERS: 'ignoreParameters',
    EXACT_DOMAIN: 'exactDomain'
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
