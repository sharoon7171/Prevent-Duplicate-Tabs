// Reusable Loading Spinner Component
// Can be used in both popup and options page

export class LoadingSpinner {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            message: 'Loading...',
            size: 'medium', // small, medium, large
            color: '#3498db', // primary color
            showMessage: true,
            ...options
        };
        
        if (!this.container) {
            console.error('LoadingSpinner: Container not found:', containerId);
            return;
        }
        
        this.render();
    }
    
    render() {
        const sizeClass = `spinner-${this.options.size}`;
        const messageClass = this.options.showMessage ? 'with-message' : 'no-message';
        
        this.container.innerHTML = `
            <div class="loading-overlay ${messageClass}">
                <div class="loading-spinner ${sizeClass}" style="border-top-color: ${this.options.color}"></div>
                ${this.options.showMessage ? `<p>${this.options.message}</p>` : ''}
            </div>
        `;
        
        this.overlay = this.container.querySelector('.loading-overlay');
        this.spinner = this.container.querySelector('.loading-spinner');
        this.message = this.container.querySelector('p');
    }
    
    // Show the loading spinner
    show() {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
        }
    }
    
    // Hide the loading spinner
    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
    
    // Update the loading message
    updateMessage(message) {
        if (this.message) {
            this.message.textContent = message;
        }
    }
    
    // Update the spinner color
    updateColor(color) {
        if (this.spinner) {
            this.spinner.style.borderTopColor = color;
        }
    }
    
    // Update the spinner size
    updateSize(size) {
        if (this.spinner) {
            this.spinner.className = `loading-spinner spinner-${size}`;
        }
    }
    
    // Check if spinner is visible
    isVisible() {
        return this.overlay && this.overlay.style.display === 'flex';
    }
    
    // Destroy the component
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
