/**
 * AuthFormHandler - Handles form submissions and value extraction
 */
export class AuthFormHandler {
    constructor(authCore, messageHandler, options) {
        this.authCore = authCore;
        this.message = messageHandler;
        this.options = options;
        
    }

    async handleLogin(form) {
        if (!this.options.enableEmail) return;

        const email = this.getEmailFromForm(form);
        const password = this.getPasswordFromForm(form);

        if (!email || !password) {
            this.message.show('Please fill in all fields', 'error');
            return;
        }

        const result = await this.authCore.login(email, password);
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
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleRegister(form) {
        if (!this.options.enableEmail) return;

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
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleForgotPassword(form) {
        if (!this.options.enableEmail) return;

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
        if (!this.options.enableGoogle) return;

        const result = await this.authCore.loginWithGoogle();
        if (result.success) {
            this.message.show('Successfully logged in with Google!', 'success');
            if (this.options.callbacks.onGoogleLogin) {
                this.options.callbacks.onGoogleLogin(result.user);
            }
            // Redirect if URL is set
            if (this.options.redirectUrl) {
                setTimeout(() => {
                    window.location.href = this.options.redirectUrl;
                }, 1000);
            }
        } else {
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleFacebookLogin() {
        if (!this.options.enableFacebook) return;

        const result = await this.authCore.loginWithFacebook();
        if (result.success) {
            this.message.show('Successfully logged in with Facebook!', 'success');
            if (this.options.callbacks.onFacebookLogin) {
                this.options.callbacks.onFacebookLogin(result.user);
            }
            // Redirect if URL is set
            if (this.options.redirectUrl) {
                setTimeout(() => {
                    window.location.href = this.options.redirectUrl;
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
            if (this.options.callbacks.onLogout) {
                this.options.callbacks.onLogout();
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

