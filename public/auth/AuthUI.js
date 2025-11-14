import { AuthModal } from './AuthModal.js';

/**
 * AuthUI - Handles UI generation and form attachment
 */
export class AuthUI {
    constructor(containerId, config) {
        this.containerId = containerId;
        this.config = config;
        this.container = null;
        this.modal = new AuthModal();
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Container with ID "${this.containerId}" not found`);
            return false;
        }
        return true;
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

