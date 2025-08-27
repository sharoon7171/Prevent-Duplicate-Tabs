/**
 * Reusable Header Component
 * Can be used in both popup and options page
 */
export class Header {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            title: 'Prevent Duplicate Tabs',
            subtitle: 'Extension Options',
            showIcon: true,
            iconPath: '../assets/icons/icon48.png',
            ...options
        };
        
        if (!this.container) {
            console.error('Header: Container not found:', containerId);
            return;
        }
        
        this.render();
    }
    
    render() {
        const headerHTML = `
            <header class="extension-header">
                <div class="header-content">
                    ${this.options.showIcon ? `<img src="${this.options.iconPath}" alt="Extension Icon" class="header-icon">` : ''}
                    <div class="header-text">
                        <h1>${this.options.title}</h1>
                        <p>${this.options.subtitle}</p>
                    </div>
                </div>
            </header>
        `;
        
        this.container.innerHTML = headerHTML;
    }
    
    updateTitle(title) {
        const titleElement = this.container.querySelector('.header-text h1');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    updateSubtitle(subtitle) {
        const subtitleElement = this.container.querySelector('.header-text p');
        if (subtitleElement) {
            subtitleElement.textContent = subtitle;
        }
    }
    
    setIconPath(path) {
        const iconElement = this.container.querySelector('.header-icon');
        if (iconElement) {
            iconElement.src = path;
        }
    }
}
