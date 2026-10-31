export class ConfigManager {
  constructor(btnId, { fbService }) {
    this.fbService = fbService;
    this.toggleBtn = document.getElementById(btnId);

    if (!this.toggleBtn) {
      console.warn(`ConfigManager: Button "${buttonSelector}" not found.`);
      return;
    }

    this._injectStylesAndHTML();
    this._initElements();
    this._bindEvents();
    this._checkInitialCookie();
  }

  _injectStylesAndHTML() {
    // Prevent duplicate injection if multiple instances or re-inits occur
    if (document.getElementById("fbConfigModalContainer")) return;

    const container = document.createElement("div");
    container.id = "fbConfigModalContainer";
    container.innerHTML = `
      <!-- Config Panel / Modal Overlay -->
      <div id="fbConfigModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
          <div class="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h2 class="font-semibold text-sm flex items-center gap-2">
              <i class="fa-solid fa-key text-amber-400"></i> Firebase Config
            </h2>
            <button id="fbCloseConfigBtn" class="text-slate-400 hover:text-white text-sm">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <div class="p-5 space-y-4">
            <input id="fbConfigTextarea" placeholder="Paste your Firebase config object here..." class="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 custom-scrollbar focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
            <div class="flex items-center justify-between text-xs text-slate-500">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="fbRememberCookie" checked class="rounded text-amber-500">
                <span>Save in cookie (30 days)</span>
              </label>
              <button type="button" id="fbClearCookieBtn" class="text-red-500 underline font-medium hover:text-red-600">Clear Cookie</button>
            </div>
            <button type="button" id="fbSaveConfigBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition">
              <i class="fa-solid fa-floppy-disk"></i> Apply & Save Config
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  }

  _initElements() {
    this.modal = document.getElementById("fbConfigModal");
    this.textarea = document.getElementById("fbConfigTextarea");
    this.rememberCheckbox = document.getElementById("fbRememberCookie");
    this.saveBtn = document.getElementById("fbSaveConfigBtn");
    this.clearBtn = document.getElementById("fbClearCookieBtn");
    this.closeBtn = document.getElementById("fbCloseConfigBtn");
  }

  _bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.open());
    this.closeBtn.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    this.saveBtn.addEventListener("click", () => this._handleSave());
    this.clearBtn.addEventListener("click", () => this._handleClear());
  }

  open() {
    const saved = this.fbService.getCookie(this.fbService.cookieName);
    if (saved) {
      this.textarea.value = saved;
    }
    this.modal.classList.remove("hidden");
  }

  close() {
    this.modal.classList.add("hidden");
  }

  _handleSave() {
    const rawText = this.textarea.value.trim();
    const parsed = this.fbService.parseConfig(rawText);
    
    if (!parsed) {
      alert("Invalid configuration syntax. Please provide a valid Firebase config object or string.");
      return;
    }

    if (this.rememberCheckbox.checked) {
      this.fbService.setCookie(this.fbService.cookieName, rawText, 30);
    } else {
      this.fbService.eraseCookie(this.fbService.cookieName);
    }

    if (this.fbService.connect(parsed)) {
      this.close();
    }
  }

  _handleClear() {
    this.fbService.eraseCookie(this.fbService.cookieName);
    this.textarea.value = "";
    this.close();
  }

  _checkInitialCookie() {
    const saved = this.fbService.getCookie(this.fbService.cookieName);
    if (saved) {
      this.textarea.value = saved;
      const parsed = this.fbService.parseConfig(saved);
      if (parsed && this.fbService.connect(parsed)) {
        return;
      }
    }
  }
}
