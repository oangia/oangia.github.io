/**
 * AuthMessage - Handles message display
 * Manages its own initialization and element finding
 */
export class AuthMessage {
    constructor(containerId = null) {
        this.messageElement = null;
        this.containerId = containerId;
        this.initialize();
    }

    initialize() {
        if (!this.containerId) return;

        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Look for generated message element first
        this.messageElement = document.getElementById('auth-message');
        
        // If not found, look for existing message elements
        if (!this.messageElement) {
            this.messageElement = container.querySelector('[data-auth="message"], .alert, .message') ||
                       Array.from(container.querySelectorAll('[id*="message"]')).find(el => 
                           el.id?.toLowerCase().includes('message')
                       );
        }
    }

    show(text, type = 'info') {
        // Re-initialize if element is not found (DOM might have changed)
        if (!this.messageElement) {
            this.initialize();
        }

        if (!this.messageElement) {
            console.log(`[${type}] ${text}`);
            return;
        }

        this.messageElement.textContent = text;
        
        // If it's a Bootstrap alert, use Bootstrap classes
        if (this.messageElement.classList.contains('alert')) {
            this.messageElement.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} show`;
        } else {
            this.messageElement.className = `auth-message auth-message-${type} show`;
        }
        
        setTimeout(() => {
            if (this.messageElement.classList.contains('alert')) {
                this.messageElement.classList.remove('show');
            } else {
                this.messageElement.className = 'auth-message';
            }
        }, 5000);
    }

    setElement(element) {
        this.messageElement = element;
    }
}
