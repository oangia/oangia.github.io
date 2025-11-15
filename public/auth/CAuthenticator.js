import { AuthFormHandler } from './AuthFormHandler.js';
import { Controller } from './Controller.js';

export class CAuthenticator extends Controller {
    loggedIn(user) {
        if (user && this.config.redirectUrl && !this._redirected) {
            this._redirected = true;
            return this.redirectToAdmin();
        }
        this.ui.toggleLoggedIn(user);
    }

    loggedOut() {
        const formHandler = new AuthFormHandler(this.firebase, this.config);
        //this.ui.loginForm(formHandler);
    }
}