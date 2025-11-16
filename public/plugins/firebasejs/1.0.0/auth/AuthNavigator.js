/**
 * AuthNavigator - Handles form navigation and visibility
 * Manages which form is shown and transitions between forms
 */
export class AuthNavigator {
    constructor() {
        this.currentForm = 'login';
    }

    /**
     * Show login form
     */
    showLoginForm() {
        this.hideAllForms();
        const loginForm = document.getElementById('auth-login-form');
        if (loginForm) {
            loginForm.classList.remove('d-none');
            this.currentForm = 'login';
        }
    }

    /**
     * Show register form
     */
    showRegisterForm() {
        this.hideAllForms();
        const registerForm = document.getElementById('auth-register-form');
        if (registerForm) {
            registerForm.classList.remove('d-none');
            this.currentForm = 'register';
        }
    }

    /**
     * Show forgot password form
     */
    showForgotPasswordForm() {
        this.hideAllForms();
        const forgotForm = document.getElementById('auth-forgot-form');
        if (forgotForm) {
            forgotForm.classList.remove('d-none');
            this.currentForm = 'forgot';
        }
    }

    /**
     * Hide all forms
     */
    hideAllForms() {
        const forms = [
            'auth-login-form',
            'auth-register-form',
            'auth-forgot-form',
            'auth-dashboard'
        ];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form && !form.classList.contains('d-none')) {
                form.classList.add('d-none');
            }
        });
    }

    /**
     * Get current visible form
     */
    getCurrentForm() {
        return this.currentForm;
    }

    /**
     * Attach navigation link listeners
     */
    attachNavigationListeners() {
        // Show register link
        const showRegister = document.getElementById('auth-show-register');
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        // Show forgot password link
        const showForgot = document.getElementById('auth-show-forgot');
        if (showForgot) {
            showForgot.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordForm();
            });
        }

        // Back to login from register
        const backToLogin = document.getElementById('auth-back-to-login');
        if (backToLogin) {
            backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        // Back to login from forgot password
        const backToLoginForgot = document.getElementById('auth-back-to-login-forgot');
        if (backToLoginForgot) {
            backToLoginForgot.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
    }
}