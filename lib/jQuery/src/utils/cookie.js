function setCookie(name, value, days = 1) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function deleteCookie(name) {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    
    for (let cookie of cookies) {
        const [key, value] = cookie.split('=');
        if (key === encodeURIComponent(name)) {
            return decodeURIComponent(value);
        }
    }
    
    return null;
}