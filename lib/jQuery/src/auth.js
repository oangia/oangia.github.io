class Auth {
    static getToken() {
        return getCookie("token");
    }

    static user() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded; // contains user info
        } catch (err) {
            return null;
        }
    }
    static login(token) {
        setCookie('token', token, 30);
        setTimeout(() => {location.href = "/admin"}, 500);
    }
    static guest() {
        const token = getCookie('token');
        if (token != null) {
            location.href = "/admin";
        }
    }
    static guard() {
        const token = getCookie("token"); // just call it

        if (!token) {
            window.location.href = "/admin/login";
            return false;
        }

        return true;
    }
    static logout() {
        deleteCookie('token');
        window.location.reload();
    }
}