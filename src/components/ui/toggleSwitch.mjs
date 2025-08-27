/**
 * Reusable Toggle Switch Component
 * Can be used in both popup and options page
 */
export class ToggleSwitch {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            id: 'toggleSwitch',
            checked: false,
            label: 'Toggle Switch',
            onChange: null,
            ...options
        };
        
        if (!this.container) {
            console.error('ToggleSwitch: Container not found:', containerId);
            return;
        }
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        const toggleHTML = `
            <label class="toggle-switch">
                <input type="checkbox" id="${this.options.id}" ${this.options.checked ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        `;
        
        this.container.innerHTML = toggleHTML;
        this.checkbox = this.container.querySelector('input[type="checkbox"]');
    }
    
    attachEventListeners() {
        if (this.checkbox && this.options.onChange) {
            this.checkbox.addEventListener('change', (e) => {
                this.options.onChange(e.target.checked, e);
            });
        }
    }
    
    isChecked() {
        return this.checkbox ? this.checkbox.checked : false;
    }
    
    setChecked(checked) {
        if (this.checkbox) {
            this.checkbox.checked = checked;
        }
    }
    
    toggle() {
        if (this.checkbox) {
            this.checkbox.checked = !this.checkbox.checked;
            if (this.options.onChange) {
                this.options.onChange(this.checkbox.checked);
            }
        }
    }
    
    disable() {
        if (this.checkbox) {
            this.checkbox.disabled = true;
        }
    }
    
    enable() {
        if (this.checkbox) {
            this.checkbox.disabled = false;
        }
    }
}
