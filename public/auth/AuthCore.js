import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';

/**
 * AuthCore - Core Firebase authentication operations
 */
export class AuthCore {
    constructor(app) {
        this.app = app;
        this.auth = null;
        this.user = null;
        this.init();
    }

    init() {
        try {
            // Ensure auth is initialized - retry if needed
            if (!this.app) {
                console.error('Firebase app not provided');
                return false;
            }
            
            this.auth = getAuth(this.app);
            
            // Verify auth was created successfully
            if (!this.auth) {
                console.error('Failed to initialize Firebase Auth');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Firebase Auth initialization error:', error);
            // Retry after a short delay if it's a registration error
            if (error.message && error.message.includes('not been registered')) {
                setTimeout(() => {
                    try {
                        this.auth = getAuth(this.app);
                    } catch (retryError) {
                        console.error('Firebase Auth retry failed:', retryError);
                    }
                }, 100);
            }
            return false;
        }
    }

    onAuthStateChange(callback) {
        if (!this.auth) {
            // Retry initialization if auth is not available
            if (this.init() && this.auth) {
                onAuthStateChanged(this.auth, (user) => {
                    this.user = user;
                    if (callback) callback(user);
                });
            } else {
                // Wait a bit and try again
                setTimeout(() => {
                    if (this.init() && this.auth) {
                        onAuthStateChanged(this.auth, (user) => {
                            this.user = user;
                            if (callback) callback(user);
                        });
                    }
                }, 200);
            }
            return;
        }
        onAuthStateChanged(this.auth, (user) => {
            this.user = user;
            if (callback) callback(user);
        });
    }

    async login(email, password) {
        if (!this.auth) {
            if (!this.init()) {
                return { success: false, error: 'auth/not-initialized' };
            }
        }
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async register(email, password) {
        if (!this.auth) {
            if (!this.init()) {
                return { success: false, error: 'auth/not-initialized' };
            }
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async logout() {
        if (!this.auth) {
            if (!this.init()) {
                return { success: false, error: 'auth/not-initialized' };
            }
        }
        try {
            await signOut(this.auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async resetPassword(email) {
        if (!this.auth) {
            if (!this.init()) {
                return { success: false, error: 'auth/not-initialized' };
            }
        }
        try {
            await sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async loginWithGoogle() {
        if (!this.auth) {
            if (!this.init()) {
                return { success: false, error: 'auth/not-initialized' };
            }
        }
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async loginWithFacebook() {
        if (!this.auth) {
            if (!this.init()) {
                return { success: false, error: 'auth/not-initialized' };
            }
        }
        try {
            const provider = new FacebookAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    getCurrentUser() {
        if (!this.auth) return null;
        return this.auth.currentUser;
    }

    getAuth() {
        return this.auth;
    }
}

