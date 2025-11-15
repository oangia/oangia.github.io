import { FAuth } from './auth/FAuth.js';
import { AuthUI } from './auth/AuthUI.js';
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
        // init UI
        this.ui = new AuthUI(this.firebase, this.options);
        // check login state
        this.onAuthStateChange();
    }

    onAuthStateChange() {
        this.firebase.onAuthStateChange((user) => {
            if (!user) {
                //logged out
                if (this.action == 'guard') {
                    window.location.href = this.options.loginUrl;
                }
                this.ui.loggedOut();
                return;
            }
            if (this.action == 'authentication' && this.options.redirectUrl && !this._redirected) {
                this._redirected = true;
                window.location.href = this.options.redirectUrl;
                return;
            }
            this.ui.loggedIn(user);
            if (this.options.callbacks && this.options.callbacks.onAuthStateChange) {
                this.options.callbacks.onAuthStateChange(user);
            }
        });
    }
}