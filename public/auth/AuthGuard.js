import { AuthCore } from './AuthCore.js';

/**
 * AuthGuard - Simple authentication protection for pages
 * Just pass the app and config, it handles everything
 * 
 * @param {Object} app - Firebase app instance
 * @param {Object} options - Configuration options
 * @param {string} options.loginUrl - URL to redirect to if not logged in
 * @param {Function} options.onAuthenticated - Callback when user is authenticated (optional)
 */
export class AuthGuard {
    constructor(app, options = {}) {
        this.app = app;
        this.config = {
            loginUrl: './auth/auto-generated.html',
            onAuthenticated: null,
            ...options
        };
        
        this.core = new AuthCore(app);
        this.init();
    }

    init() {
        // Listen for auth state changes
        this.core.onAuthStateChange((user) => {
            if (!user) {
                // Not logged in, redirect to login page
                window.location.href = this.config.loginUrl;
                return;
            }
            
            // User is authenticated
            const userInfoEl = document.getElementById('user-info');
            const userEmailEl = document.getElementById('user-email');
            if (userInfoEl && userEmailEl) {
                userEmailEl.textContent = user.email || 'User';
                userInfoEl.style.display = 'flex';
            }
        });
        // Logout button handler
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
        logoutBtn.addEventListener('click', () => authGuard.logout());
        }
    }

    // Public API
    getCurrentUser() {
        return this.core.getCurrentUser();
    }

    async logout() {
        const result = await this.core.logout();
        if (result.success) {
            window.location.href = this.config.loginUrl;
        }
        return result;
    }
}

