class ItemsGridRenderer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onItemClick = options.onItemClick || (() => {});
    this.onDeleteClick = options.onDeleteClick || (() => {});
    this.storageService = options.storageService;
  }
  
  async render(items, currentPath) {
    if (!this.container) return;
    
    this.container.className = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 p-4";
    this.container.innerHTML = "";
    
    if (!items || items.length === 0) {
      this.container.innerHTML = `<div class="col-span-full text-center py-10 opacity-60">No items found</div>`;
      return;
    }

    const thumbnailTasks = [];

    for (const file of items) {
      const sizeStr = file.getSubtext();
      
      const card = document.createElement("div");
      card.className = this.getGridCardClasses();
      card.onclick = () => this.onItemClick(file, file.getFullPath(), file.isFolderNode());
      
      const previewContainerId = `thumb-${Math.random().toString(36).substring(2, 9)}`;
      
      const mediaHTML = this.getGridCardMediaHTML(previewContainerId, file);     
      card.innerHTML = this.getGridCardHTML(mediaHTML, file.getDisplayName(), sizeStr, file.isFolderNode());

      const deleteBtn = card.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.onDeleteClick(file.getFullPath(), file.isFolderNode());
        };
      }

      this.container.appendChild(card);

      if (file.isImage()) {
        thumbnailTasks.push(async () => {
          try {
            const { data, error } = await this.storageService.getFileUrl(file.getFullPath(), 60);
            if (!error && data?.signedUrl) {
              const thumbEl = document.getElementById(previewContainerId);
              if (thumbEl) {
                thumbEl.innerHTML = `<img src="${data.signedUrl}" alt="${file.getDisplayName()}" class="w-full h-full object-cover rounded-lg" />`;
              }
            }
          } catch (e) {}
        });
      }
    }

    if (thumbnailTasks.length > 0) {
      Promise.all(thumbnailTasks.map(task => task())).catch(() => {});
    }
  }

  /* ---------- Grid Card Templates & Styles ---------- */
  getGridCardClasses() {
    return `
      group relative bg-transparent border border-white/20 hover:border-indigo-400 
      rounded-xl p-3 flex flex-col items-center justify-between text-center 
      cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 
      aspect-square overflow-hidden
    `;
  }

  getGridCardMediaHTML(previewContainerId, file) {
    return file.isFolderNode() 
        ? `<div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><i class="fa-solid fa-folder text-5xl"></i></div>`
        : `<div id="${previewContainerId}" class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors">
             <i class="${file.getFileIconClass()} text-3xl"></i>
           </div>`;
  }

  getGridCardHTML(mediaHTML, name, sizeStr, isFolder) {
    return `
      <button 
        class="delete-btn absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 
               w-6 h-6 flex items-center justify-center rounded-full 
               bg-black/50 hover:bg-red-500 text-white transition"
        title="Delete">
        <i class="fa-solid fa-xmark text-[10px]"></i>
      </button>

      ${mediaHTML}

      <div class="w-full pt-2 border-t border-white/20 flex flex-col">
        <span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(name)}">
          ${escapeHtml(name)}
        </span>
        <span class="text-[9px] text-slate-300 font-mono mt-0.5">
          ${isFolder ? (sizeStr || 'Folder') : sizeStr}
        </span>
      </div>
    `;
  }
}

class FilePreviewManager {
  constructor(options = {}) {
    this.service = options.service;
    this.currentPreviewPath = null;
    this.currentPreviewName = null;
    this.onToast = options.onToast || ((msg, type) => console.log(msg));
    this.onSaveSuccess = options.onSaveSuccess || (() => {});
  }

  setService(service) { this.service = service; }

  async openPreview(path, name, file = null) {
    const fileRecord = file || new FileRecord({ name: name, full_path: path });
    
    this.currentPreviewPath = fileRecord.getFullPath();
    this.currentPreviewName = fileRecord.getName();

    const title = document.getElementById("previewTitle");
    const body = document.getElementById("previewBody");
    const sidebar = document.getElementById("previewSidebarDetails");
    const modal = document.getElementById("modalPreview");

    if (title) title.textContent = fileRecord.getDisplayName() + (fileRecord.isEncryptedFile() ? " (Decrypted securely)" : "");
    if (body) body.innerHTML = Theme.getPreviewLoadingHTML();
    if (sidebar) sidebar.innerHTML = Theme.getPreviewSidebarLoadingHTML();
    if (modal) modal.classList.remove("hidden");

    try {
      const { data, error } = await this.service.getFileUrl(fileRecord.getFullPath(), 60);
      if (error) throw error;
      const url = data.signedUrl;

      const res = await fetch(url);
      const blob = await res.blob();
      const fileSize = blob.size;

      let pathHash = fileRecord.hash_filename;
      if (!pathHash) {
        await fileRecord.hashFullpath();
        pathHash = fileRecord.hash_filename;
      }

      fileRecord._url = url;
      await fileRecord.hashContent(url);

      if (sidebar) {
        sidebar.innerHTML = Theme.getPreviewSidebarHTML({
          name: fileRecord.getDisplayName(),
          fileSize: fileSize,
          url: url,
          path: fileRecord.getFullPath(),
          pathHash: pathHash,
          fileHash: fileRecord.hash_file
        });
      }

      if (fileRecord.isImage()) {
        body.innerHTML = Theme.getPreviewImageHTML(url, fileRecord.getDisplayName());
      } else if (fileRecord.isVideo()) {
        body.innerHTML = Theme.getPreviewVideoHTML(url);
      } else if (fileRecord.isAudio()) {
        body.innerHTML = Theme.getPreviewAudioHTML(url, fileRecord.getDisplayName());
      } else if (fileRecord.isHtml()) {
        const text = await blob.text();
        body.innerHTML = Theme.getPreviewHtmlEditorHTML(text);
        setTimeout(() => {
          const iframe = document.getElementById("htmlPreviewFrame");
          if (iframe) iframe.srcdoc = text;
        }, 50);
      } else {
        const text = await blob.text();
        body.innerHTML = Theme.getPreviewTextEditorHTML(text);
      }
    } catch (err) {
      console.error(err);
      if (body) body.innerHTML = Theme.getPreviewUnsupportedHTML();
      if (sidebar) sidebar.innerHTML = `<p class="text-xs text-rose-400 p-2">Failed to load file details.</p>`;
    }
  }

  async cancelEditText() {
    if (this.currentPreviewPath && this.currentPreviewName) {
      this.openPreview(this.currentPreviewPath, this.currentPreviewName);
    }
  }

  async saveEditedText() {
    const textarea = document.getElementById("editTextarea");
    if (!textarea || !this.currentPreviewPath) return;

    try {
      const updatedContent = textarea.value;
      const blob = new Blob([updatedContent], { type: 'text/plain;charset=utf-8' });
      
      const { error } = await this.service.upload(this.currentPreviewPath, blob, { upsert: true });
      if (error) throw error;

      this.onToast("Changes saved successfully", "success", 2000);
      this.onSaveSuccess();
    } catch (err) {
      console.error(err);
      this.onToast(err.message || "Failed to save changes", "error", 2500);
    }
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

class FileManager {
  constructor(config = {}) {
    this.storageService = this._getService(config.storageService);
    if (!this.storageService) throw new Error("A storage service is required.");

    this.allItems = [];
    this.filteredItems = [];

    this.filePreviewManager = null;
    this.gridRenderer = null;
    this.breadcrumbManager = null;
    this.configManager = null;
  }

  _getService(serviceName) {
    const StorageRegistry = {
      drive: DriveStorageService,
      supa: SupabaseStorageService,
      supabase: SupabaseStorageService,
      local: LocalFileService
    };
    const ServiceClass = StorageRegistry[serviceName.toLowerCase()];
    return new ServiceClass();
  }

  init() {
    this.breadcrumbManager = new BreadcrumbManager("breadcrumbNav", {
      onNavigate: () => this.listFiles()
    });

    this.filePreviewManager = new FilePreviewManager({
      service: this.storageService,
      onToast: (msg, type, duration) => this.showToast(msg, type, duration),
      onSaveSuccess: () => this.listFiles()
    });

    this.gridRenderer = new ItemsGridRenderer("itemsGrid", {
      storageService: this.storageService,
      onItemClick: (file, fullPath, isFolder) => {
        if (isFolder) {
          this.breadcrumbManager.navigateToFolder(fullPath, file.getName());
        } else {
          this.openPreview(fullPath, file.getName(), file);
        }
      },
      onDeleteClick: (fullPath, isFolder) => this.deleteItem(fullPath, isFolder)
    });
    this.bindGlobalEvents();
    this.initializeServiceConnection();
  }

  bindGlobalEvents() {
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("actionsMenu");
      if (!menu) return;
      if (!menu.contains(e.target) && !e.target.closest("button")?.getAttribute("onclick")?.includes("toggleActionsMenu")) {
        menu.classList.add("hidden");
      }
    });
  }

  initializeServiceConnection() {
    try {
      if (typeof this.storageService.init === "function") {
        this.storageService.init();
      }
      this.filePreviewManager?.setService(this.storageService);

      const headerUrl = document.getElementById("headerUrl");
      if (headerUrl && this.storageService.bucket) {
        headerUrl.innerHTML = `Storage Active<br />Container: ${this.storageService.bucket}`;
      }

      this.breadcrumbManager?.reset();
      this.listFiles();
    } catch (err) {
      console.error(err);
      this.updateConnectionStatus(false, err.message || "Failed to initialize storage service");
      this.showToast("Failed to initialize storage service", "error");
    }
  }

  get activePath() {
    return this.breadcrumbManager ? this.breadcrumbManager.path : "";
  }

  async listFiles() {
    this.updateConnectionStatus(null, "Loading...");
    try {
      const currentPath = this.activePath;
      const { data, error } = await this.storageService.list(currentPath, {
        limit: 500, offset: 0, sortBy: { column: "name", order: "asc" }
      });
      if (error) throw error;

      this.allItems = data;

      this.updateConnectionStatus(true, `Connected • Encrypted Vault Active`);
      this.renderView();
    } catch (err) {
      console.error(err);
      this.updateConnectionStatus(false, err.message || "Failed to list files");
      this.showToast(err.message || "Failed to list files", "error");
    }
  }

  renderView() {
    this.breadcrumbManager?.render();

    const searchVal = document.getElementById("searchInput")?.value.toLowerCase() || "";
    this.filteredItems = searchVal
      ? this.allItems.filter(file => (file.getDisplayName() || file.getName()).toLowerCase().includes(searchVal))
      : [...this.allItems];

    this.filteredItems.sort((a, b) => {
      if (a.isFolderNode() !== b.isFolderNode()) {
        return a.isFolderNode() ? -1 : 1;
      }
      return a.getDisplayName().localeCompare(b.getDisplayName());
    });

    const label = document.getElementById("itemCountLabel");
    if (label) label.textContent = `${this.filteredItems.length} item${this.filteredItems.length !== 1 ? "s" : ""}`;

    this.gridRenderer?.render(this.filteredItems, this.activePath);
  }

  openCreateFolderModal() {
    const input = document.getElementById("folderNameInput");
    const modal = document.getElementById("modalCreateFolder");
    if (input) input.value = "";
    if (modal) modal.classList.remove("hidden");
  }

  async submitCreateFolder() {
    const name = document.getElementById("folderNameInput")?.value.trim();
    if (!name) return;

    const currentPath = this.activePath;
    const folderPath = currentPath
      ? `${currentPath}/${name}/.emptyFolderPlaceholder`
      : `${name}/.emptyFolderPlaceholder`;

    try {
      const { error } = await this.storageService.upload(folderPath, new Blob([""]), { upsert: false });
      if (error) throw error;

      this.closeModals();
      this.showToast(`Folder "${name}" created`, "success");
      this.listFiles();
    } catch (err) {
      this.showToast(err.message || "Failed to create folder", "error");
    }
  }

  toggleActionsMenu() {
    document.getElementById("actionsMenu")?.classList.toggle("hidden");
  }

  async handleFileUpload(event, isFolderUpload = false, isEncrypted = false) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    this.showToast(`Uploading ${files.length} item(s) (${isEncrypted ? 'Encrypted' : 'Normal'})...`, "info", 2500);
    let success = 0, failed = 0;
    const currentPath = this.activePath;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let targetPath = currentPath ? `${currentPath}/` : "";
        if (isFolderUpload && file.webkitRelativePath) {
          targetPath += file.webkitRelativePath;
        } else {
          targetPath += file.name;
        }

        const { error } = await this.storageService.upload(targetPath, file, { cacheControl: "3600", upsert: true, isEncrypted });
        if (error) throw error;

        success++;
        if ((i + 1) % 5 === 0 || i === files.length - 1) {
          this.showToast(`Uploaded ${i + 1} / ${files.length}`, "info", 1200);
        }
      } catch (err) {
        console.error(err);
        failed++;
        this.showToast(`Failed: ${file.name}`, "error", 2500);
      }
    }

    await this.listFiles();
    if (failed === 0) {
      this.showToast(`Successfully uploaded ${success} item(s)`, "success");
    } else {
      this.showToast(`Uploaded ${success}, failed ${failed}`, "warning");
    }
    event.target.value = "";
  }

  async openPreview(path, name, file = null) {
    if (this.filePreviewManager) await this.filePreviewManager.openPreview(path, name, file);
  }

  cancelEditText() {
    this.filePreviewManager?.cancelEditText();
  }

  async saveEditedText() {
    await this.filePreviewManager?.saveEditedText();
  }

  async downloadFile(path, name) {
    try {
      await this.storageService.downloadFile(path, name);
    } catch (err) {
      this.showToast(err.message || "Download failed", "error");
    }
  }

  async createBackup() {
    const btn = document.getElementById("backupBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = Theme.getBackupLoadingHTML();
    }
    
    await this.storageService.runBackup();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = Theme.getBackupIdleHTML();
    }
  }

  async deleteItem(path, isFolder) {
    const confirmMsg = isFolder
      ? `Delete folder "${path}" and all its contents?`
      : `Delete file "${path}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      if (isFolder) {
        const { data: files, error: listError } = await this.storageService.list(path, { limit: 1000 });
        if (listError) throw listError;

        const pathsToDelete = (files || []).map(f => `${path}/${f.name}`);
        pathsToDelete.push(`${path}/.emptyFolderPlaceholder`);

        if (pathsToDelete.length > 0) {
          const { error } = await this.storageService.remove(pathsToDelete);
          if (error) throw error;
        }
      } else {
        const { error } = await this.storageService.remove([path]);
        if (error) throw error;
      }

      this.showToast("Deleted successfully", "success");
      this.listFiles();
    } catch (err) {
      console.error(err);
      this.showToast(err.message || "Delete failed", "error");
    }
  }

  showToast(msg, type, duration) { if (typeof showToast === "function") showToast(msg, type, duration); }
  updateConnectionStatus(status, msg) { if (typeof updateConnectionStatus === "function") updateConnectionStatus(status, msg); }
  closeModals() {
    document.getElementById("modalCreateFolder")?.classList.add("hidden");
    document.getElementById("modalPreview")?.classList.add("hidden");
    if (typeof closeModals === "function") closeModals();
  }
}

fileManager = new FileManager({ storageService: 'drive' });
fileManager.init();
