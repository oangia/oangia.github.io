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
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';

/**
 * FirebaseAuth - Reusable Authentication Handler
 * 
 * @param {Object} app - Firebase app instance
 * @param {Object} config - Configuration object for login functions
 * @param {Object} config.errorMessages - Custom error messages mapping
 * @param {Object} config.callbacks - Custom callback functions
 * @param {Object} config.options - Additional options (e.g., enabled providers)
 * @param {Object} config.ui - UI selectors for form handling (optional)
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
            ui: null,
            ...config
        };
        
        this.auth = null;
        this.user = null;
        this.elements = {};
        this.init();
    }

    init() {
        try {
            // Initialize auth
            this.auth = getAuth(this.app);

            // Set up auth state listener
            onAuthStateChanged(this.auth, (user) => {
                this.user = user;
                this.onAuthStateChange(user);
            });

            return true;
        } catch (error) {
            console.error('Firebase Auth initialization error:', error);
            return false;
        }
    }

    async login(email, password) {
        if (!this.config.options.enableEmail) {
            return { success: false, error: 'Email login is not enabled.' };
        }

        try {
            const userCredential = await signInWithEmailAndPassword(
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
            const userCredential = await createUserWithEmailAndPassword(
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
            await signOut(this.auth);
            
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
            await sendPasswordResetEmail(this.auth, email);
            
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
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            
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
            const provider = new FacebookAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            
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
        // Handle UI updates if forms are attached
        if (this.elements) {
            if (user) {
                this.showDashboard(user);
            } else {
                this.showLoginForm();
            }
        }

        // Call custom callback if provided
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

    /**
     * Attach form handlers to DOM elements
     * @param {Object} selectors - Object with CSS selectors or element IDs
     */
    attachToForms(selectors) {
        this.config.ui = selectors;
        this.elements = this.getElements(selectors);
        
        if (!this.elements) return;

        // Attach form submit handlers
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (this.elements.registerForm) {
            this.elements.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        if (this.elements.forgotPasswordForm) {
            this.elements.forgotPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleResetPassword();
            });
        }

        // Attach button handlers
        if (this.elements.googleLoginBtn) {
            this.elements.googleLoginBtn.addEventListener('click', () => {
                this.handleGoogleLogin();
            });
        }

        if (this.elements.facebookLoginBtn) {
            this.elements.facebookLoginBtn.addEventListener('click', () => {
                this.handleFacebookLogin();
            });
        }

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Attach navigation links
        if (this.elements.showRegister) {
            this.elements.showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (this.elements.showLogin) {
            this.elements.showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        if (this.elements.showForgotPassword) {
            this.elements.showForgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordForm();
            });
        }

        if (this.elements.backToLogin) {
            this.elements.backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
    }

    /**
     * Get DOM elements from selectors
     */
    getElements(selectors) {
        if (!selectors) return null;

        const elements = {};
        
        // Helper to get element (by ID or selector)
        const getEl = (sel) => {
            if (!sel) return null;
            if (typeof sel === 'string') {
                return document.getElementById(sel) || document.querySelector(sel);
            }
            return sel;
        };

        elements.loginForm = getEl(selectors.loginForm);
        elements.registerForm = getEl(selectors.registerForm);
        elements.forgotPasswordForm = getEl(selectors.forgotPasswordForm);
        elements.loginEmail = getEl(selectors.loginEmail);
        elements.loginPassword = getEl(selectors.loginPassword);
        elements.registerEmail = getEl(selectors.registerEmail);
        elements.registerPassword = getEl(selectors.registerPassword);
        elements.registerConfirmPassword = getEl(selectors.registerConfirmPassword);
        elements.forgotEmail = getEl(selectors.forgotEmail);
        elements.googleLoginBtn = getEl(selectors.googleLoginBtn);
        elements.facebookLoginBtn = getEl(selectors.facebookLoginBtn);
        elements.logoutBtn = getEl(selectors.logoutBtn);
        elements.messageEl = getEl(selectors.message);
        elements.loginFormContainer = getEl(selectors.loginFormContainer);
        elements.registerFormContainer = getEl(selectors.registerFormContainer);
        elements.forgotPasswordFormContainer = getEl(selectors.forgotPasswordFormContainer);
        elements.dashboard = getEl(selectors.dashboard);
        elements.userName = getEl(selectors.userName);
        elements.userEmail = getEl(selectors.userEmail);
        elements.userAvatar = getEl(selectors.userAvatar);
        elements.showRegister = getEl(selectors.showRegister);
        elements.showLogin = getEl(selectors.showLogin);
        elements.showForgotPassword = getEl(selectors.showForgotPassword);
        elements.backToLogin = getEl(selectors.backToLogin);

        return elements;
    }

    /**
     * Handle login form submission
     */
    async handleLogin() {
        if (!this.elements.loginEmail || !this.elements.loginPassword) return;

        const email = this.elements.loginEmail.value;
        const password = this.elements.loginPassword.value;

        const result = await this.login(email, password);
        if (result.success) {
            this.showMessage('Successfully logged in!', 'success');
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle register form submission
     */
    async handleRegister() {
        if (!this.elements.registerEmail || !this.elements.registerPassword || !this.elements.registerConfirmPassword) return;

        const email = this.elements.registerEmail.value;
        const password = this.elements.registerPassword.value;
        const confirmPassword = this.elements.registerConfirmPassword.value;

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match!', 'error');
            return;
        }

        const result = await this.register(email, password);
        if (result.success) {
            this.showMessage('Account created successfully!', 'success');
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle password reset form submission
     */
    async handleResetPassword() {
        if (!this.elements.forgotEmail) return;

        const email = this.elements.forgotEmail.value;
        const result = await this.resetPassword(email);
        
        if (result.success) {
            this.showMessage('Password reset email sent! Check your inbox.', 'success');
            setTimeout(() => this.showLoginForm(), 2000);
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle Google login button click
     */
    async handleGoogleLogin() {
        const result = await this.loginWithGoogle();
        if (result.success) {
            this.showMessage('Successfully logged in with Google!', 'success');
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle Facebook login button click
     */
    async handleFacebookLogin() {
        const result = await this.loginWithFacebook();
        if (result.success) {
            this.showMessage('Successfully logged in with Facebook!', 'success');
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle logout button click
     */
    async handleLogout() {
        const result = await this.logout();
        if (result.success) {
            this.showMessage('Successfully logged out!', 'success');
        }
    }

    /**
     * Show message to user
     */
    showMessage(text, type = 'info') {
        if (!this.elements.messageEl) {
            if (this.config.callbacks.onMessage) {
                this.config.callbacks.onMessage(text, type);
            } else {
                console.log(`[${type}] ${text}`);
            }
            return;
        }

        this.elements.messageEl.textContent = text;
        this.elements.messageEl.className = `message ${type} show`;
        
        setTimeout(() => {
            if (this.elements.messageEl) {
                this.elements.messageEl.className = 'message';
            }
        }, 5000);
    }

    /**
     * Show login form
     */
    showLoginForm() {
        if (this.elements.loginFormContainer) {
            this.elements.loginFormContainer.classList.remove('hidden');
        }
        if (this.elements.registerFormContainer) {
            this.elements.registerFormContainer.classList.add('hidden');
        }
        if (this.elements.forgotPasswordFormContainer) {
            this.elements.forgotPasswordFormContainer.classList.add('hidden');
        }
        if (this.elements.dashboard) {
            this.elements.dashboard.classList.remove('active');
        }
    }

    /**
     * Show register form
     */
    showRegisterForm() {
        if (this.elements.loginFormContainer) {
            this.elements.loginFormContainer.classList.add('hidden');
        }
        if (this.elements.registerFormContainer) {
            this.elements.registerFormContainer.classList.remove('hidden');
        }
        if (this.elements.forgotPasswordFormContainer) {
            this.elements.forgotPasswordFormContainer.classList.add('hidden');
        }
        if (this.elements.dashboard) {
            this.elements.dashboard.classList.remove('active');
        }
    }

    /**
     * Show forgot password form
     */
    showForgotPasswordForm() {
        if (this.elements.loginFormContainer) {
            this.elements.loginFormContainer.classList.add('hidden');
        }
        if (this.elements.registerFormContainer) {
            this.elements.registerFormContainer.classList.add('hidden');
        }
        if (this.elements.forgotPasswordFormContainer) {
            this.elements.forgotPasswordFormContainer.classList.remove('hidden');
        }
        if (this.elements.dashboard) {
            this.elements.dashboard.classList.remove('active');
        }
    }

    /**
     * Show dashboard with user info
     */
    showDashboard(user) {
        if (this.elements.loginFormContainer) {
            this.elements.loginFormContainer.classList.add('hidden');
        }
        if (this.elements.registerFormContainer) {
            this.elements.registerFormContainer.classList.add('hidden');
        }
        if (this.elements.forgotPasswordFormContainer) {
            this.elements.forgotPasswordFormContainer.classList.add('hidden');
        }
        if (this.elements.dashboard) {
            this.elements.dashboard.classList.add('active');
        }

        if (this.elements.userName) {
            this.elements.userName.textContent = user.displayName || 'User';
        }
        if (this.elements.userEmail) {
            this.elements.userEmail.textContent = user.email;
        }
        if (this.elements.userAvatar) {
            const initial = (user.displayName || user.email).charAt(0).toUpperCase();
            this.elements.userAvatar.textContent = initial;
        }
    }
}

