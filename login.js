async function sha256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days*864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
  return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
}
if (document.getElementById("login") != undefined) {
document.getElementById("login").addEventListener("keydown", async e => {
  if (e.key !== "Enter") return;

  const password = e.target.value;
  const private = await sha256(password.repeat(5));
  const public = await sha256(private);
  if (public == public_key) {
    setCookie("auth", private, 30);
    window.location.href = "index.html"
  } else {
    alert("Invalid password.");
  }
});
}
(async () => {
  const saved = getCookie("auth");
  const public = await sha256(saved);
  if (public == public_key) {
    setCookie("auth", saved, 30);
    document.body.style.display = "block";
  } else {
    if (window.location.pathname != '/login.html') {
      window.location.href = "login.html";
    }
  }
})();
