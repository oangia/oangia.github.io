class Cookie{static set(e,t,o=30){const n=new Date;n.setTime(n.getTime()+24*o*60*60*1e3),document.cookie=`${e}=${encodeURIComponent(t)};expires=${n.toUTCString()};path=/;SameSite=Strict`}static get(e){const t=e+"=",o=document.cookie.split(";");for(let e=0;e<o.length;e++){let n=o[e].trim();if(0===n.indexOf(t))return decodeURIComponent(n.substring(t.length))}return null}static erase(e){document.cookie=`${e}=; Max-Age=-99999999; path=/;`}}
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
            <div class="flex items-center justify-between text-xs text-slate-500">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="appRememberCookie" checked class="rounded text-amber-500">
                <span>Save in cookie (30 days)</span>
              </label>
            </div>
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
    this.rememberCheckbox = document.getElementById("appRememberCookie");
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
    this.clearBtn.addEventListener("click", () => this._handleClear());
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

    if (this.rememberCheckbox.checked) {
      Cookie.set(this.cookieName, rawText, 30);
    } else {
      Cookie.erase(this.cookieName);
    }

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
class AppHeader{constructor(e){this.config={icon:"fa-solid fa-database",iconBg:"bg-amber-500 text-slate-900",statusColor:"amber",...e}}renderHTML(){const{title:e,subtitle:t,icon:n,iconBg:s,status:a,actionButton:r}=this.config,l={amber:"bg-amber-500/20 text-amber-300 border-amber-500/30 bg-amber-400",emerald:"bg-emerald-500/20 text-emerald-300 border-emerald-500/30 bg-emerald-400",blue:"bg-blue-500/20 text-blue-300 border-blue-500/30 bg-blue-400",purple:"bg-purple-500/20 text-purple-300 border-purple-300/30 bg-purple-400"},[i,o,d,c]=(l[a?.color]||l.amber).split(" ");return`\n      <header class="bg-slate-900 text-white shadow-lg sticky top-0 z-30 w-full">\n        <div class="max-w-8xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4 w-full">\n          \x3c!-- Logo & Titles --\x3e\n          <div class="flex items-center space-x-3">\n            <div class="${s} p-2 rounded-xl shadow-md">\n              <i class="${n} text-lg"></i>\n            </div>\n            <div>\n              <h1 id="appTitle" class="text-lg font-bold tracking-tight">${e}</h1>\n              <p class="text-[11px] text-slate-400">${t}</p>\n            </div>\n          </div>\n\n          \x3c!-- Status & Action Button --\x3e\n          <div class="flex items-center space-x-3">\n            ${a?`\n              <span id="statusBadge" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${i} ${o} border ${d}">\n                <span id="statusDot" class="w-2 h-2 rounded-full ${c}"></span>\n                <span id="statusText">${a.text}</span>\n              </span>\n            `:""}\n\n            ${r?`\n              ${r.href?`\n                <a href="${r.href}" target="_blank" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-2 border border-slate-700">\n                  <i class="${r.icon}"></i>\n                  <span>${r.text}</span>\n                </a>\n              `:`\n                <button id="${r.id}" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-2 border border-slate-700">\n                  <i class="${r.icon}"></i>\n                  <span>${r.text}</span>\n                </button>\n              `}\n            `:""}\n          </div>\n        </div>\n      </header>\n    `}mount(e="body"){const t=document.querySelector(e);if(!t)return;const n=document.createElement("template");n.innerHTML=this.renderHTML().trim();const s=n.content.firstChild;"HEADER"===t.tagName?t.replaceWith(s):t.insertBefore(s,t.firstChild)}}
class Toast{static ensureDOM(){if(document.getElementById("toastContainer"))return;document.body.insertAdjacentHTML("beforeend",'<div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"></div>')}static show(e,t="info"){Toast.ensureDOM();let s=document.getElementById("toastContainer");if(!s)return;const a=document.createElement("div"),o={success:"bg-emerald-600",error:"bg-red-600",info:"bg-slate-900"};a.className=`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-medium text-white ${o[t]||o.info} transition-all transform translate-y-2 opacity-0 pointer-events-auto`,a.innerHTML=`<i class="fa-solid fa-circle-info text-base"></i> <span>${e}</span>`,s.appendChild(a),requestAnimationFrame(()=>a.classList.remove("translate-y-2","opacity-0")),setTimeout(()=>{a.classList.add("opacity-0","translate-y-2"),setTimeout(()=>a.remove(),300)},3e3)}static success(e){Toast.show(e,"success")}static error(e){Toast.show(e,"error")}static info(e){Toast.show(e,"info")}}
!function(){if(document.getElementById("fontAwesomeCDN"))return;const e=document.createElement("script");e.src="https://cdn.tailwindcss.com",document.head.appendChild(e)}();
!function(){if(document.getElementById("customScrollbarStyle"))return;const r=document.createElement("style");r.id="customScrollbarStyle",r.innerHTML="\n    .custom-scrollbar::-webkit-scrollbar { width: 6px; }\n    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }\n    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }\n  ",document.head.appendChild(r)}();
!function(){if(document.getElementById("fontAwesomeCDN"))return;const e=document.createElement("link");e.rel="stylesheet",e.href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",document.head.appendChild(e)}();
