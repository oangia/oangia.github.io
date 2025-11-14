/**
 * AuthHTML - Generates HTML for auth forms
 */
export class AuthHTML {
    static generate(config) {
        const hasEmail = config.enableEmail;
        const hasGoogle = config.enableGoogle;
        const hasFacebook = config.enableFacebook;
        const showRegister = config.showRegister && hasEmail;
        const showForgotPassword = config.showForgotPassword && hasEmail;

        return `
            <div class="auth-ui">
                <div id="auth-message" class="auth-message mb-3"></div>

                <!-- Login Form -->
                <div id="auth-login-form" class="auth-form">
                    ${hasEmail ? `
                        <form id="auth-login-form-element">
                            <div class="mb-3">
                                <label for="auth-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="auth-email" required placeholder="Enter your email">
                            </div>
                            <div class="mb-3">
                                <label for="auth-password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="auth-password" required placeholder="Enter your password">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Sign In</button>
                        </form>
                    ` : ''}

                    ${(hasGoogle || hasFacebook) ? `
                        <div class="auth-divider my-3"><span>OR</span></div>
                        <div class="auth-social-buttons d-flex flex-column gap-2">
                            ${hasGoogle ? `
                                <button id="auth-google-btn" type="button" class="btn btn-social btn-google w-100">
                                    <svg width="18" height="18" viewBox="0 0 18 18" class="me-2">
                                        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"/>
                                        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.71.48-1.62.75-2.7.75-2.08 0-3.84-1.4-4.47-3.3H1.87v2.07A7.97 7.97 0 0 0 8.98 17Z"/>
                                        <path fill="#FBBC05" d="M4.51 10.5a4.8 4.8 0 0 1 0-3.07V5.36H1.87a7.97 7.97 0 0 0 0 7.17l2.64-2.07Z"/>
                                        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A7.97 7.97 0 0 0 1.87 5.36l2.64 2.07c.63-1.9 2.39-3.3 4.47-3.3Z"/>
                                    </svg>
                                    Continue with Google
                                </button>
                            ` : ''}
                            ${hasFacebook ? `
                                <button id="auth-facebook-btn" type="button" class="btn btn-social btn-facebook w-100">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#4267B2" class="me-2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    Continue with Facebook
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}

                    ${showRegister || showForgotPassword ? `
                        <div class="auth-links text-center mt-3">
                            ${showRegister ? `<a href="#" id="auth-show-register" class="d-block mb-2">Don't have an account? Sign up</a>` : ''}
                            ${showForgotPassword ? `<a href="#" id="auth-show-forgot" class="d-block">Forgot password?</a>` : ''}
                        </div>
                    ` : ''}
                </div>

                <!-- Register Form -->
                ${showRegister ? `
                    <div id="auth-register-form" class="auth-form d-none">
                        <form id="auth-register-form-element">
                            <div class="mb-3">
                                <label for="auth-register-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="auth-register-email" required placeholder="Enter your email">
                            </div>
                            <div class="mb-3">
                                <label for="auth-register-password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="auth-register-password" required placeholder="Create a password">
                            </div>
                            <div class="mb-3">
                                <label for="auth-register-confirm" class="form-label">Confirm Password</label>
                                <input type="password" class="form-control" id="auth-register-confirm" required placeholder="Confirm your password">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Create Account</button>
                        </form>
                        <div class="auth-links text-center mt-3">
                            <a href="#" id="auth-back-to-login">Already have an account? Sign in</a>
                        </div>
                    </div>
                ` : ''}

                <!-- Forgot Password Form -->
                ${showForgotPassword ? `
                    <div id="auth-forgot-form" class="auth-form d-none">
                        <form id="auth-forgot-form-element">
                            <div class="mb-3">
                                <label for="auth-forgot-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="auth-forgot-email" required placeholder="Enter your email">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Reset Password</button>
                        </form>
                        <div class="auth-links text-center mt-3">
                            <a href="#" id="auth-back-to-login-forgot">Back to Sign In</a>
                        </div>
                    </div>
                ` : ''}

                <!-- Dashboard -->
                <div id="auth-dashboard" class="auth-dashboard d-none text-center">
                    <div class="user-info bg-light p-3 rounded mb-3">
                        <div class="user-avatar mx-auto mb-2" id="auth-user-avatar">U</div>
                        <h3 id="auth-user-name" class="h5 mb-1">User Name</h3>
                        <p id="auth-user-email" class="text-muted mb-0">user@example.com</p>
                    </div>
                    <button id="auth-logout-btn" type="button" class="btn btn-primary w-100">Sign Out</button>
                </div>
            </div>
        `;
    }
}

