import { AuthNavigator } from './AuthNavigator.js';
/**
 * AuthEventBinder - Handles event listener attachment
 * Binds UI events to form handler actions
 */
export class AuthEventBinder {
    constructor(formHandler) {
        this.formHandler = formHandler;
        this.navigator = new AuthNavigator();
    }

    /**
     * Attach all event listeners for generated forms
     */
    attachGeneratedFormListeners() {
        this.attachLoginForm();
        this.attachRegisterForm();
        this.attachForgotPasswordForm();
        this.attachSocialButtons();
        this.attachLogoutButton();
        this.navigator.attachNavigationListeners();
    }

    /**
     * Attach listeners to existing forms
     */
    attachExistingFormListeners(container) {
        if (!container) return;
        this.navigator.attachNavigationListeners();
        const forms = this.findExistingForms(container);
        const buttons = this.findExistingButtons(container);

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

    /**
     * Attach login form listener
     */
    attachLoginForm() {
        const loginForm = document.getElementById('auth-login-form-element');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.formHandler.handleLogin(loginForm);
            });
        }
    }

    /**
     * Attach register form listener
     */
    attachRegisterForm() {
        const registerForm = document.getElementById('auth-register-form-element');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.formHandler.handleRegister(registerForm);
            });
        }
    }

    /**
     * Attach forgot password form listener
     */
    attachForgotPasswordForm() {
        const forgotForm = document.getElementById('auth-forgot-form-element');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const result = await this.formHandler.handleForgotPassword(forgotForm);
                // Show login form after successful password reset
                if (result?.success) {
                    setTimeout(() => this.navigator.showLoginForm(), 2000);
                }
            });
        }
    }

    /**
     * Attach social login button listeners
     */
    attachSocialButtons() {
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
    }

    /**
     * Attach logout button listener
     */
    attachLogoutButton() {
        const logoutBtn = document.getElementById('auth-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.formHandler.handleLogout();
            });
        }
    }

    /**
     * Attach logout listener for external button
     */
    attachExternalLogoutButton(logoutBtnId) {
        const logoutBtn = document.getElementById(logoutBtnId);
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.formHandler.handleLogout();
            });
        }
    }

    /**
     * Attach toggle button listener for modal mode
     */
    attachToggleButton(modal) {
        const toggleBtn = document.getElementById('auth-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                modal.show();
            });
        }
    }

    /**
     * Find existing forms in container (helper method)
     */
    findExistingForms(container) {
        const allForms = Array.from(container.querySelectorAll('form'));
        
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

    /**
     * Find existing buttons in container (helper method)
     */
    findExistingButtons(container) {
        const allButtons = Array.from(container.querySelectorAll('button'));
        
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
}