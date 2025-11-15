import { FAuth } from './FAuth.js';
import { AuthUI } from './AuthUI.js';
/**
 * Auth - Main authentication class that routes to appropriate handlers
 * 
 * @param {Object} app - Firebase app instance
 * @param {string} action - 'authenticate' or 'guard'
 * @param {Object} options - Configuration options
 */
export class Authenticator {
    constructor(app, action, options = {}) {
        this.firebase = new FAuth(app);

        this.action = action;
        this.options = options;

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
            if (this.config.callbacks && this.config.callbacks.onAuthStateChange) {
                this.config.callbacks.onAuthStateChange(user);
            }
        });
    }

    loggedOut() {
        if (this.action == 'guard') {this.returnToLogin();}
        this.ui.loggedOut();
    }

    loggedIn(user) {
        if (this.action == 'authentication' && this.config.redirectUrl && !this._redirected) {
            this._redirected = true;
            return this.redirectToAdmin();
        }
        this.ui.loggedIn(user);
    }

    redirectToLogin() {
        window.location.href = this.config.loginUrl;
    }

    redirectToAdmin() {
        window.location.href = this.config.redirectUrl;
    }
}