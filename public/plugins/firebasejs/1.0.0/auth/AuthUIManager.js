import { AuthModal } from './AuthModal.js';
import { FormGenerator } from './FormGenerator.js';
/**
 * AuthUIManager - Handles UI rendering and updates
 * Responsible for displaying user information and UI state
 */
export class AuthUIManager {
    constructor(options) {
        this.options = options;
        this.modal = new AuthModal();
    }

    /**
     * Update UI for logged in user
     */
    updateLoggedInUI(user) {
        const userInfoEl = document.getElementById('user-info');
        const userEmailEl = document.getElementById('user-email');
        if (userInfoEl && userEmailEl) {
            userEmailEl.textContent = user.email || 'User';
            userInfoEl.style.display = 'flex';
        }
    }

    /**
     * Clear logged in UI
     */
    clearLoggedInUI() {
        const userInfoEl = document.getElementById('user-info');
        if (userInfoEl) {
            userInfoEl.style.display = 'none';
        }
    }

    /**
     * Generate authentication UI
     */
    generateAuthUI(container, navigator, eventBinder) {
        if (!container) return;
        // Inject styles
        FormGenerator.inject();
        // Generate HTML content
        const htmlContent = FormGenerator.generate(this.options);
        
        // Generate UI based on mode
        if (this.options.mode === 'toggle') {
            this.generateToggleMode(container, htmlContent, eventBinder);
        } else {
            this.generateDirectMode(container, htmlContent);
        }
        
        // Attach event listeners
        eventBinder.attachGeneratedFormListeners();
        
        // Show initial form
        navigator.showLoginForm();
    }

    /**
     * Generate UI in direct mode (inline)
     */
    generateDirectMode(container, htmlContent) {
        if (!container) return;
        container.innerHTML = htmlContent;
    }

    /**
     * Generate UI in toggle mode (modal)
     */
    generateToggleMode(container, htmlContent, eventBinder) {
        if (!container) return;

        // Render toggle button
        this.renderToggleButton(container);
        
        // Create modal
        this.modal.create(htmlContent);
        
        // Attach toggle button listener
        eventBinder.attachToggleButton(this.modal);
    }

    /**
     * Check if container has existing forms
     */
    hasExistingForms(container) {
        if (!container) return false;
        
        const hasForm = container.querySelector('form') !== null;
        const hasInputs = container.querySelector('input[type="email"], input[type="password"]') !== null;
        const hasButtons = container.querySelector('button[id*="auth"], button[id*="login"], button[id*="register"]') !== null;
        
        return hasForm || hasInputs || hasButtons;
    }

    /**
     * Find existing forms in container
     */
    findExistingForms(container) {
        if (!container) return {};
        
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
     * Find existing buttons in container
     */
    findExistingButtons(container) {
        if (!container) return {};
        
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

    /**
     * Render HTML content in direct mode
     */
    renderDirectMode(container, htmlContent) {
        if (!container) return;
        container.innerHTML = htmlContent;
    }

    /**
     * Render toggle button for modal mode
     */
    renderToggleButton(container) {
        if (!container) return;
        container.innerHTML = `
            <button id="auth-toggle-btn" class="btn w-100 auth-toggle-btn">Show Login</button>
        `;
    }

    /**
     * Get modal instance
     */
    getModal() {
        return this.modal;
    }
}