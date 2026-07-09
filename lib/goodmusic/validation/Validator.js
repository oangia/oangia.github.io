class MessageBag {
    constructor(errors = {}) {
      this.errors = errors;
    }
  
    first(field) {
      return this.errors[field]?.[0] || null;
    }
  
    get(field) {
      return this.errors[field] || [];
    }
  
    all() {
      return Object.values(this.errors).flat();
    }
  
    // This makes JSON.stringify() return clean object automatically
    toJSON() {
      return this.errors;
    }
  }
  
  class Validator {
    constructor(data, rules) {
      this.data = data;
      this.rules = rules;
      this._errors = {};
      this._validated = {};
      this._validate();
    }
  
    static make(data, rules) {
      return new Validator(data, rules);
    }
  
    _validate() {
      for (const field in this.rules) {
        const value = this.data[field];
        const ruleList = this.rules[field].split("|");
  
        for (const rule of ruleList) {
          const [name, param] = rule.split(":");
  
          if (name === "required") {
            if (value === undefined || value === null || value === "") {
              this._addError(field, `The ${field} field is required.`);
            }
          }
  
          if (name === "email") {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !regex.test(value)) {
              this._addError(field, `The ${field} must be a valid email address.`);
            }
          }
  
          if (name === "min") {
            if (value && value.length < Number(param)) {
              this._addError(field, `The ${field} must be at least ${param} characters.`);
            }
          }
        }
  
        if (!this._errors[field]) {
          this._validated[field] = value;
        }
      }
    }
  
    _addError(field, message) {
      if (!this._errors[field]) {
        this._errors[field] = [];
      }
      this._errors[field].push(message);
    }
  
    fails() {
      return Object.keys(this._errors).length > 0;
    }
  
    passes() {
      return !this.fails();
    }
  
    errors() {
      return new MessageBag(this._errors);
    }
  
    validated() {
      return this._validated;
    }
  }
  
  module.exports = Validator;