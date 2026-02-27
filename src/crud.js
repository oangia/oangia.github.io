async function apiRequest({
  url,
  method = 'GET',
  data = null,
  onSuccess = (data) => {},
  onFail = (data) => {}
}) {
  loading();
  const curl = new CUrl;
  curl.json();
  const res = await curl.connect(url, method, data);
  console.log(res);
  if (res.status != 200) {
      const messages = res.data.errors
                  ? Object.values(res.data.errors).flat()
                  : [res.data.message || 'Request failed'];
  
      //showToast(messages.join('<br>'), 'error');
      onFail(res.data);
      loading(false);
      return;
  } else {
      console.log("success", res);
      onSuccess(res.data);
      loading(false);
  }
}
class Crud {
  constructor({ endpoint, table, renderItem, formData, addBtn, limit = 10 }) {
    this.endpoint = endpoint;
    this.table = table;
    this.renderItem = renderItem;
    this.formData = formData;
    this.addBtn = addBtn;
    this.limit = limit;
    this.page = 1;
    this.pagination = null;

    this.init();
  }

  init() {
    if (this.table) {
      this.list();

      document.getElementById(this.table).addEventListener("click", async (e) => {
        const id = e.target.dataset.id;

        if (e.target.matches("[data-delete]")) {
          this.delete(id);
        }

        if (e.target.matches("[data-prev]") && this.page > 1) {
          this.page--;
          this.list();
        }

        if (e.target.matches("[data-next]") && this.pagination?.hasNext) {
          this.page++;
          this.list();
        }
        if (e.target.matches("[data-page]")) {
          this.page = Number(e.target.dataset.page);
          this.list();
        }
      });
    }

    if (this.addBtn) {
      this.create();
    }
  }

  async list() {
    apiRequest({
      url: `${this.endpoint}?page=${this.page}&limit=${this.limit}`,
      onSuccess: (result) => {
        this.pagination = result.pagination;
        this.render(result.data);
      }
    });
  }

  render(items) {
    const tableEl = document.getElementById(this.table);

    tableEl.innerHTML =
      items.map(item => this.renderItem(item)).join("") +
      this.renderPagination();
  }

  renderPagination() {
    if (!this.pagination) return "";
  
    const totalPages = this.pagination.totalPages;
    let pages = "";
  
    for (let i = 1; i <= totalPages; i++) {
      pages += `
        <button 
          data-page="${i}"
          class="px-3 py-1.5 text-sm rounded-md border transition
            ${i === this.page
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}">
          ${i}
        </button>
      `;
    }
  
    return `
      <tr>
        <td colspan="4" class="px-4 py-4 bg-gray-50">
          <div class="flex items-center justify-between">
  
            <div class="text-sm text-gray-500">
              Page ${this.page} of ${totalPages}
              <span class="ml-2">• ${this.pagination.total} pages</span>
            </div>
  
            <div class="flex items-center gap-2">
  
              <button 
                data-prev
                ${this.page === 1 ? "disabled" : ""}
                class="px-3 py-1.5 text-sm rounded-md border transition
                  ${this.page === 1
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}">
                Prev
              </button>
  
              ${pages}
  
              <button 
                data-next
                ${!this.pagination.hasNext ? "disabled" : ""}
                class="px-3 py-1.5 text-sm rounded-md border transition
                  ${!this.pagination.hasNext
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}">
                Next
              </button>
  
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  async delete(id) {
    if (confirm("Are you sure?")) {
      await apiRequest({
        url: `${this.endpoint}/${id}`,
        method: "DELETE"
      });
      this.list();
    }
  }

  create() {
    document.getElementById(this.addBtn).addEventListener("click", async (e) => {
      e.preventDefault();

      await apiRequest({
        url: this.endpoint,
        method: "POST",
        data: this.formData(),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getCookie("token")}`
        }
      });

      this.page = 1;
      this.list();
    });
  }

  async update(saveBtn, options = {}) {
    apiRequest({
      url: `${this.endpoint}/${options.id}`,
      method: "GET",
      onSuccess: (data) => {
        Object.keys(data).forEach(key => {
          if (document.getElementById(key)) {
            document.getElementById(key).value = data[key];
          }
        });
      }
    });
    document.getElementById(saveBtn).addEventListener("click", async () => {
      await apiRequest({
        url: `${this.endpoint}/${options.id}`,
        method: "PUT",
        data: options.formData(),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getCookie("token")}`
        }
      });
    });
  }
}
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
class Form {
  constructor({ endpoint, formId, formData, validation = {}, onSuccess }) {
    this.endpoint = endpoint;
    this.form = document.getElementById(formId);
    this.formData = formData;
    this.rules = validation.rules || {};
    this.messages = validation.messages || {};
    this.onSuccess = onSuccess;

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = this.formData();

      const validator = new Validator(data, this.rules, this.messages);
      const errors = validator.validate();

      if (errors.length) {
        alert(errors.join("\n"));
        return;
      }

      apiRequest({
        url: this.endpoint,
        method: "POST",
        data,
        onSuccess: (res) => this.onSuccess?.(res)
      });
    });
  }

  static get(id) {
    const el = document.getElementById(id);
    if (!el) return null;

    if (el.type === 'checkbox') return el.checked;

    if (el.type === 'radio') {
      const checked = document.querySelector(`input[name="${el.name}"]:checked`);
      return checked ? checked.value : null;
    }

    return 'value' in el ? el.value : null;
  }
}
