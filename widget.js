class Tracker {
  // --- UI & HTML Templates ---
  static get _TEMPLATES() {
    return {
      wrapperId: (id) => `tracker-wrapper-${id}`,
      mainCardId: (id) => `main-card-${id}`,
      backdropClass: "fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 hidden opacity-0 transition-opacity duration-300",
      panelClass: "fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl z-50 flex flex-col transform translate-x-full transition-transform duration-300 ease-out border-l border-slate-200",
      headerClass: "w-full bg-slate-900 text-white px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 shadow-sm sticky top-0 z-10",
      mainClass: "w-full flex-grow overflow-y-auto px-3 py-4",
      mainCardClass: "w-full bg-white rounded-lg border border-slate-200 shadow-sm p-3.5 space-y-4",
      sectionHeaderClass: "flex items-center justify-between pb-1.5 mb-2",
      sectionTitleClass: "text-[10px] font-bold uppercase tracking-wider text-slate-400",
      sectionCountClass: "text-[10px] font-medium text-slate-400",
      listClass: "space-y-1.5",
      listItemClass: (isDisabled) => `flex items-start justify-between p-2 rounded-md border transition ${
        isDisabled ? "opacity-50 bg-slate-50 border-slate-100 cursor-not-allowed" : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
      }`,
      badgeClass: (colorClasses) => `text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors duration-300 ${colorClasses}`,
      sortOption: (opt, isSelected) => `<option value="${opt.value}" ${isSelected ? "selected" : ""}>Sort: ${opt.label}</option>`,
      header: (title, todayFormatted, sortOptionsHTML, id) => `
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <i class="fa-solid fa-list-check text-xs"></i>
          </div>
          <div>
            <h1 class="text-xs font-bold tracking-tight">${escapeHtml(title)}</h1>
            <p class="text-[10px] text-slate-400">${todayFormatted}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select id="sort-select-${id}" class="text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-slate-700 transition">
            ${sortOptionsHTML}
          </select>
          <div id="progress-badge-${id}" class="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            0 / 0 Completed
          </div>
          <button id="close-panel-${id}" type="button" class="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer" title="Close">
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>`,
      taskItem: (id, taskName, taskType, taskDesc, isDisabled, colors, sectionName, isAlwaysChecked) => `
        <div class="flex items-start gap-2.5 w-full">
          <label for="${id}" class="relative flex items-start gap-2.5 w-full ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
            <input type="checkbox" id="${id}" data-task="${escapeHtml(taskName)}" data-type="${taskType}" ${
              isDisabled ? 'disabled' : ''
            } ${isAlwaysChecked ? 'checked data-always-checked="true"' : ''} class="sr-only peer">

            <div class="mt-0.5 w-3.5 h-3.5 rounded border ${colors.border} bg-white ${colors.bg} peer-checked:border-transparent flex items-center justify-center transition flex-shrink-0 ${isDisabled ? 'opacity-50' : ''}">
              <svg class="w-2.5 h-2.5 text-white ${isAlwaysChecked ? 'opacity-100' : 'opacity-0'} transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <div class="flex flex-col flex-grow min-w-0">
              <span class="text-xs font-medium select-none flex items-center flex-wrap gap-1 ${
                isDisabled ? 'text-slate-400 line-through' : 'text-slate-800'
              }">
                <span class="break-words">${escapeHtml(taskName)}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">${escapeHtml(sectionName)}</span>
                ${taskType === 'weekly' ? `<span class="text-[9px] px-1 py-0.2 rounded no-underline font-semibold ${colors.badge}">Weekly</span>` : ''}
                ${isDisabled ? '<span class="text-[9px] text-slate-500 bg-slate-200 px-1 py-0.2 rounded no-underline font-normal">Disabled</span>' : ''}
              </span>
              ${taskDesc ? `<span class="text-[10px] text-slate-400 mt-0.5 break-words leading-tight">${escapeHtml(taskDesc)}</span>` : ''}
            </div>
          </label>
        </div>`
    };
  }

  constructor(btnId, tasks = null, title = "Tasks Tracker", options = {}) {
    this.btnId = btnId;
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.title = title;
    this.storageKey = options.storageKey || "daily_tasks_status";
    this.tasks = tasks || [
      { name: "Learn songs", type: "daily", desc: "Learn as much as possible", priority: 0, timeline: 3, section: "Music", objective: "useful" },
      { name: "Practice singing", type: "daily", priority: 1, timeline: 1, section: "Music", objective: "useful" },
      { name: "Reading", type: "daily", desc: "Try to understand how girls, social, the world work", priority: 2, timeline: 2, section: "Foundation", objective: "useful" },
      { name: "Social", type: "daily", desc: "Be less annoying", priority: 4, timeline: 3, section: "Foundation", objective: "useful", alwaysChecked: true },
      { name: "Exercise", type: "daily", priority: 4, timeline: 0, section: "Foundation", objective: "healthy" }
    ];
    this.options = {
      defaultSort: options.defaultSort || "timeline",
      sortOptions: options.sortOptions || [
        { value: "timeline", label: "Timeline (Default)" },
        { value: "priority", label: "Priority" },
        { value: "section", label: "Section" },
        { value: "objective", label: "Objective" }
      ],
      ...options
    };
    this.currentSort = this.options.defaultSort;
    this.objectiveColors = {
      healthy: { border: "border-emerald-500", bg: "peer-checked:bg-emerald-600", badge: "text-emerald-700 bg-emerald-50 border border-emerald-200" },
      useful: { border: "border-sky-500", bg: "peer-checked:bg-sky-600", badge: "text-sky-700 bg-sky-50 border border-sky-200" },
      default: { border: "border-slate-400", bg: "peer-checked:bg-slate-600", badge: "text-slate-700 bg-slate-100 border border-slate-200" }
    };
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.createPanel();
    this.loadState();
    this.attachEvents();
    this.bindTrigger();
  }

  bindTrigger() {
    const btn = document.getElementById(this.btnId);
    if (btn) btn.addEventListener("click", () => this.open());
  }

  open() {
    this.backdrop.classList.remove("hidden");
    requestAnimationFrame(() => {
      this.backdrop.classList.remove("opacity-0");
      this.panel.classList.remove("translate-x-full");
    });
  }

  close() {
    this.backdrop.classList.add("opacity-0");
    this.panel.classList.add("translate-x-full");
    setTimeout(() => this.backdrop.classList.add("hidden"), 300);
  }

  createPanel() {
    if (this.wrapper) this.wrapper.remove();
    this.wrapper = document.createElement("div");
    this.wrapper.id = Tracker._TEMPLATES.wrapperId(this.id);

    this.backdrop = document.createElement("div");
    this.backdrop.className = Tracker._TEMPLATES.backdropClass;
    this.backdrop.addEventListener("click", () => this.close());

    this.panel = document.createElement("div");
    this.panel.className = Tracker._TEMPLATES.panelClass;

    const header = document.createElement("header");
    header.className = Tracker._TEMPLATES.headerClass;

    const todayFormatted = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const sortOptionsHTML = this.options.sortOptions
      .map(opt => Tracker._TEMPLATES.sortOption(opt, this.currentSort === opt.value))
      .join("");

    header.innerHTML = Tracker._TEMPLATES.header(this.title, todayFormatted, sortOptionsHTML, this.id);

    const main = document.createElement("main");
    main.className = Tracker._TEMPLATES.mainClass;

    const mainCard = document.createElement("section");
    mainCard.className = Tracker._TEMPLATES.mainCardClass;
    mainCard.id = Tracker._TEMPLATES.mainCardId(this.id);

    this.renderTaskListContainer(mainCard);
    main.appendChild(mainCard);
    this.panel.appendChild(header);
    this.panel.appendChild(main);
    this.wrapper.appendChild(this.backdrop);
    this.wrapper.appendChild(this.panel);
    document.body.appendChild(this.wrapper);

    header.querySelector(`#close-panel-${this.id}`).addEventListener("click", () => this.close());
    header.querySelector(`#sort-select-${this.id}`).addEventListener("change", (e) => {
      this.currentSort = e.target.value;
      const currentState = this.captureCurrentCheckStates();
      mainCard.innerHTML = "";
      this.renderTaskListContainer(mainCard);
      this.restoreCheckStates(currentState);
      this.attachEvents();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.backdrop.classList.contains("hidden")) this.close();
    });
  }

  renderTaskListContainer(mainCard) {
    let tasksCopy = [...this.tasks];
    if (this.currentSort === "timeline") tasksCopy.sort((a, b) => (a.timeline ?? 99) - (b.timeline ?? 99));
    else if (this.currentSort === "priority") tasksCopy.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    else if (this.currentSort === "section") tasksCopy.sort((a, b) => (a.section || "").localeCompare(b.section || ""));
    else if (this.currentSort === "objective") {
      const objectiveRank = { useful: 1, healthy: 2, fun: 3 };
      tasksCopy.sort((a, b) => (objectiveRank[a.objective] || 99) - (objectiveRank[b.objective] || 99));
    }

    const sectionWrapper = document.createElement("div");
    const sectionHeader = document.createElement("div");
    sectionHeader.className = Tracker._TEMPLATES.sectionHeaderClass;

    const sectionTitle = document.createElement("h2");
    sectionTitle.className = Tracker._TEMPLATES.sectionTitleClass;
    sectionTitle.textContent = `Sorted by ${this.currentSort}`;

    const sectionCount = document.createElement("span");
    sectionCount.className = Tracker._TEMPLATES.sectionCountClass;
    sectionCount.textContent = `${tasksCopy.length} ${tasksCopy.length === 1 ? "task" : "tasks"}`;

    sectionHeader.appendChild(sectionTitle);
    sectionHeader.appendChild(sectionCount);
    sectionWrapper.appendChild(sectionHeader);

    const ul = document.createElement("ul");
    ul.className = Tracker._TEMPLATES.listClass;

    tasksCopy.forEach((taskItem, index) => {
      ul.appendChild(this.createTaskListItem(
        taskItem.name, taskItem.type || "daily", taskItem.desc || "",
        !!taskItem.disabled, taskItem.objective || "default",
        taskItem.section || "General", index, !!taskItem.alwaysChecked
      ));
    });

    sectionWrapper.appendChild(ul);
    mainCard.appendChild(sectionWrapper);
  }

  createTaskListItem(taskName, taskType, taskDesc, isDisabled, objectiveKey, sectionName, index, isAlwaysChecked = false) {
    const colors = this.objectiveColors[objectiveKey] || this.objectiveColors.default;
    const id = `task-${this.id}-${index}`;
    const li = document.createElement("li");
    li.className = Tracker._TEMPLATES.listItemClass(isDisabled);
    li.innerHTML = Tracker._TEMPLATES.taskItem(id, taskName, taskType, taskDesc, isDisabled, colors, sectionName, isAlwaysChecked);

    const checkbox = li.querySelector('input[type="checkbox"]');
    const checkIcon = li.querySelector("svg");
    checkbox.addEventListener("change", () => {
      if (isAlwaysChecked) checkbox.checked = true;
      checkIcon.classList.toggle("opacity-0", !checkbox.checked);
      checkIcon.classList.toggle("opacity-100", checkbox.checked);
    });
    return li;
  }

  captureCurrentCheckStates() {
    const states = {};
    this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(chk => {
      states[chk.dataset.task] = chk.checked || chk.dataset.alwaysChecked === "true";
    });
    return states;
  }

  restoreCheckStates(states) {
    this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(chk => {
      if (states[chk.dataset.task] || chk.dataset.alwaysChecked === "true") {
        chk.checked = true;
        const checkIcon = chk.parentElement.querySelector("svg");
        if (checkIcon) {
          checkIcon.classList.remove("opacity-0");
          checkIcon.classList.add("opacity-100");
        }
      }
    });
  }

  updateProgress() {
    const checkboxes = Array.from(this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])'));
    const total = checkboxes.length;
    const completed = checkboxes.filter(chk => chk.checked).length;
    const badge = document.getElementById(`progress-badge-${this.id}`);
    if (badge) {
      badge.textContent = `${completed} / ${total} Completed`;
      const ratio = total > 0 ? completed / total : 0;
      let colorClasses = "bg-slate-800 text-slate-300 border-slate-700";
      if (ratio === 1 && total > 0) colorClasses = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      else if (ratio >= 0.75) colorClasses = "bg-sky-500/20 text-sky-300 border-sky-500/40";
      else if (ratio >= 0.4) colorClasses = "bg-amber-500/20 text-amber-300 border-amber-500/40";
      else if (completed > 0) colorClasses = "bg-rose-500/20 text-rose-300 border-rose-500/40";
      badge.className = Tracker._TEMPLATES.badgeClass(colorClasses);
    }
  }

  attachEvents() {
    this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(chk => {
      chk.addEventListener("change", () => {
        this.saveState();
        this.updateProgress();
      });
    });
    this.updateProgress();
  }

  getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  getWeekKey() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
  }

  saveState() {
    const checkboxes = this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])');
    let existingData = {};
    const storedValue = localStorage.getItem(this.storageKey);
    if (storedValue) {
      try { existingData = JSON.parse(storedValue); } catch (e) {}
    }
    const currentDailyDate = this.getTodayDateString();
    const currentWeekKey = this.getWeekKey();
    const activeDaily = existingData.dailyDate === currentDailyDate ? existingData.dailyTasks || {} : {};
    const activeWeekly = existingData.weekKey === currentWeekKey ? existingData.weeklyTasks || {} : {};
    checkboxes.forEach(chk => {
      if (chk.dataset.type === "weekly") activeWeekly[chk.dataset.task] = chk.checked;
      else activeDaily[chk.dataset.task] = chk.checked;
    });
    localStorage.setItem(this.storageKey, JSON.stringify({
      dailyDate: currentDailyDate,
      weekKey: currentWeekKey,
      dailyTasks: activeDaily,
      weeklyTasks: activeWeekly
    }));
  }

  loadState() {
    const storedValue = localStorage.getItem(this.storageKey);
    const checkboxes = this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])');
    if (!storedValue) {
      checkboxes.forEach(chk => {
        if (chk.dataset.alwaysChecked === "true") {
          chk.checked = true;
          const checkIcon = chk.parentElement.querySelector("svg");
          if (checkIcon) {
            checkIcon.classList.remove("opacity-0");
            checkIcon.classList.add("opacity-100");
          }
        }
      });
      return;
    }
    try {
      const data = JSON.parse(storedValue);
      const today = this.getTodayDateString();
      const currentWeek = this.getWeekKey();
      checkboxes.forEach(chk => {
        const taskName = chk.dataset.task;
        const checkIcon = chk.parentElement.querySelector("svg");
        if (chk.dataset.alwaysChecked === "true") chk.checked = true;
        else if (chk.dataset.type === "weekly") {
          if (data.weekKey === currentWeek && data.weeklyTasks?.[taskName]) chk.checked = true;
        } else {
          if (data.dailyDate === today && data.dailyTasks?.[taskName]) chk.checked = true;
        }
        if (chk.checked && checkIcon) {
          checkIcon.classList.remove("opacity-0");
          checkIcon.classList.add("opacity-100");
        }
      });
    } catch (e) {
      console.error("Failed to parse task localStorage state:", e);
    }
  }
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

(function () {
  "use strict";
  const scriptTag = document.currentScript;
  if (scriptTag) {
    const src = scriptTag.getAttribute("src");
    try {
      const url = new URL(src, window.location.origin);
      const btnId = url.searchParams.get("id");
      if (btnId) window.currentTrackerInstance = new Tracker(btnId);
    } catch (e) {
      const match = src && src.match(/[?&]id=([^&]+)/);
      if (match) window.currentTrackerInstance = new Tracker(match[1]);
    }
  }
})();
new Config("navSettingsTab");
