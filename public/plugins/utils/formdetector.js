class FormDetector {
  constructor() {
    this.fields = {};
    this.detect();
  }

  isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  isUsername(v) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(v);
  }

  isPassword(v) {
    return v.length >= 6 || /[!@#$%^&*()\-_=+{};:,<.>]/.test(v);
  }

  isPhone(v) {
    return /^\+?\d{8,15}$/.test(v.replace(/\s+/g, ""));
  }

  detect() {
    this.fields = {};
    const inputs = document.querySelectorAll("input");

    inputs.forEach(input => {
      const value = (input.value || "").trim();
      if (!value) return;

      const name = (input.name || input.id || "").toLowerCase() || value;

      // Determine type
      let type = "other";
      if (this.isEmail(value)) type = "email";
      else if (this.isPhone(value)) type = "phone";
      else if (this.isPassword(value)) type = "password";
      else if (this.isUsername(value)) type = "username";

      // Use name/id if available, else type
      const key = name || type;

      // Handle duplicates
      if (!this.fields[key]) this.fields[key] = value;
      else if (Array.isArray(this.fields[key])) this.fields[key].push(value);
      else this.fields[key] = [this.fields[key], value];
    });
  }

  get(field) {
    return this.fields[field] || null;
  }

  getAll() {
    return this.fields;
  }
}
