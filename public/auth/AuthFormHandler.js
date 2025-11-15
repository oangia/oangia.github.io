import { AuthMessage } from './AuthMessage.js';
import { AuthUI } from './AuthUI.js';
import { AuthStyles } from './AuthStyles.js';
import { AuthHTML } from './AuthHTML.js';
/**
 * AuthFormHandler - Handles form submissions and value extraction
 */
export class AuthFormHandler {
    constructor(authCore, messageHandler, config) {
        this.authCore = authCore;
        this.message = messageHandler;
        this.config = config;
        this.ui = new AuthUI(this.config.containerId, this.config);
        this.message = new AuthMessage();
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
            this.formHandler.attachEventListeners();
            
            // Set up message element
            const messageEl = document.getElementById('auth-message');
            if (messageEl) {
                this.message.setElement(messageEl);
            }
        }
        if (!this.ui.hasExistingForms()) {
            this.formHandker.showLoginForm();
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
                
                const result = await this.firebase.register(email, password);
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

    async handleLogin(form) {
        if (!this.config.enableEmail) return;

        const email = this.getEmailFromForm(form);
        const password = this.getPasswordFromForm(form);

        if (!email || !password) {
            this.message.show('Please fill in all fields', 'error');
            return;
        }

        const result = await this.authCore.login(email, password);
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
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleRegister(form) {
        if (!this.config.enableEmail) return;

        const email = this.getEmailFromForm(form);
        const password = this.getPasswordFromForm(form);
        const confirmPassword = this.getConfirmPasswordFromForm(form);

        if (!email || !password) {
            this.message.show('Please fill in all fields', 'error');
            return;
        }

        if (confirmPassword && password !== confirmPassword) {
            this.message.show('Passwords do not match!', 'error');
            return;
        }

        const result = await this.authCore.register(email, password);
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
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleForgotPassword(form) {
        if (!this.config.enableEmail) return;

        const email = this.getEmailFromForm(form);
        if (!email) {
            this.message.show('Please enter your email', 'error');
            return;
        }

        const result = await this.authCore.resetPassword(email);
        if (result.success) {
            this.message.show('Password reset email sent! Check your inbox.', 'success');
        } else {
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleGoogleLogin() {
        if (!this.config.enableGoogle) return;

        const result = await this.authCore.loginWithGoogle();
        if (result.success) {
            this.message.show('Successfully logged in with Google!', 'success');
            if (this.config.callbacks.onGoogleLogin) {
                this.config.callbacks.onGoogleLogin(result.user);
            }
            // Redirect if URL is set
            if (this.config.redirectUrl) {
                setTimeout(() => {
                    window.location.href = this.config.redirectUrl;
                }, 1000);
            }
        } else {
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleFacebookLogin() {
        if (!this.config.enableFacebook) return;

        const result = await this.authCore.loginWithFacebook();
        if (result.success) {
            this.message.show('Successfully logged in with Facebook!', 'success');
            if (this.config.callbacks.onFacebookLogin) {
                this.config.callbacks.onFacebookLogin(result.user);
            }
            // Redirect if URL is set
            if (this.config.redirectUrl) {
                setTimeout(() => {
                    window.location.href = this.config.redirectUrl;
                }, 1000);
            }
        } else {
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleLogout() {
        const result = await this.authCore.logout();
        if (result.success) {
            this.message.show('Successfully logged out!', 'success');
            if (this.config.callbacks.onLogout) {
                this.config.callbacks.onLogout();
            }
        } else {
            this.message.show(this.getErrorMessage(result.error), 'error');
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

