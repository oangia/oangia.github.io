// sha256
// getCookie
// setCookie(key, value, days)
async function sha256(t){let e=new TextEncoder,n=e.encode(t),i=await crypto.subtle.digest("SHA-256",n),o=Array.from(new Uint8Array(i)),r=o.map(t=>t.toString(16).padStart(2,"0")).join("");return r}function setCookie(t,e,n){let i=new Date(Date.now()+864e5*n).toUTCString();document.cookie=`${t}=${encodeURIComponent(e)}; expires=${i}; path=/`}function getCookie(t){return document.cookie.split("; ").find(e=>e.startsWith(t+"="))?.split("=")[1]}
async function generatePrivate(password) {
  const private_key = await sha256(password.repeat(5));
  return private_key;
}
async function generatePublic(private_key) {
  const public_key = await sha256(private_key);
  return public_key;
}
async function checkPublicKey(public_key) {
  const response = await fetch("/public/" + public_key);
  if (!response.ok) {
    return false;
  }
  return (await response.text()).trim() == 'true';
}
function loginFail() {
  if (window.location.pathname != '/login.html') {
    window.location.href = "login.html";
  } else {
    alert("Invalid password.");
  }
}
function loginSuccess(private_key) {
  setCookie("auth", private, 30);
  document.body.style.display = "block";
  if (window.location.pathname == '/login.html') {
    window.location.href = "index.html";
  }
}
async function checkLogin(private_key) {
  const public_key = await generatePublic(private_key);
  const checkValid = await checkPublicKey(public_key);
  if (checkValid) {
    loginSuccess();
  } else {
    loginFail();
  }
}
const pInput = document.getElementById("login");
if (pInput != undefined) {
  pInput.addEventListener("keydown", async e => {
    if (e.key !== "Enter") return;
    const password = e.target.value;
    const private = await generatePrivate(password);
    await checkLogin(private);
  });
}
(async () => {
  const saved = getCookie("auth");
  await checkLogin(saved);
})();

