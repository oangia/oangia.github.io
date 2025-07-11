function setCookie(t,e,n){let i=new Date(Date.now()+864e5*n).toUTCString();document.cookie=`${t}=${encodeURIComponent(e)}; expires=${i}; path=/`}function getCookie(t){return document.cookie.split("; ").find(e=>e.startsWith(t+"="))?.split("=")[1]}
class Crypto {
  async sha256(t){let e=new TextEncoder,n=e.encode(t),i=await crypto.subtle.digest("SHA-256",n),o=Array.from(new Uint8Array(i)),r=o.map(t=>t.toString(16).padStart(2,"0")).join("");return r}
}
class Password {
  constructor() {
    this.crypto = new Crypto();
  }
  async generatePrivate(password) {
    return await this.crypto.sha256(password.repeat(5));
  }
  async generatePublic(private_key) {
    return await this.crypto.sha256(private_key);
  }
  async checkPrivateKey(private_key) {
    const public_key = await this.generatePublic(private_key);
    const response = await fetch("/public/" + public_key);
    return (await response.text()).trim() == 'true';
  }
}
class Login {
  constructor() {
    this.password = new Password();
    this.homePage = '/';
    this.loginPage = '/login.html';
  }
  async start() {
    const saved = getCookie("auth");
    await this.checkLogin(saved);
    const pInput = document.getElementById("login");
    if (pInput != undefined) {
      pInput.addEventListener("keydown", async e => {
        if (e.key !== "Enter") return;
        const password = e.target.value;
        const private_key = await this.password.generatePrivate(password);
        await this.checkLogin(private_key);
      });
    }
  }
  async checkLogin(private_key) {
    const checkValid = await this.password.checkPrivateKey(private_key);
    if (checkValid) {
      this.success(private_key);
    } else {
      this.fail();
    }
  }
  fail() {
    if (window.location.pathname != this.loginPage) {
      window.location.href = this.loginPage;
    } else {
      alert("Invalid password.");
    }
  }
  success(private_key) {
    setCookie("auth", private_key, 30);
    document.body.style.display = "block";
    if (window.location.pathname == this.loginPage) {
      window.location.href = this.homePage;
    }
  }
}

(new Login()).start();
