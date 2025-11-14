/**
 * AuthFormHandler - Handles form submissions and value extraction
 */
export class AuthFormHandler {
    constructor(authCore, messageHandler, config) {
        this.authCore = authCore;
        this.message = messageHandler;
        this.config = config;
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
            if (this.config.callbacks?.onLogin) {
                this.config.callbacks.onLogin(result.user);
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
            if (this.config.callbacks?.onRegister) {
                this.config.callbacks.onRegister(result.user);
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
            if (this.config.callbacks?.onGoogleLogin) {
                this.config.callbacks.onGoogleLogin(result.user);
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
            if (this.config.callbacks?.onFacebookLogin) {
                this.config.callbacks.onFacebookLogin(result.user);
            }
        } else {
            this.message.show(this.getErrorMessage(result.error), 'error');
        }
    }

    async handleLogout() {
        const result = await this.authCore.logout();
        if (result.success) {
            this.message.show('Successfully logged out!', 'success');
            if (this.config.callbacks?.onLogout) {
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

