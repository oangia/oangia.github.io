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
        this.app = app;
        this.action = action;
        this.options = options;
        this.init();
        // init UI
        this.ui = new AuthUI(this, this.options);
        // check login state
        this.listenToAuthStateChanged();
    }

    listenToAuthStateChanged(callback) {
        onAuthStateChanged(this.auth, (user) => {
            this.user = user;
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
            if (callback) callback(user);
        });
    }

    init() {
        this.auth = null;
        this.user = null;
        try {
            // Ensure auth is initialized - retry if needed
            if (!this.app) {
                console.error('Firebase app not provided');
                return false;
            }
            
            this.auth = getAuth(this.app);
            
            // Verify auth was created successfully
            if (!this.auth) {
                console.error('Failed to initialize Firebase Auth');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Firebase Auth initialization error:', error);
            return false;
        }
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