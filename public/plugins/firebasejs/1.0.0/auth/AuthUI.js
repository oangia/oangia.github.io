import { AuthHTML, AuthStyles, AuthModal } from './AuthHTML.js';
import { AuthFormHandler } from './AuthFormHandler.js';

/**
 * AuthUI - Handles UI generation, display and navigation
 * All form actions are delegated to AuthFormHandler
 */
export class AuthUI {
    constructor(firebase, options) {
        this.firebase = firebase;
        this.options = options;
        this.container = null;
        this.modal = new AuthModal();
        this.formHandler = new AuthFormHandler(this.firebase, this.options);
    }

    loggedIn(user) {
        this.hideAllForms();
        this.updateLoggedInUI(user);
        this.attachLogoutListener();
    }

    attachLogoutListener() {
        const logoutBtn = document.getElementById(this.options.logoutBtnId);
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.formHandler.handleLogout();
            });
        }
    }

    updateLoggedInUI(user) {
        const userName = document.getElementById('auth-user-name');
        const userEmail = document.getElementById('auth-user-email');
        const userAvatar = document.getElementById('auth-user-avatar');

        if (userName) userName.textContent = user.displayName || 'User';
        if (userEmail) userEmail.textContent = user.email;
        if (userAvatar) {
            const initial = (user.displayName || user.email).charAt(0).toUpperCase();
            userAvatar.textContent = initial;
        }
        
        const userInfoEl = document.getElementById('user-info');
        const userEmailEl = document.getElementById('user-email');
        if (userInfoEl && userEmailEl) {
            userEmailEl.textContent = user.email || 'User';
            userInfoEl.style.display = 'flex';
        }
    }

    loggedOut() {
        this.container = document.getElementById(this.options.containerId);
        if (this.hasExistingForms()) {
            // Use existing forms - attach event listeners only
            this.attachToExistingForms();
        } else {
            // Generate new forms
            AuthStyles.inject();
            
            const htmlContent = AuthHTML.generate(this.options);
            
            // Generate UI based on mode
            if (this.options.mode === 'toggle') {
                this.generateToggleMode(htmlContent);
            } else {
                this.generateDirectMode(htmlContent);
            }
            
            // Attach event listeners to generated forms
            this.attachEventListeners();
            
            this.showLoginForm();
        }
    }

    attachEventListeners() {
        // Login form
        const loginForm = document.getElementById('auth-login-form-element');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.formHandler.handleLogin(loginForm);
            });
        }

        // Register form
        const registerForm = document.getElementById('auth-register-form-element');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.formHandler.handleRegister(registerForm);
            });
        }

        // Forgot password form
        const forgotForm = document.getElementById('auth-forgot-form-element');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const result = await this.formHandler.handleForgotPassword(forgotForm);
                // Show login form after successful password reset
                if (result?.success) {
                    setTimeout(() => this.showLoginForm(), 2000);
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
            logoutBtn.addEventListener('click', async () => {
                await this.formHandler.handleLogout();
            });
        }

        // Navigation links
        this.attachNavigationLinks();
    }

    attachNavigationLinks() {
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

    hideAllForms() {
        const forms = ['auth-login-form', 'auth-register-form', 'auth-forgot-form', 'auth-dashboard'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form && !form.classList.contains('d-none')) {
                form.classList.add('d-none');
            }
        });
    }

    hasExistingForms() {
        if (!this.container) return false;
        
        const hasForm = this.container.querySelector('form') !== null;
        const hasInputs = this.container.querySelector('input[type="email"], input[type="password"]') !== null;
        const hasButtons = this.container.querySelector('button[id*="auth"], button[id*="login"], button[id*="register"]') !== null;
        
        return hasForm || hasInputs || hasButtons;
    }

    attachToExistingForms() {
        if (!this.container) return;

        // Find existing forms and buttons
        const forms = this.findExistingForms();
        const buttons = this.findExistingButtons();

        // Attach event listeners using FormHandler
        if (forms.loginForm) {
            forms.loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.formHandler.handleLogin(forms.loginForm);
            });
        }

        if (forms.registerForm) {
            forms.registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.formHandler.handleRegister(forms.registerForm);
            });
        }

        if (forms.forgotForm) {
            forms.forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.formHandler.handleForgotPassword(forms.forgotForm);
            });
        }

        if (buttons.googleBtn) {
            buttons.googleBtn.addEventListener('click', async () => {
                await this.formHandler.handleGoogleLogin();
            });
        }

        if (buttons.facebookBtn) {
            buttons.facebookBtn.addEventListener('click', async () => {
                await this.formHandler.handleFacebookLogin();
            });
        }

        if (buttons.logoutBtn) {
            buttons.logoutBtn.addEventListener('click', async () => {
                await this.formHandler.handleLogout();
            });
        }
    }

    findExistingForms() {
        const allForms = Array.from(this.container.querySelectorAll('form'));
        
        const loginForm = allForms.find(form => 
            form.id?.toLowerCase().includes('login') || 
            form.id?.toLowerCase().includes('signin') ||
            form.getAttribute('data-auth') === 'login' ||
            form.getAttribute('data-auth') === 'signin'
        ) || allForms[0];
        
        const registerForm = allForms.find(form => 
            form.id?.toLowerCase().includes('register') || 
            form.id?.toLowerCase().includes('signup') ||
            form.getAttribute('data-auth') === 'register' ||
            form.getAttribute('data-auth') === 'signup'
        );
        
        const forgotForm = allForms.find(form => 
            form.id?.toLowerCase().includes('forgot') || 
            form.id?.toLowerCase().includes('reset') ||
            form.getAttribute('data-auth') === 'forgot' ||
            form.getAttribute('data-auth') === 'reset'
        );

        return { loginForm, registerForm, forgotForm };
    }

    findExistingButtons() {
        const allButtons = Array.from(this.container.querySelectorAll('button'));
        
        const googleBtn = allButtons.find(btn => 
            btn.id?.toLowerCase().includes('google') ||
            btn.getAttribute('data-auth') === 'google' ||
            btn.getAttribute('data-provider') === 'google'
        );
        
        const facebookBtn = allButtons.find(btn => 
            btn.id?.toLowerCase().includes('facebook') ||
            btn.getAttribute('data-auth') === 'facebook' ||
            btn.getAttribute('data-provider') === 'facebook'
        );
        
        const logoutBtn = allButtons.find(btn => 
            btn.id?.toLowerCase().includes('logout') ||
            btn.getAttribute('data-auth') === 'logout' ||
            btn.getAttribute('data-action') === 'logout'
        );

        return { googleBtn, facebookBtn, logoutBtn };
    }

    generateDirectMode(htmlContent) {
        if (!this.container) return;
        this.container.innerHTML = htmlContent;
    }

    generateToggleMode(htmlContent) {
        if (!this.container) return;

        // Generate button only
        this.container.innerHTML = `
            <button id="auth-toggle-btn" class="btn w-100 auth-toggle-btn">Show Login</button>
        `;

        // Create modal
        this.modal.create(htmlContent);

        // Set up toggle button
        const toggleBtn = document.getElementById('auth-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.modal.show();
            });
        }
    }

    getModal() {
        return this.modal;
    }
}