class Url {
    static get(name) {
      const params = new URLSearchParams(window.location.search);
      return params.get(name);
    }
  
    static has(name) {
      const params = new URLSearchParams(window.location.search);
      return params.has(name);
    }
  
    static getAll() {
      return Object.fromEntries(new URLSearchParams(window.location.search));
    }
  }