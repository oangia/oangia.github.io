class ItemsGridRenderer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onItemClick = options.onItemClick || (() => {});
    this.onDeleteClick = options.onDeleteClick || (() => {});
  }
  
  async render(items, currentPath) {
    if (!this.container) return;
    
    this.container.className = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 p-4";
    this.container.innerHTML = "";
    
    if (!items || items.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400 text-sm">
          <i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-90 hover:opacity-100"></i>
          No items found
        </div>`;
      return;
    }

    const thumbnailTasks = [];

    for (const file of items) {
      const sizeStr = file.getSubtext();
      const isFolder = file.isFolderNode();
      const name = file.getDisplayName();
      
      const card = document.createElement("div");
      card.className = `
        group relative bg-transparent border border-white/20 hover:border-indigo-400 
        rounded-xl p-3 flex flex-col items-center justify-between text-center 
        cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 
        aspect-square overflow-hidden
      `;
      card.onclick = () => this.onItemClick(file, file.getFullPath(), isFolder);
      
      const previewContainerId = `thumb-${Math.random().toString(36).substring(2, 9)}`;
      
      const mediaHTML = isFolder
        ? `<div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><i class="fa-solid fa-folder text-5xl"></i></div>`
        : `<div id="${previewContainerId}" class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors">
             <i class="${file.getFileIconClass()} text-3xl"></i>
           </div>`;
      
      card.innerHTML = `
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

      const deleteBtn = card.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.onDeleteClick(file);
        };
      }

      this.container.appendChild(card);

      if (file.isImage()) {
        thumbnailTasks.push(async () => {
          try {
            const { data, error } = await file.fetchSignedUrl(60);
            if (!error && data?.signedUrl) {
              const thumbEl = document.getElementById(previewContainerId);
              if (thumbEl) {
                thumbEl.innerHTML = `<img src="${data.signedUrl}" alt="${escapeHtml(name)}" class="w-full h-full object-cover rounded-lg" />`;
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
}

class FilePreviewManager {
  constructor(options = {}) {
    this.currentFileRecord = null;
    this.onToast = options.onToast || ((msg, type) => console.log(msg));
    this.onSaveSuccess = options.onSaveSuccess || (() => {});
  }

  async openPreview(path, name, file = null) {
    const fileRecord = file || new FileRecord({ name: name, full_path: path });
    this.currentFileRecord = fileRecord;

    const title = document.getElementById("previewTitle");
    const body = document.getElementById("previewBody");
    const sidebar = document.getElementById("previewSidebarDetails");
    const modal = document.getElementById("modalPreview");

    if (title) title.textContent = fileRecord.getDisplayName() + (fileRecord.isEncryptedFile() ? " (Decrypted securely)" : "");
    if (body) {
      body.innerHTML = '<div class="wire-subtext py-12 flex justify-center"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>';
    }
    if (sidebar) {
      sidebar.innerHTML = `
        <div class="text-center py-10 space-y-2 wire-subtext">
          <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-400"></i>
          <p class="text-xs">Loading info...</p>
        </div>
      `;
    }
    if (modal) modal.classList.remove("hidden");

    try {
      const { data, error } = await fileRecord.fetchSignedUrl(60);
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

      const displayName = fileRecord.getDisplayName();
      const fullPath = fileRecord.getFullPath();
      const formattedBytes = fileSize ? new FileRecord({ size: fileSize }).getFormattedSize() : "Unknown";

      if (sidebar) {
        sidebar.innerHTML = `
          <div class="space-y-4 text-xs wire-subtext">
            <div>
              <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Name</span>
              <p class="wire-text font-medium break-all">${escapeHtml(displayName)}</p>
            </div>
            <div>
              <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Size</span>
              <p class="wire-text font-mono text-xs">${fileSize ? formattedBytes + ` (${fileSize} bytes)` : "Unknown"}</p>
            </div>
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">Signed URL</span>
                <div class="space-x-2">
                  <button onclick="navigator.clipboard.writeText('${escapeHtml(url)}'); showToast('URL copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy</button>
                  <a href="${escapeHtml(url)}" download="${escapeHtml(displayName)}" class="text-[11px] text-indigo-300 hover:text-indigo-200"><i class="fa-solid fa-download"></i> Download</a>
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
                <span class="text-[10px] wire-subtext block mb-0.5">Exact string hashed: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">${escapeHtml(fullPath)}</code></span>
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

      if (fileRecord.isImage()) {
        body.innerHTML = `<img src="${url}" alt="${escapeHtml(displayName)}" class="max-w-full h-full shadow-md object-contain">`;
      } else if (fileRecord.isVideo()) {
        body.innerHTML = `<video controls class="max-w-full max-h-[70vh] rounded-lg shadow-md wire-border" src="${url}"></video>`;
      } else if (fileRecord.isAudio()) {
        body.innerHTML = `
          <div class="w-full max-w-lg text-center">
            <audio controls class="w-full mb-3" src="${url}"></audio>
            <p class="text-xs wire-text">${escapeHtml(displayName)}</p>
          </div>`;
      } else if (fileRecord.isHtml()) {
        const text = await blob.text();
        body.innerHTML = `
          <div class="flex flex-col h-full w-full">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
              <div class="flex items-center gap-1 bg-black/40 p-1 rounded wire-border text-xs">
                <button type="button" onclick="filePreviewManager.switchHtmlView('preview')" id="htmlPreviewTab" class="px-3 py-1 rounded bg-indigo-600 text-white font-medium transition">Preview</button>
                <button type="button" onclick="filePreviewManager.switchHtmlView('editor')" id="htmlEditorTab" class="px-3 py-1 rounded wire-subtext hover:text-white transition">Code Editor</button>
              </div>
              <span class="text-[11px] wire-subtext italic">HTML Interactive File</span>
            </div>
            <div id="htmlPreviewContainer" class="w-full h-[70vh] bg-white rounded-lg overflow-hidden wire-border">
              <iframe id="htmlPreviewFrame" class="w-full h-full border-0" sandbox="allow-scripts allow-modals"></iframe>
            </div>
            <div id="htmlEditorContainer" class="w-full h-[70vh] hidden">
              <textarea id="editTextarea" class="w-full h-full font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${escapeHtml(text)}</textarea>
            </div>
          </div>
        `;
        setTimeout(() => {
          const iframe = document.getElementById("htmlPreviewFrame");
          if (iframe) iframe.srcdoc = text;
        }, 50);
      } else {
        const text = await blob.text();
        body.innerHTML = `<textarea id="editTextarea" class="w-full h-[75vh] font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${escapeHtml(text)}</textarea>`;
      }
    } catch (err) {
      console.error(err);
      if (body) {
        body.innerHTML = `
          <div class="text-center space-y-4 py-12 wire-subtext">
            <i class="fa-solid fa-file text-5xl"></i>
            <p class="text-sm">Preview not available for this file type.</p>
          </div>`;
      }
      if (sidebar) sidebar.innerHTML = `<p class="text-xs text-rose-400 p-2">Failed to load file details.</p>`;
    }
  }

  async cancelEditText() {
    if (this.currentFileRecord) {
      this.openPreview(
        this.currentFileRecord.getFullPath(),
        this.currentFileRecord.getName(),
        this.currentFileRecord
      );
    }
  }

  async saveEditedText() {
    const textarea = document.getElementById("editTextarea");
    if (!textarea || !this.currentFileRecord) return;

    try {
      const updatedContent = textarea.value;
      const blob = new Blob([updatedContent], { type: 'text/plain;charset=utf-8' });
      
      await this.currentFileRecord.save(blob);

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
        btn.innerHTML = `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(crumb.name)}</span>`;
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
      onToast: (msg, type, duration) => this.showToast(msg, type, duration),
      onSaveSuccess: () => this.listFiles()
    });

    this.gridRenderer = new ItemsGridRenderer("itemsGrid", {
      onItemClick: (file, fullPath, isFolder) => {
        if (isFolder) {
          this.breadcrumbManager.navigateToFolder(fullPath, file.getName());
        } else {
          this.openPreview(fullPath, file.getName(), file);
        }
      },
      onDeleteClick: (file) => this.deleteItem(file)
    });

    this.initializeServiceConnection();
  }
  
  initializeServiceConnection() {
    try {
      const headerUrl = document.getElementById("headerUrl");
      if (headerUrl) {
        headerUrl.innerHTML = `Storage Active<br />`;
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
      const { data, error } = await FileRecord.all(this.activePath);
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
      const { error } = await FileRecord.create(folderPath, new Blob([""]), { upsert: false });
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

        const { error } = await FileRecord.update(targetPath, file, { cacheControl: "3600", isEncrypted });
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
      await FileRecord.download(path, name);
    } catch (err) {
      this.showToast(err.message || "Download failed", "error");
    }
  }

  async createBackup() {
    const btn = document.getElementById("backupBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Backing up...</span>';
    }
    
    await FileRecord.backup();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-box-archive"></i> <span>Backup</span>';
    }
  }

  async deleteItem(fileOrPath, isFolderFlag = false) {
    const isRecord = fileOrPath instanceof FileRecord;
    const path = isRecord ? fileOrPath.getFullPath() : fileOrPath;
    const isFolder = isRecord ? fileOrPath.isFolderNode() : isFolderFlag;

    const confirmMsg = isFolder
      ? `Delete folder "${path}" and all its contents?`
      : `Delete file "${path}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      if (isFolder) {
        const { data: children, error: listError } = await FileRecord.all(path, { limit: 1000 });
        if (listError) throw listError;

        const pathsToDelete = (children || []).map(child => child.getFullPath());
        pathsToDelete.push(`${path}/.emptyFolderPlaceholder`);

        const { error } = await FileRecord.destroy(pathsToDelete);
        if (error) throw error;
      } else if (isRecord) {
        const { error } = await fileOrPath.delete();
        if (error) throw error;
      } else {
        const { error } = await FileRecord.destroy(path);
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

document.addEventListener("click", (e) => {
  const menu = document.getElementById("actionsMenu");
  if (!menu) return;
  if (!menu.contains(e.target) && !e.target.closest("button")?.getAttribute("onclick")?.includes("toggleActionsMenu")) {
    menu.classList.add("hidden");
  }
});

const fileManager = new FileManager();
fileManager.init();
