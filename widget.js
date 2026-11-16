/* ============================================================
   Classes – now consume Theme instead of hard-coded HTML
   ============================================================ */

class FirebaseUploaderWidget {
  constructor(fbService, collectionName = "uploaded_files") {
    this.collectionName = collectionName;
    this.fbService = fbService;
    this.isRendered = false;
  }

  init(triggerBtnId) {
    const triggerBtn = document.getElementById(triggerBtnId);
    if (!triggerBtn) {
      console.error(`Trigger button with ID "${triggerBtnId}" not found.`);
      return;
    }
    triggerBtn.addEventListener("click", () => {
      if (this.isRendered) {
        const overlay = document.getElementById("fb-modal-overlay");
        if (overlay) {
          overlay.classList.remove("hidden");
          this._checkAndConnect();
        }
        return;
      }
      this._renderPanel();
      this._bindEvents();
      this._checkAndConnect();
      this.isRendered = true;
    });
  }

  _renderPanel() {
    const style = document.createElement("style");
    style.innerHTML = Theme.getFirebaseWidgetStyles();
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "fb-modal-overlay";
    overlay.innerHTML = Theme.getFirebaseWidgetHTML();
    document.body.appendChild(overlay);
  }

  _checkAndConnect() {
    const fileList = document.getElementById("fb-fileList");
    const statusDiv = document.getElementById("fb-status");
    const apiKey = localStorage.getItem("fb_apikey") || localStorage.getItem("firebase_api_key");
    const projectId = localStorage.getItem("fb_projectid") || "freedata-4c235";
    const appId = localStorage.getItem("fb_appid") || "1:906764667278:web:aa229456f8de0740923cdf";

    if (!apiKey) {
      fileList.innerHTML = "<li style='justify-content:center; color:#f87171;'>Firebase API Key missing! Please configure it in Settings.</li>";
      return;
    }
    try {
      this.fbService.init({ apiKey, projectId, appId });
      this._loadFiles(fileList, statusDiv);
    } catch (err) {
      console.error(err);
      fileList.innerHTML = `<li style='justify-content:center; color:#f87171;'>Connection error: ${err.message}</li>`;
    }
  }

  _bindEvents() {
    const overlay = document.getElementById("fb-modal-overlay");
    const closeBtn = document.getElementById("fb-closeModalBtn");
    const fileInput = document.getElementById("fb-fileInput");
    const uploadBtnText = document.getElementById("fb-uploadBtnText");
    const statusDiv = document.getElementById("fb-status");
    const refreshBtn = document.getElementById("fb-refreshBtn");
    const fileList = document.getElementById("fb-fileList");

    closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      uploadBtnText.textContent = "Uploading...";
      try {
        await this.fbService.uploadFile(this.collectionName, file, (msg) => {
          statusDiv.textContent = msg;
        });
        fileInput.value = "";
        statusDiv.textContent = "";
        this._loadFiles(fileList, statusDiv);
      } catch (err) {
        console.error(err);
        statusDiv.textContent = "Error: " + err.message;
      } finally {
        uploadBtnText.textContent = "Upload File";
      }
    });

    refreshBtn.addEventListener("click", () => this._loadFiles(fileList, statusDiv));
  }

  async _loadFiles(fileListEl, statusDiv) {
    fileListEl.innerHTML = "<li style='justify-content:center; color:#a1a1aa;'>Loading files...</li>";
    try {
      const files = await this.fbService.getAllFilenames(this.collectionName);
      fileListEl.innerHTML = "";
      if (files.length === 0) {
        fileListEl.innerHTML = "<li style='justify-content:center; color:#a1a1aa;'>No files found in collection.</li>";
        return;
      }
      files.forEach(f => {
        const li = document.createElement("li");
        const infoDiv = document.createElement("div");
        infoDiv.className = "file-info";
        infoDiv.innerHTML = `<span><strong>${escapeHtml(f.filename)}</strong></span><small>${escapeHtml(f.type)} (${f.totalParts} chunks)</small>`;

        const btnGroup = document.createElement("div");
        btnGroup.className = "btn-group";

        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "Download";
        downloadBtn.className = "btn-download";
        downloadBtn.onclick = async () => {
          downloadBtn.disabled = true;
          downloadBtn.textContent = "Downloading...";
          try {
            const fileRecord = await this.fbService.getFileByFilename(this.collectionName, f.filename, (msg) => {
              statusDiv.textContent = msg;
            });
            if (fileRecord) {
              const a = document.createElement("a");
              a.href = fileRecord.dataUrl;
              a.download = fileRecord.filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              statusDiv.textContent = `Successfully downloaded ${f.filename}!`;
            }
          } catch (err) {
            console.error(err);
            statusDiv.textContent = "Download failed: " + err.message;
          } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = "Download";
          }
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "btn-delete";
        deleteBtn.onclick = async () => {
          if (!confirm(`Are you sure you want to delete ${f.filename}?`)) return;
          deleteBtn.disabled = true;
          deleteBtn.textContent = "Deleting...";
          try {
            await this.fbService.deleteFileByFilename(this.collectionName, f.filename, (msg) => {
              statusDiv.textContent = msg;
            });
            this._loadFiles(fileListEl, statusDiv);
          } catch (err) {
            console.error(err);
            statusDiv.textContent = "Deletion failed: " + err.message;
            deleteBtn.disabled = false;
            deleteBtn.textContent = "Delete";
          }
        };

        btnGroup.appendChild(downloadBtn);
        btnGroup.appendChild(deleteBtn);
        li.appendChild(infoDiv);
        li.appendChild(btnGroup);
        fileListEl.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      fileListEl.innerHTML = "<li style='justify-content:center; color:#f87171;'>Failed to load files.</li>";
    }
  }
}

class Tracker {
  constructor(btnId, tasks = null, title = "Tasks Tracker", options = {}) {
    this.btnId = btnId;
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.title = title;
    this.storageKey = options.storageKey || "daily_tasks_status";
    this.tasks = tasks || [
      { name: "Learn songs", type: "daily", desc: "Learn as much as possible", priority: 0, timeline: 2, section: "Music", objective: "useful" },
      { name: "Exercise", type: "daily", priority: 1, timeline: 0, section: "Foundation", objective: "healthy" },
      { name: "Reading", type: "daily", desc: "Try to understand how girls, social, the world work", priority: 2, timeline: 1, section: "Foundation", objective: "useful" },
      { name: "Fun", type: "daily", desc: "Having fun is the extension, practice singing, social/girls", priority: 3, timeline: 3, section: "Fun", objective: "fun", alwaysChecked: true }
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
      fun: { border: "border-amber-400", bg: "peer-checked:bg-amber-500", badge: "text-amber-700 bg-amber-50 border border-amber-200" },
      default: { border: "border-slate-300", bg: "peer-checked:bg-slate-600", badge: "text-slate-700 bg-slate-50 border border-slate-200" }
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
    this.wrapper.id = `tracker-wrapper-${this.id}`;

    this.backdrop = document.createElement("div");
    this.backdrop.className = "fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 hidden opacity-0 transition-opacity duration-300";
    this.backdrop.addEventListener("click", () => this.close());

    this.panel = document.createElement("div");
    this.panel.className = "fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl z-50 flex flex-col transform translate-x-full transition-transform duration-300 ease-out border-l border-slate-200";

    const header = document.createElement("header");
    header.className = "w-full bg-slate-900 text-white px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 shadow-sm sticky top-0 z-10";

    const todayFormatted = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const sortOptionsHTML = this.options.sortOptions
      .map(opt => `<option value="${opt.value}" ${this.currentSort === opt.value ? "selected" : ""}>Sort: ${opt.label}</option>`)
      .join("");

    header.innerHTML = Theme.getTrackerHeaderHTML(this.title, todayFormatted, sortOptionsHTML, this.id);

    const main = document.createElement("main");
    main.className = "w-full flex-grow overflow-y-auto px-3 py-4";

    const mainCard = document.createElement("section");
    mainCard.className = "w-full bg-white rounded-lg border border-slate-200 shadow-sm p-3.5 space-y-4";
    mainCard.id = `main-card-${this.id}`;

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
    sectionHeader.className = "flex items-center justify-between pb-1.5 mb-2";

    const sectionTitle = document.createElement("h2");
    sectionTitle.className = "text-[10px] font-bold uppercase tracking-wider text-slate-400";
    sectionTitle.textContent = `Sorted by ${this.currentSort}`;

    const sectionCount = document.createElement("span");
    sectionCount.className = "text-[10px] font-medium text-slate-400";
    sectionCount.textContent = `${tasksCopy.length} ${tasksCopy.length === 1 ? "task" : "tasks"}`;

    sectionHeader.appendChild(sectionTitle);
    sectionHeader.appendChild(sectionCount);
    sectionWrapper.appendChild(sectionHeader);

    const ul = document.createElement("ul");
    ul.className = "space-y-1.5";

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
    li.className = `flex items-start justify-between p-2 rounded-md border transition ${
      isDisabled ? "opacity-50 bg-slate-50 border-slate-100 cursor-not-allowed" : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
    }`;
    li.innerHTML = Theme.getTrackerTaskItemHTML(id, taskName, taskType, taskDesc, isDisabled, colors, sectionName, isAlwaysChecked);

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
      badge.className = `text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors duration-300 ${colorClasses}`;
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
    overlay.className = "hidden fixed inset-0 z-[60] bg-black/40";

    const panel = document.createElement("div");
    panel.id = this.panelId;
    panel.className = "hidden fixed inset-0 z-[70] flex items-center justify-center p-6 overflow-y-auto";
    panel.innerHTML = Theme.getConfigPanelHTML();

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
