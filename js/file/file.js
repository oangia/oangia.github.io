import { FilePreviewComponent } from "./preview.js";
import { FileBackup } from "./backup.js";

export class FileManager {
  constructor(config = {}) {
    this.containerId = config.containerId || "fileManagerApp";
    this.container = document.getElementById(this.containerId);

    // Injected Firebase service
    this.firebase = config.firebaseService;

    this.currentFolderId = "root";
    this.contextTarget = null;
    this.previewer = new FilePreviewComponent();

    // Backup is now owned by FileManager
    this.backupManager = new FileBackup(
      this.firebase.fbService,
      this.firebase.collections,
      "backupDataBtn"
    );
  }

  // --------------------------------------------------
  // Mount UI
  // --------------------------------------------------
  mountUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 justify-between items-center shrink-0">
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

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col space-y-4 overflow-hidden">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div id="breadcrumbsBar" class="flex items-center gap-2 text-xs font-semibold text-slate-700"></div>
          <span id="fileCountBadge" class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-mono">0 items</span>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div id="fileGridContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"></div>
        </div>
      </div>
    `;

    const overlaysHTML = `
      <div id="contextMenu" class="hidden fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-40 text-xs font-medium text-slate-700">
        <button id="ctxDownloadBtn" class="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hidden cursor-pointer">
          <i class="fa-solid fa-download text-emerald-600"></i> Download
        </button>
        <button id="ctxDeleteBtn" class="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-slate-700 cursor-pointer">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>

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

  // --------------------------------------------------
  // Load + render
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
        await this.firebase.getFolderContents(this.currentFolderId);

      this.render(folders, files, currentFolderName);
    } catch (err) {
      Toast.show(`Error loading folder: ${err.message}`, "error");
    }
  }

  render(folders = [], files = [], currentFolderName = "Home") {
    const breadcrumbs = this.container.querySelector("#breadcrumbsBar");
    const grid = this.container.querySelector("#fileGridContainer");
    if (!grid) return;

    // Breadcrumbs
    if (this.currentFolderId === "root") {
      breadcrumbs.innerHTML = `
        <span class="text-blue-600 font-bold flex items-center gap-1.5">
          <i class="fa-solid fa-house"></i> Home
        </span>`;
    } else {
      breadcrumbs.innerHTML = `
        <button data-action="navigate" data-id="root"
          class="hover:text-blue-600 flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-house"></i> Home
        </button>
        <i class="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
        <span class="text-blue-600 font-bold">${currentFolderName}</span>`;
    }

    this.container.querySelector("#fileCountBadge").textContent =
      `${folders.length} folders, ${files.length} files`;

    let html = "";

    // Folders
    folders.forEach(folder => {
      html += `
        <div data-action="navigate" data-id="${folder.id}"
             data-context="folder" data-context-id="${folder.id}"
             class="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 flex flex-col items-center justify-between gap-2 cursor-pointer transition group shadow-sm select-none overflow-hidden">
          <div class="w-full flex justify-center items-center h-20 bg-amber-50/50 group-hover:bg-amber-50 rounded-xl overflow-hidden transition-colors">
            <i class="fa-solid fa-folder text-amber-400 text-4xl group-hover:scale-110 transition"></i>
          </div>
          <span class="text-xs font-bold text-slate-800 truncate w-full text-center"
                title="${folder.title || folder.name}">
            ${folder.title || folder.name}
          </span>
          <div class="w-full text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
            <span>Folder</span>
          </div>
        </div>`;
    });

    // Files
    files.forEach(file => {
      const ext = (file.title || "").split(".").pop().toLowerCase();
      let defaultIcon = "fa-solid fa-file-lines text-blue-400";

      if (["js", "ts", "jsx", "tsx"].includes(ext))
        defaultIcon = "fa-brands fa-js text-amber-400";
      else if (["html", "htm"].includes(ext))
        defaultIcon = "fa-brands fa-html5 text-orange-400";
      else if (["css", "scss"].includes(ext))
        defaultIcon = "fa-brands fa-css3-alt text-blue-500";
      else if (["json"].includes(ext))
        defaultIcon = "fa-solid fa-brackets-curly text-yellow-500";
      else if (file.category === "Media" || ["mp4", "webm", "mov"].includes(ext))
        defaultIcon = "fa-solid fa-file-video text-purple-400";
      else if (["mp3", "wav", "ogg"].includes(ext))
        defaultIcon = "fa-solid fa-file-audio text-emerald-400";

      const thumbHtml = file.thumbnail
        ? `<img src="${file.thumbnail}" class="w-full h-full object-cover rounded-xl shadow-inner">`
        : `<i class="${defaultIcon} text-4xl"></i>`;

      html += `
        <div data-action="view" data-id="${file.id}" data-file-id="${file.fileId}"
             data-context="file" data-context-id="${file.id}" data-file-id="${file.fileId}"
             class="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 flex flex-col items-center justify-between gap-2 cursor-pointer transition group shadow-sm select-none overflow-hidden">
          <div class="w-full flex justify-center items-center h-20 bg-slate-100 rounded-xl overflow-hidden relative transition-colors group-hover:bg-slate-200/60">
            ${thumbHtml}
          </div>
          <span class="text-xs font-semibold text-slate-800 truncate w-full text-center"
                title="${file.title}">${file.title}</span>
          <div class="w-full text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
            <span>${file.totalParts || 1} chunks</span>
          </div>
        </div>`;
    });

    if (folders.length === 0 && files.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400 text-xs italic">
          <i class="fa-regular fa-folder-open text-3xl mb-2 text-slate-300 block"></i>
          This folder is empty.
        </div>`;
    } else {
      grid.innerHTML = html;
    }
  }

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------
  navigateToFolder(folderId) {
    this.currentFolderId = folderId;
    this.loadCurrentFolder();
  }

  async createFolder(name, parentId) {
    await this.firebase.createFolder(name, parentId);
    Toast.show("Folder created!", "success");
    this.loadCurrentFolder();
  }

  async uploadFiles(files, parentId) {
    const submitBtn = document.getElementById("submitFileBtn");
    if (submitBtn) submitBtn.disabled = true;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await this.firebase.uploadFile(
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
      await this.firebase.deleteFolder(target.id);
      Toast.show("Folder deleted", "success");
    } else {
      if (!confirm("Delete file and its chunks?")) return;
      await this.firebase.deleteFile(target.id, target.fileId);
      Toast.show("File deleted", "success");
    }
    this.loadCurrentFolder();
  }

  async downloadFile(target) {
    const fileRecord = await this.firebase.getFileRecord(target.id);
    if (!fileRecord) return;

    const fullBase64 = await this.firebase.getFullBase64(fileRecord.fileId);

    const a = document.createElement("a");
    a.href = fullBase64;
    a.download = fileRecord.title;
    document.body.appendChild(a);
    a.click();
    a.remove();

    Toast.show(`Downloaded ${fileRecord.title}`, "success");
  }

  async viewFile(id, fileId) {
    const fileRecord = await this.firebase.getFileRecord(id);
    if (!fileRecord) return;

    this.previewer.showLoading(fileRecord.title);

    const fullBase64 = await this.firebase.getFullBase64(fileRecord.fileId);
    this.previewer.render(fileRecord, fullBase64);
  }

  // --------------------------------------------------
  // Events
  // --------------------------------------------------
  bindEvents() {
    document.addEventListener("click", () => {
      document.getElementById("contextMenu")?.classList.add("hidden");
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

  // --------------------------------------------------
  // Public
  // --------------------------------------------------
  init() {
    this.mountUI();
    this.bindEvents();
    this.loadCurrentFolder();
  }

  switch(collections) {
    this.firebase.switch(collections);
    this.backupManager.switch(collections);   // backup also switches
    this.currentFolderId = "root";
    this.loadCurrentFolder();
  }
}
