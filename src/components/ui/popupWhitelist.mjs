// Popup-specific whitelist component for current tab
import { 
    getWhitelistEntries,
    addWhitelistEntry, 
    removeWhitelistEntry,
    isUrlWhitelisted,
    normalizeUrl
} from '../../functions/utils/whitelistUtils.mjs';

export class PopupWhitelist {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentUrl = '';
        this.currentTabId = null;
        this.whitelistEntry = null;
        this.whitelistEnabled = false;
        
        if (!this.container) {
            console.error('PopupWhitelist: Container not found:', containerId);
            return;
        }
        
        this.init();
    }
    
    async init() {
        try {
            console.log('PopupWhitelist: Starting initialization...');
            
            // Get current tab information
            await this.getCurrentTabInfo();
            
            // Check if current URL is already whitelisted
            await this.checkWhitelistStatus();
            
            // Render the component
            this.render();
            
            console.log('PopupWhitelist: Initialization complete');
        } catch (error) {
            console.error('PopupWhitelist: Initialization failed:', error);
            this.showError('Failed to initialize whitelist component');
        }
    }
    
    async getCurrentTabInfo() {
        try {
            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                this.currentTabId = tab.id;
                this.currentUrl = tab.url;
                console.log('PopupWhitelist: Current tab URL:', this.currentUrl);
            } else {
                throw new Error('No active tab found');
            }
        } catch (error) {
            console.error('Error getting current tab:', error);
            throw error;
        }
    }
    
    async checkWhitelistStatus() {
        try {
            if (!this.currentUrl) return;
            
            // Check if URL is already whitelisted
            const isWhitelisted = await isUrlWhitelisted(this.currentUrl);
            this.whitelistEnabled = isWhitelisted;
            
            if (isWhitelisted) {
                // Find the existing whitelist entry
                const entries = await getWhitelistEntries();
                this.whitelistEntry = entries.find(entry => {
                    // Check if this URL matches any whitelist entry
                    return this.matchesWhitelistEntry(this.currentUrl, entry);
                });
                console.log('PopupWhitelist: Found existing whitelist entry:', this.whitelistEntry);
            }
        } catch (error) {
            console.error('Error checking whitelist status:', error);
        }
    }
    
    matchesWhitelistEntry(url, entry) {
        try {
            // All entries are now domain-only whitelists
            // Complete domain match (ignores path, parameters, and fragments)
            const urlHostname = this.extractHostname(url);
            const entryHostname = this.extractHostname(entry.url);
            return urlHostname === entryHostname;
        } catch (error) {
            console.error('Error matching whitelist entry:', error);
            return false;
        }
    }
    
    extractHostname(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, '');
        } catch (error) {
            const cleanUrl = url.replace(/^https?:\/\//, '');
            const hostname = cleanUrl.split('/')[0].split('?')[0].split('#')[0];
            return hostname ? hostname.replace(/^www\./, '') : url;
        }
    }
    
    render() {
        if (!this.currentUrl) {
            this.container.innerHTML = '<div class="error-message">Unable to get current tab URL</div>';
            return;
        }
        
        const normalizedDomain = normalizeUrl(this.currentUrl);
        
        this.container.innerHTML = `
            <div class="whitelist-unified">
                <label class="toggle-label">
                    <input type="checkbox" id="whitelistToggle" ${this.whitelistEnabled ? 'checked' : ''}>
                    <span class="toggle-text">Enable Whitelist for this domain</span>
                </label>
                <div class="toggle-description">
                    ${this.whitelistEnabled ? 'Duplicate prevention disabled for this domain' : 'Duplicate prevention enabled for this domain'}
                </div>
                <div class="domain-display">
                    <strong>Domain:</strong> ${normalizedDomain}
                </div>
            </div>
        `;
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Whitelist toggle
        const whitelistToggle = document.getElementById('whitelistToggle');
        if (whitelistToggle) {
            whitelistToggle.addEventListener('change', (e) => this.handleToggleChange(e.target.checked));
        }
    }
    
    async handleToggleChange(enabled) {
        try {
            this.whitelistEnabled = enabled;
            
            if (enabled) {
                // Add to whitelist
                await this.handleAdd();
            } else {
                // Remove from whitelist
                if (this.whitelistEntry) {
                    await this.handleRemove();
                }
            }
            
            // Update the UI
            this.render();
            this.bindEvents();
        } catch (error) {
            console.error('Error toggling whitelist:', error);
            // Revert the toggle if there was an error
            this.whitelistEnabled = !enabled;
            this.render();
            this.bindEvents();
        }
    }
    
    async handleAdd() {
        try {
            // Add to whitelist
            await addWhitelistEntry({
                url: this.currentUrl
            });
            
            // Update status
            await this.checkWhitelistStatus();
            this.render();
            this.bindEvents();
            
            this.showSuccess('URL added to whitelist successfully');
        } catch (error) {
            console.error('Error adding to whitelist:', error);
            this.showError(error.message);
        }
    }
    
    async handleRemove() {
        if (!this.whitelistEntry) return;
        
        try {
            // Remove from whitelist
            await removeWhitelistEntry(this.whitelistEntry.id);
            
            // Update status
            this.whitelistEntry = null;
            this.render();
            this.bindEvents();
            
            this.showSuccess('URL removed from whitelist successfully');
        } catch (error) {
            console.error('Error removing from whitelist:', error);
            this.showError(error.message);
        }
    }
    
    showSuccess(message) {
        console.log('Success:', message);
        // Show success message in the UI
        this.showMessage(message, 'success');
    }
    
    showError(message) {
        console.error('Error:', message);
        // Show error message in the UI
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing message
        const existingMessage = this.container.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast message-${type}`;
        messageDiv.textContent = message;
        
        // Insert at the top of the container
        this.container.insertBefore(messageDiv, this.container.firstChild);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // Refresh method to update the component when storage changes
    async refresh() {
        try {
            console.log('PopupWhitelist: Refreshing component...');
            await this.checkWhitelistStatus();
            this.render();
            this.bindEvents();
            console.log('PopupWhitelist: Component refreshed successfully');
        } catch (error) {
            console.error('PopupWhitelist: Error refreshing component:', error);
        }
    }
}
