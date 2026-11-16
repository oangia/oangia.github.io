class FileManager {
  constructor(config = {}) {
    this.storageService = config.storageService;
    if (!this.storageService) throw new Error("A storage service is required.");

    this.allItems = [];
    this.filteredItems = [];

    this.filePreviewManager = null;
    this.gridRenderer = null;
    this.breadcrumbManager = null;
    this.configManager = null;
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

      // FIX: Just assign paths and names instantly. No network downloads or decryption here!
      this.allItems.forEach(item => {
        const isFolder = !item.id;
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        item.fullPath = fullPath;
        item.isEncrypted = this.isEncryptedFile(item.name);
        item.displayName = item.isEncrypted ? this.getOriginalFilename(item.name) : item.name;
      });

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
      const aFolder = !a.id;
      const bFolder = !b.id;
      if (aFolder !== bFolder) return aFolder ? -1 : 1;
      return (a.displayName || a.name).localeCompare(b.displayName || b.name);
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

new Config("navSettingsTab");
//const sbManager = new SupabaseStorageService();
const driveService = new DriveStorageService();

fileManager = new FileManager({ storageService: driveService });
fileManager.init();
