
class Crud {
  constructor({ endpoint, table, renderItem, formData, addBtn, limit = 10 }) {
    this.endpoint = endpoint;
    this.formData = formData;
    this.addBtn = addBtn;

    this.init();
  }

  init() {
    if (this.addBtn) {
      this.create();
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

class Form {
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
