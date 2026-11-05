class Cookie{static set(e,t,o=30){const n=new Date;n.setTime(n.getTime()+24*o*60*60*1e3),document.cookie=`${e}=${encodeURIComponent(t)};expires=${n.toUTCString()};path=/;SameSite=Strict`}static get(e){const t=e+"=",o=document.cookie.split(";");for(let e=0;e<o.length;e++){let n=o[e].trim();if(0===n.indexOf(t))return decodeURIComponent(n.substring(t.length))}return null}static erase(e){document.cookie=`${e}=; Max-Age=-99999999; path=/;`}}
class WidgetU {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this._createLayout();
    this._createFloatButton(options.floatBtn.icon, options.floatBtn.bg);
    this._bindToggle();
  }

  _createLayout() {
    let container = document.getElementById('floating-widgets-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'floating-widgets-container';
      container.className = 'fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 font-sans';
      document.body.appendChild(container);
    }
    this.widgetContainer = container;

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'relative flex flex-col items-end';
    this.widgetContainer.appendChild(this.wrapper);
  }

  // Parent handles creating the trigger button and shared toggle logic
  _createFloatButton(icon, bgClasses = 'bg-rose-600 hover:bg-rose-700') {
    this.floatBtn = document.createElement('button');
    this.floatBtn.type = 'button';
    this.floatBtn.className = `w-14 h-14 ${bgClasses} text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-all duration-200 hover:scale-105`;
    this.floatBtn.innerHTML = `<i class="${icon} text-2xl"></i>`;

    this.wrapper.appendChild(this.floatBtn);
  }

  _bindToggle() {
    // Toggle popup open/closed when clicking the floating button
    this.floatBtn.addEventListener('click', () => {
      //this.popup = this.widgetContainer.querySelector(`#${this.id}`);
      if (!this.popup) return;
  
      if (this.popup.classList.contains('hidden')) {
        this.popup.classList.remove('hidden');
        this.popup.classList.add('flex');
      } else {
        this.popup.classList.remove('flex');
        this.popup.classList.add('hidden');
      }
    });
  
    // Event delegation on the container for any close button
    this.widgetContainer.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.widget-close-btn');
      if (!closeBtn) return;
  
      this.popup = this.widgetContainer.querySelector(`#${this.id}`);
      if (!this.popup) return;
  
      this.popup.classList.remove('flex');
      this.popup.classList.add('hidden');
    });
  }
}

class Toast{static ensureDOM(){if(document.getElementById("toastContainer"))return;document.body.insertAdjacentHTML("beforeend",'<div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"></div>')}static show(e,t="info"){Toast.ensureDOM();let s=document.getElementById("toastContainer");if(!s)return;const a=document.createElement("div"),o={success:"bg-emerald-600",error:"bg-red-600",info:"bg-slate-900"};a.className=`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-medium text-white ${o[t]||o.info} transition-all transform translate-y-2 opacity-0 pointer-events-auto`,a.innerHTML=`<i class="fa-solid fa-circle-info text-base"></i> <span>${e}</span>`,s.appendChild(a),requestAnimationFrame(()=>a.classList.remove("translate-y-2","opacity-0")),setTimeout(()=>{a.classList.add("opacity-0","translate-y-2"),setTimeout(()=>a.remove(),300)},3e3)}static success(e){Toast.show(e,"success")}static error(e){Toast.show(e,"error")}static info(e){Toast.show(e,"info")}}
class Sidebar {
  /**
   * @param {Object} config
   * @param {string} config.containerId - ID của container bọc sidebar
   * @param {Array<{ id: string, label: string, icon: string, spaceKey: string }>} config.items - Danh sách nav item
   * @param {string} config.activeSpace - Space được chọn ban đầu
   * @param {Function} config.onSelect - Callback được gọi khi chuyển space
   */
  constructor({ containerId, items = [], activeSpace = 'home', onSelect }) {
    this.container = document.getElementById(containerId);
    this.items = items;
    this.activeSpace = activeSpace;
    this.onSelect = onSelect;

    this.render();
    this.bindEvents();
  }

  // Render HTML Sidebar
  render() {
    if (!this.container) return;

    const navItemsHTML = this.items.map(item => {
      const isActive = item.spaceKey === this.activeSpace;
      const activeClass = isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-slate-300 hover:bg-slate-700 hover:text-white';

      return `
        <button 
          data-space="${item.spaceKey}" 
          class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeClass}"
        >
          <i class="${item.icon} text-base"></i>
          <span>${item.label}</span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <aside class="w-64 bg-slate-800 text-slate-300 border-r border-slate-700 flex flex-col shrink-0 h-full">
        <div class="p-4 border-b border-slate-700 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Navigation
        </div>
        <nav class="p-3 space-y-1 flex-1">
          ${navItemsHTML}
        </nav>
      </aside>
    `;
  }

  // Đăng ký sự kiện click
  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('.sidebar-item');
      if (!btn) return;

      const spaceKey = btn.dataset.space;
      if (spaceKey && spaceKey !== this.activeSpace) {
        this.setActive(spaceKey);
        if (typeof this.onSelect === 'function') {
          this.onSelect(spaceKey);
        }
      }
    });
  }

  // Cập nhật giao diện khi đổi tab chủ động
  setActive(spaceKey) {
    this.activeSpace = spaceKey;
    const buttons = this.container.querySelectorAll('.sidebar-item');

    buttons.forEach(btn => {
      const isSelected = btn.dataset.space === spaceKey;
      btn.className = `sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
        isSelected ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`;
    });
  }
}
class ConfigManager {
  constructor(btnId) {
    this.cookieName = "app_config";
    this.globalKey = "APP_CONFIG";
    this.toggleBtn = document.getElementById(btnId);

    if (!this.toggleBtn) {
      console.warn(`ConfigManager: Button "${btnId}" not found.`);
      return;
    }

    this._injectStylesAndHTML();
    this._initElements();
    this._bindEvents();
    this._checkInitialCookie();
  }

  _injectStylesAndHTML() {
    if (document.getElementById("appConfigModalContainer")) return;

    const container = document.createElement("div");
    container.id = "appConfigModalContainer";
    container.innerHTML = `
      <!-- Config Panel / Modal Overlay -->
      <div id="appConfigModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
          <div class="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h2 class="font-semibold text-sm flex items-center gap-2">
              <i class="fa-solid fa-gear text-amber-400"></i> App Configuration
            </h2>
            <button id="appCloseConfigBtn" class="text-slate-400 hover:text-white text-sm">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <div class="p-5 space-y-4">
            <textarea id="appConfigTextarea" placeholder="Paste your JSON configuration here..." class="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 custom-scrollbar focus:outline-none focus:ring-2 focus:ring-blue-500" rows="8"></textarea>
            <button type="button" id="appSaveConfigBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition">
              <i class="fa-solid fa-floppy-disk"></i> Apply & Save Config
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  }

  _initElements() {
    this.modal = document.getElementById("appConfigModal");
    this.textarea = document.getElementById("appConfigTextarea");
    this.saveBtn = document.getElementById("appSaveConfigBtn");
    this.closeBtn = document.getElementById("appCloseConfigBtn");
  }

  _bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.open());
    this.closeBtn.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    this.saveBtn.addEventListener("click", () => this._handleSave());
  }

  open() {
    const saved = Cookie.get(this.cookieName);
    if (saved) {
      this.textarea.value = saved;
    }
    this.modal.classList.remove("hidden");
  }

  close() {
    this.modal.classList.add("hidden");
  }

  _applyConfig(rawText) {
    try {
      const parsed = JSON.parse(rawText);
      
      // Set global variable
      window[this.globalKey] = parsed;

      return true;
    } catch (error) {
      console.error("ConfigManager: Invalid JSON format.", error);
      alert("Invalid JSON format. Please check your syntax.");
      return false;
    }
  }

  _handleSave() {
    const rawText = this.textarea.value.trim();

    if (!rawText) {
      alert("Configuration cannot be empty.");
      return;
    }

    if (!this._applyConfig(rawText)) {
      return;
    }

    Cookie.set(this.cookieName, rawText, 365);

    this.close();
  }

  _checkInitialCookie() {
    const saved = Cookie.get(this.cookieName);
    if (saved) {
      this.textarea.value = saved;
      this._applyConfig(saved);
    }
  }
}
