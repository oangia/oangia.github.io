/**
 * FirebaseAuth - Reusable Authentication Handler
 * 
 * @param {Object} app - Firebase app instance
 * @param {Object} config - Configuration object for login functions
 * @param {Object} config.errorMessages - Custom error messages mapping
 * @param {Object} config.callbacks - Custom callback functions
 * @param {Object} config.options - Additional options (e.g., enabled providers)
 */
export class FirebaseAuth {
    constructor(app, config = {}) {
        this.app = app;
        this.config = {
            errorMessages: {},
            callbacks: {},
            options: {
                enableGoogle: true,
                enableFacebook: true,
                enableEmail: true
            },
            ...config
        };
        
        // Import Firebase Auth functions
        this.auth = null;
        this.user = null;
        this.init();
    }

    async init() {
        try {
            // Import Firebase Auth module once
            if (!this.authModule) {
                this.authModule = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js');
            }
            
            // Initialize auth
            this.auth = this.authModule.getAuth(this.app);

            // Set up auth state listener
            this.authModule.onAuthStateChanged(this.auth, (user) => {
                this.user = user;
                this.onAuthStateChange(user);
            });

            return true;
        } catch (error) {
            console.error('Firebase Auth initialization error:', error);
            return false;
        }
    }

    // Helper method to get auth module
    async getAuthModule() {
        if (!this.authModule) {
            this.authModule = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js');
        }
        return this.authModule;
    }

    async login(email, password) {
        if (!this.config.options.enableEmail) {
            return { success: false, error: 'Email login is not enabled.' };
        }

        try {
            const authModule = await this.getAuthModule();
            const userCredential = await authModule.signInWithEmailAndPassword(
                this.auth, 
                email, 
                password
            );
            
            // Call custom callback if provided
            if (this.config.callbacks.onLogin) {
                this.config.callbacks.onLogin(userCredential.user);
            }
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async register(email, password) {
        if (!this.config.options.enableEmail) {
            return { success: false, error: 'Email registration is not enabled.' };
        }

        try {
            const authModule = await this.getAuthModule();
            const userCredential = await authModule.createUserWithEmailAndPassword(
                this.auth, 
                email, 
                password
            );
            
            // Call custom callback if provided
            if (this.config.callbacks.onRegister) {
                this.config.callbacks.onRegister(userCredential.user);
            }
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async logout() {
        try {
            const authModule = await this.getAuthModule();
            await authModule.signOut(this.auth);
            
            // Call custom callback if provided
            if (this.config.callbacks.onLogout) {
                this.config.callbacks.onLogout();
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async resetPassword(email) {
        if (!this.config.options.enableEmail) {
            return { success: false, error: 'Password reset is not enabled.' };
        }

        try {
            const authModule = await this.getAuthModule();
            await authModule.sendPasswordResetEmail(this.auth, email);
            
            // Call custom callback if provided
            if (this.config.callbacks.onPasswordReset) {
                this.config.callbacks.onPasswordReset(email);
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async loginWithGoogle() {
        if (!this.config.options.enableGoogle) {
            return { success: false, error: 'Google login is not enabled.' };
        }

        try {
            const authModule = await this.getAuthModule();
            const provider = new authModule.GoogleAuthProvider();
            const result = await authModule.signInWithPopup(this.auth, provider);
            
            // Call custom callback if provided
            if (this.config.callbacks.onGoogleLogin) {
                this.config.callbacks.onGoogleLogin(result.user);
            }
            
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async loginWithFacebook() {
        if (!this.config.options.enableFacebook) {
            return { success: false, error: 'Facebook login is not enabled.' };
        }

        try {
            const authModule = await this.getAuthModule();
            const provider = new authModule.FacebookAuthProvider();
            const result = await authModule.signInWithPopup(this.auth, provider);
            
            // Call custom callback if provided
            if (this.config.callbacks.onFacebookLogin) {
                this.config.callbacks.onFacebookLogin(result.user);
            }
            
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    onAuthStateChange(user) {
        // Override this method in your implementation or use config.callbacks.onAuthStateChange
        if (this.config.callbacks.onAuthStateChange) {
            this.config.callbacks.onAuthStateChange(user);
        } else {
            console.log('Auth state changed:', user);
        }
    }

    getErrorMessage(code) {
        // First check custom error messages
        if (this.config.errorMessages && this.config.errorMessages[code]) {
            return this.config.errorMessages[code];
        }

        // Default error messages
        const defaultMessages = {
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/operation-not-allowed': 'Operation not allowed.',
            'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/invalid-credential': 'Invalid email or password.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed.',
            'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
            'auth/account-exists-with-different-credential': 'An account already exists with this email.'
        };
        
        return defaultMessages[code] || this.config.errorMessages.default || 'An error occurred. Please try again.';
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get auth instance
    getAuth() {
        return this.auth;
    }
}

