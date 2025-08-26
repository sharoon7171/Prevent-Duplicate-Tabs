// Utility functions for Prevent Duplicate Tabs extension
import { EXTENSION_CONFIG } from '../../constants/config/extensionConfig.mjs';

export function getExtensionInfo() {
    return {
        name: EXTENSION_CONFIG.NAME,
        version: EXTENSION_CONFIG.VERSION,
        author: EXTENSION_CONFIG.AUTHOR,
        website: EXTENSION_CONFIG.WEBSITE
    };
}

export function logExtensionStatus(status) {
    console.log(`[${EXTENSION_CONFIG.NAME}] ${status}`);
}
