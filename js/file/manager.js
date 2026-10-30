import { Toast } from "./toast.js";
import { FilePreviewComponent } from "./preview.js";
import { FileUploadComponent } from "./upload.js";
import { BackupManager } from "./backup.js";

export class FileManager {
  constructor(config = {}) {
    this.containerId = config.containerId || "fileManagerApp";
    this.container = document.getElementById(this.containerId);
    this.fbService = config.fbService;
    
    this.collections = {
      items: config.filesCollection || "files",
      fileChunks: config.fileChunksCollection || "file_chunks"
    };

    this.currentFolderId = "root";
    this.contextTarget = null;
    
    this.previewer = new FilePreviewComponent();
    this.backupManager = new BackupManager({
      fbService: this.fbService,
      collections: this.collections,
      buttonId: "backupDataBtn"
    });
  }

  mountMainLayout() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <!-- Toolbar / Header -->
        <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div id="breadcrumbContainer" class="flex items-center space-x-2 text-sm"></div>
          <div class="flex items-center space-x-2">
            <button id="openFolderModalBtn" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
              <i class="fa-solid fa-folder-plus mr-1"></i> New Folder
            </button>
            <button id="openCreateModalBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
              <i class="fa-solid fa-upload mr-1"></i> Upload File
            </button>
            <button id="backupDataBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
              <i class="fa-solid fa-file-zipper mr-1"></i> Backup ZIP
            </button>
          </div>
        </div>

        <!-- File List View -->
        <div id="fileListContainer" class="flex-1 overflow-y-auto p-4 custom-scrollbar"></div>
      </div>

      <!-- Upload Modal -->
      <div id="fileModal" class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold text-slate-800">Upload Files</h3>
            <button id="closeFileModalBtn" class="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <form id="createFileForm" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Files</label>
              <input type="file" id="chunkFileInput" multiple class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            <div class="flex justify-end space-x-2 pt-2">
              <button type="button" id="cancelFileBtn" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" id="submitFileBtn" class="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700">Upload File</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Folder Modal -->
      <div id="folderModal" class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
          <h3 class="text-base font-bold text-slate-800 mb-3">Create New Folder</h3>
          <input type="text" id="folderNameInput" placeholder="Folder Name" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-blue-500"/>
          <div class="flex justify-end space-x-2">
            <button type="button" id="cancelFolderBtn" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button type="button" id="submitFolderBtn" class="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700">Create</button>
          </div>
        </div>
      </div>
    `;
  }

  showLoadingState() {
    const listEl = document.getElementById("fileListContainer");
    if (listEl) {
      listEl.innerHTML = `<div class="p-4 text-center text-gray-500">Loading contents...</div>`;
    }
  }

  renderItems(subFolders, dirFiles, currentFolderName) {
    const listEl = document.getElementById("fileListContainer");
    const breadcrumbEl = document.getElementById("breadcrumbContainer");
    if (!listEl) return;

    if (breadcrumbEl) {
      breadcrumbEl.innerHTML = `
        <span class="text-gray-600 font-medium">Current Folder:</span> 
        <span class="font-bold text-blue-600">${currentFolderName}</span>
      `;
    }

    listEl.innerHTML = "";

    if (this.currentFolderId !== "root") {
      const backDiv = document.createElement("div");
      backDiv.className = "flex items-center p-3 hover:bg-gray-100 rounded cursor-pointer text-gray-700";
      backDiv.innerHTML = `<span class="mr-2">📁</span> <strong>... (Go Back)</strong>`;
      backDiv.onclick = () => this.navigateToFolder("root");
      listEl.appendChild(backDiv);
    }

    subFolders.forEach(folder => {
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-3 hover:bg-gray-50 rounded border-b cursor-pointer";
      div.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="text-xl">📁</span>
          <span class="font-medium text-gray-800">${folder.title || folder.name}</span>
        </div>
        <button class="text-gray-400 hover:text-gray-600 px-2 py-1 context-trigger" data-type="folder" data-id="${folder.id}">⋮</button>
      `;
      div.addEventListener("dblclick", () => this.navigateToFolder(folder.id));
      listEl.appendChild(div);
    });

    dirFiles.forEach(file => {
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-3 hover:bg-gray-50 rounded border-b cursor-pointer";
      
      const thumbHtml = file.thumbnail 
        ? `<img src="${file.thumbnail}" class="w-8 h-8 object-cover rounded"/>` 
        : `<span class="text-xl">📄</span>`;

      div.innerHTML = `
        <div class="flex items-center space-x-3">
          ${thumbHtml}
          <span class="font-medium text-gray-800">${file.title}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button class="text-blue-500 hover:underline text-sm view-file-btn" data-id="${file.id}" data-fileid="${file.fileId}">View</button>
          <button class="text-gray-400 hover:text-gray-600 px-2 py-1 context-trigger" data-type="file" data-id="${file.id}" data-fileid="${file.fileId}">⋮</button>
        </div>
      `;
      listEl.appendChild(div);
    });
  }

  toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.toggle("hidden", !show);
  }

  showContextMenu(e, type) {
    const menu = document.getElementById("contextMenu");
    if (menu) {
      menu.style.top = `${e.pageY}px`;
      menu.style.left = `${e.pageX}px`;
      menu.classList.remove("hidden");
    }
  }

  hideContextMenu() {
    const menu = document.getElementById("contextMenu");
    if (menu) menu.classList.add("hidden");
  }

  getFolderNameInput() {
    const input = document.getElementById("folderNameInput");
    const val = input ? input.value.trim() : "";
    if (input) input.value = "";
    return val;
  }

  setUploadButtonProgress(isUploading, text) {
    const btn = document.getElementById("submitFileBtn") || document.querySelector("#createFileForm button[type='submit']");
    if (btn) {
      btn.disabled = isUploading;
      btn.textContent = text;
    }
  }

  async loadCurrentFolder() {
    this.showLoadingState();

    try {
      let allItems = [];
      let currentFolderName = "Home";

      if (this.fbService.isLiveMode) {
        allItems = await this.fbService.getByField(this.collections.items, "parentId", this.currentFolderId);
        if (this.currentFolderId !== "root") {
          const parentFolder = await this.fbService.getById(this.collections.items, this.currentFolderId);
          if (parentFolder) currentFolderName = parentFolder.title || parentFolder.name;
        }
      } else {
        const stored = JSON.parse(localStorage.getItem(`demo_${this.collections.items}`) || "[]");
        allItems = stored.filter(item => item.parentId === this.currentFolderId);
        if (this.currentFolderId !== "root") {
          const found = stored.find(item => item.id === this.currentFolderId);
          if (found) currentFolderName = found.title || found.name;
        }
      }

      const subFolders = allItems.filter(item => item.isFolder === true);
      const dirFiles = allItems.filter(item => !item.isFolder);

      this.renderItems(subFolders, dirFiles, currentFolderName);
    } catch (err) {
      Toast.show(`Error loading folder: ${err.message}`, "error");
    }
  }

  navigateToFolder(folderId) {
    this.currentFolderId = folderId;
    this.loadCurrentFolder();
  }

  openContextMenu(e, type, id, fileId = null) {
    this.contextTarget = { type, id, fileId };
    this.showContextMenu(e, type);
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  generateThumbnail(base64Str, maxSize = 150) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
        else { w = Math.round((w * maxSize) / h); h = maxSize; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = () => resolve("");
    });
  }

  async viewFile(id, fileId) {
    const fileRecord = this.fbService.isLiveMode ?
      await this.fbService.getById(this.collections.items, id) :
      JSON.parse(localStorage.getItem(`demo_${this.collections.items}`) || "[]").find(f => f.id === id || f.fileId === fileId);

    if (!fileRecord) return;
    this.previewer.showLoading(fileRecord.title);

    const chunks = this.fbService.isLiveMode ?
      await this.fbService.getByField(this.collections.fileChunks, "fileId", fileRecord.fileId) :
      JSON.parse(localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]").filter(c => c.fileId === fileRecord.fileId);

    chunks.sort((a, b) => a.partIndex - b.partIndex);
    const fullBase64 = chunks.map(c => c.chunkData).join("");
    this.previewer.render(fileRecord, fullBase64);
  }

  init() {
    this.mountMainLayout();
    this.previewer.initEvents();

    document.addEventListener("click", () => this.hideContextMenu());

    // Event Listeners for UI triggers
    document.getElementById("openFolderModalBtn")?.addEventListener("click", () => this.toggleModal("folderModal", true));
    document.getElementById("cancelFolderBtn")?.addEventListener("click", () => this.toggleModal("folderModal", false));
    document.getElementById("openCreateModalBtn")?.addEventListener("click", () => this.toggleModal("fileModal", true));
    document.getElementById("closeFileModalBtn")?.addEventListener("click", () => this.toggleModal("fileModal", false));
    document.getElementById("cancelFileBtn")?.addEventListener("click", () => this.toggleModal("fileModal", false));

    document.getElementById("fileListContainer")?.addEventListener("click", (e) => {
      const viewBtn = e.target.closest(".view-file-btn");
      if (viewBtn) {
        this.viewFile(viewBtn.getAttribute("data-id"), viewBtn.getAttribute("data-fileid"));
      }
    });

    // Submit Folder
    document.getElementById("submitFolderBtn")?.addEventListener("click", async () => {
      const name = this.getFolderNameInput();
      if (!name) return;
      await this.fbService.create(this.collections.items, {
        title: name,
        isFolder: true,
        parentId: this.currentFolderId
      });
      Toast.show("Folder created!", "success");
      this.toggleModal("folderModal", false);
      this.loadCurrentFolder();
    });

    // Submit File Upload
    document.getElementById("createFileForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("chunkFileInput");
      const files = fileInput.files;
      if (!files || files.length === 0) return;

      this.setUploadButtonProgress(true, `Uploading (1/${files.length})...`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const base64Data = await this.readFileAsDataURL(file);
          let thumbnail = "";
          if (file.type.startsWith("image/")) {
            thumbnail = await this.generateThumbnail(base64Data, 150);
          }

          const CHUNK_SIZE = 700000;
          const totalParts = Math.ceil(base64Data.length / CHUNK_SIZE);
          const fileId = "file_" + Date.now() + "_" + i;

          await this.fbService.create(this.collections.items, {
            fileId,
            title: file.name,
            isFolder: false,
            category: file.type.startsWith("image/") ? "Image" : "Media",
            parentId: this.currentFolderId,
            totalParts,
            thumbnail
          });

          for (let c = 0; c < totalParts; c++) {
            const chunkData = base64Data.substring(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
            await this.fbService.create(this.collections.fileChunks, { fileId, partIndex: c, chunkData });
          }

          Toast.show(`Uploaded: ${file.name}`, "success");
        } catch (err) {
          Toast.show(`Failed to upload ${file.name}: ${err.message}`, "error");
        }
      }

      this.setUploadButtonProgress(false, "Upload File");
      this.toggleModal("fileModal", false);
      if (fileInput) fileInput.value = "";
      this.loadCurrentFolder();      
    });

    this.loadCurrentFolder();
  }
}
