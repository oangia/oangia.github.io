class FileManager {
  static _TEMPLATES = {
    grid: {
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
    },
    breadcrumb: {
      crumb: (name, isRoot) => isRoot
        ? `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(name)}</span>`
        : `<span>${escapeHtml(name)}</span>`,
      separatorClass: "opacity-50 mx-1",
      crumbClass: (isLast) => (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center"
    }
  };

  constructor(gridId = "itemsGrid", breadcrumbId = "breadcrumbNav") {
    this.items = [];
    this.listRequestId = 0;

    this.gridContainer = document.getElementById(gridId);
    this.contextRecord = null;
    this.contextMenu = document.createElement("div");
    this.contextMenu.className =
      "hidden fixed z-[110] max-h-[80vh] min-w-44 border border-white/20 bg-zinc-900 py-1 text-slate-200 shadow-lg rounded-lg";
    document.body.appendChild(this.contextMenu);

    this.breadcrumbContainer = document.getElementById(breadcrumbId);
    this.path = "";
    this.history = [{ path: "", name: "root" }];

    this._bindEvents();
    this._renderBreadcrumb();
    this._renderGrid([]);

    const storage = this._ensureStorage();
    if (typeof storage.isAvailable !== "function" || storage.isAvailable()) {
      this.action("listFiles");
    }
  }

  _bindEvents() {
    document.getElementById("authBtn")?.addEventListener("click", () => {
      const hasSupabase = Boolean(localStorage.getItem("sb_url") && localStorage.getItem("sb_key"));
      const drive = FileRecord.use("drive", {
        onConnectionChange: ({ error }) => {
          if (error) {
            showToast(error, "error");
            return;
          }
          if (FileRecord.current === drive && drive.isAvailable()) {
            this.listFiles();
          }
        }
      }).current;

      if (!hasSupabase || FileRecord.current === drive) {
        FileRecord.current = drive;
      }

      if (drive.isAvailable()) {
        this.listFiles();
      }
    });

    this.gridContainer?.addEventListener("contextmenu", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest("[data-item-index]");
      const record = card ? this.items[Number(card.dataset.itemIndex)] : null;
      if (!record) return;
      this._showContextMenu(event, record);
    });

    this.gridContainer?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest("[data-item-index]");
      if (!card) return;
      const record = this.items[Number(card.dataset.itemIndex)];
      if (!record) return;
      this.action(record.isFolderNode() ? "navigate" : "openFilePreview", record);
    });

    this.contextMenu.addEventListener("pointerdown", (e) => e.stopPropagation());

    this.contextMenu.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button[data-action]");
      if (!button || !this.contextRecord) return;
      const action = button.dataset.action;
      const record = this.contextRecord;
      this._hideContextMenu();
      this.action(action, record);
    });

    this.breadcrumbContainer?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const crumb = event.target.closest("[data-breadcrumb-index]");
      if (crumb) this.jumpToBreadcrumb(Number(crumb.dataset.breadcrumbIndex));
    });

    document.addEventListener("pointerdown", (event) => {
      if (!this.contextMenu.contains(event.target)) this._hideContextMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this._hideContextMenu();
    });
  }

  _ensureStorage() {
    if (!FileRecord.current) {
      FileRecord.use(localStorage.getItem("sb_url") && localStorage.getItem("sb_key") ? "supabase" : "drive");
    }
    return FileRecord.current;
  }

  _renderBreadcrumb() {
    if (!this.breadcrumbContainer) return;
    const tpl = FileManager._TEMPLATES.breadcrumb;
    this.breadcrumbContainer.innerHTML = "";

    this.history.forEach((crumb, idx) => {
      const isLast = idx === this.history.length - 1;
      const btn = document.createElement("button");
      btn.className = tpl.crumbClass(isLast);
      btn.dataset.breadcrumbIndex = String(idx);
      btn.innerHTML = tpl.crumb(crumb.name, crumb.name.toLowerCase() === "root");
      this.breadcrumbContainer.appendChild(btn);

      if (!isLast) {
        const sep = document.createElement("span");
        sep.className = tpl.separatorClass;
        sep.textContent = "/";
        this.breadcrumbContainer.appendChild(sep);
      }
    });
  }

  _renderGrid(items = []) {
    if (!this.gridContainer) return [];

    const tpl = FileManager._TEMPLATES.grid;
    const previewMedia = [];

    this.gridContainer.className = tpl.containerClass;
    this.gridContainer.innerHTML = "";

    if (!items.length) {
      this.gridContainer.innerHTML = tpl.emptyState;
      return previewMedia;
    }

    items.forEach((record, index) => {
      const card = document.createElement("div");
      card.className = tpl.cardClass;
      card.title = "Right-click for actions";
      card.dataset.itemIndex = String(index);

      const mediaHTML = record.isFolderNode() ? tpl.folderIcon : tpl.fileMedia(record);
      card.innerHTML = tpl.card(record, mediaHTML);
      this.gridContainer.appendChild(card);

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

  _showContextMenu(event, record) {
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

  _hideContextMenu() {
    this.contextRecord = null;
    this.contextMenu.classList.add("hidden");
  }

  navigateToFolder(path, name, breadcrumbIndex = null) {
    if (breadcrumbIndex === null && this.path === path) return;
    if (breadcrumbIndex === null) {
      this.history.push({ path, name });
    } else {
      this.history = this.history.slice(0, breadcrumbIndex + 1);
    }
    this.path = path;
    this._renderBreadcrumb();
    this.action("listFiles");
  }

  jumpToBreadcrumb(index) {
    this.navigateToFolder(this.history[index].path, null, index);
  }

  resetBreadcrumb() {
    this.path = "";
    this.history = [{ path: "", name: "root" }];
    this._renderBreadcrumb();
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
      const storage = this._ensureStorage();
      if (typeof storage.isAvailable === "function" && !storage.isAvailable()) return;

      const queryPath = storage instanceof DriveStorageService ? (this.path || "root") : this.path;
      const { data, error } = await FileRecord.list(queryPath);
      if (requestId !== this.listRequestId) return;
      if (error) throw error;

      this.items = [...(data || [])].sort((a, b) => {
        if (a.isFolderNode() !== b.isFolderNode()) return a.isFolderNode() ? -1 : 1;
        return a.getDisplayName().localeCompare(b.getDisplayName());
      });

      const label = document.getElementById("itemCountLabel");
      if (label) label.textContent = `${this.items.length} item${this.items.length !== 1 ? "s" : ""}`;

      const previewMedia = this._renderGrid(this.items);
      previewMedia.forEach(({ file, element }) => this.loadPreviewMedia(file, element));
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to list files", "error");
    }
  }

  async handleFileUpload(event, isFolderUpload = false, options = {}) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    this._ensureStorage();
    showToast(`Uploading ${files.length} item(s)...`, "info", 2500);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const rel = isFolderUpload && file.webkitRelativePath ? file.webkitRelativePath : file.name;
        const targetPath = this.path ? `${this.path}/${rel}` : rel;
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
    this.navigateToFolder(file.getFullPath(), file.getName());
  }

  async openFilePreview(file) {
    this._ensureStorage();
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
      this._ensureStorage();
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
      this._ensureStorage();
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
      this._ensureStorage();
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
