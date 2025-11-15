import { AuthUI } from './AuthUI.js';
import { Controller } from './Controller.js';
/**
 * AuthGuard - Simple authentication protection for pages
 * Just pass the app and config, it handles everything
 * 
 * @param {Object} auth - Firebase auth instance
 * @param {Object} options - Configuration options
 * @param {string} options.loginUrl - URL to redirect to if not logged in
 * @param {Function} options.onAuthenticated - Callback when user is authenticated (optional)
 */
export class CGuard extends Controller {
    loggedIn(user) {
        this.ui.authenticated(user);
    }
}

