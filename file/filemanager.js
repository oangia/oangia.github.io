const escapeHtml = e => String(e || "").replace(/[&<>'"]/g, e => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[e] || e));

function showToast(e, t = "info", o = 4e3) {
  let r = document.getElementById("toastContainer");
  r || (r = document.createElement("div"), r.id = "toastContainer", r.className = "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full", document.body.appendChild(r));
  const a = document.createElement("div");
  const n = {
    success: { border: "border-emerald-800", text: "text-emerald-100", icon: "fa-circle-check text-emerald-400", bar: "border-l-emerald-500" },
    error: { border: "border-rose-800", text: "text-rose-100", icon: "fa-circle-exclamation text-rose-400", bar: "border-l-rose-500" },
    warning: { border: "border-amber-800", text: "text-amber-100", icon: "fa-triangle-exclamation text-amber-400", bar: "border-l-amber-500" },
    info: { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" }
  }[t] || { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" };
  a.className = `pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${n.border} ${n.text} ${n.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`;
  a.innerHTML = `
    <div class="flex items-center"><i class="fa-solid ${n.icon} text-base mr-3"></i><span>${escapeHtml(e)}</span></div>
    <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>
  `;
  r.appendChild(a);
  requestAnimationFrame(() => a.classList.remove("translate-x-12", "opacity-0"));
  o > 0 && setTimeout(() => {
    a.classList.add("translate-x-12", "opacity-0");
    setTimeout(() => a.remove(), 300);
  }, o);
}

function set_bg() {
  window.self === window.top && (
    document.body.style.backgroundImage = "linear-gradient(rgba(5, 8, 17, 0.45), rgba(5, 8, 17, 0.7)), url('https://images.unsplash.com/photo-1772511988871-a010197b94ae?auto=format&fit=crop&w=1920&q=80')",
    document.body.style.backgroundSize = "cover",
    document.body.style.backgroundPosition = "center",
    document.body.style.backgroundRepeat = "no-repeat",
    document.body.style.backgroundAttachment = "fixed",
    document.body.style.backgroundColor = "#050811"
  );
}

class Config {
  static get _TEMPLATES() {
    return {
      overlayClass: "hidden fixed inset-0 z-[60] bg-black/40",
      panelClass: "hidden fixed inset-0 z-[70] flex items-center justify-center p-6 overflow-y-auto",
      modalBox: e => `
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
                  Current origin: <code id="originLabel" class="text-indigo-300">${e}</code>
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

  constructor(e) {
    this.btnId = e;
    this.panelId = "configPanel";
    this.overlayId = "configOverlay";
    this.#e();
    this.#t();
    this.#n();
    localStorage.getItem("sb_url") && localStorage.getItem("sb_key") || this.open();
  }

  open() {
    document.getElementById(this.overlayId)?.classList.remove("hidden");
    document.getElementById(this.panelId)?.classList.remove("hidden");
  }

  close() {
    document.getElementById(this.overlayId)?.classList.add("hidden");
    document.getElementById(this.panelId)?.classList.add("hidden");
  }

  #e() {
    document.getElementById(this.overlayId)?.remove();
    document.getElementById(this.panelId)?.remove();
    const e = document.createElement("div");
    e.id = this.overlayId;
    e.className = Config._TEMPLATES.overlayClass;
    const t = document.createElement("div");
    t.id = this.panelId;
    t.className = Config._TEMPLATES.panelClass;
    t.innerHTML = Config._TEMPLATES.modalBox(window.location.origin);
    document.body.appendChild(e);
    document.body.appendChild(t);
    document.getElementById("configCloseBtn").onclick = () => this.close();
    document.getElementById("configCancelBtn").onclick = () => this.close();
    e.onclick = () => this.close();
    t.querySelector("div").onclick = e => e.stopPropagation();
    document.getElementById("configSaveBtn").onclick = () => this.#o();
  }

  #t() {
    const e = document.getElementById(this.btnId);
    e && (e.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      this.open();
    });
  }

  #n() {
    const e = document.getElementById(this.panelId);
    e && e.querySelectorAll("input[name]").forEach(e => {
      const t = localStorage.getItem(e.name);
      null !== t && "" !== t ? e.value = t : e.dataset.default && (e.value = e.dataset.default);
    });
  }

  #o() {
    const e = document.getElementById(this.panelId).querySelectorAll("input[name]");
    const t = Object.fromEntries([...e].map(e => [e.name, e.value.trim() || e.dataset.default || ""]));
    t.sb_url && t.sb_key ? (Object.entries(t).forEach(([e, t]) => localStorage.setItem(e, t)), this.close(), location.reload()) : showToast("URL and Anon Key are required", "warning");
  }
}
new Config("navSettingsTab");

class ViewInterface {
  initHTML() {}
  bindEvents() {}
  render(params) {}
}

class UITemplates {
  static get grid() {
    return {
      containerClass: "grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4",
      cardClass: "group relative bg-transparent border border-white/20 hover:border-indigo-400 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden",
      emptyState: `<div class="col-span-full py-16 text-center text-slate-400 text-sm"><i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-90 hover:opacity-100"></i>No items found</div>`,
      folderIcon: `<div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><i class="fa-solid fa-folder text-5xl"></i></div>`,
      fileMedia: (file) => {
        const mediaClass = "widget-preview-area flex-1 w-full h-full object-cover overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors";
        if (file.isVideo()) {
          return `<video class="${mediaClass}" muted preload="metadata" aria-label="${escapeHtml(file.getDisplayName())}"></video>`;
        }
        if (file.getThumbnail() || file.isImage()) {
          return `<img class="${mediaClass}">`;
        }
        return `<div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors"><i class="fa-solid fa-file text-3xl"></i></div>`;
      },
      card: (record, mediaHTML) =>
        `${mediaHTML}<div class="w-full pt-2 border-t border-white/20 flex flex-col"><span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(record.getDisplayName())}">${escapeHtml(record.getDisplayName())}</span><span class="text-[9px] text-slate-300 font-mono mt-0.5">${record.isFolderNode() ? "Folder" : `${record.getSize()} B`}</span></div>`
    };
  }

  static get breadcrumb() {
    return {
      crumb: (name, isRoot) => isRoot
        ? `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(name)}</span>`
        : `<span>${escapeHtml(name)}</span>`,
      separatorClass: "opacity-50 mx-1",
      crumbClass: (isLast) => (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center"
    };
  }
}

class ItemsGridRenderer extends ViewInterface {
  constructor(containerId, fileManagerInstance) {
    super();
    this.containerId = containerId;
    this.fileManager = fileManagerInstance;

    this.initHTML();
    this.bindEvents();
    this.render();
  }

  initHTML() {
    this.container = document.getElementById(this.containerId);
    this.items = [];

    this.contextMenu = document.createElement("div");
    this.contextMenu.className =
      "hidden fixed z-[110] max-h-[80vh] min-w-44 border border-white/20 bg-zinc-900 py-1 text-slate-200 shadow-lg rounded-lg";
    document.body.appendChild(this.contextMenu);
  }

  bindEvents() {
    this.container?.addEventListener("contextmenu", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest("[data-item-index]");
      const record = card ? this.items[Number(card.dataset.itemIndex)] : null;
      if (!record) return;
      this.showContextMenu(event, record);
    });

    this.container?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest("[data-item-index]");
      if (!card) return;
      const record = this.items[Number(card.dataset.itemIndex)];
      if (!record) return;
      this.fileManager.action(record.isFolderNode() ? "navigate" : "openFilePreview", record);
    });

    this.contextMenu.addEventListener("pointerdown", (e) => e.stopPropagation());

    this.contextMenu.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button[data-action]");
      if (!button || !this.contextRecord) return;
      const action = button.dataset.action;
      const record = this.contextRecord;
      this.hideContextMenu();
      this.fileManager.action(action, record);
    });

    document.addEventListener("pointerdown", (event) => {
      if (!this.contextMenu.contains(event.target)) this.hideContextMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.hideContextMenu();
    });
  }

  render(items = []) {
    this.items = items;
    if (!this.container) return [];

    const tpl = UITemplates.grid;
    const previewMedia = [];

    this.container.className = tpl.containerClass;
    this.container.innerHTML = "";

    if (!items.length) {
      this.container.innerHTML = tpl.emptyState;
      return previewMedia;
    }

    items.forEach((record, index) => {
      const card = document.createElement("div");
      card.className = tpl.cardClass;
      card.title = "Right-click for actions";
      card.dataset.itemIndex = String(index);

      const mediaHTML = record.isFolderNode() ? tpl.folderIcon : tpl.fileMedia(record);
      card.innerHTML = tpl.card(record, mediaHTML);
      this.container.appendChild(card);

      const previewEl = card.querySelector(".widget-preview-area");
      if (
        ((record.getThumbnail() || record.isImage()) && previewEl instanceof HTMLImageElement) ||
        (record.isVideo() && previewEl instanceof HTMLVideoElement)
      ) {
        previewMedia.push({ file: record, element: previewEl });
      }
    });

    return previewMedia;
  }

  showContextMenu(event, record) {
    event.preventDefault();
    event.stopPropagation();
    this.contextRecord = record;

    const openLabel = record.isFolderNode() ? "Open" : "Open preview";
    const openAction = record.isFolderNode() ? "navigate" : "openFilePreview";
    const downloadBtn = record.isFolderNode()
      ? ""
      : `<button type="button" data-action="downloadRecord" class="w-full text-left px-3 py-2 text-xs hover:bg-white/10">Download</button>`;

    this.contextMenu.innerHTML = `
      <button type="button" data-action="${openAction}" class="w-full text-left px-3 py-2 text-xs hover:bg-white/10">${escapeHtml(openLabel)}</button>
      ${downloadBtn}
      <button type="button" data-action="removeRecord" class="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-white/10">Delete</button>
    `;

    this.contextMenu.classList.remove("hidden");
    const left = event.clientX || 8;
    const top = event.clientY || 8;
    const rect = this.contextMenu.getBoundingClientRect();
    this.contextMenu.style.left = `${Math.max(8, Math.min(left, window.innerWidth - rect.width - 8))}px`;
    this.contextMenu.style.top = `${Math.max(8, Math.min(top, window.innerHeight - rect.height - 8))}px`;
  }

  hideContextMenu() {
    this.contextRecord = null;
    this.contextMenu.classList.add("hidden");
  }
}

class BreadcrumbManager extends ViewInterface {
  constructor(containerId, fileManagerInstance) {
    super();
    this.containerId = containerId;
    this.fileManager = fileManagerInstance;

    this.initHTML();
    this.bindEvents();
    this.render();
  }

  initHTML() {
    this.container = document.getElementById(this.containerId);
    this.history = [{ path: "", name: "root" }];
    this.path = "";
  }

  bindEvents() {
    this.container?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const crumb = event.target.closest("[data-breadcrumb-index]");
      if (crumb) this.jumpToBreadcrumb(Number(crumb.dataset.breadcrumbIndex));
    });
  }

  navigateToFolder(path, name, breadcrumbIndex = null) {
    if (breadcrumbIndex === null && this.path === path) return;
    if (breadcrumbIndex === null) {
      this.history.push({ path, name });
    } else {
      this.history = this.history.slice(0, breadcrumbIndex + 1);
    }
    this.path = path;
    this.render();
    this.fileManager.action("listFiles");
  }

  jumpToBreadcrumb(index) {
    this.navigateToFolder(this.history[index].path, null, index);
  }

  reset() {
    this.path = "";
    this.history = [{ path: "", name: "root" }];
    this.render();
  }

  render() {
    if (!this.container) return;
    const tpl = UITemplates.breadcrumb;
    this.container.innerHTML = "";

    this.history.forEach((crumb, idx) => {
      const isLast = idx === this.history.length - 1;
      const btn = document.createElement("button");
      btn.className = tpl.crumbClass(isLast);
      btn.dataset.breadcrumbIndex = String(idx);
      btn.innerHTML = tpl.crumb(crumb.name, crumb.name.toLowerCase() === "root");
      this.container.appendChild(btn);

      if (!isLast) {
        const sep = document.createElement("span");
        sep.className = tpl.separatorClass;
        sep.textContent = "/";
        this.container.appendChild(sep);
      }
    });
  }
}

class FileManager {
  constructor() {
    this.items = [];
    this.listRequestId = 0;

    this.breadcrumb = new BreadcrumbManager("breadcrumbNav", this);
    this.gridRenderer = new ItemsGridRenderer("itemsGrid", this);

    this.action("listFiles");
  }

  action(actionName, ...args) {
    switch (actionName) {
      case "refresh":
      case "listFiles": return this.listFiles();
      case "navigate": return this.navigate(args[0]);
      case "openFilePreview": return this.openFilePreview(args[0]);
      case "upload": return this.handleFileUpload(args[0], args[1], args[2]);
      case "downloadRecord": return this.downloadRecord(args[0]);
      case "removeRecord": return this.removeRecord(args[0]);
      default: throw new Error(`Unknown file-manager action: ${actionName}`);
    }
  }

  async listFiles() {
    const requestId = ++this.listRequestId;
    try {
      const { data, error } = await FileRecord.list(this.breadcrumb.path);
      if (requestId !== this.listRequestId) return;
      if (error) throw error;

      this.items = [...(data || [])].sort((a, b) => {
        if (a.isFolderNode() !== b.isFolderNode()) return a.isFolderNode() ? -1 : 1;
        return a.getDisplayName().localeCompare(b.getDisplayName());
      });

      const label = document.getElementById("itemCountLabel");
      if (label) label.textContent = `${this.items.length} item${this.items.length !== 1 ? "s" : ""}`;

      const previewMedia = this.gridRenderer?.render(this.items) || [];
      previewMedia.forEach(({ file, element }) => this.loadPreviewMedia(file, element));
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to list files", "error");
    }
  }

  async handleFileUpload(event, isFolderUpload = false, options = {}) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    showToast(`Uploading ${files.length} item(s)...`, "info", 2500);
    let success = 0;
    let failed = 0;
    const currentPath = this.breadcrumb.path;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const rel = isFolderUpload && file.webkitRelativePath ? file.webkitRelativePath : file.name;
        const targetPath = currentPath ? `${currentPath}/${rel}` : rel;
        const { error } = await FileRecord.upload(targetPath, file, options);
        if (error) throw error;
        success++;
      } catch (err) {
        console.error(err);
        failed++;
        showToast(`Failed: ${file.name}`, "error", 2500);
      }
    }

    await this.listFiles();
    if (failed === 0) {
      showToast(`Uploaded ${success} item(s)`, "success");
    } else {
      showToast(`Uploaded ${success}, failed ${failed}`, "warning");
    }
    event.target.value = "";
  }

  navigate(file) {
    this.breadcrumb.navigateToFolder(file.getFullPath(), file.getName());
  }

  async openFilePreview(file) {
    this.activeFilePreview?.close();

    const panel = document.createElement("div");
    panel.className = "fixed inset-0 z-[120] flex items-center justify-center bg-black/60";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", `Preview: ${file.getDisplayName()}`);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className =
      "absolute right-4 top-4 z-[1] rounded-full border border-white/20 bg-zinc-900/80 px-3 py-2 text-sm text-white shadow-lg backdrop-blur";
    closeButton.setAttribute("aria-label", "Close preview");
    closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';

    let objectUrl;
    const close = () => {
      if (!panel.isConnected) return;
      document.removeEventListener("keydown", handleKeydown);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      panel.remove();
      if (this.activeFilePreview?.panel === panel) this.activeFilePreview = null;
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") close();
    };

    closeButton.addEventListener("click", close);
    document.addEventListener("keydown", handleKeydown);
    panel.appendChild(closeButton);
    document.body.appendChild(panel);
    this.activeFilePreview = { panel, close };

    try {
      const response = await file.download();
      const blob = await response.blob();
      if (!panel.isConnected) return;

      if (file.isHtml()) {
        const frame = document.createElement("iframe");
        frame.title = file.getDisplayName();
        frame.setAttribute("sandbox", "allow-scripts");
        frame.setAttribute("allowtransparency", "true");
        frame.className = "absolute inset-0 w-full h-full border-0 bg-transparent";
        frame.srcdoc = await blob.text();
        panel.appendChild(frame);
        return;
      }

      objectUrl = URL.createObjectURL(blob);

      if (file.isImage()) {
        const img = document.createElement("img");
        img.src = objectUrl;
        img.alt = file.getDisplayName();
        img.className = "max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl";
        panel.appendChild(img);
        return;
      }

      const frame = document.createElement("iframe");
      frame.title = file.getDisplayName();
      frame.setAttribute("allowtransparency", "true");
      frame.className =
        "w-[100vw] h-[100vh] max-w-5xl border-0 rounded-lg bg-transparent shadow-2xl";
      frame.src = objectUrl;
      panel.appendChild(frame);
    } catch (error) {
      console.error("Failed to open file:", error);
      if (!panel.isConnected) return;
      close();
      showToast(error.message || "Failed to open file", "error");
    }
  }

  async loadPreviewMedia(file, element, useThumbnail = true) {
    try {
      if (useThumbnail && element instanceof HTMLImageElement && file.getThumbnail()) {
        element.loading = "lazy";
        element.onerror = () => {
          element.onerror = null;
          if (!file.isImage()) {
            element.remove();
            return;
          }
          void this.loadPreviewMedia(file, element, false);
        };
        element.src = file.getThumbnail();
        return;
      }

      if (file.getUrl()?.startsWith("blob:")) {
        element.loading = "lazy";
        element.src = file.getUrl();
        return;
      }

      const content = await file.download();
      const blob = await content.blob();
      element.loading = "lazy";
      element.preload = "auto";
      element.src = URL.createObjectURL(blob);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Failed to load file preview:", error);
    }
  }

  async downloadRecord(file) {
    try {
      const response = await file.download();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = file.getDisplayName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Download failed:", error);
      showToast(error.message || "Download failed", "error");
    }
  }

  async removeRecord(file) {
    try {
      const { error } = await file.remove();
      if (error) throw error;
      showToast(`Deleted ${file.getDisplayName()}`, "success");
      await this.listFiles();
    } catch (error) {
      console.error("Delete failed:", error);
      showToast(error.message || "Delete failed", "error");
    }
  }
}
