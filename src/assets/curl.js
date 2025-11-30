class CUrl {
    static async connect(method, url, data = null, headers = {}) {
        const options = {
            method: method.toUpperCase(),
            headers: {
                "Content-Type": "application/json",
                ...headers
            }
        };

        if (data && (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT")) {
            options.body = JSON.stringify(data);
        }

        const res = await fetch(url, options);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result = await res.json();
        return result;
    }
}
