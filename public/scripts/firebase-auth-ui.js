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
 * FirebaseAuthUI - Auto-generates authentication UI
 * 
 * @param {Object} app - Firebase app instance
 * @param {string} containerId - ID of container div where UI will be generated
 * @param {Object} options - Configuration options
 * @param {string} options.mode - 'direct' (show UI immediately) or 'toggle' (show button to toggle)
 * @param {boolean} options.enableEmail - Enable email/password login
 * @param {boolean} options.enableGoogle - Enable Google login
 * @param {boolean} options.enableFacebook - Enable Facebook login
 * @param {boolean} options.showRegister - Show register form
 * @param {boolean} options.showForgotPassword - Show forgot password form
 * @param {Object} options.callbacks - Custom callback functions
 */
export class FirebaseAuthUI {
    constructor(app, containerId, options = {}) {
        this.app = app;
        this.containerId = containerId;
        this.config = {
            mode: 'direct', // 'direct' or 'toggle'
            enableEmail: true,
            enableGoogle: true,
            enableFacebook: true,
            showRegister: true,
            showForgotPassword: true,
            callbacks: {},
            ...options
        };
        
        this.auth = null;
        this.user = null;
        this.container = null;
        this.isVisible = this.config.mode === 'direct';
        
        this.init();
    }

    init() {
        try {
            // Initialize auth
            this.auth = getAuth(this.app);

            // Get container element
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                console.error(`Container with ID "${this.containerId}" not found`);
                return false;
            }

            // Set up auth state listener
            onAuthStateChanged(this.auth, (user) => {
                this.user = user;
                this.onAuthStateChange(user);
            });

            // Inject styles
            this.injectStyles();

            // Generate UI based on mode
            if (this.config.mode === 'toggle') {
                this.generateToggleMode();
            } else {
                this.generateDirectMode();
            }

            return true;
        } catch (error) {
            console.error('Firebase Auth UI initialization error:', error);
            return false;
        }
    }

    injectStyles() {
        // Check if styles already injected
        if (document.getElementById('firebase-auth-ui-styles')) return;

        const style = document.createElement('style');
        style.id = 'firebase-auth-ui-styles';
        style.textContent = `
            .auth-ui {
                width: 100%;
            }

            .auth-message {
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 14px;
                display: none;
            }

            .auth-message.show {
                display: block;
            }

            .auth-message-success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .auth-message-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .auth-form {
                width: 100%;
            }

            /* Custom styles for Bootstrap overrides */
            .form-control:focus {
                border-color: #14b8a6;
                box-shadow: 0 0 0 0.25rem rgba(20, 184, 166, 0.25);
            }

            .btn-primary {
                background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
                border: none;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(20, 184, 166, 0.4);
                background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
            }

            .btn-social {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                background: white;
                border: 2px solid #e0e0e0;
                color: #333;
            }

            .btn-social:hover {
                background: #f5f5f5;
            }

            .btn-google {
                border-color: #db4437;
                color: #db4437;
            }

            .btn-facebook {
                border-color: #4267B2;
                color: #4267B2;
            }

            .auth-divider {
                display: flex;
                align-items: center;
                margin: 20px 0;
                color: #999;
                font-size: 14px;
            }

            .auth-divider::before,
            .auth-divider::after {
                content: '';
                flex: 1;
                height: 1px;
                background: #e0e0e0;
            }

            .auth-divider span {
                padding: 0 15px;
            }

            .auth-links a {
                color: #14b8a6;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
            }

            .auth-links a:hover {
                text-decoration: underline;
                color: #10b981;
            }

            .user-avatar {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                margin: 0 auto 10px;
                background: #14b8a6;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 28px;
                font-weight: bold;
            }


            .auth-toggle-btn {
                background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                margin-bottom: 20px;
                width: 100%;
            }

            .auth-toggle-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(20, 184, 166, 0.4);
            }

            .auth-panel {
                margin-top: 20px;
            }

            .auth-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                padding: 1rem;
            }

            .auth-modal-content {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 450px;
                width: 100%;
                height: 100%;
                max-height: 100vh;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            .auth-modal-header {
                flex-shrink: 0;
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
            }

            .auth-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    generateDirectMode() {
        if (!this.container) return;

        // Generate the HTML structure directly
        this.container.innerHTML = this.getUIHTML();
        
        // Attach event listeners
        this.attachEventListeners();
    }

    generateToggleMode() {
        if (!this.container) return;

        // Generate button only with Bootstrap
        this.container.innerHTML = `
            <button id="auth-toggle-btn" class="btn w-100 auth-toggle-btn">Show Login</button>
        `;

        // Create modal overlay with Bootstrap
        const modal = document.createElement('div');
        modal.id = 'auth-modal-overlay';
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">Login</h2>
                    <button id="auth-modal-close" type="button" class="btn-close" aria-label="Close"></button>
                </div>
                <div class="auth-modal-body">
                    ${this.getUIHTML()}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Set up toggle button
        const toggleBtn = document.getElementById('auth-toggle-btn');
        const modalOverlay = document.getElementById('auth-modal-overlay');
        const closeBtn = document.getElementById('auth-modal-close');
        
        if (toggleBtn && modalOverlay) {
            toggleBtn.addEventListener('click', () => {
                this.showModal();
            });
        }

        if (closeBtn && modalOverlay) {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // Close modal when clicking outside
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideModal();
                }
            });
        }
        
        // Attach event listeners
        this.attachEventListeners();
    }

    showModal() {
        const modalOverlay = document.getElementById('auth-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    hideModal() {
        const modalOverlay = document.getElementById('auth-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    getUIHTML() {
        const hasEmail = this.config.enableEmail;
        const hasGoogle = this.config.enableGoogle;
        const hasFacebook = this.config.enableFacebook;
        const showRegister = this.config.showRegister && hasEmail;
        const showForgotPassword = this.config.showForgotPassword && hasEmail;

        return `
            <div class="auth-ui">
                <div id="auth-message" class="auth-message mb-3"></div>

                <!-- Login Form -->
                <div id="auth-login-form" class="auth-form">
                    ${hasEmail ? `
                        <form id="auth-login-form-element">
                            <div class="mb-3">
                                <label for="auth-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="auth-email" required placeholder="Enter your email">
                            </div>
                            <div class="mb-3">
                                <label for="auth-password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="auth-password" required placeholder="Enter your password">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Sign In</button>
                        </form>
                    ` : ''}

                    ${(hasGoogle || hasFacebook) ? `
                        <div class="auth-divider my-3"><span>OR</span></div>
                        <div class="auth-social-buttons d-flex flex-column gap-2">
                            ${hasGoogle ? `
                                <button id="auth-google-btn" type="button" class="btn btn-social btn-google w-100">
                                    <svg width="18" height="18" viewBox="0 0 18 18" class="me-2">
                                        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"/>
                                        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.71.48-1.62.75-2.7.75-2.08 0-3.84-1.4-4.47-3.3H1.87v2.07A7.97 7.97 0 0 0 8.98 17Z"/>
                                        <path fill="#FBBC05" d="M4.51 10.5a4.8 4.8 0 0 1 0-3.07V5.36H1.87a7.97 7.97 0 0 0 0 7.17l2.64-2.07Z"/>
                                        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A7.97 7.97 0 0 0 1.87 5.36l2.64 2.07c.63-1.9 2.39-3.3 4.47-3.3Z"/>
                                    </svg>
                                    Continue with Google
                                </button>
                            ` : ''}
                            ${hasFacebook ? `
                                <button id="auth-facebook-btn" type="button" class="btn btn-social btn-facebook w-100">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#4267B2" class="me-2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    Continue with Facebook
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}

                    ${showRegister || showForgotPassword ? `
                        <div class="auth-links text-center mt-3">
                            ${showRegister ? `<a href="#" id="auth-show-register" class="d-block mb-2">Don't have an account? Sign up</a>` : ''}
                            ${showForgotPassword ? `<a href="#" id="auth-show-forgot" class="d-block">Forgot password?</a>` : ''}
                        </div>
                    ` : ''}
                </div>

                <!-- Register Form -->
                ${showRegister ? `
                    <div id="auth-register-form" class="auth-form d-none">
                        <form id="auth-register-form-element">
                            <div class="mb-3">
                                <label for="auth-register-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="auth-register-email" required placeholder="Enter your email">
                            </div>
                            <div class="mb-3">
                                <label for="auth-register-password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="auth-register-password" required placeholder="Create a password">
                            </div>
                            <div class="mb-3">
                                <label for="auth-register-confirm" class="form-label">Confirm Password</label>
                                <input type="password" class="form-control" id="auth-register-confirm" required placeholder="Confirm your password">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Create Account</button>
                        </form>
                        <div class="auth-links text-center mt-3">
                            <a href="#" id="auth-back-to-login">Already have an account? Sign in</a>
                        </div>
                    </div>
                ` : ''}

                <!-- Forgot Password Form -->
                ${showForgotPassword ? `
                    <div id="auth-forgot-form" class="auth-form d-none">
                        <form id="auth-forgot-form-element">
                            <div class="mb-3">
                                <label for="auth-forgot-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="auth-forgot-email" required placeholder="Enter your email">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Reset Password</button>
                        </form>
                        <div class="auth-links text-center mt-3">
                            <a href="#" id="auth-back-to-login-forgot">Back to Sign In</a>
                        </div>
                    </div>
                ` : ''}

                <!-- Dashboard -->
                <div id="auth-dashboard" class="auth-dashboard d-none text-center">
                    <div class="user-info bg-light p-3 rounded mb-3">
                        <div class="user-avatar mx-auto mb-2" id="auth-user-avatar">U</div>
                        <h3 id="auth-user-name" class="h5 mb-1">User Name</h3>
                        <p id="auth-user-email" class="text-muted mb-0">user@example.com</p>
                    </div>
                    <button id="auth-logout-btn" type="button" class="btn btn-primary w-100">Sign Out</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Login form
        const loginForm = document.getElementById('auth-login-form-element');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('auth-register-form-element');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Forgot password form
        const forgotForm = document.getElementById('auth-forgot-form-element');
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // Social login buttons
        const googleBtn = document.getElementById('auth-google-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        }

        const facebookBtn = document.getElementById('auth-facebook-btn');
        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => this.handleFacebookLogin());
        }

        // Logout button
        const logoutBtn = document.getElementById('auth-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation links
        const showRegister = document.getElementById('auth-show-register');
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        const showForgot = document.getElementById('auth-show-forgot');
        if (showForgot) {
            showForgot.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordForm();
            });
        }

        const backToLogin = document.getElementById('auth-back-to-login');
        if (backToLogin) {
            backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        const backToLoginForgot = document.getElementById('auth-back-to-login-forgot');
        if (backToLoginForgot) {
            backToLoginForgot.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
    }

    async handleLogin() {
        if (!this.config.enableEmail) return;

        const email = document.getElementById('auth-email')?.value;
        const password = document.getElementById('auth-password')?.value;

        if (!email || !password) return;

        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            this.showMessage('Successfully logged in!', 'success');
            if (this.config.callbacks?.onLogin) {
                this.config.callbacks.onLogin(userCredential.user);
            }
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    async handleRegister() {
        if (!this.config.enableEmail) return;

        const email = document.getElementById('auth-register-email')?.value;
        const password = document.getElementById('auth-register-password')?.value;
        const confirmPassword = document.getElementById('auth-register-confirm')?.value;

        if (!email || !password || !confirmPassword) return;

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match!', 'error');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            this.showMessage('Account created successfully!', 'success');
            if (this.config.callbacks?.onRegister) {
                this.config.callbacks.onRegister(userCredential.user);
            }
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    async handleForgotPassword() {
        if (!this.config.enableEmail) return;

        const email = document.getElementById('auth-forgot-email')?.value;
        if (!email) return;

        try {
            await sendPasswordResetEmail(this.auth, email);
            this.showMessage('Password reset email sent! Check your inbox.', 'success');
            setTimeout(() => this.showLoginForm(), 2000);
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    async handleGoogleLogin() {
        if (!this.config.enableGoogle) return;

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            this.showMessage('Successfully logged in with Google!', 'success');
            if (this.config.callbacks?.onGoogleLogin) {
                this.config.callbacks.onGoogleLogin(result.user);
            }
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    async handleFacebookLogin() {
        if (!this.config.enableFacebook) return;

        try {
            const provider = new FacebookAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            this.showMessage('Successfully logged in with Facebook!', 'success');
            if (this.config.callbacks?.onFacebookLogin) {
                this.config.callbacks.onFacebookLogin(result.user);
            }
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    async handleLogout() {
        try {
            await signOut(this.auth);
            this.showMessage('Successfully logged out!', 'success');
            if (this.config.callbacks?.onLogout) {
                this.config.callbacks.onLogout();
            }
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    showMessage(text, type = 'info') {
        const messageEl = document.getElementById('auth-message');
        if (!messageEl) return;

        messageEl.textContent = text;
        messageEl.className = `auth-message auth-message-${type} show`;
        
        setTimeout(() => {
            messageEl.className = 'auth-message';
        }, 5000);
    }

    showLoginForm() {
        this.hideAllForms();
        const loginForm = document.getElementById('auth-login-form');
        if (loginForm) loginForm.classList.remove('d-none');
    }

    showRegisterForm() {
        this.hideAllForms();
        const registerForm = document.getElementById('auth-register-form');
        if (registerForm) registerForm.classList.remove('d-none');
    }

    showForgotPasswordForm() {
        this.hideAllForms();
        const forgotForm = document.getElementById('auth-forgot-form');
        if (forgotForm) forgotForm.classList.remove('d-none');
    }

    showDashboard(user) {
        this.hideAllForms();
        const dashboard = document.getElementById('auth-dashboard');
        if (dashboard) dashboard.classList.remove('d-none');

        const userName = document.getElementById('auth-user-name');
        const userEmail = document.getElementById('auth-user-email');
        const userAvatar = document.getElementById('auth-user-avatar');

        if (userName) userName.textContent = user.displayName || 'User';
        if (userEmail) userEmail.textContent = user.email;
        if (userAvatar) {
            const initial = (user.displayName || user.email).charAt(0).toUpperCase();
            userAvatar.textContent = initial;
        }
    }

    hideAllForms() {
        const forms = ['auth-login-form', 'auth-register-form', 'auth-forgot-form', 'auth-dashboard'];
        forms.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('d-none');
        });
    }

    onAuthStateChange(user) {
        if (user) {
            this.showDashboard(user);
            // Close modal if user is logged in (in toggle mode)
            if (this.config.mode === 'toggle') {
                this.hideModal();
            }
        } else {
            this.showLoginForm();
        }

        if (this.config.callbacks?.onAuthStateChange) {
            this.config.callbacks.onAuthStateChange(user);
        }
    }

    getErrorMessage(code) {
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
        
        return defaultMessages[code] || 'An error occurred. Please try again.';
    }
}

