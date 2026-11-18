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

class Tracker{static get _TEMPLATES(){return{wrapperId:e=>`tracker-wrapper-${e}`,mainCardId:e=>`main-card-${e}`,backdropClass:"fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 hidden opacity-0 transition-opacity duration-300",panelClass:"fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl z-50 flex flex-col transform translate-x-full transition-transform duration-300 ease-out border-l border-slate-200",headerClass:"w-full bg-slate-900 text-white px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 shadow-sm sticky top-0 z-10",mainClass:"w-full flex-grow overflow-y-auto px-3 py-4",mainCardClass:"w-full bg-white rounded-lg border border-slate-200 shadow-sm p-3.5 space-y-4",sectionHeaderClass:"flex items-center justify-between pb-1.5 mb-2",sectionTitleClass:"text-[10px] font-bold uppercase tracking-wider text-slate-400",sectionCountClass:"text-[10px] font-medium text-slate-400",listClass:"space-y-1.5",listItemClass:e=>"flex items-start justify-between p-2 rounded-md border transition "+(e?"opacity-50 bg-slate-50 border-slate-100 cursor-not-allowed":"bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"),badgeClass:e=>`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors duration-300 ${e}`,sortOption:(e,t)=>`<option value="${e.value}" ${t?"selected":""}>Sort: ${e.label}</option>`,header:(e,t,s,a)=>`\n        <div class="flex items-center gap-2">\n          <div class="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">\n            <i class="fa-solid fa-list-check text-xs"></i>\n          </div>\n          <div>\n            <h1 class="text-xs font-bold tracking-tight">${escapeHtml(e)}</h1>\n            <p class="text-[10px] text-slate-400">${t}</p>\n          </div>\n        </div>\n        <div class="flex items-center gap-2">\n          <select id="sort-select-${a}" class="text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-slate-700 transition">\n            ${s}\n          </select>\n          <div id="progress-badge-${a}" class="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">\n            0 / 0 Completed\n          </div>\n          <button id="close-panel-${a}" type="button" class="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer" title="Close">\n            <i class="fa-solid fa-xmark text-xs"></i>\n          </button>\n        </div>`,taskItem:(e,t,s,a,r,i,l,n)=>`\n        <div class="flex items-start gap-2.5 w-full">\n          <label for="${e}" class="relative flex items-start gap-2.5 w-full ${r?"cursor-not-allowed":"cursor-pointer"}">\n            <input type="checkbox" id="${e}" data-task="${escapeHtml(t)}" data-type="${s}" ${r?"disabled":""} ${n?'checked data-always-checked="true"':""} class="sr-only peer">\n\n            <div class="mt-0.5 w-3.5 h-3.5 rounded border ${i.border} bg-white ${i.bg} peer-checked:border-transparent flex items-center justify-center transition flex-shrink-0 ${r?"opacity-50":""}">\n              <svg class="w-2.5 h-2.5 text-white ${n?"opacity-100":"opacity-0"} transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"></path>\n              </svg>\n            </div>\n\n            <div class="flex flex-col flex-grow min-w-0">\n              <span class="text-xs font-medium select-none flex items-center flex-wrap gap-1 ${r?"text-slate-400 line-through":"text-slate-800"}">\n                <span class="break-words">${escapeHtml(t)}</span>\n                <span class="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">${escapeHtml(l)}</span>\n                ${"weekly"===s?`<span class="text-[9px] px-1 py-0.2 rounded no-underline font-semibold ${i.badge}">Weekly</span>`:""}\n                ${r?'<span class="text-[9px] text-slate-500 bg-slate-200 px-1 py-0.2 rounded no-underline font-normal">Disabled</span>':""}\n              </span>\n              ${a?`<span class="text-[10px] text-slate-400 mt-0.5 break-words leading-tight">${escapeHtml(a)}</span>`:""}\n            </div>\n          </label>\n        </div>`}}constructor(e,t=null,s="Tasks Tracker",a={}){this.btnId=e,this.id=a.id||Math.random().toString(36).substring(2,9),this.title=s,this.storageKey=a.storageKey||"daily_tasks_status",this.tasks=t||[{name:"Learn songs",type:"daily",desc:"Learn as much as possible",priority:0,timeline:3,section:"Music",objective:"useful"},{name:"Practice singing",type:"daily",priority:1,timeline:1,section:"Music",objective:"useful"},{name:"Reading",type:"daily",desc:"Try to understand how girls, social, the world work",priority:2,timeline:2,section:"Foundation",objective:"useful"},{name:"Social",type:"daily",desc:"Be less annoying",priority:4,timeline:3,section:"Foundation",objective:"useful",alwaysChecked:!0},{name:"Exercise",type:"daily",priority:4,timeline:0,section:"Foundation",objective:"healthy",disable:!0}],this.options={defaultSort:a.defaultSort||"timeline",sortOptions:a.sortOptions||[{value:"timeline",label:"Timeline (Default)"},{value:"priority",label:"Priority"},{value:"section",label:"Section"},{value:"objective",label:"Objective"}],...a},this.currentSort=this.options.defaultSort,this.objectiveColors={healthy:{border:"border-emerald-500",bg:"peer-checked:bg-emerald-600",badge:"text-emerald-700 bg-emerald-50 border border-emerald-200"},useful:{border:"border-sky-500",bg:"peer-checked:bg-sky-600",badge:"text-sky-700 bg-sky-50 border border-sky-200"},default:{border:"border-slate-400",bg:"peer-checked:bg-slate-600",badge:"text-slate-700 bg-slate-100 border border-slate-200"}},this.init()}init(){"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>this.setup()):this.setup()}setup(){this.createPanel(),this.loadState(),this.attachEvents(),this.bindTrigger()}bindTrigger(){const e=document.getElementById(this.btnId);e&&e.addEventListener("click",()=>this.open())}open(){this.backdrop.classList.remove("hidden"),requestAnimationFrame(()=>{this.backdrop.classList.remove("opacity-0"),this.panel.classList.remove("translate-x-full")})}close(){this.backdrop.classList.add("opacity-0"),this.panel.classList.add("translate-x-full"),setTimeout(()=>this.backdrop.classList.add("hidden"),300)}createPanel(){this.wrapper&&this.wrapper.remove(),this.wrapper=document.createElement("div"),this.wrapper.id=Tracker._TEMPLATES.wrapperId(this.id),this.backdrop=document.createElement("div"),this.backdrop.className=Tracker._TEMPLATES.backdropClass,this.backdrop.addEventListener("click",()=>this.close()),this.panel=document.createElement("div"),this.panel.className=Tracker._TEMPLATES.panelClass;const e=document.createElement("header");e.className=Tracker._TEMPLATES.headerClass;const t=(new Date).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"}),s=this.options.sortOptions.map(e=>Tracker._TEMPLATES.sortOption(e,this.currentSort===e.value)).join("");e.innerHTML=Tracker._TEMPLATES.header(this.title,t,s,this.id);const a=document.createElement("main");a.className=Tracker._TEMPLATES.mainClass;const r=document.createElement("section");r.className=Tracker._TEMPLATES.mainCardClass,r.id=Tracker._TEMPLATES.mainCardId(this.id),this.renderTaskListContainer(r),a.appendChild(r),this.panel.appendChild(e),this.panel.appendChild(a),this.wrapper.appendChild(this.backdrop),this.wrapper.appendChild(this.panel),document.body.appendChild(this.wrapper),e.querySelector(`#close-panel-${this.id}`).addEventListener("click",()=>this.close()),e.querySelector(`#sort-select-${this.id}`).addEventListener("change",e=>{this.currentSort=e.target.value;const t=this.captureCurrentCheckStates();r.innerHTML="",this.renderTaskListContainer(r),this.restoreCheckStates(t),this.attachEvents()}),document.addEventListener("keydown",e=>{"Escape"!==e.key||this.backdrop.classList.contains("hidden")||this.close()})}renderTaskListContainer(e){let t=[...this.tasks];if("timeline"===this.currentSort)t.sort((e,t)=>(e.timeline??99)-(t.timeline??99));else if("priority"===this.currentSort)t.sort((e,t)=>(e.priority??99)-(t.priority??99));else if("section"===this.currentSort)t.sort((e,t)=>(e.section||"").localeCompare(t.section||""));else if("objective"===this.currentSort){const e={useful:1,healthy:2,fun:3};t.sort((t,s)=>(e[t.objective]||99)-(e[s.objective]||99))}const s=document.createElement("div"),a=document.createElement("div");a.className=Tracker._TEMPLATES.sectionHeaderClass;const r=document.createElement("h2");r.className=Tracker._TEMPLATES.sectionTitleClass,r.textContent=`Sorted by ${this.currentSort}`;const i=document.createElement("span");i.className=Tracker._TEMPLATES.sectionCountClass,i.textContent=`${t.length} ${1===t.length?"task":"tasks"}`,a.appendChild(r),a.appendChild(i),s.appendChild(a);const l=document.createElement("ul");l.className=Tracker._TEMPLATES.listClass,t.forEach((e,t)=>{l.appendChild(this.createTaskListItem(e.name,e.type||"daily",e.desc||"",!!e.disabled,e.objective||"default",e.section||"General",t,!!e.alwaysChecked))}),s.appendChild(l),e.appendChild(s)}createTaskListItem(e,t,s,a,r,i,l,n=!1){const o=this.objectiveColors[r]||this.objectiveColors.default,d=`task-${this.id}-${l}`,c=document.createElement("li");c.className=Tracker._TEMPLATES.listItemClass(a),c.innerHTML=Tracker._TEMPLATES.taskItem(d,e,t,s,a,o,i,n);const p=c.querySelector('input[type="checkbox"]'),h=c.querySelector("svg");return p.addEventListener("change",()=>{n&&(p.checked=!0),h.classList.toggle("opacity-0",!p.checked),h.classList.toggle("opacity-100",p.checked)}),c}captureCurrentCheckStates(){const e={};return this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(t=>{e[t.dataset.task]=t.checked||"true"===t.dataset.alwaysChecked}),e}restoreCheckStates(e){this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(t=>{if(e[t.dataset.task]||"true"===t.dataset.alwaysChecked){t.checked=!0;const e=t.parentElement.querySelector("svg");e&&(e.classList.remove("opacity-0"),e.classList.add("opacity-100"))}})}updateProgress(){const e=Array.from(this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])')),t=e.length,s=e.filter(e=>e.checked).length,a=document.getElementById(`progress-badge-${this.id}`);if(a){a.textContent=`${s} / ${t} Completed`;const e=t>0?s/t:0;let r="bg-slate-800 text-slate-300 border-slate-700";1===e&&t>0?r="bg-emerald-500/20 text-emerald-300 border-emerald-500/40":e>=.75?r="bg-sky-500/20 text-sky-300 border-sky-500/40":e>=.4?r="bg-amber-500/20 text-amber-300 border-amber-500/40":s>0&&(r="bg-rose-500/20 text-rose-300 border-rose-500/40"),a.className=Tracker._TEMPLATES.badgeClass(r)}}attachEvents(){this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(e=>{e.addEventListener("change",()=>{this.saveState(),this.updateProgress()})}),this.updateProgress()}getTodayDateString(){const e=new Date;return`${e.getFullYear()}-${e.getMonth()+1}-${e.getDate()}`}getWeekKey(){const e=new Date;e.setHours(0,0,0,0),e.setDate(e.getDate()+4-(e.getDay()||7));const t=new Date(e.getFullYear(),0,1),s=Math.ceil(((e-t)/864e5+1)/7);return`${e.getFullYear()}-W${s}`}saveState(){const e=this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])');let t={};const s=localStorage.getItem(this.storageKey);if(s)try{t=JSON.parse(s)}catch(e){}const a=this.getTodayDateString(),r=this.getWeekKey(),i=t.dailyDate===a&&t.dailyTasks||{},l=t.weekKey===r&&t.weeklyTasks||{};e.forEach(e=>{"weekly"===e.dataset.type?l[e.dataset.task]=e.checked:i[e.dataset.task]=e.checked}),localStorage.setItem(this.storageKey,JSON.stringify({dailyDate:a,weekKey:r,dailyTasks:i,weeklyTasks:l}))}loadState(){const e=localStorage.getItem(this.storageKey),t=this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])');if(e)try{const s=JSON.parse(e),a=this.getTodayDateString(),r=this.getWeekKey();t.forEach(e=>{const t=e.dataset.task,i=e.parentElement.querySelector("svg");"true"===e.dataset.alwaysChecked?e.checked=!0:"weekly"===e.dataset.type?s.weekKey===r&&s.weeklyTasks?.[t]&&(e.checked=!0):s.dailyDate===a&&s.dailyTasks?.[t]&&(e.checked=!0),e.checked&&i&&(i.classList.remove("opacity-0"),i.classList.add("opacity-100"))})}catch(e){console.error("Failed to parse task localStorage state:",e)}else t.forEach(e=>{if("true"===e.dataset.alwaysChecked){e.checked=!0;const t=e.parentElement.querySelector("svg");t&&(t.classList.remove("opacity-0"),t.classList.add("opacity-100"))}})}}

(function () {
  "use strict";
  const scriptTag = document.currentScript;
  if (scriptTag) {
    const src = scriptTag.getAttribute("src");
    try {
      const url = new URL(src, window.location.origin);
      const btnId = url.searchParams.get("id");
      if (btnId) window.currentTrackerInstance = new Tracker(btnId, [
          { name: "Learn songs", type: "daily", desc: "Learn as much as possible", priority: 0, timeline: 3, section: "Music", objective: "useful" },
          { name: "Practice singing", type: "daily", priority: 1, timeline: 1, section: "Music", objective: "useful" },
          { name: "Reading", type: "daily", desc: "Try to understand how girls, social, the world work", priority: 2, timeline: 2, section: "Foundation", objective: "useful" },
          { name: "Social", type: "daily", desc: "Be less annoying", priority: 4, timeline: 3, section: "Foundation", objective: "useful", alwaysChecked: true },
          { name: "Exercise", type: "daily", priority: 4, timeline: 0, section: "Foundation", objective: "healthy", disable: true }
      ]);
    } catch (e) {
      const match = src && src.match(/[?&]id=([^&]+)/);
      if (match) window.currentTrackerInstance = new Tracker(match[1]);
    }
  }
})();
