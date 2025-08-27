// Whitelist manager UI component
import { 
    getWhitelistEntries, 
    addWhitelistEntry, 
    updateWhitelistEntry, 
    removeWhitelistEntry,
    clearAllWhitelistEntries,
    validateWhitelistEntry,
    normalizeUrl
} from '../../functions/utils/whitelistUtils.mjs';

export class WhitelistManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.entries = [];
        this.editingEntry = null;
        
        // Check if container exists
        if (!this.container) {
            console.error('WhitelistManager: Container not found:', containerId);
            return;
        }
        
        // Initialize asynchronously
        this.init().catch(error => {
            console.error('WhitelistManager: Initialization failed:', error);
        });
    }
    
    async init() {
        try {
            console.log('WhitelistManager: Starting initialization...');
            await this.loadEntries();
            console.log('WhitelistManager: Entries loaded, rendering...');
            this.render();
            console.log('WhitelistManager: Rendering complete, binding events...');
            this.bindEvents();
            console.log('WhitelistManager: Initialization complete');
        } catch (error) {
            console.error('WhitelistManager: Initialization failed:', error);
        }
    }
    
    async loadEntries() {
        try {
            console.log('WhitelistManager: Loading entries...');
            this.entries = await getWhitelistEntries();
            console.log('WhitelistManager: Entries loaded:', this.entries);
        } catch (error) {
            console.error('Error loading whitelist entries:', error);
            this.entries = [];
        }
    }
    
    render() {
        console.log('WhitelistManager: Rendering to container:', this.container);
        this.container.innerHTML = `
            <div class="whitelist-section">
                <div class="section-header">
                    <h3>Whitelist Management</h3>
                    <p>Manage URLs and domains that should be ignored by duplicate prevention</p>
                </div>
                
                <div class="whitelist-form">
                    <div class="form-group full-width">
                        <label for="whitelistUrl">URL or Domain</label>
                        <input type="text" id="whitelistUrl" placeholder="https://example.com or example.com">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="addWhitelistBtn" class="btn btn-primary">Add to Whitelist</button>
                        <button type="button" id="updateWhitelistBtn" class="btn btn-primary" style="display: none;">Update Entry</button>
                        <button type="button" id="cancelEditBtn" class="btn btn-secondary" style="display: none;">Cancel</button>
                    </div>
                </div>
                
                <div class="whitelist-list">
                    <div class="list-header">
                        <h4>Current Whitelist Entries (${this.entries.length})</h4>
                        ${this.entries.length > 0 ? '<button type="button" id="clearAllBtn" class="btn btn-danger btn-small">Clear All</button>' : ''}
                    </div>
                    
                    <div id="whitelistEntries" class="entries-container">
                        ${this.renderEntries()}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderEntries() {
        if (this.entries.length === 0) {
            return '<div class="no-entries">No whitelist entries yet. Add your first entry above.</div>';
        }
        
        return this.entries.map(entry => `
            <div class="whitelist-entry" data-id="${entry.id}">
                <div class="entry-content">
                    <div class="entry-url">${this.formatUrl(entry.url)}</div>
                    <div class="entry-date">Added: ${new Date(entry.createdAt).toLocaleDateString()}</div>
                </div>
                <div class="entry-actions">
                    <button type="button" class="btn btn-small btn-secondary edit-entry" data-id="${entry.id}">Edit</button>
                    <button type="button" class="btn btn-small btn-danger delete-entry" data-id="${entry.id}">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    formatUrl(url) {
        // Normalize URL for consistent display
        const normalizedUrl = normalizeUrl(url);
        // Truncate long URLs for display
        if (normalizedUrl.length > 50) {
            return normalizedUrl.substring(0, 47) + '...';
        }
        return normalizedUrl;
    }
    
    bindEvents() {
        // Add/Update button
        const addBtn = document.getElementById('addWhitelistBtn');
        const updateBtn = document.getElementById('updateWhitelistBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        
        addBtn?.addEventListener('click', () => this.handleAdd());
        updateBtn?.addEventListener('click', () => this.handleUpdate());
        cancelBtn?.addEventListener('click', () => this.cancelEdit());
        
        // Enter key support for domain input field
        const urlInput = document.getElementById('whitelistUrl');
        urlInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.editingEntry) {
                    this.handleUpdate();
                } else {
                    this.handleAdd();
                }
            }
        });
        
        // Type change handler removed - no more type field
        
        // Clear all button
        const clearAllBtn = document.getElementById('clearAllBtn');
        clearAllBtn?.addEventListener('click', () => this.showClearAllConfirmation());
        
        // Entry action buttons
        this.bindEntryActions();
    }
    
    bindEntryActions() {
        // Edit buttons
        document.querySelectorAll('.edit-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.editEntry(id);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteEntry(id);
            });
        });
    }
    
    // updateTypeInfo function removed - no more type field
    
    async handleAdd() {
        const url = document.getElementById('whitelistUrl').value.trim();
        
        // Validate entry
        const validation = validateWhitelistEntry({ url });
        if (!validation.isValid) {
            this.showError(validation.errors.join(', '));
            return;
        }
        
        try {
            await addWhitelistEntry({ url });
            await this.loadEntries();
            this.render();
            this.bindEvents();
            this.clearForm();
            this.showSuccess('Whitelist entry added successfully');
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    async handleUpdate() {
        if (!this.editingEntry) return;
        
        const url = document.getElementById('whitelistUrl').value.trim();
        
        // Validate entry
        const validation = validateWhitelistEntry({ url });
        if (!validation.isValid) {
            this.showError(validation.errors.join(', '));
            return;
        }
        
        try {
            await updateWhitelistEntry(this.editingEntry.id, { url });
            await this.loadEntries();
            this.render();
            this.bindEvents();
            this.clearForm();
            this.cancelEdit();
            this.showSuccess('Whitelist entry updated successfully');
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        this.editingEntry = entry;
        
        // Populate form
        document.getElementById('whitelistUrl').value = entry.url;
        
        // Show update buttons
        document.getElementById('addWhitelistBtn').style.display = 'none';
        document.getElementById('updateWhitelistBtn').style.display = 'inline-block';
        document.getElementById('cancelEditBtn').style.display = 'inline-block';
        
        // Focus on URL field
        document.getElementById('whitelistUrl').focus();
    }
    
    cancelEdit() {
        this.editingEntry = null;
        this.clearForm();
        
        // Show add button
        document.getElementById('addWhitelistBtn').style.display = 'inline-block';
        document.getElementById('updateWhitelistBtn').style.display = 'none';
        document.getElementById('cancelEditBtn').style.display = 'none';
    }
    
    async deleteEntry(id) {
        this.showDeleteConfirmation(id);
    }
    
    showDeleteConfirmation(id) {
        // Create confirmation overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';
        overlay.innerHTML = `
            <div class="confirmation-dialog">
                <div class="confirmation-header">
                    <h4>Confirm Deletion</h4>
                </div>
                <div class="confirmation-content">
                    <p>Are you sure you want to delete this whitelist entry?</p>
                    <p class="confirmation-warning">This action cannot be undone.</p>
                </div>
                <div class="confirmation-actions">
                    <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Bind confirmation events
        const cancelBtn = overlay.querySelector('#cancelDeleteBtn');
        const confirmBtn = overlay.querySelector('#confirmDeleteBtn');
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        confirmBtn.addEventListener('click', async () => {
            document.body.removeChild(overlay);
            await this.confirmDeleteEntry(id);
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }
    
    async confirmDeleteEntry(id) {
        try {
            await removeWhitelistEntry(id);
            await this.loadEntries();
            this.render();
            this.bindEvents();
            this.showSuccess('Whitelist entry deleted successfully');
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    showClearAllConfirmation() {
        // Create confirmation overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';
        overlay.innerHTML = `
            <div class="confirmation-dialog">
                <div class="confirmation-header">
                    <h4>Confirm Clear All</h4>
                </div>
                <div class="confirmation-content">
                    <p>Are you sure you want to clear all whitelist entries?</p>
                    <p class="confirmation-warning">This action cannot be undone.</p>
                </div>
                <div class="confirmation-actions">
                    <button type="button" class="btn btn-secondary" id="cancelClearAllBtn">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmClearAllBtn">Clear All</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Bind confirmation events
        const cancelBtn = overlay.querySelector('#cancelClearAllBtn');
        const confirmBtn = overlay.querySelector('#confirmClearAllBtn');
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        confirmBtn.addEventListener('click', async () => {
            document.body.removeChild(overlay);
            await this.handleClearAll();
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }
    
    async handleClearAll() {
        try {
            await this.clearAllEntries();
            await this.loadEntries();
            this.render();
            this.bindEvents();
            this.showSuccess('All whitelist entries cleared successfully');
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    async clearAllEntries() {
        try {
            await clearAllWhitelistEntries();
        } catch (error) {
            console.error('Error clearing all entries:', error);
            throw error;
        }
    }
    
    clearForm() {
        document.getElementById('whitelistUrl').value = '';
    }
    
    showSuccess(message) {
        console.log('Success:', message);
    }
    
    showError(message) {
        console.error('Error:', message);
    }

    // Refresh method to update the component when storage changes
    async refresh() {
        try {
            console.log('WhitelistManager: Refreshing component...');
            await this.loadEntries();
            this.render();
            this.bindEvents();
            console.log('WhitelistManager: Component refreshed successfully');
        } catch (error) {
            console.error('WhitelistManager: Error refreshing component:', error);
        }
    }
}
