// Escape HTML entities to prevent XSS attacks
const escapeHtml = str => String(str || "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
}[char] || char));
// Show toast notification banner with inline direct HTML/classes (no Theme dependency)
function showToast(message, type = "info", duration = 4000) {
    let container = document.getElementById("toastContainer");
    
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const themes = {
        success: { border: "border-emerald-800", text: "text-emerald-100", icon: "fa-circle-check text-emerald-400", bar: "border-l-emerald-500" },
        error:   { border: "border-rose-800", text: "text-rose-100", icon: "fa-circle-exclamation text-rose-400", bar: "border-l-rose-500" },
        warning: { border: "border-amber-800", text: "text-amber-100", icon: "fa-triangle-exclamation text-amber-400", bar: "border-l-amber-500" },
        info:    { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" }
    }[type] || { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" };

    toast.className = `pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${themes.border} ${themes.text} ${themes.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`;
    toast.innerHTML = `
        <div class="flex items-center"><i class="fa-solid ${themes.icon} text-base mr-3"></i><span>${escapeHtml(message)}</span></div>
        <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("translate-x-12", "opacity-0"));

    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add("translate-x-12", "opacity-0");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Update connection indicator dot and text status directly via inline HTML/classes
function updateConnectionStatus(isConnected, statusText) {
    const statusDot = document.getElementById("statusDot");
    const statusLabel = document.getElementById("statusText");

    if (statusLabel && statusDot) {
        statusLabel.textContent = statusText;
        statusDot.className = isConnected === true 
            ? "w-2 h-2 rounded-full bg-emerald-500" 
            : isConnected === false 
            ? "w-2 h-2 rounded-full bg-rose-500" 
            : "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
    }
}

function set_bg() {
    if (window.self === window.top) {
      document.body.style.backgroundImage = "linear-gradient(rgba(5, 8, 17, 0.45), rgba(5, 8, 17, 0.7)), url('https://images.unsplash.com/photo-1772511988871-a010197b94ae?auto=format&fit=crop&w=1920&q=80')";
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "#050811";
    }
}

// Close all open modal windows and reset text editors if active
function closeModals() {
    document.querySelectorAll(".fixed").forEach(modal => {
        if (modal.id !== "toastContainer") {
            modal.classList.add("hidden");
        }
    });

    if (typeof filePreviewManager !== "undefined" && filePreviewManager) {
        filePreviewManager.isTextEditor = false;
    }

    document.getElementById("previewSaveBtn")?.classList.add("hidden");
    document.getElementById("previewCancelEditBtn")?.classList.add("hidden");
}

class Config {
  // --- UI & HTML Templates ---
  static get _TEMPLATES() {
    return {
      overlayClass: "hidden fixed inset-0 z-[60] bg-black/40",
      panelClass: "hidden fixed inset-0 z-[70] flex items-center justify-center p-6 overflow-y-auto",
      modalBox: (origin) => `
        <div class="max-w-3xl w-full bg-zinc-900/0 border border-white/15 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-2xl relative">
          <button id="configCloseBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>

          <div class="border-b border-white/10 pb-4">
            <h2 class="text-lg font-bold text-white mb-1">Configuration</h2>
            <p class="text-xs text-slate-400">Enter your Google Drive and Supabase credentials.</p>
          </div>

          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">
            <h3 class="font-semibold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-indigo-400"></i> Google Drive & Encryption
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Google Client ID</label>
                <input id="clientIdInput" name="gdrive_oauth_client_id" type="text" placeholder="123456789-abc.apps.googleusercontent.com"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
                <p class="text-[10px] text-slate-400 mt-1">
                  Current origin: <code id="originLabel" class="text-indigo-300">${origin}</code>
                </p>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Private Encryption Key / Password</label>
                <input id="secretKeyInput" name="gdrive_encryption_password" type="password" placeholder="Enter a secure encryption passphrase"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
                <p class="text-[10px] text-slate-400 mt-1">Required to encrypt/decrypt secure uploads.</p>
              </div>
            </div>
          </div>
      
          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">
            <h3 class="font-semibold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-bolt text-emerald-400"></i> Supabase Credentials
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Project URL</label>
                <input type="text" name="sb_url" placeholder="https://xxxxx.supabase.co" 
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Anon Public Key</label>
                <input type="text" name="sb_key" placeholder="eyJhbGciOiJIUzI1NiIsIn..." 
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>
              <div class="lg:col-span-2">
                <label class="block text-xs font-medium text-slate-300 mb-1">Storage Bucket Name</label>
                <input type="text" name="sb_bucket" placeholder="files" value="files" data-default="files"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>
            </div>
          </div>
      
          <div class="pt-2 flex justify-end gap-3">
            <button id="configCancelBtn" class="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button>
            <button id="configSaveBtn" class="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">Save & Connect</button>
          </div>
        </div>`
    };
  }

  constructor(btnId) {
    this.btnId = btnId;
    this.panelId = "configPanel";
    this.overlayId = "configOverlay";
    this.#createPanel();
    this.#bindButton();
    this.#load();
    if (!localStorage.getItem("sb_url") || !localStorage.getItem("sb_key")) this.open();
  }

  open() {
    document.getElementById(this.overlayId)?.classList.remove("hidden");
    document.getElementById(this.panelId)?.classList.remove("hidden");
  }

  close() {
    document.getElementById(this.overlayId)?.classList.add("hidden");
    document.getElementById(this.panelId)?.classList.add("hidden");
  }

  #createPanel() {
    document.getElementById(this.overlayId)?.remove();
    document.getElementById(this.panelId)?.remove();

    const overlay = document.createElement("div");
    overlay.id = this.overlayId;
    overlay.className = Config._TEMPLATES.overlayClass;

    const panel = document.createElement("div");
    panel.id = this.panelId;
    panel.className = Config._TEMPLATES.panelClass;
    panel.innerHTML = Config._TEMPLATES.modalBox(window.location.origin);

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    document.getElementById("configCloseBtn").onclick = () => this.close();
    document.getElementById("configCancelBtn").onclick = () => this.close();
    overlay.onclick = () => this.close();
    panel.querySelector("div").onclick = (e) => e.stopPropagation();
    document.getElementById("configSaveBtn").onclick = () => this.#save();
  }

  #bindButton() {
    const btn = document.getElementById(this.btnId);
    if (!btn) return;
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.open();
    };
  }

  #load() {
    const panel = document.getElementById(this.panelId);
    if (!panel) return;
    panel.querySelectorAll("input[name]").forEach(el => {
      const saved = localStorage.getItem(el.name);
      if (saved !== null && saved !== "") el.value = saved;
      else if (el.dataset.default) el.value = el.dataset.default;
    });
  }

  #save() {
    const panel = document.getElementById(this.panelId);
    const inputs = panel.querySelectorAll("input[name]");
    const cfg = Object.fromEntries([...inputs].map(el => [el.name, el.value.trim() || el.dataset.default || ""]));
    if (!cfg.sb_url || !cfg.sb_key) {
      showToast("URL and Anon Key are required", "warning");
      return;
    }
    Object.entries(cfg).forEach(([k, v]) => localStorage.setItem(k, v));
    this.close();
    location.reload();
  }
}
new Config("navSettingsTab");