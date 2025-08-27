/**
 * Reusable Option Group Component
 * Can be used in both popup and options page
 */
export class OptionGroup {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            title: 'Option Group',
            type: 'default', // default, strategy, sensitivity
            ...options
        };
        
        if (!this.container) {
            console.error('OptionGroup: Container not found:', containerId);
            return;
        }
        
        this.render();
    }
    
    render() {
        const descriptionHTML = this.options.description && this.options.description.trim() !== '' 
            ? `<p>${this.options.description}</p>` 
            : '';
            
        const optionGroupHTML = `
            <div class="option-group ${this.options.type}-group">
                <div class="option-label">
                    <h3>${this.options.title}</h3>
                    ${descriptionHTML}
                </div>
                <div class="option-controls">
                    <!-- Controls will be added by child components -->
                </div>
            </div>
        `;
        
        this.container.innerHTML = optionGroupHTML;
        this.controlsContainer = this.container.querySelector('.option-controls');
    }
    
    addControl(controlHTML) {
        if (this.controlsContainer) {
            this.controlsContainer.innerHTML += controlHTML;
        }
    }
    
    addToggleSwitch() {
        if (this.controlsContainer) {
            // Create a container for the toggle switch with a unique ID
            const toggleContainer = document.createElement('div');
            toggleContainer.id = 'toggleSwitchContainer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.controlsContainer.appendChild(toggleContainer);
            
            // Return the container ID for the calling code to use
            return toggleContainer.id;
        }
    }
    
    addRadioGroup() {
        if (this.controlsContainer) {
            // Create a container for the radio group with a unique ID
            const radioContainer = document.createElement('div');
            radioContainer.id = 'radioGroupContainer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.controlsContainer.appendChild(radioContainer);
            
            // Return the container ID for the calling code to use
            return radioContainer.id;
        }
    }
    
    updateTitle(title) {
        const titleElement = this.container.querySelector('.option-label h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    updateDescription(description) {
        const descElement = this.container.querySelector('.option-label p');
        if (descElement) {
            descElement.textContent = description;
        }
    }
}
