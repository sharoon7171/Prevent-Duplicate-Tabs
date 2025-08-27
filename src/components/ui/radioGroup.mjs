/**
 * Reusable Radio Group Component
 * Can be used in both popup and options page
 */
export class RadioGroup {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            name: 'radioGroup',
            options: [],
            selectedValue: null,
            onChange: null,
            type: 'default', // default, strategy, sensitivity
            ...options
        };
        
        if (!this.container) {
            console.error('RadioGroup: Container not found:', containerId);
            return;
        }
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        const radioHTML = `
            <div class="radio-options">
                ${this.options.options.map(option => `
                    <label class="radio-option">
                        <input type="radio" name="${this.options.name}" value="${option.value}" ${option.value === this.options.selectedValue ? 'checked' : ''}>
                        <span class="radio-custom"></span>
                        <div class="radio-text">
                            <strong>${option.label}</strong>
                            ${option.description ? `<span>${option.description}</span>` : ''}
                        </div>
                    </label>
                `).join('')}
            </div>
        `;
        
        this.container.innerHTML = radioHTML;
        this.radioButtons = this.container.querySelectorAll('input[type="radio"]');
    }
    
    attachEventListeners() {
        this.radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && this.options.onChange) {
                    this.options.onChange(e.target.value, e);
                }
            });
        });
    }
    
    getSelectedValue() {
        const selectedRadio = this.container.querySelector('input[type="radio"]:checked');
        return selectedRadio ? selectedRadio.value : null;
    }
    
    setSelectedValue(value) {
        this.radioButtons.forEach(radio => {
            radio.checked = radio.value === value;
        });
    }
    
    addOption(option) {
        this.options.options.push(option);
        this.render();
        this.attachEventListeners();
    }
    
    removeOption(value) {
        this.options.options = this.options.options.filter(opt => opt.value !== value);
        this.render();
        this.attachEventListeners();
    }
    
    disable() {
        this.radioButtons.forEach(radio => {
            radio.disabled = true;
        });
    }
    
    enable() {
        this.radioButtons.forEach(radio => {
            radio.disabled = false;
        });
    }
}
