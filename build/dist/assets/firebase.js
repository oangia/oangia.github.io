import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyB0TxR5HpNJ8Ph7rnrHqXNMAmBWo1dw5Nw",
    authDomain: "agent52.firebaseapp.com",
    projectId: "agent52",
    storageBucket: "agent52.firebasestorage.app",
    messagingSenderId: "534394830199",
    appId: "1:534394830199:web:521b810d19dbcfe9edb572",
    measurementId: "G-J9RZWL9DZ5"
}

const app = initializeApp(firebaseConfig);
class CAuth {
  constructor(authenticator, options) {
    this.authenticator = authenticator;
    this.options = options;
    // update ui
    const userInfoEl = document.getElementById('user-info');
    const userEmailEl = document.getElementById('user-email');
    if (userInfoEl && userEmailEl) {
      userEmailEl.textContent = this.authenticator.getCurrentUser().email || 'User';
      userInfoEl.style.display = 'flex';
    }
    // logout
    const logoutBtn = document.getElementById(this.options.logoutBtnId);
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const result = await this.authenticator.logout();
        this.lastResult = result;
        
        if (result.success) {
            Message.success('Successfully logged out!');
            if (this.options.callbacks?.onLogout) {
                this.options.callbacks.onLogout();
            }
            // Redirect to login URL if specified
            if (this.options.loginUrl) {
                setTimeout(() => {
                    window.location.href = this.options.loginUrl;
                }, 1000);
            }
        } else {
            Message.error(this.getErrorMessage(result.error));
        }
      });
    }
  }
}
class CLogin {
    constructor(firebase, options) {
      this.firebase = firebase;
      this.options = options;
  
      this.navigate();
      const forms = this.findExistingForms();
      const buttons = this.findExistingButtons();
  
      if (forms.loginForm) {
          forms.loginForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              await this.handleLogin(forms.loginForm);
          });
      }
  
      if (forms.registerForm) {
          forms.registerForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              //await this.formHandler.handleRegister(forms.registerForm);
          });
      }
  
      if (forms.forgotForm) {
          forms.forgotForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              //await this.formHandler.handleForgotPassword(forms.forgotForm);
          });
      }
  
      if (buttons.googleBtn) {
          buttons.googleBtn.addEventListener('click', async () => {
              //await this.formHandler.handleGoogleLogin();
          });
      }
  
      if (buttons.facebookBtn) {
          buttons.facebookBtn.addEventListener('click', async () => {
              //await this.formHandler.handleFacebookLogin();
          });
      }
    }
  
    async handleLogin(form) {
      if (!this.options.enableEmail) return;
  
      const email = this.getEmailFromForm(form);
      const password = this.getPasswordFromForm(form);
  
      if (!email || !password) {
          Message.error('Please fill in all fields');
          return;
      }
  
      const result = await this.firebase.login(email, password);
      this.lastResult = result;
      
      if (result.success) {
          if (!this.options.redirectUrl) {
              Message.success('Successfully logged in!');
          }
          // Redirect if URL is set
          if (this.options.redirectUrl) {
              window.location.href = this.options.redirectUrl;
          }
      } else {
          Message.error(this.getErrorMessage(result.error));
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
  
          const result = await this.firebase.register(email, password);
          this.lastResult = result;
          
          if (result.success) {
              this.message.show('Account created successfully!', 'success');
              if (this.options.callbacks?.onRegister) {
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
  
          const result = await this.firebase.resetPassword(email);
          this.lastResult = result;
          
          if (result.success) {
              this.message.show('Password reset email sent! Check your inbox.', 'success');
          } else {
              this.message.show(this.getErrorMessage(result.error), 'error');
          }
          
          return result;
      }
  
      async handleGoogleLogin() {
          if (!this.options.enableGoogle) return;
  
          const result = await this.firebase.loginWithGoogle();
          this.lastResult = result;
          
          if (result.success) {
              this.message.show('Successfully logged in with Google!', 'success');
              if (this.options.callbacks?.onGoogleLogin) {
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
  
          const result = await this.firebase.loginWithFacebook();
          this.lastResult = result;
          
          if (result.success) {
              this.message.show('Successfully logged in with Facebook!', 'success');
              if (this.options.callbacks?.onFacebookLogin) {
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
  
    getEmailFromForm(form) {
        const emailInput = form.querySelector('input[type="email"]');
        return emailInput?.value || this.getFormValues(form).email || this.getFormValues(form).mail;
    }
  
    getPasswordFromForm(form) {
        const passwordInput = form.querySelector('input[type="password"]:not([id*="confirm"]):not([name*="confirm"])');
        return passwordInput?.value || this.getFormValues(form).password || this.getFormValues(form).pwd;
    }
  
    navigate() {
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
  
    findExistingForms() {
          const allForms = Array.from(document.body.querySelectorAll('form'));
          
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
  
      /**
       * Find existing buttons in container (helper method)
       */
      findExistingButtons() {
          const allButtons = Array.from(document.body.querySelectorAll('button'));
          
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
/**
 * Auth - Main authentication class that routes to appropriate handlers
 * 
 * @param {Object} app - Firebase app instance
 * @param {string} action - 'authenticate' or 'guard'
 * @param {Object} options - Configuration options
 */
class Authenticator {
    constructor(app, action, options = {}) {
        this.auth = getAuth(app);
        this.action = action;
        this.options = options;
        this.listenToUser();
    }

    listenToUser() {
        // check login state
        onAuthStateChanged(this.auth, (user) => {
            if (!user) {
                if (this.action == 'guard') {
                    window.location.href = this.options.loginUrl;
                    return;
                }
                return new CLogin(this, this.options);
            }
            if (this.action == 'authenticate' && this.options.redirectUrl) {
                window.location.href = this.options.redirectUrl;
                return;
            }
            return new CAuth(this, this.options);
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
        return this.auth.currentUser;
    }

    getAuth() {
        return this.auth;
    }
}

class Firestore {
    constructor(app, auth = null) {
      this.db = getFirestore(app);
      this.auth = auth;
    }
    
    // Create document with auto ID
    async create(collectionName, data) {
      try {
        const time = this.now();
        const docRef = await addDoc(collection(this.db, collectionName), {
          ...data,
          createdAt: time,
          updatedAt: time
        });
        return { id: docRef.id, ...data, createdAt: time, updatedAt: time };
      } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        throw error;
      }
    }
  
    // Create or overwrite document with custom ID
    async createWithId(collectionName, id, data) {
      try {
        const time = this.now();
        const ref = doc(this.db, collectionName, id);
        await setDoc(ref, {
          ...data,
          createdAt: time,
          updatedAt: time
        });
        return { id, ...data, createdAt: time, updatedAt: time };
      } catch (error) {
        console.error(`Error creating document with ID in ${collectionName}:`, error);
        throw error;
      }
    }
  
    async read(collectionName, id) {
      try {
        const ref = doc(this.db, collectionName, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Document not found");
        return { id: snap.id, ...snap.data() };
      } catch (error) {
        console.error(`Error getting document from ${collectionName}:`, error);
        throw error;
      }
    }
  
    // Get all documents
    async readAll(collectionName) {
      try {
        const snapshot = await getDocs(collection(this.db, collectionName));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        throw error;
      }
    }
  
    // Pagination helper
    async paginate(
      collectionName,
      limitCount = 10,
      cursor = null,
      orderByField = 'createdAt',
      orderDirection = 'desc'
    ) {
      try {
        let q = query(
          collection(this.db, collectionName),
          orderBy(orderByField, orderDirection),
          limit(limitCount)
        );
  
        if (cursor) {
          q = query(
            collection(this.db, collectionName),
            orderBy(orderByField, orderDirection),
            startAfter(cursor),
            limit(limitCount)
          );
        }
  
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const lastDoc = snap.docs[snap.docs.length - 1] || null;
  
        return {
          items,
          cursor: lastDoc,
          hasMore: snap.docs.length === limitCount
        };
      } catch (error) {
        console.error(`Error paginating ${collectionName}:`, error);
        throw error;
      }
    }
  
    async update(collectionName, id, data) {
      try {
        const time = this.now();
        const ref = doc(this.db, collectionName, id);
        await updateDoc(ref, {
          ...data,
          updatedAt: time
        });
        return { id, ...data, updatedAt: time };
      } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        throw error;
      }
    }
  
    async delete(collectionName, id) {
      try {
        const ref = doc(this.db, collectionName, id);
        await deleteDoc(ref);
        return true;
      } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        throw error;
      }
    }
  
    now() {
      return Date.now()/1e3|0
    }
}

export function getFirestoreDB(auth = null) {
    const firestore = new Firestore(app, auth);
    return firestore;
}

export function getAuthenticator(action, config) {
    const auth = new Authenticator(app, action, config);
    return auth;
}

export function getFirestoreWithAuth(action, config) {
    const auth = getAuthenticator(action, config);
    const firestore = getFirestoreDB(auth);
    return firestore;
}