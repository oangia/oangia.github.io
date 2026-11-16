class ItemsGridRenderer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onItemClick = options.onItemClick || (() => {});
    this.onDeleteClick = options.onDeleteClick || (() => {});
    this.storageService = options.storageService;
  }

  isEncryptedFile(name) { return String(name || "").endsWith(".enc"); }
  getOriginalFilename(name) { return this.isEncryptedFile(name) ? name.slice(0, -4) : name; }
  isImage(name) { return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(this.getOriginalFilename(name)); }

  async render(items, currentPath) {
    if (!this.container) return;
    
    this.container.className = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 p-4";
    this.container.innerHTML = "";
    
    if (!items || items.length === 0) {
      this.container.innerHTML = `<div class="col-span-full text-center py-10 opacity-60">No items found</div>`;
      return;
    }

    const thumbnailTasks = [];

    // 1. Render all cards instantly without awaiting network calls in the loop
    for (const item of items) {
      const isFolder = !item.id;
      const encrypted = !isFolder && this.isEncryptedFile(item.name);
      const displayName = isFolder ? item.name : this.getOriginalFilename(item.name);
      const fullPath = item.fullPath || (currentPath ? `${currentPath}/${item.name}` : item.name);
      const sizeStr = isFolder ? "" : formatBytes(item.metadata?.size || 0) + encrypted ? "<span class=\"text-emerald-400\">Encrypted</span>" : "";
      
      const card = document.createElement("div");
      card.className = Theme.getGridCardClasses(); // "group relative border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden";
      card.onclick = () => this.onItemClick(item, fullPath, isFolder);
      
      const previewContainerId = `thumb-${Math.random().toString(36).substring(2, 9)}`;
      
      const mediaHTML = isFolder 
        ? `<div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><i class="fa-solid fa-folder text-5xl"></i></div>`
        : `<div id="${previewContainerId}" class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg relative group-hover:scale-110  transition-colors">
             <i class="fa-solid ${encrypted ? 'fa-file-shield text-emerald-400 text-3xl' : 'fa-file-lines text-slate-400 text-3xl'}"></i>
           </div>`;
      
      card.innerHTML = Theme.getGridCardHTML(mediaHTML, displayName, sizeStr, isFolder);
      /*card.innerHTML = `
        ${mediaHTML}
        <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
          <span class="w-full text-xs font-bold text-slate-700 truncate" title="${displayName}">${displayName}</span>
          <span class="text-[9px] text-slate-400 font-mono mt-0.5">${sizeStr}</span>
        </div>
        <button class="delete-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 p-1">
          <i class="fa-solid fa-trash text-xs"></i>
        </button>
      `;*/

      const deleteBtn = card.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.onDeleteClick(fullPath, isFolder);
        };
      }

      this.container.appendChild(card);

      // 2. Queue image thumbnail fetching tasks for background execution
      if (!isFolder && this.storageService && this.isImage(item.name)) {
        thumbnailTasks.push(async () => {
          try {
            const { data, error } = await this.storageService.getFileUrl(fullPath, 60);
            if (!error && data?.signedUrl) {
              const thumbEl = document.getElementById(previewContainerId);
              if (thumbEl) {
                thumbEl.innerHTML = `<img src="${data.signedUrl}" alt="${displayName}" class="w-full h-full object-cover rounded-lg" />`;
              }
            }
          } catch (e) {}
        });
      }
    }

    // 3. Fire all thumbnail requests concurrently in the background without blocking the grid
    if (thumbnailTasks.length > 0) {
      Promise.all(thumbnailTasks.map(task => task())).catch(() => {});
    }
  }
}

class FilePreviewManager {
  constructor(options = {}) {
    this.service = options.service;
    this.currentPreviewPath = null;
    this.currentPreviewName = null;
    this.onToast = options.onToast || ((msg, type) => console.log(msg));
  }

  setService(service) { this.service = service; }

  isEncryptedFile(name) { return String(name || "").endsWith(".enc"); }
  getOriginalFilename(name) { return this.isEncryptedFile(name) ? name.slice(0, -4) : name; }

  async openPreview(path, name) {
    const title = document.getElementById("previewTitle");
    const body = document.getElementById("previewBody");
    const modal = document.getElementById("modalPreview");
    
    const origName = this.getOriginalFilename(name);
    const encrypted = this.isEncryptedFile(name);

    if (title) title.textContent = origName + (encrypted ? " (Decrypted securely)" : "");
    if (body) body.innerHTML = `<div class="text-center py-10 text-slate-400">Decrypting and loading...</div>`;
    if (modal) modal.classList.remove("hidden");

    try {
      // This calls storageService.getFileUrl(), which transparently decrypts .enc files on-demand!
      const { data, error } = await this.service.getFileUrl(path, 60);
      if (error) throw error;
      const url = data.signedUrl;

      if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(origName)) {
        body.innerHTML = `<div class="flex items-center justify-center h-full"><img src="${url}" class="max-h-[70vh] object-contain rounded" /></div>`;
      } else if (/\.(mp4|webm|ogg|mov)$/i.test(origName)) {
        body.innerHTML = `<div class="flex items-center justify-center h-full"><video src="${url}" controls class="max-h-[70vh] rounded"></video></div>`;
      } else {
        // Fallback for text or general files
        const res = await fetch(url);
        const text = await res.text();
        body.innerHTML = `<textarea class="w-full h-96 bg-slate-950 text-slate-100 p-3 rounded font-mono text-xs" readonly>${text}</textarea>`;
      }
    } catch (err) {
      console.error(err);
      if (body) body.innerHTML = `<div class="text-center py-10 text-rose-400">Failed to decrypt or load file. Check your password in settings.</div>`;
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
    //const driveService = new DriveStorageService();
    if (!this.storageService) throw new Error("A storage service is required.");

    this.allItems = [];
    this.filteredItems = [];

    this.filePreviewManager = null;
    this.gridRenderer = null;
    this.breadcrumbManager = null;
    this.configManager = null;
  }

  _getService(serviceName) {
    // supa, drive, local, firebase
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
     storageService: this.storageService, // <-- Pass this so cards can load thumbs lazily
     onItemClick: (item, fullPath, isFolder) => {
       if (isFolder) {
         this.breadcrumbManager.navigateToFolder(fullPath, item.name);
       } else {
         this.openPreview(fullPath, item.name);
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

      this.allItems = (data || []).filter(item => item.name !== ".emptyFolderPlaceholder");

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
      ? this.allItems.filter(i => (i.displayName || i.name).toLowerCase().includes(searchVal))
      : [...this.allItems];

    this.filteredItems.sort((a, b) => {
      // Folders first using the clean isFolder property
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      
      // Alphabetical sort using consistent display_name (with underscore)
      return a.display_name.localeCompare(b.display_name);
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

        // If storage service handles transparent encryption when passphrase is active or via flags
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

  async openPreview(path, name) {
    if (this.filePreviewManager) await this.filePreviewManager.openPreview(path, name);
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

  isEncryptedFile(name) { return String(name || "").endsWith(".enc"); }
  getOriginalFilename(name) { return this.isEncryptedFile(name) ? name.slice(0, -4) : name; }
  isImage(name) { return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(this.getOriginalFilename(name)); }
  isVideo(name) { return /\.(mp4|webm|ogg|mov)$/i.test(this.getOriginalFilename(name)); }
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
