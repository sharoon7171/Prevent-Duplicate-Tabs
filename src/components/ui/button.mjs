/**
 * Reusable Button Component
 * Can be used in both popup and options page
 */
export class Button {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            id: 'button_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            text: 'Button',
            type: 'secondary', // primary, secondary
            disabled: false,
            onClick: null,
            className: '',
            ...options
        };
        
        if (!this.container) {
            console.error('Button: Container not found:', containerId);
            return;
        }
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        const buttonHTML = `
            <button 
                id="${this.options.id}" 
                class="btn btn-${this.options.type} ${this.options.className}"
                ${this.options.disabled ? 'disabled' : ''}
            >
                ${this.options.text}
            </button>
        `;
        
        this.container.innerHTML = buttonHTML;
        this.buttonElement = this.container.querySelector(`#${this.options.id}`);
    }
    
    attachEventListeners() {
        if (this.buttonElement && this.options.onClick) {
            this.buttonElement.addEventListener('click', this.options.onClick);
        }
    }
    
    setText(text) {
        if (this.buttonElement) {
            this.buttonElement.textContent = text;
        }
    }
    
    setDisabled(disabled) {
        if (this.buttonElement) {
            this.buttonElement.disabled = disabled;
        }
    }
    
    setType(type) {
        if (this.buttonElement) {
            this.buttonElement.className = `btn btn-${type} ${this.options.className}`;
        }
    }
    
    destroy() {
        if (this.buttonElement && this.options.onClick) {
            this.buttonElement.removeEventListener('click', this.options.onClick);
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
