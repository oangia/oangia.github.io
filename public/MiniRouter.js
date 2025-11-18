export class MiniRouter {
    constructor({ root }) {
        this.routes = [];
        this.root = root;

        window.addEventListener("popstate", () => {
            this._handleRoute(window.location.pathname);
        });
    }

    // Register a route and the file to load
    on(path, filePath) {
        const paramNames = [];

        const regex = new RegExp(
            "^" +
            path.replace(/:([^/]+)/g, (_, name) => {
                paramNames.push(name);
                return "([^/]+)";
            })
            + "$"
        );

        this.routes.push({
            regex,
            paramNames,
            filePath
        });
    }

    navigate(path) {
        history.pushState({}, "", path);
        this._handleRoute(path);
    }

    _runScripts(container) {
        const scripts = container.querySelectorAll("script");
        scripts.forEach(oldScript => {
            const newScript = document.createElement("script");

            // Copy inline script
            if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
            }

            // Copy src script
            if (oldScript.src) {
                newScript.src = oldScript.src;
            }

            // Replace old script
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    async _handleRoute(path) {
        for (const route of this.routes) {
            const match = path.match(route.regex);
            if (!match) continue;

            // extract params
            const params = {};
            route.paramNames.forEach((name, i) => {
                params[name] = match[i + 1];
            });

            // Load HTML
            const html = await fetch(route.filePath).then(r => r.text());

            // Render
            this.root.innerHTML = this._injectParams(html, params);
            this._runScripts(this.root);
            return;
        }

        console.warn("Route not found:", path);
    }

    // simple {{param}} replacement inside HTML file
    _injectParams(html, params) {
        return html.replace(/{{\s*(\w+)\s*}}/g, (_, key) => params[key] || "");
    }
}