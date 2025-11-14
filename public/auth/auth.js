import { AuthAuthenticate } from './AuthAuthenticate.js';
import { AuthGuard } from './AuthGuard.js';
/**
 * Auth - Main authentication class that combines all components
 * 
 * @param {Object} app - Firebase app instance
 * @param {string} action - authenticate or guard
 * @param {Object} options - Configuration options
 */
export class Auth {
    constructor(app, action, options = {}) {
        this.app = app;
        this.action = action;
        this.options = options;
        
        // Route to appropriate handler based on action
        this.handler = this.createHandler();
    }

    createHandler() {
        switch(this.action) {
            case 'guard':
                return new AuthGuard(this.app, this.options);
            
            case 'authenticate':
                return new AuthAuthenticator(this.app, this.options);
            
            default:
                console.error(`Unknown action: ${this.action}`);
                return null;
        }
    }

    // Proxy methods to handler (if needed for public API)
    getCurrentUser() {
        return this.handler?.getCurrentUser?.();
    }

    getAuth() {
        return this.handler?.getAuth?.();
    }
}

