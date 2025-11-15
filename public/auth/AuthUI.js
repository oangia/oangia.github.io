import { AuthModal } from './AuthModal.js';
import { AuthMessage } from './AuthMessage.js';
import { AuthStyles } from './AuthStyles.js';
import { AuthHTML } from './AuthHTML.js';
import { AuthFormHandler } from './AuthFormHandler.js';
/**
 * AuthUI - Handles UI generation and form attachment
 */
export class AuthUI {
    constructor(firebase, options) {
        this.firebase = firebase;
        this.options = options;
        this.container = null;
        this.modal = new AuthModal();
        this.message = new AuthMessage();
        this.formHandler = new AuthFormHandler(this.firebase, this.message, this.options);
    }

    loggedIn(user) {
        this.hideAllForms();
        const dashboard = document.getElementById('auth-dashboard');
        if (dashboard) dashboard.classList.remove('d-none');
        this.getModal().hide();
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
        const logoutBtn = document.getElementById(this.options.logoutBtnId);
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await this.firebase.logout();
                if (result.success) {
                    window.location.href = this.options.loginUrl;
                }
            });
        }
    }

    loggedOut() {
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error(`Container with ID "${this.options.containerId}" not found`);
            return false;
        }
        const hasExistingForms = this.hasExistingForms();
        
        if (hasExistingForms) {
            // Use existing forms - attach event listeners only
            const { messageEl } = this.attachToExistingForms(this.formHandler);
            if (messageEl) {
                this.message.setElement(messageEl);
            }
        } else {
            // Generate new forms
            AuthStyles.inject();
            
            const htmlContent = AuthHTML.generate(this.config);
            
            // Generate UI based on mode
            if (this.options.mode === 'toggle') {
                this.generateToggleMode(htmlContent);
            } else {
                this.generateDirectMode(htmlContent);
            }
            
            // Attach event listeners to generated forms
            this.attachEventListeners();
            
            // Set up message element
            const messageEl = document.getElementById('auth-message');
            if (messageEl) {
                this.message.setElement(messageEl);
            }
        }
        if (!this.hasExistingForms()) {
            this.showLoginForm();
        }
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
                
                const result = await this.firebase.login(email, password);
                if (result.success) {
                    this.message.show('Successfully logged in!', 'success');
                    if (this.options.callbacks.onLogin) {
                        this.options.callbacks.onLogin(result.user);
                    }
                    // Redirect if URL is set
                    if (this.options.redirectUrl) {
                        setTimeout(() => {
                            window.location.href = this.options.redirectUrl;
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
                
                const result = await this.firebase.register(email, password);
                if (result.success) {
                    this.message.show('Account created successfully!', 'success');
                    if (this.options.callbacks.onRegister) {
                        this.options.callbacks.onRegister(result.user);
                    }
                    // Redirect if URL is set
                    if (this.options.redirectUrl) {
                        setTimeout(() => {
                            window.location.href = this.options.redirectUrl;
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
                
                const result = await this.firebase.resetPassword(email);
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

    hideAllForms() {
        const forms = ['auth-login-form', 'auth-register-form', 'auth-forgot-form', 'auth-dashboard'];
        forms.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('d-none');
        });
    }

    // Get form values directly from form element
    getFormValues(form) {
        const formData = new FormData(form);
        const values = {};
        for (const [key, value] of formData.entries()) {
            values[key] = value;
        }
        return values;
    }

    // Get email from form
    getEmailFromForm(form) {
        const emailInput = form.querySelector('input[type="email"]');
        return emailInput?.value || this.getFormValues(form).email || this.getFormValues(form).mail;
    }

    // Get password from form
    getPasswordFromForm(form) {
        const passwordInput = form.querySelector('input[type="password"]:not([id*="confirm"]):not([name*="confirm"])');
        return passwordInput?.value || this.getFormValues(form).password || this.getFormValues(form).pwd;
    }

    // Get confirm password from form
    getConfirmPasswordFromForm(form) {
        const confirmInput = form.querySelector('input[type="password"][id*="confirm"], input[type="password"][name*="confirm"]');
        return confirmInput?.value || this.getFormValues(form).confirmPassword || this.getFormValues(form).confirm;
    }

    hasExistingForms() {
        if (!this.container) return false;
        
        const hasForm = this.container.querySelector('form') !== null;
        const hasInputs = this.container.querySelector('input[type="email"], input[type="password"]') !== null;
        const hasButtons = this.container.querySelector('button[id*="auth"], button[id*="login"], button[id*="register"]') !== null;
        
        return hasForm || hasInputs || hasButtons;
    }

    attachToExistingForms(formHandler) {
        if (!this.container) return {};

        // Find existing forms
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
        
        // Find buttons
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
        
        // Find message element
        const messageEl = this.container.querySelector('[data-auth="message"], .alert, .message') ||
                         Array.from(this.container.querySelectorAll('[id*="message"]')).find(el => 
                             el.id?.toLowerCase().includes('message')
                         );

        // Attach event listeners
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                formHandler.handleLogin(loginForm);
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                formHandler.handleRegister(registerForm);
            });
        }

        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                formHandler.handleForgotPassword(forgotForm);
            });
        }

        if (googleBtn) {
            googleBtn.addEventListener('click', () => formHandler.handleGoogleLogin());
        }

        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => formHandler.handleFacebookLogin());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => formHandler.handleLogout());
        }

        return { messageEl };
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

