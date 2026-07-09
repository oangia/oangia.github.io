class CUrl {
    constructor() {
        this.headers = {}
    }

    json() {
        this.headers["Content-Type"] = "application/json";
    }

    async connect(url, method, data = null) {
        const options = {
            method: method,
            headers: this.headers
        };
    
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            options.body = JSON.stringify(data);
        }
    
        try {
            const response = await fetch(url, options);
            const resData = await response.json();
            return {status: response.status, data: resData};
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}