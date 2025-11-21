class Cookie {
    static set(name, value, days = 7) {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
    }
  
    static get(name) {
      const target = name + "=";
      const parts = document.cookie.split(";");
  
      for (let p of parts) {
        p = p.trim();
        if (p.startsWith(target)) {
          return decodeURIComponent(p.substring(target.length));
        }
      }
      return null;
    }
  
    static delete(name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }