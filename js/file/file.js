class FilePreviewComponent {
  constructor() {
    this.ensureDOM();
  }

  ensureDOM() {
    if (document.getElementById("viewModal")) return;
    const modalHTML = `
      <div id="viewModal" class="fixed inset-0 bg-slate-950 z-50 flex flex-col hidden">
        <div class="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center border-b border-slate-800 shrink-0">
          <h3 id="viewModalTitle" class="font-bold text-xs truncate">File Preview</h3>
          <button id="closeViewModalBtn" class="text-slate-400 hover:text-white text-sm px-2 py-1"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex-1 flex flex-col w-full h-full overflow-hidden p-2">
          <div id="viewContentContainer" class="bg-black border border-slate-900 rounded-lg flex-1 flex items-center justify-center overflow-auto relative">
            <i class="fa-solid fa-spinner fa-spin text-xl text-blue-500"></i>
          </div>
        </div>
        <div class="bg-slate-900 text-white px-4 py-2 flex justify-between items-center border-t border-slate-800 shrink-0">
          <span id="viewDate" class="text-[11px] text-slate-400"></span>
          <a id="downloadFileBtn" href="#" download="" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition">
            <i class="fa-solid fa-download"></i> Download
          </a>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  get elements() {
    return {
      modal: document.getElementById("viewModal"),
      title: document.getElementById("viewModalTitle"),
      content: document.getElementById("viewContentContainer"),
      downloadBtn: document.getElementById("downloadFileBtn"),
      date: document.getElementById("viewDate"),
      closeBtn: document.getElementById("closeViewModalBtn")
    };
  }

  initEvents() {
    this.elements.closeBtn?.addEventListener("click", () => this.hide());
  }

  showLoading(fileName) {
    const el = this.elements;
    if (el.title) el.title.textContent = fileName;
    if (el.date) el.date.innerHTML = `<i class="fa-regular fa-clock"></i> Recent`;
    if (el.content) {
      el.content.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i><p class="text-xs text-slate-500">Reassembling file chunks...</p>`;
    }
    el.modal?.classList.remove("hidden");
  }

  render(fileRecord, fullBase64) {
    const el = this.elements;
    if (!el.content) return;
    const fileNameLower = fileRecord.title.toLowerCase();

    if (fullBase64.startsWith("data:image/")) {
      el.content.innerHTML = `<img src="${fullBase64}" class="w-full h-full object-contain">`;
    } else if (fullBase64.startsWith("data:video/")) {
      el.content.innerHTML = `<video controls class="w-full h-full object-contain bg-black"><source src="${fullBase64}"></video>`;
    } else if (fileNameLower.endsWith(".mp3") || fileNameLower.endsWith(".wav") || fileNameLower.endsWith(".ogg") || fullBase64.startsWith("data:audio/")) {
      el.content.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full gap-4 p-6">
          <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl shadow-inner">
            <i class="fa-solid fa-music"></i>
          </div>
          <p class="text-sm font-medium text-slate-700 text-center truncate w-full">${fileRecord.title}</p>
          <audio controls class="w-full max-w-md">
            <source src="${fullBase64}">
            Your browser does not support the audio element.
          </audio>
        </div>
      `;
    } else if (fileNameLower.endsWith(".txt") || fullBase64.startsWith("data:text/plain")) {
      try {
        const base64Content = fullBase64.split(',')[1];
        const textContent = atob(base64Content);
        el.content.innerHTML = `<pre class="w-full h-full overflow-auto p-4 bg-slate-950 text-slate-100 text-xs font-mono whitespace-pre-wrap">${textContent}</pre>`;
      } catch (err) {
        el.content.innerHTML = `<p class="text-xs text-red-400">Failed to load text preview.</p>`;
      }
    } else if (fileNameLower.endsWith(".pdf") || fullBase64.startsWith("data:application/pdf")) {
      el.content.innerHTML = `<iframe src="${fullBase64}" class="w-full h-full border-0 bg-white"></iframe>`;
    } else {
      el.content.innerHTML = `<div class="text-center"><i class="fa-solid fa-file-arrow-down text-4xl text-blue-500 mb-2"></i><p class="text-xs font-semibold text-slate-300">${fileRecord.title}</p></div>`;
    }

    if (el.downloadBtn) {
      el.downloadBtn.href = fullBase64;
      el.downloadBtn.download = fileRecord.title;
    }
  }

  hide() {
    const el = this.elements;
    if (el.content) el.content.innerHTML = "";
    el.modal?.classList.add("hidden");
  }
}
export class FileManager {
  constructor(config = {}) {
    this.containerId = config.containerId || "fileManagerApp";
    this.container = document.getElementById(this.containerId);

    this.service = config.firebaseService;

    this.currentFolderId = "root";
    this.contextTarget = null;
    this.previewer = new FilePreviewComponent();
  }

  // --------------------------------------------------
  // Public
  // --------------------------------------------------
  init() {
    this._mountUI();
    this._bindEvents();
    this.loadCurrentFolder();
  }

  switch(collections) {
    this.service.switch(collections);
    this.currentFolderId = "root";
    this.loadCurrentFolder();
  }

  // --------------------------------------------------
  // Mount UI (action buttons stay, view area uses new style)
  // --------------------------------------------------
  _mountUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <!-- Action Bar -->
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 justify-between items-center shrink-0 mb-4">
        <div class="flex items-center gap-2"></div>
        <div class="flex items-center gap-2">
          <button id="openFolderModalBtn" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-folder-plus text-amber-500"></i> New Folder
          </button>
          <button id="openCreateModalBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer">
            <i class="fa-solid fa-cloud-arrow-up"></i> Upload File
          </button>
          <button id="backupDataBtn" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-file-arrow-down"></i> Backup All Files
          </button>
        </div>
      </div>

      <!-- File Manager View (styled like the example) -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <!-- Breadcrumb & Control Bar -->
        <div class="bg-white border-b border-slate-200 px-5 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
          <div class="flex items-center gap-2">
            <button type="button" id="backBtn"
              class="widget-back-btn bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div id="pathText" class="text-slate-500 font-medium pl-2 border-l border-slate-200 truncate font-mono text-[11px]">
              /
            </div>
          </div>
          <div id="fileCountBadge" class="text-slate-400 font-medium text-[11px]">
            0 items
          </div>
        </div>

        <!-- File Grid -->
        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div id="fileGridContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          </div>
        </div>
      </div>
    `;

    const overlaysHTML = `
      <!-- CONTEXT MENU -->
      <div id="contextMenu" class="hidden fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-40 text-xs font-medium text-slate-700">
        <button id="ctxDownloadBtn" class="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hidden cursor-pointer">
          <i class="fa-solid fa-download text-emerald-600"></i> Download
        </button>
        <button id="ctxDeleteBtn" class="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-slate-700 cursor-pointer">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>

      <!-- MODAL: NEW FOLDER -->
      <div id="createFolderModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4">
          <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
            <i class="fa-solid fa-folder-plus text-amber-500"></i> Create Folder
          </h3>
          <input type="text" id="folderNameInput" placeholder="Folder name..."
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div class="flex gap-2 justify-end pt-2">
            <button type="button" id="cancelFolderBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
            <button type="button" id="submitFolderBtn" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">Create</button>
          </div>
        </div>
      </div>

      <!-- MODAL: UPLOAD FILE -->
      <div id="createFileModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-cloud-arrow-up text-blue-500"></i> Upload File
            </h3>
            <button id="closeFileModalBtn" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <form id="createFileForm" class="space-y-4">
            <div class="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 transition rounded-xl p-5 text-center cursor-pointer">
              <label class="cursor-pointer block">
                <i class="fa-solid fa-file-arrow-up text-blue-500 text-2xl mb-1"></i>
                <p class="text-xs font-semibold text-slate-700">Select Image, Video, Text or PDF</p>
                <input type="file" id="chunkFileInput" multiple required
                  class="mt-2 block w-full text-xs text-slate-500 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700">
              </label>
            </div>
            <div class="pt-2 flex gap-3 justify-end">
              <button type="button" id="cancelFileBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
              <button type="submit" id="submitFileBtn" class="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">Upload File</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", overlaysHTML);
    this.previewer.initEvents();
  }

  _formatBytes(bytes) {
    if (bytes === 0 || isNaN(bytes) || bytes == null) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // --------------------------------------------------
  // Load + render (logic unchanged, style matches example)
  // --------------------------------------------------
  async loadCurrentFolder() {
    const grid = this.container?.querySelector("#fileGridContainer");
    if (!grid) return;

    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 text-xs">
        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-blue-500 block"></i>
        Loading folder...
      </div>`;

    try {
      const { folders, files, currentFolderName } =
        await this.service.getFolderContents(this.currentFolderId);

      this.render(folders, files, currentFolderName);
    } catch (err) {
      Toast.show(`Error loading folder: ${err.message}`, "error");
    }
  }

  render(folders = [], files = [], currentFolderName = "Home") {
    const grid = this.container.querySelector("#fileGridContainer");
    const pathText = this.container.querySelector("#pathText");
    const countBadge = this.container.querySelector("#fileCountBadge");
    const backBtn = this.container.querySelector("#backBtn");
    if (!grid) return;

    const isRoot = this.currentFolderId === "root";

    // Path + Back button state
    pathText.textContent = isRoot ? "/" : `/${currentFolderName}`;
    countBadge.textContent = `${folders.length + files.length} items`;

    if (isRoot) {
      backBtn.classList.add("opacity-40", "cursor-not-allowed");
      backBtn.classList.remove("cursor-pointer");
      backBtn.disabled = true;
    } else {
      backBtn.classList.remove("opacity-40", "cursor-not-allowed");
      backBtn.classList.add("cursor-pointer");
      backBtn.disabled = false;
    }

    let html = "";

    if (folders.length === 0 && files.length === 0) {
      html = `
        <div class="col-span-full py-16 text-center text-slate-400 text-xs italic">
          This folder is empty.
        </div>`;
    } else {
      // Folders (style from example)
      folders.forEach(folder => {
        const name = folder.title || folder.name || "Untitled";
        html += `
          <div data-action="navigate" data-id="${folder.id}"
               data-context="folder" data-context-id="${folder.id}"
               class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden">
            <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-folder text-5xl"></i>
            </div>
            <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
              <span class="w-full text-xs font-bold text-slate-700 truncate" title="${name}">${name}</span>
              <span class="text-[9px] text-slate-400 font-mono mt-0.5">Folder</span>
            </div>
          </div>`;
      });

      // Files (style from example)
      files.forEach(file => {
        const name = file.title || "Untitled";
        const ext = name.split(".").pop()?.toLowerCase() || "";
        let previewHTML = `<i class="fa-regular fa-file-lines text-slate-400 text-3xl"></i>`;

        if (file.thumbnail) {
          previewHTML = `<img src="${file.thumbnail}" alt="${name}" class="w-full h-full object-cover rounded-lg" />`;
        } else if (file.category === "Media" || ["mp4", "webm", "mov"].includes(ext)) {
          previewHTML = `
            <div class="flex flex-col items-center justify-center text-purple-500">
              <i class="fa-solid fa-file-video text-3xl mb-1"></i>
              <span class="text-[9px] font-mono text-slate-500 uppercase">${ext}</span>
            </div>`;
        } else if (["mp3", "wav", "ogg"].includes(ext)) {
          previewHTML = `
            <div class="flex flex-col items-center justify-center text-blue-500">
              <i class="fa-solid fa-file-audio text-3xl mb-1"></i>
              <span class="text-[9px] font-mono text-slate-500 uppercase">${ext}</span>
            </div>`;
        } else if (["js", "ts", "jsx", "tsx"].includes(ext)) {
          previewHTML = `<i class="fa-brands fa-js text-amber-400 text-3xl"></i>`;
        } else if (["html", "htm"].includes(ext)) {
          previewHTML = `<i class="fa-brands fa-html5 text-orange-400 text-3xl"></i>`;
        } else if (["css", "scss"].includes(ext)) {
          previewHTML = `<i class="fa-brands fa-css3-alt text-blue-500 text-3xl"></i>`;
        } else if (ext === "json") {
          previewHTML = `<i class="fa-solid fa-brackets-curly text-yellow-500 text-3xl"></i>`;
        }

        const sizeLabel = file.size != null
          ? this._formatBytes(file.size)
          : `${file.totalParts || 1} chunks`;

        html += `
          <div data-action="view" data-id="${file.id}" data-file-id="${file.fileId}"
               data-context="file" data-context-id="${file.id}" data-file-id="${file.fileId}"
               class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden">
            <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
              ${previewHTML}
            </div>
            <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
              <span class="w-full text-xs font-semibold text-slate-700 truncate text-[11px]" title="${name}">${name}</span>
              <span class="text-[9px] text-slate-400 font-mono mt-0.5">${sizeLabel}</span>
            </div>
          </div>`;
      });
    }

    grid.innerHTML = html;
  }

  // --------------------------------------------------
  // Actions (logic unchanged)
  // --------------------------------------------------
  navigateToFolder(folderId) {
    this.currentFolderId = folderId;
    this.loadCurrentFolder();
  }

  navigateUp() {
    if (this.currentFolderId !== "root") {
      this.navigateToFolder("root");
    }
  }

  async createFolder(name, parentId) {
    await this.service.createFolder(name, parentId);
    Toast.show("Folder created!", "success");
    this.loadCurrentFolder();
  }

  async uploadFiles(files, parentId) {
    const submitBtn = document.getElementById("submitFileBtn");
    if (submitBtn) submitBtn.disabled = true;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await this.service.uploadFile(
          file,
          parentId,
          (statusText) => {
            if (submitBtn) {
              submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> (${i + 1}/${files.length}) ${statusText}`;
            }
          }
        );
        Toast.show(`Uploaded: ${file.name}`, "success");
      } catch (err) {
        Toast.show(`Failed to upload ${file.name}: ${err.message}`, "error");
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Upload File";
    }

    this.loadCurrentFolder();
  }

  async deleteItem(target) {
    if (target.type === "folder") {
      if (!confirm("Delete folder?")) return;
      await this.service.deleteFolder(target.id);
      Toast.show("Folder deleted", "success");
    } else {
      if (!confirm("Delete file and its chunks?")) return;
      await this.service.deleteFile(target.id, target.fileId);
      Toast.show("File deleted", "success");
    }
    this.loadCurrentFolder();
  }

  async downloadFile(target) {
    const fileRecord = await this.service.getFileRecord(target.id);
    if (!fileRecord) return;

    const fullBase64 = await this.service.getFullBase64(fileRecord.fileId);

    const a = document.createElement("a");
    a.href = fullBase64;
    a.download = fileRecord.title;
    document.body.appendChild(a);
    a.click();
    a.remove();

    Toast.show(`Downloaded ${fileRecord.title}`, "success");
  }

  async viewFile(id, fileId) {
    const fileRecord = await this.service.getFileRecord(id);
    if (!fileRecord) return;

    this.previewer.showLoading(fileRecord.title);

    const fullBase64 = await this.service.getFullBase64(fileRecord.fileId);
    this.previewer.render(fileRecord, fullBase64);
  }

  // --------------------------------------------------
  // Events
  // --------------------------------------------------
  _bindEvents() {
    document.addEventListener("click", () => {
      document.getElementById("contextMenu")?.classList.add("hidden");
    });

    // Back button
    this.container.querySelector("#backBtn")?.addEventListener("click", () => {
      this.navigateUp();
    });

    // Navigate / View
    this.container.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      const action = target.dataset.action;
      const id = target.dataset.id;
      const fileId = target.dataset.fileId;

      if (action === "navigate") {
        this.navigateToFolder(id);
      } else if (action === "view") {
        this.viewFile(id, fileId);
      }
    });

    // Context menu
    this.container.addEventListener("contextmenu", (e) => {
      const target = e.target.closest("[data-context]");
      if (!target) return;

      e.preventDefault();
      const type = target.dataset.context;
      const id = target.dataset.contextId;
      const fileId = target.dataset.fileId || null;

      this.contextTarget = { type, id, fileId };

      const menu = document.getElementById("contextMenu");
      const downloadBtn = document.getElementById("ctxDownloadBtn");

      if (type === "file") {
        downloadBtn.classList.remove("hidden");
      } else {
        downloadBtn.classList.add("hidden");
      }

      menu.style.top = `${Math.min(e.clientY, window.innerHeight - 120)}px`;
      menu.style.left = `${Math.min(e.clientX, window.innerWidth - 160)}px`;
      menu.classList.remove("hidden");
    });

    // Delete
    document.getElementById("ctxDeleteBtn")?.addEventListener("click", () => {
      if (!this.contextTarget) return;
      this.deleteItem(this.contextTarget);
      document.getElementById("contextMenu").classList.add("hidden");
    });

    // Download
    document.getElementById("ctxDownloadBtn")?.addEventListener("click", () => {
      if (!this.contextTarget || this.contextTarget.type !== "file") return;
      this.downloadFile(this.contextTarget);
      document.getElementById("contextMenu").classList.add("hidden");
    });

    // New Folder
    this.container.querySelector("#openFolderModalBtn")?.addEventListener("click", () => {
      document.getElementById("folderNameInput").value = "";
      document.getElementById("createFolderModal").classList.remove("hidden");
    });
    document.getElementById("cancelFolderBtn")?.addEventListener("click", () => {
      document.getElementById("createFolderModal").classList.add("hidden");
    });
    document.getElementById("submitFolderBtn")?.addEventListener("click", () => {
      const name = document.getElementById("folderNameInput").value.trim();
      if (!name) return;
      this.createFolder(name, this.currentFolderId);
      document.getElementById("createFolderModal").classList.add("hidden");
    });

    // Upload
    this.container.querySelector("#openCreateModalBtn")?.addEventListener("click", () => {
      document.getElementById("createFileForm").reset();
      document.getElementById("createFileModal").classList.remove("hidden");
    });
    document.getElementById("closeFileModalBtn")?.addEventListener("click", () => {
      document.getElementById("createFileModal").classList.add("hidden");
    });
    document.getElementById("cancelFileBtn")?.addEventListener("click", () => {
      document.getElementById("createFileModal").classList.add("hidden");
    });
    document.getElementById("createFileForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const files = document.getElementById("chunkFileInput").files;
      if (!files?.length) return;
      this.uploadFiles(files, this.currentFolderId);
      document.getElementById("createFileModal").classList.add("hidden");
    });
  }
}
