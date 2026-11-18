class ItemsGridRenderer {
  // --- UI & HTML Templates ---
  static get _TEMPLATES() {
    return {
      containerClass: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 p-4",
      cardClass: `
        group relative bg-transparent border border-white/20 hover:border-indigo-400 
        rounded-xl p-3 flex flex-col items-center justify-between text-center 
        cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 
        aspect-square overflow-hidden
      `,
      emptyState: `
        <div class="col-span-full py-16 text-center text-slate-400 text-sm">
          <i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-90 hover:opacity-100"></i>
          No items found
        </div>`,
      folderIcon: `
        <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-folder text-5xl"></i>
        </div>`,
      fileMedia: (file) => {
        const mediaClass = "widget-preview-area flex-1 w-full h-full object-cover overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors";
        if (file.isImage()) {
          return `<img class="${mediaClass}" alt="${escapeHtml(file.getDisplayName())}">`;
        }
        if (file.isVideo()) {
          return `<video class="${mediaClass}" muted playsinline preload="metadata" aria-label="${escapeHtml(file.getDisplayName())}"></video>`;
        }
        return `
          <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors">
            <i class="${file.getFileIconClass()} text-3xl"></i>
          </div>`;
      },
      card: (file, mediaHTML) => `
        <button class="delete-btn absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-red-500 text-white transition" title="Delete">
          <i class="fa-solid fa-xmark text-[10px]"></i>
        </button>
        ${mediaHTML}
        <div class="w-full pt-2 border-t border-white/20 flex flex-col">
          <span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(file.getDisplayName())}">${escapeHtml(file.getDisplayName())}</span>
          <span class="text-[9px] text-slate-300 font-mono mt-0.5">${file.getSubtext()}</span>
        </div>`,
    };
  }

  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onItemClick = options.onItemClick || (() => {});
    this.onRefresh = options.onRefresh || (() => {});
  }
  
  async render(items) {
    if (!this.container) return;
    
    this.container.className = ItemsGridRenderer._TEMPLATES.containerClass;
    this.container.innerHTML = "";
    
    if (!items || items.length === 0) {
      this.container.innerHTML = ItemsGridRenderer._TEMPLATES.emptyState;
      return;
    }

    for (const file of items) {
      const card = document.createElement("div");
      card.className = ItemsGridRenderer._TEMPLATES.cardClass;
      card.onclick = () => this.onItemClick(file);
      
      const mediaHTML = file.isFolderNode()
        ? ItemsGridRenderer._TEMPLATES.folderIcon 
        : ItemsGridRenderer._TEMPLATES.fileMedia(file);

      card.innerHTML = ItemsGridRenderer._TEMPLATES.card(file, mediaHTML);

      const deleteBtn = card.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.deleteItem(file);
        };
      }

      this.container.appendChild(card);

      const previewEl = card.querySelector(".widget-preview-area");
      if ((file.isImage() && previewEl instanceof HTMLImageElement)
        || (file.isVideo() && previewEl instanceof HTMLVideoElement)) {
        file.loadPreviewMedia(previewEl).catch(error => {
          console.error("Failed to load file preview:", error);
        });
      }
    }
  }

  async deleteItem(file) {
    const path = file.getFullPath();
    const isFolder = file.isFolderNode();

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
      } else {
        const { error } = await file.delete();
        if (error) throw error;
      }

      if (typeof showToast === "function") {
        showToast("Deleted successfully", "success");
      }
      this.onRefresh();
    } catch (err) {
      console.error(err);
      if (typeof showToast === "function") {
        showToast(err.message || "Delete failed", "error");
      }
    }
  }
}

class FilePreviewManager {
  // --- UI & HTML Templates (Pure HTML / String Literals only — NO logic) ---
  static get _TEMPLATES() {
    return {
      modalHtml: `
        <div id="modalPreview" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-0 m-0">
          <div class="w-screen h-screen flex flex-col overflow-hidden m-0 p-0 text-slate-100">
            <div class="flex items-center justify-between px-6 py-3.5 border-b border-white/15 bg-black/40 shrink-0">
              <h3 id="previewTitle" class="font-bold text-sm text-white truncate"></h3>
              <button id="closePreviewModalBtn" class="text-slate-400 hover:text-white p-1 text-lg transition">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
      
            <div class="flex-1 flex overflow-hidden bg-transparent">
              <div id="previewBody" class="flex-1 overflow-auto flex items-center justify-center"></div>
      
              <div class="w-80 border-l border-white/15 bg-zinc-950/60 flex flex-col overflow-y-auto p-4 shrink-0">
                <div class="flex items-center gap-2 pb-3 mb-3 border-b border-white/15">
                  <i class="fa-solid fa-fingerprint text-indigo-400 text-sm"></i>
                  <h4 class="font-bold text-xs uppercase tracking-wider text-slate-200">File Details & Hashes</h4>
                </div>
                <div id="previewSidebarDetails" class="space-y-4 text-xs text-slate-300"></div>
              </div>
            </div>
      
            <div class="px-6 py-3.5 border-t border-white/15 bg-black/40 flex justify-end gap-2 flex-wrap shrink-0">
              <button id="previewSaveBtn" class="hidden px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400 text-emerald-200 hover:text-white text-xs font-semibold rounded-lg transition">
                <i class="fa-solid fa-floppy-disk mr-1 text-emerald-400"></i> Save
              </button>
              <button id="previewCancelEditBtn" class="hidden px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">
                Cancel
              </button>
              <a id="previewDownloadBtn" href="#" download class="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400 text-indigo-200 hover:text-white text-xs font-semibold rounded-lg transition">
                <i class="fa-solid fa-download mr-1 text-indigo-400"></i> Download
              </a>
              <button id="closePreviewModalBtnAlt" class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Close</button>
            </div>
          </div>
        </div>`,

      loadingSpinner: `<div class="wire-subtext py-12 flex justify-center"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>`,
      
      sidebarLoading: `
        <div class="text-center py-10 space-y-2 wire-subtext">
          <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-400"></i>
          <p class="text-xs">Loading info...</p>
        </div>`,

      // Pure template receiving pre-computed strings
      sidebarContent: ({ displayName, url, pathHash, fullPath, sizeDisplay }) => `
        <div class="space-y-4 text-xs wire-subtext">
          <div>
            <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Name</span>
            <p class="wire-text font-medium break-all">${displayName}</p>
          </div>
          <div>
            <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Size</span>
            <p class="wire-text font-mono text-xs">${sizeDisplay}</p>
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">Signed URL</span>
              <div class="space-x-2">
                <button onclick="navigator.clipboard.writeText('${url}'); showToast('URL copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy</button>
                <a href="${url}" download="${displayName}" class="text-[11px] text-indigo-300 hover:text-indigo-200"><i class="fa-solid fa-download"></i> Download</a>
              </div>
            </div>
            <div class="font-mono text-[9px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all max-h-16 overflow-y-auto">${url}</div>
          </div>
          <hr class="border-white/20">
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">1. Path Hash</span>
              <button onclick="navigator.clipboard.writeText('${pathHash}'); showToast('Path hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
            </div>
            <div>
              <span class="text-[10px] wire-subtext block mb-0.5">Exact string hashed: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">${fullPath}</code></span>
              <div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${pathHash}</div>
            </div>
          </div>
          <div class="space-y-3" id="hashesComputeContainer">
            <div>
              <span class="text-[10px] wire-subtext block mb-1">Content & Combined Hashes are uncalculated</span>
              <button class="content-hash w-full py-2.5 bg-transparent hover:border-indigo-300 wire-border text-indigo-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-fingerprint"></i> Calculate Content & Combined Hashes
              </button>
            </div>
          </div>
        </div>`,

      hashesResult: ({ contentHash, combinedHash, rawCombinedString, byteLength }) => `
        <div class="space-y-4">
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">2. Content Hash</span>
              <button onclick="navigator.clipboard.writeText('${contentHash}'); showToast('Content hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
            </div>
            <div>
              <span class="text-[10px] wire-subtext block mb-0.5">Hashed input: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">ArrayBuffer (${byteLength} bytes)</code></span>
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
              <div class="font-mono text-[9px] bg-black/40 wire-subtext p-1.5 rounded wire-border break-all select-all max-h-14 overflow-y-auto mb-1">${rawCombinedString}</div>
              <div class="font-mono text-[10px] bg-slate-950/90 text-emerald-400 p-2 rounded wire-border break-all select-all">${combinedHash}</div>
            </div>
          </div>
        </div>
      `,

      hashesError: (message) => `
        <div class="text-xs text-rose-400 p-2 bg-rose-950/60 wire-border rounded">Failed to compute hashes: ${message}</div>
      `,

      imageBody: (url, altText) => `<img src="${url}" alt="${altText}" class="max-w-full h-full shadow-md object-contain">`,
      videoBody: (url) => `<video controls class="max-w-full max-h-[70vh] rounded-lg shadow-md wire-border" src="${url}"></video>`,
      audioBody: (url, displayName) => `
        <div class="w-full max-w-lg text-center">
          <audio controls class="w-full mb-3" src="${url}"></audio>
          <p class="text-xs wire-text">${displayName}</p>
        </div>`,
      htmlBody: (text) => `
        <div class="flex flex-col h-full w-full">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
            <div class="flex items-center gap-1 bg-black/40 p-1 rounded wire-border text-xs">
              <button type="button" id="htmlPreviewTab" class="px-3 py-1 rounded bg-indigo-600 text-white font-medium transition">Preview</button>
              <button type="button" id="htmlEditorTab" class="px-3 py-1 rounded wire-subtext hover:text-white transition">Code Editor</button>
            </div>
            <span class="text-[11px] wire-subtext italic">HTML Interactive File</span>
          </div>
          <div id="htmlPreviewContainer" class="w-full h-[70vh] bg-white rounded-lg overflow-hidden wire-border">
            <iframe id="htmlPreviewFrame" class="w-full h-full border-0" sandbox="allow-scripts allow-modals"></iframe>
          </div>
          <div id="htmlEditorContainer" class="w-full h-[70vh] hidden">
            <textarea id="editTextarea" class="w-full h-full font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${text}</textarea>
          </div>
        </div>`,
      textBody: (text) => `<textarea id="editTextarea" class="w-full h-[75vh] font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${text}</textarea>`,
      errorBody: `
        <div class="text-center space-y-4 py-12 wire-subtext">
          <i class="fa-solid fa-file text-5xl"></i>
          <p class="text-sm">Preview not available for this file type.</p>
        </div>`,
      sidebarError: `<p class="text-xs text-rose-400 p-2">Failed to load file details.</p>`,
      activeTabClass: "px-3 py-1 rounded bg-indigo-600 text-white font-medium transition",
      inactiveTabClass: "px-3 py-1 rounded wire-subtext hover:text-white transition"
    };
  }

  constructor(options = {}) {
    this.currentFileRecord = null;
    this.onToast = options.onToast || ((msg, type) => console.log(msg));
    this.onSaveSuccess = options.onSaveSuccess || (() => {});
    
    this._ensureModalInDOM();
    this._initModalListeners();
  }

  _ensureModalInDOM() {
    if (!document.getElementById("modalPreview")) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = FilePreviewManager._TEMPLATES.modalHtml.trim();
      document.body.appendChild(tempDiv.firstChild);
    }
  }

  _initModalListeners() {
    const closeModal = () => {
      const modal = document.getElementById("modalPreview");
      if (modal) modal.classList.add("hidden");
    };

    document.getElementById("closePreviewModalBtn")?.addEventListener("click", closeModal);
    document.getElementById("closePreviewModalBtnAlt")?.addEventListener("click", closeModal);
    document.getElementById("previewCancelEditBtn")?.addEventListener("click", () => this.cancelEditText());
    document.getElementById("previewSaveBtn")?.addEventListener("click", () => this.saveEditedText());
  }

  async openPreview(fileRecord) {
    this.currentFileRecord = fileRecord;

    // Prevent memory leaks from previous blob URLs
    if (this._currentBlobUrl) {
      URL.revokeObjectURL(this._currentBlobUrl);
      this._currentBlobUrl = null;
    }

    const title = document.getElementById("previewTitle");
    const body = document.getElementById("previewBody");
    const sidebar = document.getElementById("previewSidebarDetails");
    const saveBtn = document.getElementById("previewSaveBtn");
    const cancelBtn = document.getElementById("previewCancelEditBtn");

    if (title) title.textContent = fileRecord.getDisplayName() + (fileRecord.isEncryptedFile() ? " (Decrypted securely)" : "");
    if (body) body.innerHTML = FilePreviewManager._TEMPLATES.loadingSpinner;
    if (sidebar) sidebar.innerHTML = FilePreviewManager._TEMPLATES.sidebarLoading;
    document.getElementById("modalPreview")?.classList.remove("hidden");

    saveBtn?.classList.add("hidden");
    cancelBtn?.classList.add("hidden");

    try {
      const response = await fileRecord.fetchContent(60);
      const blob = await response.blob();
      
      fileRecord._byteLength = blob.size;
      this._currentBlobUrl = URL.createObjectURL(blob);

      const displayName = escapeHtml(fileRecord.getDisplayName());
      const escapedUrl = escapeHtml(this._currentBlobUrl);

      // 1. Populate Sidebar
      if (sidebar) {
        sidebar.innerHTML = FilePreviewManager._TEMPLATES.sidebarContent({
          displayName,
          url: escapedUrl,
          pathHash: fileRecord.hash_filename || "",
          fullPath: escapeHtml(fileRecord.getFullPath()),
          sizeDisplay: fileRecord.getFormattedSize()
        });

        sidebar.querySelector(".content-hash")?.addEventListener("click", () => this.computeContentAndCombinedHashes(escapedUrl));
      }

      // 2. Render Body
      if (fileRecord.isImage()) {
        body.innerHTML = FilePreviewManager._TEMPLATES.imageBody(escapedUrl, displayName);
      } else if (fileRecord.isVideo()) {
        body.innerHTML = FilePreviewManager._TEMPLATES.videoBody(escapedUrl);
      } else if (fileRecord.isAudio()) {
        body.innerHTML = FilePreviewManager._TEMPLATES.audioBody(escapedUrl, displayName);
      } else {
        const text = await blob.text();
        const escapedText = escapeHtml(text);

        if (fileRecord.isHtml()) {
          body.innerHTML = FilePreviewManager._TEMPLATES.htmlBody(escapedText);
          document.getElementById("htmlPreviewTab")?.addEventListener("click", () => this.switchHtmlView("preview"));
          document.getElementById("htmlEditorTab")?.addEventListener("click", () => this.switchHtmlView("editor"));
          setTimeout(() => {
            const iframe = document.getElementById("htmlPreviewFrame");
            if (iframe) iframe.srcdoc = text;
          }, 50);
        } else {
          body.innerHTML = FilePreviewManager._TEMPLATES.textBody(escapedText);
          saveBtn?.classList.remove("hidden");
          cancelBtn?.classList.remove("hidden");
        }
      }

      // 3. Download Button
      const downloadBtn = document.getElementById("previewDownloadBtn");
      if (downloadBtn) {
        downloadBtn.href = escapedUrl;
        downloadBtn.setAttribute("download", fileRecord.getDisplayName());
      }
    } catch (err) {
      console.error("Preview failed:", err);
      if (body) body.innerHTML = FilePreviewManager._TEMPLATES.errorBody;
      if (sidebar) sidebar.innerHTML = FilePreviewManager._TEMPLATES.sidebarError;
    }
  }

  async computeContentAndCombinedHashes(url) {
    const container = document.getElementById("hashesComputeContainer");
    if (!container || !this.currentFileRecord) return;

    container.innerHTML = `
      <div class="text-center py-4 space-y-2 wire-subtext">
        <i class="fa-solid fa-spinner fa-spin text-indigo-400"></i>
        <p class="text-[10px]">Computing cryptographic hashes...</p>
      </div>
    `;

    try {
      await this.currentFileRecord.hashContent(url);

      const contentHash = this.currentFileRecord.hash_content;
      const combinedHash = this.currentFileRecord.hash_file;
      const pathHash = this.currentFileRecord.hash_filename;

      if (!contentHash || !combinedHash) {
        throw new Error("Hash computation returned empty results.");
      }

      // Compute and escape outside the template
      const rawCombinedString = escapeHtml(pathHash + contentHash);
      const byteLength = this.currentFileRecord._byteLength || "Unknown";

      container.innerHTML = FilePreviewManager._TEMPLATES.hashesResult({
        contentHash,
        combinedHash,
        rawCombinedString,
        byteLength
      });

    } catch (err) {
      console.error(err);
      container.innerHTML = FilePreviewManager._TEMPLATES.hashesError(escapeHtml(err.message || "Unknown error"));
    }
  }

  switchHtmlView(view) {
    const previewTab = document.getElementById("htmlPreviewTab");
    const editorTab = document.getElementById("htmlEditorTab");
    const previewContainer = document.getElementById("htmlPreviewContainer");
    const editorContainer = document.getElementById("htmlEditorContainer");
    const iframe = document.getElementById("htmlPreviewFrame");
    const textarea = document.getElementById("editTextarea");

    if (view === "preview") {
      if (iframe && textarea) iframe.srcdoc = textarea.value;
      previewContainer?.classList.remove("hidden");
      editorContainer?.classList.add("hidden");
      if (previewTab) previewTab.className = FilePreviewManager._TEMPLATES.activeTabClass;
      if (editorTab) editorTab.className = FilePreviewManager._TEMPLATES.inactiveTabClass;
    } else {
      previewContainer?.classList.add("hidden");
      editorContainer?.classList.remove("hidden");
      if (editorTab) editorTab.className = FilePreviewManager._TEMPLATES.activeTabClass;
      if (previewTab) previewTab.className = FilePreviewManager._TEMPLATES.inactiveTabClass;
    }
  }

  async cancelEditText() {
    if (this.currentFileRecord) {
      this.openPreview(this.currentFileRecord);
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
  // --- UI & HTML Templates ---
  static get _TEMPLATES() {
    return {
      crumb: (name, isRoot) => isRoot 
        ? `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(name)}</span>`
        : `<span>${escapeHtml(name)}</span>`,
      separatorClass: "opacity-50 mx-1",
      crumbClass: (isLast) => (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center"
    };
  }

  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onNavigate = options.onNavigate || (() => {});
    this.history = [{ path: "", name: "root" }];
    this.path = "";
  }

  navigateToFolder(path, name) {
    if (this.path === path) return;
    this.path = path;
    this.history.push({ path, name });
    this.render();
    this.onNavigate(this.path);
  }

  jumpToBreadcrumb(index) {
    this.history = this.history.slice(0, index + 1);
    this.path = this.history[this.history.length - 1].path;
    this.render();
    this.onNavigate(this.path);
  }

  reset() {
    this.path = "";
    this.history = [{ path: "", name: "root" }];
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";
    this.history.forEach((crumb, idx) => {
      const isLast = idx === this.history.length - 1;
      const btn = document.createElement("button");
      btn.className = BreadcrumbManager._TEMPLATES.crumbClass(isLast);
      
      const isRoot = crumb.name.toLowerCase() === "root";
      btn.innerHTML = BreadcrumbManager._TEMPLATES.crumb(crumb.name, isRoot);
      btn.onclick = () => this.jumpToBreadcrumb(idx);
      this.container.appendChild(btn);

      if (!isLast) {
        const sep = document.createElement("span");
        sep.className = BreadcrumbManager._TEMPLATES.separatorClass;
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
    
    this.breadcrumb = new BreadcrumbManager("breadcrumbNav", {
      onNavigate: () => this.listFiles()
    });
    this.gridRenderer = new ItemsGridRenderer("itemsGrid", {
      onItemClick: (file) => {
        if (file.isFolderNode()) {
          this.breadcrumb.navigateToFolder(file.getFullPath(), file.getName());
        } else {
          this.openPreview(file);
        }
      },
      onRefresh: () => this.listFiles()
    });
    this.filePreview = new FilePreviewManager({
      onToast: (msg, type, duration) => showToast(msg, type, duration),
      onSaveSuccess: () => this.listFiles()
    });

    // Initialize the self-contained folder modal module
    this.createFolderModal = new CreateFolderModal(this);

    this.listFiles();
  }

  async listFiles() {
    try {
      const { data, error } = await FileRecord.all(this.breadcrumb.path);
      if (error) throw error;
      this.allItems = data;
      this.renderView();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to list files", "error");
    }
  }

  renderView() {
    this.breadcrumb.render();

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

    this.gridRenderer?.render(this.filteredItems);
  }

  toggleActionsMenu() {
    document.getElementById("actionsMenuToggleBtn")?.classList.toggle("hidden");
  }

  async handleFileUpload(event, isFolderUpload = false, isEncrypted = false) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    showToast(`Uploading ${files.length} item(s) (${isEncrypted ? 'Encrypted' : 'Normal'})...`, "info", 2500);
    let success = 0, failed = 0;
    const currentPath = this.breadcrumb.path;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let targetPath = currentPath ? `${currentPath}/` : "";
        if (isFolderUpload && file.webkitRelativePath) {
          targetPath += file.webkitRelativePath;
        } else {
          targetPath += file.name;
        }

        const { error } = await FileRecord.create(targetPath, file, { encrypt: isEncrypted });
        if (error) throw error;

        success++;
        if ((i + 1) % 5 === 0 || i === files.length - 1) {
          showToast(`Uploaded ${i + 1} / ${files.length}`, "info", 1200);
        }
      } catch (err) {
        console.error(err);
        failed++;
        showToast(`Failed: ${file.name}`, "error", 2500);
      }
    }

    await this.listFiles();
    if (failed === 0) {
      showToast(`Successfully uploaded ${success} item(s)`, "success");
    } else {
      showToast(`Uploaded ${success}, failed ${failed}`, "warning");
    }
    event.target.value = "";
  }

  async openPreview(file) {
    await this.filePreview.openPreview(file);
  }

  cancelEditText() {
    this.filePreview.cancelEditText();
  }

  async saveEditedText() {
    await this.filePreview.saveEditedText();
  }

  async downloadFile(path, name) {
    try {
      await FileRecord.download(path, name);
    } catch (err) {
      showToast(err.message || "Download failed", "error");
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
}

/**
 * Self-Contained Create Folder Modal Class
 * Automatically injects its HTML template into the DOM and binds all events.
 */
class CreateFolderModal {
  constructor(fileManagerInstance) {
    this.fileManager = fileManagerInstance;
    this.injectHTML();
    this.initListeners();
  }

  injectHTML() {
    if (document.getElementById("modalCreateFolder")) return;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div id="modalCreateFolder" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
        <div class="bg-zinc-900/80 border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <h3 class="font-bold text-base text-white">Create New Folder</h3>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Folder Name</label>
            <input type="text" id="folderNameInput" placeholder="e.g. documents" 
                   class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs focus:outline-none focus:border-indigo-400">
          </div>
          <div class="flex justify-end space-x-2 pt-2">
            <button id="closeCreateFolderModalBtn" class="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button>
            <button id="submitCreateFolderBtn" class="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">Create Folder</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  initListeners() {
    const openModalBtn = document.getElementById("openCreateFolderModalBtn");
    const closeModalBtn = document.getElementById("closeCreateFolderModalBtn");
    const submitModalBtn = document.getElementById("submitCreateFolderBtn");
    const folderNameInput = document.getElementById("folderNameInput");

    if (openModalBtn) {
      openModalBtn.addEventListener("click", () => this.open());
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => this.close());
    }

    if (submitModalBtn) {
      submitModalBtn.addEventListener("click", () => this.submit());
    }

    if (folderNameInput) {
      folderNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.submit();
        }
      });
    }
  }

  open() {
    const input = document.getElementById("folderNameInput");
    const modal = document.getElementById("modalCreateFolder");
    if (input) input.value = "";
    if (modal) modal.classList.remove("hidden");
    
    document.getElementById("actionsMenuToggleBtn")?.classList.add("hidden");
    if (input) setTimeout(() => input.focus(), 50);
  }

  close() {
    const modal = document.getElementById("modalCreateFolder");
    if (modal) modal.classList.add("hidden");
  }

  async submit() {
    const name = document.getElementById("folderNameInput")?.value.trim();
    if (!name) return;

    const currentPath = this.fileManager.breadcrumb.path;
    const folderPath = currentPath
      ? `${currentPath}/${name}/.emptyFolderPlaceholder`
      : `${name}/.emptyFolderPlaceholder`;

    try {
      const { error } = await FileRecord.create(folderPath, new Blob([""]), { upsert: false });
      if (error) throw error;

      this.close();
      showToast(`Folder "${name}" created`, "success");
      this.fileManager.listFiles();
    } catch (err) {
      showToast(err.message || "Failed to create folder", "error");
    }
  }
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("actionsMenu");
  if (!menu) return;

  const actionsMenuBtn = document.getElementById('actionsMenu');
  const actionsMenuDropdown = document.getElementById('actionsMenuToggleBtn');

  if (actionsMenuBtn && actionsMenuDropdown) {
    // Toggle dropdown visibility on click
    actionsMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      actionsMenuDropdown.classList.toggle('hidden');
    });

    // Close the dropdown when clicking anywhere outside of it
    document.addEventListener('click', (e) => {
      if (!actionsMenuBtn.contains(e.target) && !actionsMenuDropdown.contains(e.target)) {
        actionsMenuDropdown.classList.add('hidden');
      }
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileUpload");
  const encryptedInput = document.getElementById("encryptedFileUpload");
  const folderInput = document.getElementById("folderUpload");

  // 1. Normal File Upload
  fileInput.addEventListener("change", (e) => fileManager.handleFileUpload(e, false, false));

  // 2. Encrypted File Upload
  if (encryptedInput && typeof fileManager !== "undefined") {
    encryptedInput.addEventListener("change", (e) => {
      const passphrase = FileRecord.getEncryptionPassphrase();
      if (!passphrase) {
        if (typeof showToast === "function") {
          showToast("Please set an encryption passphrase in settings first!", "error");
        } else {
          alert("Please set an encryption passphrase in settings first!");
        }
        encryptedInput.value = "";
        return;
      }
      fileManager.handleFileUpload(e, false, true);
    });
  }

  // 3. Folder Upload
  if (folderInput && typeof fileManager !== "undefined") {
    folderInput.addEventListener("change", (e) => fileManager.handleFileUpload(e, true, false));
  }
});
const fileManager = new FileManager();
