import { AuthUI } from './AuthUI.js';
/**
 * Controller - Simple authentication protection for pages
 * Just pass the app and config, it handles everything
 * 
 * @param {Object} auth - Firebase auth instance
 * @param {Object} options - Configuration options
 * @param {string} options.loginUrl - URL to redirect to if not logged in
 * @param {Function} options.onAuthenticated - Callback when user is authenticated (optional)
 */
export class Controller {
    constructor(firebase, options = {}) {
        this.firebase = firebase;
        this.config = options;
        this.ui = new AuthUI(this.firebase, this.config);
        this.onAuthStateChange();
    }

    onAuthStateChange() {
        this.firebase.onAuthStateChange((user) => {
            if (!user) {
                this.loggedOut();
                return;
            }
            this.loggedIn(user);
            if (this.config.callbacks.onAuthStateChange) {
                this.config.callbacks.onAuthStateChange(user);
            }
        });
    }

    loggedOut() {
        this.returnToLogin();
    }

    loggedIn(user) {
        this.returnToAdmin();
    }

    redirectToLogin() {
        window.location.href = this.config.loginUrl;
    }

    redirectToAdmin() {
        window.location.href = this.config.redirectUrl;
    }
}