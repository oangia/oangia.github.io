import { CGuard } from './CGuard.js';
import { CAuthenticator } from './CAuthenticator.js';
import { FAuth } from './FAuth.js';
/**
 * Auth - Main authentication class that routes to appropriate handlers
 * 
 * @param {Object} app - Firebase app instance
 * @param {string} action - 'authenticate' or 'guard'
 * @param {Object} options - Configuration options
 */
export class Auth {
    constructor(app, action, options = {}) {
        this.firebase = new FAuth(app);

        this.action = action;
        this.options = options;
        // Route to appropriate handler based on action
        this.createHandler();
    }

    createHandler() {
        switch(this.action) {
            case 'guard':
                return new CGuard(this.firebase, this.options);
            
            case 'authenticate':
                return new CAuthenticator(this.firebase, this.options);
            
            default:
                console.error(`Unknown action: ${this.action}`);
                return null;
        }
    }
}