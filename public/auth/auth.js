import { AuthGuard } from './AuthGuard.js';
import { AuthAuthenticator } from './AuthAuthenticator.js';

/**
 * Auth - Main authentication class that routes to appropriate handlers
 * 
 * @param {Object} app - Firebase app instance
 * @param {string} action - 'authenticate' or 'guard'
 * @param {Object} options - Configuration options
 */
export class Auth {
    constructor(app, action, options = {}) {
        this.app = app;
        this.action = action;
        this.options = options;
        
        // Validate inputs
        if (!this.validate()) {
            return;
        }
        
        // Route to appropriate handler based on action
        this.handler = this.createHandler();
    }

    validate() {
        // Validate Firebase app
        if (!this.app) {
            console.error('Auth: Firebase app instance is required');
            return false;
        }

        // Validate action
        const validActions = ['authenticate', 'guard'];
        if (!this.action) {
            console.error('Auth: Action is required. Valid actions:', validActions.join(', '));
            return false;
        }

        if (!validActions.includes(this.action)) {
            console.error(`Auth: Invalid action "${this.action}". Valid actions:`, validActions.join(', '));
            return false;
        }

        // Validate options type
        if (this.options !== null && typeof this.options !== 'object') {
            console.error('Auth: Options must be an object');
            return false;
        }

        // Action-specific validation
        if (this.action === 'authenticate') {
            return this.validateAuthenticateOptions();
        }

        if (this.action === 'guard') {
            return this.validateGuardOptions();
        }

        return true;
    }

    validateAuthenticateOptions() {
        const { mode, containerId, callbacks, redirectUrl, loginUrl } = this.options;

        // Validate mode
        if (mode && !['direct', 'toggle'].includes(mode)) {
            console.error('Auth: Invalid mode. Must be "direct" or "toggle"');
            return false;
        }

        // Validate containerId if in direct mode
        if (mode === 'direct' && containerId) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Auth: Container element with id "${containerId}" not found`);
                return false;
            }
        }

        // Validate callbacks
        if (callbacks && typeof callbacks !== 'object') {
            console.error('Auth: Callbacks must be an object');
            return false;
        }

        if (callbacks) {
            const validCallbacks = ['onLogin', 'onRegister', 'onGoogleLogin', 'onFacebookLogin', 'onLogout', 'onAuthStateChange'];
            for (const [key, value] of Object.entries(callbacks)) {
                if (!validCallbacks.includes(key)) {
                    console.warn(`Auth: Unknown callback "${key}". Valid callbacks:`, validCallbacks.join(', '));
                }
                if (value !== null && typeof value !== 'function') {
                    console.error(`Auth: Callback "${key}" must be a function or null`);
                    return false;
                }
            }
        }

        // Validate URLs
        if (redirectUrl && typeof redirectUrl !== 'string') {
            console.error('Auth: redirectUrl must be a string');
            return false;
        }

        if (loginUrl && typeof loginUrl !== 'string') {
            console.error('Auth: loginUrl must be a string');
            return false;
        }

        // Validate boolean options
        const booleanOptions = ['enableEmail', 'enableGoogle', 'enableFacebook', 'showRegister', 'showForgotPassword'];
        for (const option of booleanOptions) {
            if (this.options[option] !== undefined && typeof this.options[option] !== 'boolean') {
                console.error(`Auth: ${option} must be a boolean`);
                return false;
            }
        }

        return true;
    }

    validateGuardOptions() {
        const { loginUrl, allowedPaths, publicPaths } = this.options;

        // Validate loginUrl
        if (loginUrl && typeof loginUrl !== 'string') {
            console.error('Auth: loginUrl must be a string');
            return false;
        }

        // Validate paths arrays
        if (allowedPaths !== undefined) {
            if (!Array.isArray(allowedPaths)) {
                console.error('Auth: allowedPaths must be an array');
                return false;
            }
            if (!allowedPaths.every(path => typeof path === 'string')) {
                console.error('Auth: All allowedPaths must be strings');
                return false;
            }
        }

        if (publicPaths !== undefined) {
            if (!Array.isArray(publicPaths)) {
                console.error('Auth: publicPaths must be an array');
                return false;
            }
            if (!publicPaths.every(path => typeof path === 'string')) {
                console.error('Auth: All publicPaths must be strings');
                return false;
            }
        }

        return true;
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