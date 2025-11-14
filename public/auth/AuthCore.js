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
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';

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
            this.auth = getAuth(this.app);
            return true;
        } catch (error) {
            console.error('Firebase Auth initialization error:', error);
            return false;
        }
    }

    onAuthStateChange(callback) {
        if (!this.auth) return;
        onAuthStateChanged(this.auth, (user) => {
            this.user = user;
            if (callback) callback(user);
        });
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async register(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async logout() {
        try {
            await signOut(this.auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async loginWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    async loginWithFacebook() {
        try {
            const provider = new FacebookAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    getCurrentUser() {
        return this.user;
    }

    getAuth() {
        return this.auth;
    }
}

