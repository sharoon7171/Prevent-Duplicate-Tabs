// Popup-specific whitelist component for current tab
import { 
    getWhitelistEntries, 
    addWhitelistEntry, 
    updateWhitelistEntry,
    removeWhitelistEntry,
    isUrlWhitelisted 
} from '../../functions/utils/whitelistUtils.mjs';
import { 
    WHITELIST_TYPES, 
    WHITELIST_TYPE_LABELS, 
    WHITELIST_TYPE_DESCRIPTIONS 
} from '../../constants/config/whitelistConfig.mjs';

export class PopupWhitelist {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentUrl = '';
        this.currentTabId = null;
        this.whitelistEntry = null;
        this.isEditing = false;
        
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
            switch (entry.type) {
                case WHITELIST_TYPES.EXACT_URL:
                    return this.normalizeUrl(url) === this.normalizeUrl(entry.url);
                    
                case WHITELIST_TYPES.IGNORE_PARAMETERS:
                    return this.normalizeUrl(url) === this.normalizeUrl(entry.url);
                    
                case WHITELIST_TYPES.COMPLETE_DOMAIN:
                    const urlHostname = this.extractHostname(url);
                    const entryHostname = this.extractHostname(entry.url);
                    return urlHostname === entryHostname;
                    
                default:
                    return false;
            }
        } catch (error) {
            console.error('Error matching whitelist entry:', error);
            return false;
        }
    }
    
    normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace(/^www\./, '');
            const path = urlObj.pathname.replace(/\/$/, '');
            return hostname + path;
        } catch (error) {
            const cleanUrl = url.replace(/^https?:\/\//, '');
            const withoutWww = cleanUrl.replace(/^www\./, '');
            const normalized = withoutWww.split('?')[0].split('#')[0].replace(/\/$/, '');
            return normalized;
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
        
        const domain = this.extractHostname(this.currentUrl);
        const isCurrentlyWhitelisted = !!this.whitelistEntry;
        
        this.container.innerHTML = `
            <div class="whitelist-section">
                <div class="section-header">
                    <h3>Current Tab Whitelist</h3>
                    <p>Manage whitelist rule for the current tab</p>
                </div>
                
                <div class="current-url-info">
                    <div class="url-display">
                        <strong>Current URL:</strong>
                        <span class="url-text">${this.truncateUrl(this.currentUrl, 60)}</span>
                    </div>
                    <div class="domain-info">
                        <strong>Domain:</strong> ${domain}
                    </div>
                </div>
                
                ${isCurrentlyWhitelisted ? (this.isEditing ? this.renderEditForm() : this.renderWhitelistedState()) : this.renderWhitelistForm()}
            </div>
        `;
        
        this.bindEvents();
    }
    
    renderWhitelistForm() {
        return `
            <div class="whitelist-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="whitelistType">URL Sensitivity</label>
                        <select id="whitelistType">
                            <option value="${WHITELIST_TYPES.EXACT_URL}">${WHITELIST_TYPE_LABELS[WHITELIST_TYPES.EXACT_URL]}</option>
                            <option value="${WHITELIST_TYPES.IGNORE_PARAMETERS}">${WHITELIST_TYPE_LABELS[WHITELIST_TYPES.IGNORE_PARAMETERS]}</option>
                            <option value="${WHITELIST_TYPES.COMPLETE_DOMAIN}">${WHITELIST_TYPE_LABELS[WHITELIST_TYPES.COMPLETE_DOMAIN]}</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="info-label">Type Information</label>
                        <div id="whitelistTypeInfo" class="type-info">
                            ${WHITELIST_TYPE_DESCRIPTIONS[WHITELIST_TYPES.EXACT_URL]}
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" id="addWhitelistBtn" class="btn btn-primary">Add to Whitelist</button>
                </div>
            </div>
        `;
    }
    
    renderWhitelistedState() {
        const typeLabel = WHITELIST_TYPE_LABELS[this.whitelistEntry.type];
        const addedDate = new Date(this.whitelistEntry.createdAt).toLocaleDateString();
        
        return `
            <div class="whitelist-status">
                <div class="status-info">
                    <div class="status-badge whitelisted">✓ Whitelisted</div>
                    <div class="entry-details">
                        <div><strong>Type:</strong> ${typeLabel}</div>
                        <div><strong>Added:</strong> ${addedDate}</div>
                    </div>
                </div>
                
                <div class="status-actions">
                    <button type="button" id="editWhitelistBtn" class="btn btn-secondary btn-small">Edit</button>
                    <button type="button" id="removeWhitelistBtn" class="btn btn-danger btn-small">Remove</button>
                </div>
            </div>
        `;
    }

    renderEditForm() {
        return `
            <div class="whitelist-edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editWhitelistType">URL Sensitivity</label>
                        <select id="editWhitelistType">
                            <option value="${WHITELIST_TYPES.EXACT_URL}" ${this.whitelistEntry.type === WHITELIST_TYPES.EXACT_URL ? 'selected' : ''}>${WHITELIST_TYPE_LABELS[WHITELIST_TYPES.EXACT_URL]}</option>
                            <option value="${WHITELIST_TYPES.IGNORE_PARAMETERS}" ${this.whitelistEntry.type === WHITELIST_TYPES.IGNORE_PARAMETERS ? 'selected' : ''}>${WHITELIST_TYPE_LABELS[WHITELIST_TYPES.IGNORE_PARAMETERS]}</option>
                            <option value="${WHITELIST_TYPES.COMPLETE_DOMAIN}" ${this.whitelistEntry.type === WHITELIST_TYPES.COMPLETE_DOMAIN ? 'selected' : ''}>${WHITELIST_TYPE_LABELS[WHITELIST_TYPES.COMPLETE_DOMAIN]}</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="info-label">Type Information</label>
                        <div id="editWhitelistTypeInfo" class="type-info">
                            ${WHITELIST_TYPE_DESCRIPTIONS[this.whitelistEntry.type]}
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" id="updateWhitelistBtn" class="btn btn-primary btn-small">Update</button>
                    <button type="button" id="cancelEditBtn" class="btn btn-secondary btn-small">Cancel</button>
                </div>
            </div>
        `;
    }
    
    truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }
    
    bindEvents() {
        // Type change handler
        const typeSelect = document.getElementById('whitelistType');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => this.updateTypeInfo());
        }
        
        // Edit type change handler
        const editTypeSelect = document.getElementById('editWhitelistType');
        if (editTypeSelect) {
            editTypeSelect.addEventListener('change', () => this.updateEditTypeInfo());
        }
        
        // Add whitelist button
        const addBtn = document.getElementById('addWhitelistBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.handleAdd());
        }
        
        // Edit whitelist button
        const editBtn = document.getElementById('editWhitelistBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.handleEdit());
        }
        
        // Update whitelist button
        const updateBtn = document.getElementById('updateWhitelistBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.handleUpdate());
        }
        
        // Cancel edit button
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancelEdit());
        }
        
        // Remove whitelist button
        const removeBtn = document.getElementById('removeWhitelistBtn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.handleRemove());
        }
    }
    
    updateTypeInfo() {
        const typeSelect = document.getElementById('whitelistType');
        const typeInfo = document.getElementById('whitelistTypeInfo');
        
        if (typeSelect && typeInfo) {
            const selectedType = typeSelect.value;
            typeInfo.textContent = WHITELIST_TYPE_DESCRIPTIONS[selectedType];
        }
    }

    updateEditTypeInfo() {
        const typeSelect = document.getElementById('editWhitelistType');
        const typeInfo = document.getElementById('editWhitelistTypeInfo');
        
        if (typeSelect && typeInfo) {
            const selectedType = typeSelect.value;
            typeInfo.textContent = WHITELIST_TYPE_DESCRIPTIONS[selectedType];
        }
    }

    handleEdit() {
        this.isEditing = true;
        this.render();
        this.bindEvents();
    }

    handleCancelEdit() {
        this.isEditing = false;
        this.render();
        this.bindEvents();
    }

    async handleUpdate() {
        try {
            const type = document.getElementById('editWhitelistType').value;
            
            // Update whitelist entry
            await updateWhitelistEntry(this.whitelistEntry.id, {
                url: this.currentUrl,
                type: type
            });
            
            // Update local entry
            this.whitelistEntry.type = type;
            this.whitelistEntry.updatedAt = Date.now();
            
            // Exit edit mode and refresh
            this.isEditing = false;
            this.render();
            this.bindEvents();
            
            this.showSuccess('Whitelist entry updated successfully');
        } catch (error) {
            console.error('Error updating whitelist entry:', error);
            this.showError(error.message);
        }
    }
    
    async handleAdd() {
        try {
            const type = document.getElementById('whitelistType').value;
            
            // Add to whitelist
            await addWhitelistEntry({
                url: this.currentUrl,
                type: type
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
