class Validator {
  static isEmpty(v) {
    return !v || !v.trim();
  }

  static isEmail(v) {
    const p = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return p.test(v);
  }

  static minLength(v, len) {
    return v.trim().length >= len;
  }

  static maxLength(v, len) {
    return v.trim().length <= len;
  }

  static isNumber(v) {
    return /^\d+$/.test(v.trim());
  }

  static isStrongPassword(v) {
    // at least 1 lowercase, 1 uppercase, 1 digit, 1 special, 8 chars
    const p =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/;
    return p.test(v);
  }

  static match(v1, v2) {
    return v1 === v2;
  }

  static isPhone(v) {
    // simple: digits 8–15
    return /^\d{8,15}$/.test(v.trim());
  }

  static isUsername(v) {
    // letters, numbers, underscore, 3–20 chars
    return /^[a-zA-Z0-9_]{3,20}$/.test(v.trim());
  }

  static inRange(n, min, max) {
    return Number(n) >= min && Number(n) <= max;
  }
}
