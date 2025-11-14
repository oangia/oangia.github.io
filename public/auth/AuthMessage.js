/**
 * AuthMessage - Handles message display
 */
export class AuthMessage {
    constructor(messageElement) {
        this.messageElement = messageElement;
    }

    show(text, type = 'info') {
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

