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
      menuTrigger: (record, index) => `
        <button type="button" data-item-menu-btn="${index}" aria-label="Actions for ${escapeHtml(record.getDisplayName())}"
                class="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
          <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
        </button>`,
      card: (record, mediaHTML, menuHTML = "") =>
        `${menuHTML}${mediaHTML}<div class="w-full pt-2 border-t border-white/20 flex flex-col"><span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(record.getDisplayName())}">${escapeHtml(record.getDisplayName())}</span><span class="text-[9px] text-slate-300 font-mono mt-0.5">${record.isFolderNode() ? "Folder" : `${record.getSize()} B`}</span></div>`
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
    this.itemMenu = null;

    this.breadcrumbContainer = document.getElementById(breadcrumbId);
    this.path = "";
    this.history = [{ path: "", name: "root" }];

    this._initItemMenu();
    this._bindEvents();
    this._renderBreadcrumb();
    this._renderGrid([]);
    FileRecord.use("supabase");
    this.action("listFiles");
  }

  _initItemMenu() {
    document.getElementById("itemContextMenu")?.remove();
    const menu = document.createElement("div");
    menu.id = "itemContextMenu";
    menu.className = "hidden fixed z-[110] w-44 rounded-lg border border-white/20 bg-zinc-900 py-1 text-xs text-slate-200 shadow-xl";
    menu.setAttribute("role", "menu");
    menu.innerHTML = `
      <button type="button" data-item-action="open" role="menuitem" class="w-full text-left flex items-center px-3 py-2 hover:bg-white/10 hover:text-white transition">
        <i class="fa-solid fa-arrow-up-right-from-square mr-2.5 text-indigo-400 w-4"></i>
        <span data-open-label>Open</span>
      </button>
      <button type="button" data-item-action="download" role="menuitem" class="w-full text-left flex items-center px-3 py-2 hover:bg-white/10 hover:text-white transition">
        <i class="fa-solid fa-download mr-2.5 text-emerald-400 w-4"></i>
        <span>Download</span>
      </button>
      <div class="border-t border-white/10 my-1"></div>
      <button type="button" data-item-action="delete" role="menuitem" class="w-full text-left flex items-center px-3 py-2 text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition">
        <i class="fa-solid fa-trash mr-2.5 text-rose-400 w-4"></i>
        <span>Delete</span>
      </button>
    `;
    document.body.appendChild(menu);
    this.itemMenu = menu;

    menu.addEventListener("click", async (event) => {
      event.stopPropagation();
      const btn = event.target instanceof Element ? event.target.closest("[data-item-action]") : null;
      const record = this.contextRecord;
      this.closeItemMenu();
      if (!btn || !record) return;

      const actionType = btn.dataset.itemAction;
      if (actionType === "open") {
        this.action(record.isFolderNode() ? "navigate" : "openFilePreview", record);
      } else if (actionType === "download") {
        await this.action("downloadRecord", record);
      } else if (actionType === "delete") {
        await this.action("removeRecord", record);
      }
    });
  }

  openItemMenu(record, anchorEl) {
    if (!this.itemMenu || !record || !anchorEl) return;
    this.contextRecord = record;

    const openLabel = this.itemMenu.querySelector("[data-open-label]");
    if (openLabel) openLabel.textContent = record.isFolderNode() ? "Open folder" : "Preview";

    const downloadBtn = this.itemMenu.querySelector('[data-item-action="download"]');
    if (downloadBtn) downloadBtn.classList.toggle("hidden", record.isFolderNode());

    this.itemMenu.classList.remove("hidden");

    const rect = anchorEl.getBoundingClientRect();
    const menuRect = this.itemMenu.getBoundingClientRect();
    const pad = 8;
    let left = rect.right - menuRect.width;
    let top = rect.bottom + 4;

    if (left < pad) left = pad;
    if (left + menuRect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - menuRect.width - pad);
    }
    if (top + menuRect.height > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - menuRect.height - 4);
    }

    this.itemMenu.style.left = `${left}px`;
    this.itemMenu.style.top = `${top}px`;
  }

  closeItemMenu() {
    this.itemMenu?.classList.add("hidden");
    this.contextRecord = null;
  }

  _bindEvents() {
    document.getElementById("openLocalFolderBtn")?.addEventListener("click", () => {
      FileRecord.use("local");
      this.action("listFiles");
    });

    document.getElementById("authBtn")?.addEventListener("click", () => {
      FileRecord.use("drive");
      this.action("listFiles");
    });

    const actionsMenu = document.getElementById("actionsMenu");
    const actionsDropdown = document.getElementById("actionsMenuToggleBtn");
    actionsMenu?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.closeItemMenu();
      actionsDropdown?.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
      if (!actionsMenu?.contains(event.target) && !actionsDropdown?.contains(event.target)) {
        actionsDropdown?.classList.add("hidden");
      }
      if (!this.itemMenu?.contains(event.target) && !(event.target instanceof Element && event.target.closest("[data-item-menu-btn]"))) {
        this.closeItemMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.closeItemMenu();
    });

    this.gridContainer?.addEventListener("scroll", () => this.closeItemMenu());

    this.gridContainer?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const menuBtn = event.target.closest("[data-item-menu-btn]");
      if (menuBtn) {
        event.stopPropagation();
        const record = this.items[Number(menuBtn.dataset.itemMenuBtn)];
        if (record) this.openItemMenu(record, menuBtn);
        return;
      }
      this.closeItemMenu();
      const card = event.target.closest("[data-item-index]");
      if (!card) return;
      const record = this.items[Number(card.dataset.itemIndex)];
      if (!record) return;
      this.action(record.isFolderNode() ? "navigate" : "openFilePreview", record);
    });

    this.breadcrumbContainer?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const crumb = event.target.closest("[data-breadcrumb-index]");
      if (crumb) this.jumpToBreadcrumb(Number(crumb.dataset.breadcrumbIndex));
    });
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

    this.closeItemMenu();
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
      card.dataset.itemIndex = String(index);

      const mediaHTML = record.isFolderNode() ? tpl.folderIcon : tpl.fileMedia(record);
      const menuHTML = tpl.menuTrigger(record, index);
      card.innerHTML = tpl.card(record, mediaHTML, menuHTML);
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
      const { data, error } = await FileRecord.list(this.path);
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
    const nextPath = file.getId() && file.getId() !== file.getFullPath() ? file.getId() : file.getFullPath();
    this.navigateToFolder(nextPath, file.getDisplayName());
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
      const raw = await file.getContent();
      const blob = file.isEncryptedFile()
        ? await EncryptionMiddleware.decrypt(raw, file.getMimeType())
        : (raw instanceof Blob ? raw : (raw instanceof Response ? await raw.blob() : new Blob([raw])));
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

      const raw = await file.getContent();
      const blob = file.isEncryptedFile()
        ? await EncryptionMiddleware.decrypt(raw, file.getMimeType())
        : (raw instanceof Blob ? raw : (raw instanceof Response ? await raw.blob() : new Blob([raw])));
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
      const raw = await file.getContent();
      const blob = file.isEncryptedFile()
        ? await EncryptionMiddleware.decrypt(raw, file.getMimeType())
        : (raw instanceof Blob ? raw : (raw instanceof Response ? await raw.blob() : new Blob([raw])));
      const url = URL.createObjectURL(blob);
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

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileUpload");
  const encryptedInput = document.getElementById("encryptedFileUpload");
  const folderInput = document.getElementById("folderUpload");

  fileInput?.addEventListener("change", (e) => fileManager.action("upload", e, false, {}));
  encryptedInput?.addEventListener("change", (e) => fileManager.action("upload", e, false, { encrypt: true }));
  folderInput?.addEventListener("change", (e) => fileManager.action("upload", e, true, {}));
  set_bg();
});
const fileManager = new FileManager();
