import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  getDoc,
  getDocs,
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  where,
  orderBy 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

export class FirebaseService {
  constructor(cookieName = "firebase_config_cookie") {
    this.cookieName = cookieName;
    this.app = null;
    this.db = null;
    this.unsubscribeMap = {};
    this.isLiveMode = false;

    // Hardcoded project identifiers
    this.defaultConfig = {
      projectId: "freedata-4c235",
      appId: "1:906764667278:web:aa229456f8de0740923cdf"
    };
  }

  setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Strict`;
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }

  eraseCookie(name) {
    document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  }

  parseConfig(rawText) {
    if (!rawText || !rawText.trim()) return null;

    const trimmed = rawText.trim();

    // If it's passed as a plain API key string (doesn't start with '{' and has no object declarations)
    if (!trimmed.startsWith('{') && !trimmed.includes('firebaseConfig')) {
      return {
        ...this.defaultConfig,
        apiKey: trimmed
      };
    }

    try {
      const evalFn = new Function(`
        let firebaseConfig;
        ${trimmed};
        if (typeof firebaseConfig !== 'undefined') return firebaseConfig;
      `);
      const res = evalFn();
      if (res) return { ...this.defaultConfig, ...res };
    } catch (e) {}

    try {
      const evalFn2 = new Function(`return (${trimmed});`);
      const res = evalFn2();
      if (res) return { ...this.defaultConfig, ...res };
    } catch (e2) {
      try { 
        const parsed = JSON.parse(trimmed);
        return { ...this.defaultConfig, ...parsed };
      } catch (e3) { 
        // Fallback to treating input purely as the apiKey string
        return {
          ...this.defaultConfig,
          apiKey: trimmed
        };
      }
    }
  }

  connect(configInput) {
    try {
      if (this.app) deleteApp(this.app);
      
      // Resolve configuration whether input is a raw API key string, a snippet, or an object
      const resolvedConfig = typeof configInput === 'string' 
        ? this.parseConfig(configInput) 
        : { ...this.defaultConfig, ...configInput };

      if (!resolvedConfig || !resolvedConfig.apiKey) {
        throw new Error("Valid API key is required to connect to Firebase.");
      }

      this.app = initializeApp(resolvedConfig);
      this.db = getFirestore(this.app);
      this.isLiveMode = true;
      return true;
    } catch (err) {
      console.error("Firebase connect failed:", err);
      this.isLiveMode = false;
      return false;
    }
  }

  // Generic Realtime Listener for any collection
  subscribe(collectionName, callback) {
    if (!this.db || !this.isLiveMode) return;
    
    if (this.unsubscribeMap[collectionName]) {
      this.unsubscribeMap[collectionName]();
    }

    const q = query(collection(this.db, collectionName), orderBy("createdAt", "desc"));
    this.unsubscribeMap[collectionName] = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let formattedDate = "Just now";
        if (data && data.createdAt && typeof data.createdAt.toDate === "function") {
          formattedDate = data.createdAt.toDate().toLocaleString();
        }
        return { id: docSnap.id, ...data, formattedDate };
      });
      callback(items);
    });
  }

  // On-Demand Fetch Methods
  async getAll(collectionName) {
    if (this.isLiveMode && this.db) {
      const q = query(collection(this.db, collectionName), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } else {
      return this.getLocal(collectionName);
    }
  }

  async getById(collectionName, id) {
    if (this.isLiveMode && this.db) {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } else {
      const items = this.getLocal(collectionName);
      return items.find(i => i.id === id) || null;
    }
  }

  async getByField(collectionName, fieldName, value) {
    if (this.isLiveMode && this.db) {
      const q = query(collection(this.db, collectionName), where(fieldName, "==", value));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } else {
      const items = this.getLocal(collectionName);
      return items.filter(i => i[fieldName] === value);
    }
  }

  // Generic CRUD
  async create(collectionName, data) {
    if (this.isLiveMode && this.db) {
      return await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
    } else {
      const key = `demo_${collectionName}`;
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      const newItem = { 
        id: "local-" + Date.now(), 
        ...data, 
        createdAt: new Date().toISOString(),
        formattedDate: new Date().toLocaleString()
      };
      items.unshift(newItem);
      localStorage.setItem(key, JSON.stringify(items));
      return newItem;
    }
  }

  async update(collectionName, id, updatedFields) {
    if (this.isLiveMode && this.db) {
      return await updateDoc(doc(this.db, collectionName, id), updatedFields);
    } else {
      const key = `demo_${collectionName}`;
      let items = JSON.parse(localStorage.getItem(key) || "[]");
      items = items.map(i => i.id === id ? { ...i, ...updatedFields } : i);
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  async delete(collectionName, id) {
    if (this.isLiveMode && this.db) {
      return await deleteDoc(doc(this.db, collectionName, id));
    } else {
      const key = `demo_${collectionName}`;
      let items = JSON.parse(localStorage.getItem(key) || "[]");
      items = items.filter(i => i.id !== id);
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  getLocal(collectionName) {
    const key = `demo_${collectionName}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }
}

export class CrudManager {
  /**
   * @param {Object} config
   * @param {string} config.containerSelector - CSS selector for the root container element.
   * @param {Object} config.fbService - Instance of FirebaseService.
   * @param {string} config.collectionName - Name of the collection / table.
   * @param {string} [config.entityTitle="Record"] - Singular title (e.g. "Note", "Product").
   * @param {Array}  [config.fields=[]] - Field definitions [{name, label, type, options}].
   * @param {Function} [config.onToast] - Callback for toast notifications.
   */
  constructor(config) {
    this.container = document.querySelector(config.containerSelector);
    if (!this.container) {
      throw new Error(`CrudManager: Container element '${config.containerSelector}' not found.`);
    }

    this.fbService = config.fbService;
    this.collectionName = config.collectionName;
    this.entityTitle = config.entityTitle || "Record";
    this.fields = config.fields || [];
    this.onToast = config.onToast || ((msg) => console.log(msg));

    this.items = [];
    this.unsubscribe = null;

    this.init();
  }

  init() {
    this._renderLayout();
    this._bindEvents();
    this.refresh();
  }

  refresh() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.fbService && this.fbService.isLiveMode) {
      this.unsubscribe = this.fbService.subscribe(this.collectionName, (data) => {
        this.renderTable(data);
      });
    } else {
      this.startLocalDemo();
    }
  }

  startLocalDemo() {
    const storageKey = `demo_${this.collectionName}`;
    if (!localStorage.getItem(storageKey)) {
      const sampleItem = { id: "demo-1", createdAt: new Date().toISOString() };
      this.fields.forEach(f => {
        sampleItem[f.name] = `Sample ${f.label}`;
      });
      localStorage.setItem(storageKey, JSON.stringify([sampleItem]));
    }
    const localData = this.fbService ? this.fbService.getLocal(this.collectionName) : [];
    this.renderTable(localData);
  }

  renderTable(items = []) {
    this.items = items;
    const tbody = this.container.querySelector("#crudTableBody");
    const countBadge = this.container.querySelector("#crudCount");

    if (countBadge) countBadge.textContent = `${items.length} ${this.entityTitle.toLowerCase()}s`;
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="100" class="py-10 text-center text-slate-400">No ${this.entityTitle.toLowerCase()}s found</td></tr>`;
      return;
    }

    const displayFields = this.fields.slice(0, 3);

    tbody.innerHTML = items.map(item => `
      <tr class="hover:bg-slate-50 transition">
        ${displayFields.map((f, idx) => `
          <td class="py-3 px-4 ${idx === 0 ? 'font-semibold text-slate-800' : 'text-slate-500 truncate max-w-xs'}">
            ${this._escapeHtml(String(item[f.name] !== undefined ? item[f.name] : ''))}
          </td>
        `).join("")}
        <td class="py-3 px-4 text-xs text-slate-400">${item.formattedDate || 'Recent'}</td>
        <td class="py-3 px-4 text-center">
          <button data-action="edit" data-id="${item.id}" class="p-1.5 text-slate-400 hover:text-amber-600 transition" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button data-action="delete" data-id="${item.id}" class="p-1.5 text-slate-400 hover:text-red-600 transition" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join("");
  }

  _renderLayout() {
    const formFieldsHtml = this.fields.map(f => {
      if (f.type === "textarea") {
        return `
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">${f.label} ${f.required ? '*' : ''}</label>
            <textarea id="field_${f.name}" rows="5" placeholder="${f.label}..." ${f.required ? 'required' : ''} class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm custom-scrollbar"></textarea>
          </div>
        `;
      } else if (f.type === "select") {
        const optionsHtml = (f.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join("");
        return `
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">${f.label}</label>
            <select id="field_${f.name}" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
              ${optionsHtml}
            </select>
          </div>
        `;
      } else {
        return `
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">${f.label} ${f.required ? '*' : ''}</label>
            <input type="${f.type || 'text'}" id="field_${f.name}" placeholder="${f.label}..." ${f.required ? 'required' : ''} class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
          </div>
        `;
      }
    }).join("");

    const tableHeadersHtml = this.fields.slice(0, 3).map(f => `<th class="py-3 px-4">${f.label}</th>`).join("");

    this.container.innerHTML = `
      <!-- Toolbar -->
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500 px-2 py-1 bg-slate-100 rounded-lg">
            Collection: <span class="text-amber-600">${this.collectionName}</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button id="openCreateModalBtn" class="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm">
            <i class="fa-solid fa-plus text-amber-400"></i> New ${this.entityTitle}
          </button>
          <button id="backupDataBtn" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold px-3 py-2 rounded-xl text-xs transition flex items-center gap-2">
            <i class="fa-solid fa-file-arrow-down"></i> Backup Data
          </button>
        </div>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="font-bold text-sm text-slate-700">${this.entityTitle} Table</h3>
          <span id="crudCount" class="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-xl">0 records</span>
        </div>
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                ${tableHeadersHtml}
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="crudTableBody" class="divide-y divide-slate-100 text-sm">
              <tr><td colspan="100" class="py-10 text-center text-slate-400">Loading ${this.entityTitle.toLowerCase()}s...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: CREATE / EDIT -->
      <div id="crudModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 id="modalTitleText" class="font-bold text-base text-slate-800 flex items-center gap-2"><i class="fa-solid fa-plus text-amber-500"></i> New ${this.entityTitle}</h3>
            <button id="closeCrudModalBtn" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>
          <form id="crudForm" class="space-y-4">
            <input type="hidden" id="editItemId">
            ${formFieldsHtml}
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" id="cancelCrudBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" id="submitCrudBtn" class="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold">Save ${this.entityTitle}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const modal = this.container.querySelector("#crudModal");
    const form = this.container.querySelector("#crudForm");

    this.container.querySelector("#openCreateModalBtn").addEventListener("click", () => {
      form.reset();
      this.container.querySelector("#editItemId").value = "";
      this.container.querySelector("#modalTitleText").innerHTML = `<i class="fa-solid fa-plus text-amber-500"></i> New ${this.entityTitle}`;
      this.container.querySelector("#submitCrudBtn").textContent = `Save ${this.entityTitle}`;
      modal.classList.remove("hidden");
    });

    const closeModal = () => modal.classList.add("hidden");
    this.container.querySelector("#closeCrudModalBtn").addEventListener("click", closeModal);
    this.container.querySelector("#cancelCrudBtn").addEventListener("click", closeModal);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = this.container.querySelector("#editItemId").value;
      const payload = {};

      this.fields.forEach(f => {
        const input = this.container.querySelector(`#field_${f.name}`);
        if (input) payload[f.name] = input.value.trim();
      });

      if (id) {
        await this.fbService.update(this.collectionName, id, payload);
        this.onToast(`${this.entityTitle} updated successfully!`, "success");
      } else {
        await this.fbService.create(this.collectionName, payload);
        this.onToast(`${this.entityTitle} created successfully!`, "success");
      }

      if (!this.fbService.isLiveMode) {
        this.startLocalDemo();
      }

      modal.classList.add("hidden");
    });

    const tbody = this.container.querySelector("#crudTableBody");
    tbody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "edit") {
        const item = this.items.find(i => i.id === id);
        if (!item) return;

        this.container.querySelector("#editItemId").value = item.id;
        this.fields.forEach(f => {
          const input = this.container.querySelector(`#field_${f.name}`);
          if (input) input.value = item[f.name] || "";
        });

        this.container.querySelector("#modalTitleText").innerHTML = `<i class="fa-solid fa-pen text-amber-500"></i> Edit ${this.entityTitle}`;
        this.container.querySelector("#submitCrudBtn").textContent = `Update ${this.entityTitle}`;
        modal.classList.remove("hidden");
      } else if (action === "delete") {
        if (!confirm(`Are you sure you want to delete this ${this.entityTitle.toLowerCase()}?`)) return;
        await this.fbService.delete(this.collectionName, id);
        this.onToast(`${this.entityTitle} deleted!`, "success");
        if (!this.fbService.isLiveMode) {
          this.startLocalDemo();
        }
      }
    });

    this.container.querySelector("#backupDataBtn").addEventListener("click", () => {
      const backupPayload = {
        [this.collectionName]: this.items,
        exportedAt: new Date().toISOString()
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${this.collectionName}_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.onToast(`${this.entityTitle}s backup downloaded!`, "success");
    });
  }

  _escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    this.container.innerHTML = "";
  }
}
