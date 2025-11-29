class CUrl {
    /**
     * Makes an HTTP request with fetch
     * @param {string} method - HTTP method: 'GET', 'POST', etc.
     * @param {string} url - Endpoint URL
     * @param {object|null} data - Payload for POST/PUT requests
     * @param {object} headers - Optional headers
     * @returns {Promise<any>} - Parsed JSON response
     */
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
