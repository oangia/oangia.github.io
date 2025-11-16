import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
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
        this.auth = getAuth(app);
        this.action = action;
        this.options = options;
        // init UI
        this.ui = new AuthUI(this, this.options);
        // check login state
        onAuthStateChanged(this.auth, (user) => {
            if (!user) {
                if (this.action == 'guard') {
                    window.location.href = this.options.loginUrl;
                }
                this.ui.loggedOut();
                return;
            }
            if (this.action == 'authentication' && this.options.redirectUrl) {
                window.location.href = this.options.redirectUrl;
                return;
            }
            this.ui.loggedIn(user);
        });
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async register(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async logout() {
        try {
            await signOut(this.auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async loginWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async loginWithFacebook() {
        try {
            const provider = new FacebookAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }

    getAuth() {
        return this.auth;
    }
}