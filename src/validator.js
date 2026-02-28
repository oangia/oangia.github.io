class Validator {
  constructor(data, rules = {}, messages = {}) {
    this.data = data;
    this.rules = rules;
    this.messages = messages;
    this.errors = [];
  }

  validate() {
    for (const field in this.rules) {
      const value = this.data[field];
      const ruleList = this.rules[field].split('|');

      ruleList.forEach(rule => {
        const [name, param] = rule.split(':');

        if (name === 'required' && (!value || value === '')) {
          this.addError(field, 'required', `${field} is required`);
        }

        if (name === 'min' && value && value.length < Number(param)) {
          this.addError(field, 'min', `${field} min ${param} characters`);
        }

        if (name === 'max' && value && value.length > Number(param)) {
          this.addError(field, 'max', `${field} max ${param} characters`);
        }

        if (name === 'numeric' && value && !/^\d+$/.test(value)) {
          this.addError(field, 'numeric', `${field} must be numeric`);
        }

        if (name === 'date' && value && isNaN(Date.parse(value))) {
          this.addError(field, 'date', `${field} must be valid date`);
        }
      });
    }

    return this.errors;
  }

  addError(field, rule, defaultMsg) {
    const custom = this.messages?.[field]?.[rule];
    this.errors.push(custom || defaultMsg);
  }
}