import { AuthCore } from './AuthCore.js';
import { AuthMessage } from './AuthMessage.js';
import { AuthFormHandler } from './AuthFormHandler.js';
import { AuthUI } from './AuthUI.js';
import { AuthStyles } from './AuthStyles.js';
import { AuthHTML } from './AuthHTML.js';
import { AuthGuard } from './AuthGuard.js';
/**
 * Auth - Main authentication class that combines all components
 * 
 * @param {Object} app - Firebase app instance
 * @param {string} action - authenticate or guard
 * @param {Object} options - Configuration options
 */
export class Auth {
    constructor(app, action, options = {}) {
        this.app = app;
        this.options = options;
        this[action](options);
    }

    guard() {
        new AuthGuard(this.app, this.options);
    }

    authenticate() {
        const defaultConfig = {
            mode: 'direct', // 'direct' or 'toggle'
            containerId: null,
            enableEmail: true,
            enableGoogle: true,
            enableFacebook: true,
            showRegister: true,
            showForgotPassword: true,
            loginUrl: '/auth/login.html',
            redirectUrl: null, // URL to redirect after login or if already logged in
            callbacks: {
                onLogin: null,
                onRegister: null,
                onGoogleLogin: null,
                onFacebookLogin: null,
                onLogout: null,
                onAuthStateChange: null
            }
        };
        // Merge user options with defaults
        this.config = {
            ...defaultConfig,
            ...this.options,
            callbacks: {
                ...defaultConfig.callbacks,
                ...(this.options.callbacks || {})
            }
        };
        
        // Initialize core components
        this.core = new AuthCore(app);
        this.ui = new AuthUI(this.config.containerId, this.config);
        this.message = new AuthMessage();
        this.formHandler = new AuthFormHandler(this.core, this.message, this.config);
        
        this.init();
    }

    init() {
        // Initialize UI
        if (!this.ui.init()) {
            return false;
        }

        // Set up auth state listener
        this.core.onAuthStateChange((user) => {
            // Check if user is already logged in and redirect (only on initial load)
            if (user && this.config.redirectUrl && !this._redirected) {
                this._redirected = true;
                window.location.href = this.config.redirectUrl;
                return;
            }
            this.onAuthStateChange(user);
        });

        // Check if container has existing forms
        const hasExistingForms = this.ui.hasExistingForms();
        
        if (hasExistingForms) {
            // Use existing forms - attach event listeners only
            const { messageEl } = this.ui.attachToExistingForms(this.formHandler);
            if (messageEl) {
                this.message.setElement(messageEl);
            }
        } else {
            // Generate new forms
            AuthStyles.inject();
            
            const htmlContent = AuthHTML.generate(this.config);
            
            // Generate UI based on mode
            if (this.config.mode === 'toggle') {
                this.ui.generateToggleMode(htmlContent);
            } else {
                this.ui.generateDirectMode(htmlContent);
            }
            
            // Attach event listeners to generated forms
            this.attachEventListeners();
            
            // Set up message element
            const messageEl = document.getElementById('auth-message');
            if (messageEl) {
                this.message.setElement(messageEl);
            }
        }

        return true;
    }

    attachEventListeners() {
        // Login form
        const loginForm = document.getElementById('auth-login-form-element');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-email')?.value;
                const password = document.getElementById('auth-password')?.value;
                
                if (!email || !password) {
                    this.message.show('Please fill in all fields', 'error');
                    return;
                }
                
                const result = await this.core.login(email, password);
                if (result.success) {
                    this.message.show('Successfully logged in!', 'success');
                    if (this.config.callbacks.onLogin) {
                        this.config.callbacks.onLogin(result.user);
                    }
                    // Redirect if URL is set
                    if (this.config.redirectUrl) {
                        setTimeout(() => {
                            window.location.href = this.config.redirectUrl;
                        }, 1000);
                    }
                } else {
                    this.message.show(this.formHandler.getErrorMessage(result.error), 'error');
                }
            });
        }

        // Register form
        const registerForm = document.getElementById('auth-register-form-element');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-register-email')?.value;
                const password = document.getElementById('auth-register-password')?.value;
                const confirmPassword = document.getElementById('auth-register-confirm')?.value;
                
                if (!email || !password || !confirmPassword) {
                    this.message.show('Please fill in all fields', 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    this.message.show('Passwords do not match!', 'error');
                    return;
                }
                
                const result = await this.core.register(email, password);
                if (result.success) {
                    this.message.show('Account created successfully!', 'success');
                    if (this.config.callbacks.onRegister) {
                        this.config.callbacks.onRegister(result.user);
                    }
                    // Redirect if URL is set
                    if (this.config.redirectUrl) {
                        setTimeout(() => {
                            window.location.href = this.config.redirectUrl;
                        }, 1000);
                    }
                } else {
                    this.message.show(this.formHandler.getErrorMessage(result.error), 'error');
                }
            });
        }

        // Forgot password form
        const forgotForm = document.getElementById('auth-forgot-form-element');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-forgot-email')?.value;
                
                if (!email) {
                    this.message.show('Please enter your email', 'error');
                    return;
                }
                
                const result = await this.core.resetPassword(email);
                if (result.success) {
                    this.message.show('Password reset email sent! Check your inbox.', 'success');
                    setTimeout(() => this.showLoginForm(), 2000);
                } else {
                    this.message.show(this.formHandler.getErrorMessage(result.error), 'error');
                }
            });
        }

        // Social login buttons
        const googleBtn = document.getElementById('auth-google-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                await this.formHandler.handleGoogleLogin();
            });
        }

        const facebookBtn = document.getElementById('auth-facebook-btn');
        if (facebookBtn) {
            facebookBtn.addEventListener('click', async () => {
                await this.formHandler.handleFacebookLogin();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('auth-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.formHandler.handleLogout());
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
            // Only show dashboard if we generated the UI
            if (!this.ui.hasExistingForms()) {
                this.showDashboard(user);
            }
            // Close modal if user is logged in (in toggle mode)
            if (this.config.mode === 'toggle') {
                this.ui.getModal().hide();
            }
        } else {
            // Only show login form if we generated the UI
            if (!this.ui.hasExistingForms()) {
                this.showLoginForm();
            }
        }

        if (this.config.callbacks.onAuthStateChange) {
            this.config.callbacks.onAuthStateChange(user);
        }
    }

    // Public API methods
    getCurrentUser() {
        return this.core.getCurrentUser();
    }

    getAuth() {
        return this.core.getAuth();
    }
}

