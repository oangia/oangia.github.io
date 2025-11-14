import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
  } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const modalHTML = `
<div class="modal fade" id="authModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
        <div class="modal-header">
        <h5 class="modal-title" id="modalTitle">Login</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
        <form id="authForm">
            <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" id="email" class="form-control" required>
            </div>
            <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" id="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary w-100" id="mainAction">Login</button>
        </form>
        <div class="text-center mt-3">
            <button id="googleLogin" class="btn btn-outline-danger w-100 mb-2">
            <i class="bi bi-google me-2"></i>Sign in with Google
            </button>
            <a href="#" id="toggleAuthMode">Don't have an account? Register</a>
        </div>
        </div>
    </div>
    </div>
</div>`;

export class Auth {
  constructor(app, config) {
    this.firebase = getAuth(app);
    this.config = config;
    this.provider = new GoogleAuthProvider();
    this.user = new User();
    switch (this.config.type) {
        case 'modal':
            this.initAuthModal(this.config.loginBtn);
            break;
    }
    onAuthStateChanged(this.firebase, (user) => {
        const userInfo = document.getElementById("user-info");
        const loginBtn = document.getElementById(this.config.loginBtn);
        const logoutBtn = document.getElementById("logout-btn");
      
        if (user) {
          console.log("Logged in as:", user.email);
          this.user.firebase(user);
      
          // Update UI
          userInfo.innerHTML = `UID: ${user.uid} <br> Name: ${user.displayName || user.email}`;
          loginBtn.style.display = "none";
          logoutBtn.style.display = "inline-block";
        } else {
          console.log("Logged out");
      
          // Reset UI
          this.user.firebase({ uid: this.user.getTempUID(), displayName: 'Unknown', email: 'Unknown' });
          userInfo.innerHTML = "";
          loginBtn.style.display = "inline-block";
          logoutBtn.style.display = "none";
        }
      });
      
      // Logout button
      document.getElementById("logout-btn").addEventListener("click", async () => {
        await signOut(this.firebase);
      });
    document.body.addEventListener('click', (e) => {
        /*if (e.target.id === this.config.loginBtnId) {
          signInWithPopup(this.firebaseAuth, this.provider);
        }
        if (e.target.id === this.config.logoutBtnId) {
          signOut(this.firebaseAuth);
        }*/
    });
    this.loginWithGoogle();
  }

  initAuthModal(buttonId) {
    this.createAuthModal();
    const authModal = new bootstrap.Modal(document.getElementById("authModal"));
    const btn = document.getElementById(buttonId);
    const modalTitle = document.getElementById("modalTitle");
    const mainAction = document.getElementById("mainAction");
    const toggleLink = document.getElementById("toggleAuthMode");
    let mode = "login"; // or "register"

    btn.addEventListener("click", () => authModal.show());

    toggleLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (mode === "login") {
        mode = "register";
        modalTitle.textContent = "Register";
        mainAction.textContent = "Create Account";
        toggleLink.textContent = "Already have an account? Login";
      } else {
        mode = "login";
        modalTitle.textContent = "Login";
        mainAction.textContent = "Login";
        toggleLink.textContent = "Don't have an account? Register";
      }
    });

    // Email + password
    document.addEventListener("submit", async (e) => {
      if (e.target && e.target.id === "authForm") {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
          if (mode === "login") {
            await signInWithEmailAndPassword(this.firebase, email, password);
            alert("Logged in!");
          } else {
            await createUserWithEmailAndPassword(this.firebase, email, password);
            alert("Account created!");
          }
          authModal.hide();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }
  loginWithGoogle() {
    document.getElementById("googleLogin").addEventListener("click", async () => {
        try {
          await signInWithPopup(this.firebase, this.provider);
          authModal.hide();
          alert("Logged in with Google!");
        } catch (err) {
          alert(err.message);
        }
    });
  }
  createAuthModal() {
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

class User {
    constructor() {
      this.uid = this.getTempUID();
      this.name = 'Unknown';
      this.email = 'Unknown';
    }
  
    getUid() {return this.uid;}
    getName() {return this.name;}
    getEmail() {return this.email;}
  
    firebase(user) {
      this.uid = user.uid;
      this.name = user.displayName;
      this.email = user.email;
    }
  
    getTempUID() {
      const match = document.cookie.match(/(^|;) ?tempUID=([^;]*)/);
      if (!match) {
        let tempUID = 'temp_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        this.setTempUID(tempUID);
        return tempUID;
      }
      return match[2];
    }
  
    setTempUID(uid) {
      document.cookie = `tempUID=${uid}; path=/; max-age=${60*60*24*30}`; // 30 days
    }
}
  