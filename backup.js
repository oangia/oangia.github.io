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

class FolderManagerPanel {
  constructor(triggerSelector) {
    this.trigger = document.querySelector(triggerSelector);
    this.container = null;
    this.localService = null;
    this.isInitialized = false;
    if (this.trigger) {
      this.trigger.addEventListener("click", () => this.open());
    }
  }

  init() {
    if (this.isInitialized) return;
    this.container = document.createElement("div");
    this.container.className = Theme.getFolderManagerContainerClasses();
    this.container.innerHTML = Theme.getFolderManagerPanelHTML();
    document.body.appendChild(this.container);
    this.bindLogic();
    this.isInitialized = true;
  }

  bindLogic() {
    this.localService = new LocalFileAdapterService();

    const renderLocalFolder = () => {
      const currentPath = breadcrumbManager.path;
      const searchVal = document.getElementById("searchInput").value.toLowerCase();
      let items = this.localService.getItemsAtPath(currentPath);
      if (searchVal) items = items.filter(i => i.name.toLowerCase().includes(searchVal));
      document.getElementById("itemCountLabel").textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;
      gridRenderer.render(items, currentPath);
    };

    filePreviewManager = new FilePreviewManager({
      service: this.localService,
      onToast: (msg, type, duration) => showToast(msg, type, duration),
      onSaveSuccess: () => renderLocalFolder()
    });

    gridRenderer = new ItemsGridRenderer("itemsGrid", {
      onItemClick: (item, fullPath, isFolder) => {
        if (isFolder) {
          breadcrumbManager.navigateToFolder(fullPath, item.name);
        } else {
          const record = this.localService.pathToFile.get(fullPath);
          filePreviewManager.openPreview(fullPath, item.name, record?.size || 0);
        }
      },
      onDeleteClick: (fullPath, isFolder) => {
        this.localService.deleteLocalPath(fullPath, isFolder);
        showToast(`Removed "${fullPath}" from view`, "success", 2000);
        renderLocalFolder();
      }
    });

    breadcrumbManager = new BreadcrumbManager("breadcrumbNav", {
      onNavigate: () => renderLocalFolder()
    });

    document.getElementById("searchInput").addEventListener("input", renderLocalFolder);

    document.querySelectorAll(".widget-folder-input-main, .widget-folder-input-header").forEach(input => {
      input.addEventListener("change", async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        await this.localService.loadFiles(files);
        document.getElementById("selectScreen").classList.add("hidden");
        document.getElementById("breadcrumbBar").classList.remove("hidden");
        document.getElementById("gridScrollArea").classList.remove("hidden");
        breadcrumbManager.reset();
        breadcrumbManager.history[0].name = this.localService.rootNode.name || "root";
        breadcrumbManager.render();
        renderLocalFolder();
        showToast(`Loaded "${this.localService.rootNode.name}"`, "success", 2500);
        e.target.value = "";
      });
    });

    document.getElementById("closeFolderPanelBtn").addEventListener("click", () => this.close());
  }

  open() {
    this.init();
    this.container.classList.remove("hidden");
  }

  close() {
    if (this.container) this.container.classList.add("hidden");
  }
}

class LocalFileAdapterService {
  constructor() {
    this.rootNode = { name: "root", children: {}, files: [] };
    this.pathToFile = new Map();
    this.pathToNode = new Map();
  }

  async loadFiles(fileList) {
    for (const record of this.pathToFile.values()) {
      if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
    }
    const files = Array.from(fileList || []);
    this.rootNode = { name: "root", children: {}, files: [] };
    this.pathToFile.clear();
    this.pathToNode.clear();
    this.pathToNode.set("", this.rootNode);
    if (!files.length) return;

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const rootFolderName = firstPath.split("/")[0] || "root";
    this.rootNode.name = rootFolderName;

    for (const file of files) {
      const rawPath = file.webkitRelativePath || file.name;
      const parts = rawPath.split("/");
      if (parts.length > 1 && parts[0] === rootFolderName) parts.shift();
      const fileName = parts.pop();
      if (!fileName) continue;

      let currentNode = this.rootNode;
      let runningPath = "";
      for (const folderName of parts) {
        runningPath = runningPath ? `${runningPath}/${folderName}` : folderName;
        if (!currentNode.children[folderName]) {
          const newNode = { name: folderName, path: runningPath, children: {}, files: [] };
          currentNode.children[folderName] = newNode;
          this.pathToNode.set(runningPath, newNode);
        }
        currentNode = currentNode.children[folderName];
      }

      const fullPath = runningPath ? `${runningPath}/${fileName}` : fileName;
      const fileUrl = URL.createObjectURL(file);
      const record = {
        id: fullPath,
        name: fileName,
        fullPath,
        fileUrl,
        size: file.size,
        metadata: { size: file.size },
        thumbUrl: (isImage(fileName) || isVideo(fileName)) ? fileUrl : null
      };
      currentNode.files.push(record);
      this.pathToFile.set(fullPath, record);
    }
  }

  getItemsAtPath(folderPath = "") {
    const node = this.pathToNode.get(folderPath) || this.rootNode;
    const folderItems = Object.values(node.children).map(child => ({
      id: null,
      name: child.name,
      fullPath: child.path,
      metadata: { size: this._calculateFolderSize(child) }
    }));
    folderItems.sort((a, b) => a.name.localeCompare(b.name));
    const fileItems = [...node.files].sort((a, b) => a.name.localeCompare(b.name));
    return [...folderItems, ...fileItems];
  }

  _calculateFolderSize(node) {
    let total = node.files.reduce((sum, f) => sum + (f.size || 0), 0);
    for (const child of Object.values(node.children)) {
      total += this._calculateFolderSize(child);
    }
    return total;
  }

  async createSignedUrl(path) {
    const record = this.pathToFile.get(path);
    if (!record) return { data: null, error: new Error("File not found") };
    return { data: { signedUrl: record.fileUrl }, error: null };
  }

  async upload(path, blob) {
    const record = this.pathToFile.get(path);
    if (!record) return { error: new Error("File not found") };
    if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
    record.fileUrl = URL.createObjectURL(blob);
    record.size = blob.size;
    record.metadata.size = blob.size;
    return { error: null };
  }

  deleteLocalPath(path, isFolder) {
    if (isFolder) {
      for (const key of Array.from(this.pathToFile.keys())) {
        if (key === path || key.startsWith(`${path}/`)) {
          const rec = this.pathToFile.get(key);
          if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
          this.pathToFile.delete(key);
        }
      }
      for (const key of Array.from(this.pathToNode.keys())) {
        if (key === path || key.startsWith(`${path}/`)) this.pathToNode.delete(key);
      }
      const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      const folderName = path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) delete parentNode.children[folderName];
    } else {
      const rec = this.pathToFile.get(path);
      if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
      this.pathToFile.delete(path);
      const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) parentNode.files = parentNode.files.filter(f => f.fullPath !== path);
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

class SupabaseManager {
  constructor() {
    this.client = null;
    this.bucket = "files";
  }
  init(config) {
    this.client = window.supabase.createClient(config.url, config.key);
    if (config.bucket) this.bucket = config.bucket;
    this.backup = new SupabaseBackupManager(this.client, this.bucket, (message, type) => {
      showToast(message, type, type === "warning" ? 2500 : 3500);
    });
  }
  async list(path, options) {
    if (!this.client) throw new Error("Supabase client not initialized");
    return await this.client.storage.from(this.bucket).list(path, options);
  }
  async createSignedUrl(path, expiresIn) {
    if (!this.client) throw new Error("Supabase client not initialized");
    return await this.client.storage.from(this.bucket).createSignedUrl(path, expiresIn);
  }
  async upload(path, file, options) {
    if (!this.client) throw new Error("Supabase client not initialized");
    return await this.client.storage.from(this.bucket).upload(path, file, options);
  }
  async remove(paths) {
    if (!this.client) throw new Error("Supabase client not initialized");
    return await this.client.storage.from(this.bucket).remove(paths);
  }
  async runBackup() {
    await this.backup.runBackup();
  }
}

class SupabaseBackupManager {
  constructor(supabaseClient, bucketName, onProgress = null) {
    if (!supabaseClient) throw new Error("Supabase client is required for backup.");
    this.supabase = supabaseClient;
    this.bucket = bucketName;
    this.onProgress = onProgress || ((msg) => console.log(msg));
  }
  async runBackup() {
    try {
      this.onProgress("Collecting all files...", "info");
      const allFiles = await this._listAllFilesRecursive("");
      if (allFiles.length === 0) {
        this.onProgress("Bucket is empty – nothing to backup", "warning");
        return { success: false, error: "Bucket is empty" };
      }
      this.onProgress(`Found ${allFiles.length} file(s). Downloading fresh copies...`, "info");
      const zip = new JSZip();
      const hashParts = [];
      let processed = 0;
      for (const filePath of allFiles) {
        try {
          const { data: signed, error: signErr } = await this.supabase.storage.from(this.bucket).createSignedUrl(filePath, 60);
          if (signErr) throw signErr;
          const res = await fetch(signed.signedUrl, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          zip.file(filePath, arrayBuffer);
          hashParts.push({ path: filePath, buffer: arrayBuffer });
        } catch (err) {
          console.warn(`Failed to download ${filePath}:`, err);
          this.onProgress(`Skipped ${filePath}`, "warning");
        }
        processed++;
        if (processed % 5 === 0 || processed === allFiles.length) {
          this.onProgress(`Downloaded ${processed} / ${allFiles.length}`, "info");
        }
      }
      this.onProgress("Calculating archive hash...", "info");
      const shortHash = await this._computeHash(hashParts);
      const today = new Date().toISOString().slice(0, 10);
      const zipName = `${this.bucket}_${today}_${shortHash}.zip`;
      this.onProgress("Compressing into ZIP archive...", "info");
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      this._triggerDownload(blob, zipName);
      this.onProgress(`Backup ready: ${zipName}`, "success");
      return { success: true, filename: zipName };
    } catch (err) {
      console.error("Backup failed:", err);
      this.onProgress(err.message || "Backup failed", "error");
      return { success: false, error: err.message };
    }
  }
  async _listAllFilesRecursive(prefix = "") {
    const results = [];
    const { data, error } = await this.supabase.storage.from(this.bucket).list(prefix, { limit: 1000, offset: 0 });
    if (error) throw error;
    for (const item of (data || [])) {
      if (item.name === ".emptyFolderPlaceholder") continue;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id) {
        const subFiles = await this._listAllFilesRecursive(fullPath);
        results.push(...subFiles);
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }
  async _computeHash(hashParts) {
    hashParts.sort((a, b) => a.path.localeCompare(b.path));
    const encoder = new TextEncoder();
    const chunks = [];
    let totalLength = 0;
    for (const part of hashParts) {
      const pathBytes = encoder.encode(part.path);
      const contentBytes = new Uint8Array(part.buffer);
      chunks.push(pathBytes);
      chunks.push(new Uint8Array([0]));
      chunks.push(contentBytes);
      totalLength += pathBytes.length + 1 + contentBytes.length;
    }
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  }
  _triggerDownload(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

class FilePreviewManager {
  constructor(options = {}) {
    this.service = options.service;
    this.currentPreviewPath = null;
    this.currentPreviewName = null;
    this.currentPreviewText = null;
    this.isTextEditor = false;
    this.currentArrayBuffer = null;
    this.cachedContentHash = null;
    this.fileSize = 0;
    this.onToast = options.onToast || ((msg, type) => showToast(msg, type));
    this.onSaveSuccess = options.onSaveSuccess || (() => {});
  }

  setService(service) {
    this.service = service;
  }

  async openPreview(path, name, fileSize = 0) {
    const title = document.getElementById("previewTitle");
    const body = document.getElementById("previewBody");
    const sidebarDetails = document.getElementById("previewSidebarDetails");
    const downloadBtn = document.getElementById("previewDownloadBtn");
    const saveBtn = document.getElementById("previewSaveBtn");
    const cancelBtn = document.getElementById("previewCancelEditBtn");

    this.currentPreviewPath = path;
    this.currentPreviewName = name;
    this.currentPreviewText = null;
    this.currentArrayBuffer = null;
    this.cachedContentHash = null;
    this.fileSize = fileSize;
    this.isTextEditor = false;

    if (saveBtn) saveBtn.classList.add("hidden");
    if (cancelBtn) cancelBtn.classList.add("hidden");
    if (title) title.textContent = name;
    if (body) body.innerHTML = Theme.getPreviewLoadingHTML();
    if (sidebarDetails) sidebarDetails.innerHTML = Theme.getPreviewSidebarLoadingHTML();

    const modal = document.getElementById("modalPreview");
    if (modal) modal.classList.remove("hidden");

    try {
      const { data, error } = await this.service.createSignedUrl(path, 60);
      if (error) throw error;
      const url = data.signedUrl;
      if (downloadBtn) {
        downloadBtn.href = url;
        downloadBtn.download = name;
      }

      if (isImage(name)) {
        body.innerHTML = Theme.getPreviewImageHTML(url, name);
      } else if (isAudio(name)) {
        body.innerHTML = Theme.getPreviewAudioHTML(url, name);
      } else if (isVideo(name)) {
        body.innerHTML = Theme.getPreviewVideoHTML(url);
      } else if (isText(name) || isHtml(name)) {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch file content");
        this.currentArrayBuffer = await res.arrayBuffer();
        if (!this.fileSize) this.fileSize = this.currentArrayBuffer.byteLength;
        const text = new TextDecoder().decode(this.currentArrayBuffer);
        this.currentPreviewText = text;
        this.isTextEditor = true;

        if (isHtml(name)) {
          body.innerHTML = Theme.getPreviewHtmlEditorHTML(text);
          setTimeout(() => {
            const frame = document.getElementById("htmlPreviewFrame");
            if (frame) frame.srcdoc = text;
          }, 50);
        } else {
          body.innerHTML = Theme.getPreviewTextEditorHTML(text);
        }
        if (saveBtn) saveBtn.classList.remove("hidden");
        if (cancelBtn) cancelBtn.classList.remove("hidden");
      } else {
        body.innerHTML = Theme.getPreviewUnsupportedHTML();
      }

      await this.renderSidebarLazy(path, name, this.fileSize, url);
    } catch (err) {
      this.onToast(err.message || "Failed to load file", "error");
      if (sidebarDetails) {
        sidebarDetails.innerHTML = `<div class="p-3 bg-rose-950/60 border border-rose-500/50 text-rose-200 rounded text-xs">Failed to load details</div>`;
      }
    }
  }

  switchHtmlView(mode) {
    const previewTab = document.getElementById("htmlPreviewTab");
    const editorTab = document.getElementById("htmlEditorTab");
    const previewContainer = document.getElementById("htmlPreviewContainer");
    const editorContainer = document.getElementById("htmlEditorContainer");
    const textarea = document.getElementById("editTextarea");
    if (!previewTab || !editorTab || !previewContainer || !editorContainer) return;

    if (mode === "preview") {
      if (textarea && this.currentPreviewText !== textarea.value) {
        this.currentPreviewText = textarea.value;
        const frame = document.getElementById("htmlPreviewFrame");
        if (frame) frame.srcdoc = this.currentPreviewText;
      }
      previewTab.className = "px-3 py-1 rounded bg-indigo-600 text-white font-medium transition";
      editorTab.className = "px-3 py-1 rounded wire-subtext hover:text-white transition";
      previewContainer.classList.remove("hidden");
      editorContainer.classList.add("hidden");
    } else {
      previewTab.className = "px-3 py-1 rounded wire-subtext hover:text-white transition";
      editorTab.className = "px-3 py-1 rounded bg-indigo-600 text-white font-medium transition";
      previewContainer.classList.add("hidden");
      editorContainer.classList.remove("hidden");
      if (textarea) textarea.focus();
    }
  }

  async renderSidebarLazy(path, name, fileSize, url) {
    const sidebarDetails = document.getElementById("previewSidebarDetails");
    if (!sidebarDetails) return;
    const pathHash = await computeSha256(path);
    // Keep the detailed sidebar HTML here for now (very large). 
    // You can move pieces into Theme later if desired.
    sidebarDetails.innerHTML = `
      <div class="space-y-4 text-xs wire-subtext">
        <div>
          <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Name</span>
          <p class="wire-text font-medium break-all">${escapeHtml(name)}</p>
        </div>
        <div>
          <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Size</span>
          <p class="wire-text font-mono text-xs">${fileSize ? formatBytes(fileSize) + ` (${fileSize} bytes)` : "Unknown"}</p>
        </div>
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">Signed URL</span>
            <div class="space-x-2">
              <button onclick="navigator.clipboard.writeText('${escapeHtml(url)}'); showToast('URL copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy</button>
              <a href="${escapeHtml(url)}" download="${escapeHtml(name)}" class="text-[11px] text-indigo-300 hover:text-indigo-200"><i class="fa-solid fa-download"></i> Download</a>
            </div>
          </div>
          <div class="font-mono text-[9px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all max-h-16 overflow-y-auto">${escapeHtml(url)}</div>
        </div>
        <hr class="border-white/20">
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">1. Path Hash</span>
            <button onclick="navigator.clipboard.writeText('${pathHash}'); showToast('Path hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
          </div>
          <div>
            <span class="text-[10px] wire-subtext block mb-0.5">Exact string hashed: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">${escapeHtml(path)}</code></span>
            <div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${pathHash}</div>
          </div>
        </div>
        <div class="space-y-3" id="hashesComputeContainer">
          <div>
            <span class="text-[10px] wire-subtext block mb-1">Content & Combined Hashes are uncalculated</span>
            <button onclick="filePreviewManager.computeContentAndCombinedHashes()" class="w-full py-2.5 bg-transparent hover:border-indigo-300 wire-border text-indigo-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-fingerprint"></i> Calculate Content & Combined Hashes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async computeContentAndCombinedHashes() {
    const container = document.getElementById("hashesComputeContainer");
    if (!container || !this.currentPreviewPath) return;
    container.innerHTML = `
      <div class="flex items-center justify-center py-4 wire-subtext text-xs gap-2">
        <i class="fa-solid fa-spinner fa-spin text-indigo-400 text-base"></i> Fetching file & computing hashes...
      </div>
    `;
    try {
      if (!this.currentArrayBuffer) {
        const { data, error } = await this.service.createSignedUrl(this.currentPreviewPath, 60);
        if (error) throw error;
        const res = await fetch(data.signedUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch file content");
        this.currentArrayBuffer = await res.arrayBuffer();
        if (!this.fileSize) this.fileSize = this.currentArrayBuffer.byteLength;
      }
      const pathHash = await computeSha256(this.currentPreviewPath);
      const contentHash = await computeSha256(this.currentArrayBuffer);
      this.cachedContentHash = contentHash;
      const rawCombinedString = pathHash + contentHash;
      const combinedHash = await computeSha256(rawCombinedString);
      container.innerHTML = `
        <div class="space-y-4">
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">2. Content Hash</span>
              <button onclick="navigator.clipboard.writeText('${contentHash}'); showToast('Content hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
            </div>
            <div>
              <span class="text-[10px] wire-subtext block mb-0.5">Hashed input: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">ArrayBuffer (${this.currentArrayBuffer.byteLength} bytes)</code></span>
              <div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${contentHash}</div>
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">3. Combined Hash</span>
              <button onclick="navigator.clipboard.writeText('${combinedHash}'); showToast('Combined hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
            </div>
            <div>
              <span class="text-[10px] wire-subtext block mb-0.5">Exact concatenated string hashed:</span>
              <div class="font-mono text-[9px] bg-black/40 wire-subtext p-1.5 rounded wire-border break-all select-all max-h-14 overflow-y-auto mb-1">${escapeHtml(rawCombinedString)}</div>
              <div class="font-mono text-[10px] bg-slate-950/90 text-emerald-400 p-2 rounded wire-border break-all select-all">${combinedHash}</div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="text-xs text-rose-400 p-2 bg-rose-950/60 wire-border rounded">Failed to compute hashes: ${escapeHtml(err.message)}</div>`;
    }
  }

  cancelEditText() {
    if (!this.isTextEditor || this.currentPreviewText === null) return;
    const textarea = document.getElementById("editTextarea");
    if (textarea) textarea.value = this.currentPreviewText;
    this.onToast("Changes discarded", "info", 1500);
  }

  async saveEditedText() {
    const textarea = document.getElementById("editTextarea");
    if (!textarea || !this.currentPreviewPath || !this.isTextEditor) return;
    const newContent = textarea.value;
    try {
      this.onToast("Saving...", "info", 1500);
      const contentType = isHtml(this.currentPreviewName) ? "text/html" : "text/plain;charset=utf-8";
      const blob = new Blob([newContent], { type: contentType });
      const { error } = await this.service.upload(this.currentPreviewPath, blob, {
        cacheControl: "no-cache",
        upsert: true,
        contentType: isHtml(this.currentPreviewName) ? "text/html" : "text/plain"
      });
      if (error) throw error;
      this.currentPreviewText = newContent;
      this.currentArrayBuffer = await blob.arrayBuffer();
      this.fileSize = this.currentArrayBuffer.byteLength;
      this.cachedContentHash = null;
      const { data } = await this.service.createSignedUrl(this.currentPreviewPath, 60);
      await this.renderSidebarLazy(this.currentPreviewPath, this.currentPreviewName, this.fileSize, data?.signedUrl);
      this.onToast("File saved successfully", "success");
      this.onSaveSuccess();
    } catch (err) {
      console.error(err);
      this.onToast(err.message || "Failed to save file", "error");
    }
  }
}

class ItemsGridRenderer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onItemClick = options.onItemClick || (() => {});
    this.onDeleteClick = options.onDeleteClick || (() => {});
  }

  render(items, currentPath) {
    if (!this.container) return;
    this.container.className = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 p-4 text-slate-100";
    this.container.innerHTML = "";
    if (!items || items.length === 0) {
      this.container.innerHTML = Theme.getGridEmptyHTML();
      return;
    }
    items.forEach(item => {
      const isFolder = !item.id;
      const fullPath = item.fullPath || (currentPath ? `${currentPath}/${item.name}` : item.name);
      const sizeStr = isFolder ? "" : formatBytes(item.metadata?.size || 0);
      const card = document.createElement("div");
      card.className = Theme.getGridCardClasses();
      card.onclick = () => this.onItemClick(item, fullPath, isFolder);
      const mediaHTML = this.buildMediaPreview(item, isFolder);
      card.innerHTML = Theme.getGridCardHTML(mediaHTML, item.name, sizeStr, isFolder);
      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.onDeleteClick(fullPath, isFolder);
      };
      this.container.appendChild(card);
    });
  }

  buildMediaPreview(item, isFolder) {
    if (isFolder) return Theme.getFolderPreviewHTML();
    if (item.thumbUrl && isImage(item.name)) return Theme.getImagePreviewHTML(item.thumbUrl);
    if (item.thumbUrl && isVideo(item.name)) return Theme.getVideoPreviewHTML(item.thumbUrl);
    return Theme.getGenericFilePreviewHTML(item.name);
  }
}

class BreadcrumbManager {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onNavigate = options.onNavigate || (() => {});
    this.history = [{ path: "", name: "root" }];
    this.currentPath = "";
  }
  get path() { return this.currentPath; }
  navigateToFolder(path, name) {
    if (this.currentPath === path) return;
    this.currentPath = path;
    this.history.push({ path, name });
    this.render();
    this.onNavigate(this.currentPath);
  }
  jumpToBreadcrumb(index) {
    this.history = this.history.slice(0, index + 1);
    this.currentPath = this.history[this.history.length - 1].path;
    this.render();
    this.onNavigate(this.currentPath);
  }
  reset() {
    this.currentPath = "";
    this.history = [{ path: "", name: "root" }];
    this.render();
  }
  render() {
    if (!this.container) return;
    this.container.innerHTML = "";
    this.history.forEach((crumb, idx) => {
      const isLast = idx === this.history.length - 1;
      const btn = document.createElement("button");
      btn.className = (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center";
      if (crumb.name.toLowerCase() === "root") {
        btn.innerHTML = Theme.getBreadcrumbRootHTML(crumb.name);
      } else {
        btn.textContent = crumb.name;
      }
      btn.onclick = () => this.jumpToBreadcrumb(idx);
      this.container.appendChild(btn);
      if (!isLast) {
        const sep = document.createElement("span");
        sep.className = "opacity-50 mx-1";
        sep.textContent = "/";
        this.container.appendChild(sep);
      }
    });
  }
}


/**
 * Global Utilities & Helpers
 */
const formatBytes=(e,t=1)=>{if(!e)return"0 B";const o=Math.floor(Math.log(e)/Math.log(1024));return`${parseFloat((e/Math.pow(1024,o)).toFixed(t))} ${["B","KB","MB","GB"][o]}`},escapeHtml=e=>String(e||"").replace(/[&<>'"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[e]||e)),getExtension=e=>e.includes(".")?e.split(".").pop().toLowerCase():"file",isType=(e,t)=>t.includes(getExtension(e)),isImage=e=>isType(e,["png","jpg","jpeg","gif","webp","svg","bmp","ico"]),isVideo=e=>isType(e,["mp4","webm","mov","avi","mkv","ogg"]),isText=e=>isType(e,["txt","md","json","js","ts","html","css","xml","csv","log","py","sql","yml","yaml"]);async function computeSha256(e){const t="string"==typeof e?(new TextEncoder).encode(e):e,o=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(o)).map(e=>e.toString(16).padStart(2,"0")).join("")}function showToast(e,t="info",o=4e3){const r=document.getElementById("toastContainer");r||(r=document.createElement("div"),r.id="toastContainer",r.className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full",document.body.appendChild(r));const a={success:{border:"border-emerald-800",text:"text-emerald-100",icon:"fa-circle-check text-emerald-400",bar:"border-l-emerald-500"},error:{border:"border-rose-800",text:"text-rose-100",icon:"fa-circle-exclamation text-rose-400",bar:"border-l-rose-500"},warning:{border:"border-amber-800",text:"text-amber-100",icon:"fa-triangle-exclamation text-amber-400",bar:"border-l-amber-500"},info:{border:"border-slate-700",text:"text-slate-100",icon:"fa-circle-info text-sky-400",bar:"border-l-sky-500"}}[t]||a.info,s=document.createElement("div");s.className=`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${a.border} ${a.text} ${a.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`,s.innerHTML=`\n    <div class="flex items-center"><i class="fa-solid ${a.icon} text-base mr-3"></i><span>${escapeHtml(e)}</span></div>\n    <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>\n  `,r.appendChild(s),requestAnimationFrame(()=>s.classList.remove("translate-x-12","opacity-0")),o>0&&setTimeout(()=>{s.classList.add("translate-x-12","opacity-0"),setTimeout(()=>s.remove(),300)},o)}
const isAudio = e => isType(e, ["mp3", "wav", "ogg", "m4a", "flac", "aac"]);
function isHtml(e){return/\.(html|htm)$/i.test(e)}function updateConnectionStatus(e,i){const t=document.getElementById("statusDot"),a=document.getElementById("statusText");a&&t&&(a.textContent=i,t.className=!0===e?"w-2 h-2 rounded-full bg-emerald-500":!1===e?"w-2 h-2 rounded-full bg-rose-500":"w-2 h-2 rounded-full bg-amber-400 animate-pulse")}function closeModals(){document.querySelectorAll(".fixed").forEach(e=>{"toastContainer"!==e.id&&e.classList.add("hidden")}),filePreviewManager&&(filePreviewManager.isTextEditor=!1),document.getElementById("previewSaveBtn")?.classList.add("hidden"),document.getElementById("previewCancelEditBtn")?.classList.add("hidden")}

/* ---------- Toast (uses Theme) ---------- */
function showToast(e, t = "info", o = 4e3) {
  let r = document.getElementById("toastContainer");
  if (!r) {
    r = document.createElement("div");
    r.id = "toastContainer";
    r.className = Theme.getToastContainerClasses();
    document.body.appendChild(r);
  }
  const s = document.createElement("div");
  s.className = Theme.getToastClasses(t);
  s.innerHTML = Theme.getToastHTML(e, t);
  r.appendChild(s);
  requestAnimationFrame(() => s.classList.remove("translate-x-12", "opacity-0"));
  if (o > 0) {
    setTimeout(() => {
      s.classList.add("translate-x-12", "opacity-0");
      setTimeout(() => s.remove(), 300);
    }, o);
  }
}

function updateConnectionStatus(e, i) {
  const t = document.getElementById("statusDot");
  const a = document.getElementById("statusText");
  if (a && t) {
    a.textContent = i;
    t.className = Theme.getStatusDotClasses(e);
  }
}

function closeModals() {
  document.querySelectorAll(".fixed").forEach(e => {
    if (e.id !== "toastContainer") e.classList.add("hidden");
  });
  if (filePreviewManager) filePreviewManager.isTextEditor = false;
  document.getElementById("previewSaveBtn")?.classList.add("hidden");
  document.getElementById("previewCancelEditBtn")?.classList.add("hidden");
}

/* ---------- Global State & Init ---------- */
let allItems = [];
let filteredItems = [];
let filePreviewManager = null;
let gridRenderer = null;
let breadcrumbManager = null;
const sbManager = new SupabaseManager();

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

window.addEventListener("DOMContentLoaded", () => {
  filePreviewManager = new FilePreviewManager({
    service: sbManager,
    onToast: (msg, type, duration) => showToast(msg, type, duration),
    onSaveSuccess: () => listFiles()
  });

  gridRenderer = new ItemsGridRenderer("itemsGrid", {
    onItemClick: (item, fullPath, isFolder) => {
      if (isFolder) breadcrumbManager.navigateToFolder(fullPath, item.name);
      else openPreview(fullPath, item.name);
    },
    onDeleteClick: (fullPath, isFolder) => deleteItem(fullPath, isFolder)
  });

  breadcrumbManager = new BreadcrumbManager("breadcrumbNav", {
    onNavigate: () => listFiles()
  });

  new Config("navSettingsTab");
  new FolderManagerPanel("#openFolderManagerBtn");

  const savedUrl = localStorage.getItem("sb_url");
  const savedKey = localStorage.getItem("sb_key");
  const savedBucket = localStorage.getItem("sb_bucket") || "files";

  if (savedUrl && savedKey) {
    try {
      sbManager.init({ url: savedUrl, key: savedKey, bucket: savedBucket });
      if (filePreviewManager) filePreviewManager.setService(sbManager);
      document.getElementById("headerUrl").innerHTML = savedUrl + "<br />Bucket: " + savedBucket;
      if (breadcrumbManager) breadcrumbManager.reset();
      listFiles();
    } catch (err) {
      console.error(err);
      showToast("Failed to initialize Supabase client", "error");
    }
  } else {
    updateConnectionStatus(false, "Please configure credentials in Settings");
  }
});

/* ---------- File Operations ---------- */
async function listFiles() {
  updateConnectionStatus(null, "Loading...");
  try {
    const activePath = breadcrumbManager ? breadcrumbManager.path : "";
    const { data, error } = await sbManager.list(activePath, {
      limit: 500, offset: 0, sortBy: { column: "name", order: "asc" }
    });
    if (error) throw error;
    allItems = (data || []).filter(item => item.name !== ".emptyFolderPlaceholder");
    await Promise.all(allItems.map(async (item) => {
      const isFolder = !item.id;
      if (isFolder) return;
      const activePath = breadcrumbManager ? breadcrumbManager.path : "";
      const fullPath = activePath ? `${activePath}/${item.name}` : item.name;
      item.fullPath = fullPath;
      if (isImage(item.name) || isVideo(item.name)) {
        try {
          const { data: signed, error: signErr } = await sbManager.createSignedUrl(fullPath, 60);
          if (!signErr && signed?.signedUrl) item.thumbUrl = signed.signedUrl;
        } catch (e) {}
      }
    }));
    updateConnectionStatus(true, `Connected • Bucket: ${sbManager.bucket}`);
    renderView();
  } catch (err) {
    console.error(err);
    updateConnectionStatus(false, err.message || "Failed to list files");
    showToast(err.message || "Failed to list files", "error");
  }
}

function renderView() {
  if (breadcrumbManager) breadcrumbManager.render();
  const searchVal = document.getElementById("searchInput")?.value.toLowerCase() || "";
  filteredItems = searchVal ? allItems.filter(i => i.name.toLowerCase().includes(searchVal)) : [...allItems];
  filteredItems.sort((a, b) => {
    const aFolder = !a.id;
    const bFolder = !b.id;
    if (aFolder !== bFolder) return aFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const label = document.getElementById("itemCountLabel");
  if (label) label.textContent = `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""}`;
  if (gridRenderer) {
    const activePath = breadcrumbManager ? breadcrumbManager.path : "";
    gridRenderer.render(filteredItems, activePath);
  }
}

function handleSearch() { renderView(); }

function openCreateFolderModal() {
  document.getElementById("folderNameInput").value = "";
  document.getElementById("modalCreateFolder").classList.remove("hidden");
}

async function submitCreateFolder() {
  const name = document.getElementById("folderNameInput").value.trim();
  if (!name) return;
  const activePath = breadcrumbManager ? breadcrumbManager.path : "";
  const folderPath = activePath ? `${activePath}/${name}/.emptyFolderPlaceholder` : `${name}/.emptyFolderPlaceholder`;
  try {
    const { error } = await sbManager.upload(folderPath, new Blob([""]), { upsert: false });
    if (error) throw error;
    closeModals();
    showToast(`Folder "${name}" created`, "success");
    listFiles();
  } catch (err) {
    showToast(err.message || "Failed to create folder", "error");
  }
}

function toggleActionsMenu() {
  const menu = document.getElementById("actionsMenu");
  if (menu) menu.classList.toggle("hidden");
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("actionsMenu");
  if (!menu) return;
  if (!menu.contains(e.target) && !e.target.closest("button")?.getAttribute("onclick")?.includes("toggleActionsMenu")) {
    menu.classList.add("hidden");
  }
});

async function handleFileUpload(event, isFolderUpload = false) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  showToast(`Uploading ${files.length} item(s) sequentially...`, "info", 2500);
  let success = 0, failed = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const activePath = breadcrumbManager ? breadcrumbManager.path : "";
      let targetPath = activePath ? `${activePath}/` : "";
      if (isFolderUpload && file.webkitRelativePath) targetPath += file.webkitRelativePath;
      else targetPath += file.name;
      const { error } = await sbManager.upload(targetPath, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      success++;
      if ((i + 1) % 5 === 0 || i === files.length - 1) showToast(`Uploaded ${i + 1} / ${files.length}`, "info", 1200);
    } catch (err) {
      console.error(err);
      failed++;
      showToast(`Failed: ${file.name}`, "error", 2500);
    }
  }
  await listFiles();
  if (failed === 0) showToast(`Successfully uploaded ${success} item(s)`, "success");
  else showToast(`Uploaded ${success}, failed ${failed}`, "warning");
  event.target.value = "";
}

async function openPreview(path, name) {
  if (filePreviewManager) await filePreviewManager.openPreview(path, name);
}
function cancelEditText() { if (filePreviewManager) filePreviewManager.cancelEditText(); }
async function saveEditedText() { if (filePreviewManager) await filePreviewManager.saveEditedText(); }

async function downloadFile(path, name) {
  try {
    const { data, error } = await sbManager.createSignedUrl(path, 60);
    if (error) throw error;
    const res = await fetch(data.signedUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    showToast(err.message || "Download failed", "error");
  }
}

async function createBackup() {
  const btn = document.getElementById("backupBtn");
  btn.disabled = true;
  btn.innerHTML = Theme.getBackupLoadingHTML();
  await sbManager.runBackup();
  btn.disabled = false;
  btn.innerHTML = Theme.getBackupIdleHTML();
}

async function deleteItem(path, isFolder) {
  if (!confirm(isFolder ? `Delete folder "${path}" and all its contents?` : `Delete file "${path}"?`)) return;
  try {
    if (isFolder) {
      const { data: files, error: listError } = await sbManager.list(path, { limit: 1000 });
      if (listError) throw listError;
      const pathsToDelete = [];
      if (files && files.length > 0) {
        for (const f of files) pathsToDelete.push(`${path}/${f.name}`);
      }
      pathsToDelete.push(`${path}/.emptyFolderPlaceholder`);
      if (pathsToDelete.length > 0) {
        const { error } = await sbManager.remove(pathsToDelete);
        if (error) throw error;
      }
    } else {
      const { error } = await sbManager.remove([path]);
      if (error) throw error;
    }
    showToast("Deleted successfully", "success");
    listFiles();
  } catch (err) {
    console.error(err);
    showToast(err.message || "Delete failed", "error");
  }
}
