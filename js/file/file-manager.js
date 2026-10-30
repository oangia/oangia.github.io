// file-manager.js
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

import { ToastManager } from "./toast.js";
import { FilePreviewComponent } from "./preview.js";

export class FileManager {
  constructor(config = {}) {
    this.containerId = config.containerId || "fileManagerApp";
    this.container = document.getElementById(this.containerId);
    this.fbService = config.fbService;
    
    // Unified collection configuration (folders and files live together)
    this.collections = {
      items: config.filesCollection || "files",
      fileChunks: config.fileChunksCollection || "file_chunks"
    };

    this.currentFolderId = "root";
    this.contextTarget = null;
    this.previewer = new FilePreviewComponent();
    this.ensureOverlays();
  }

  ensureOverlays() {
    ToastManager.ensureDOM();
    if (document.getElementById("contextMenu")) return;

    const overlaysHTML = `
      <!-- CONTEXT MENU -->
      <div id="contextMenu" class="hidden fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-40 text-xs font-medium text-slate-700">
        <button id="ctxDownloadBtn" class="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hidden"><i class="fa-solid fa-download text-emerald-600"></i> Download</button>
        <button id="ctxDeleteBtn" class="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-slate-700"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>

      <!-- MODAL: NEW FOLDER -->
      <div id="createFolderModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4">
          <h3 class="font-bold text-base text-slate-800 flex items-center gap-2"><i class="fa-solid fa-folder-plus text-amber-500"></i> Create Folder</h3>
          <input type="text" id="folderNameInput" placeholder="Folder name..." class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div class="flex gap-2 justify-end pt-2">
            <button type="button" id="cancelFolderBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
            <button type="button" id="submitFolderBtn" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Create</button>
          </div>
        </div>
      </div>

      <!-- MODAL: UPLOAD FILE -->
      <div id="createFileModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-800 flex items-center gap-2"><i class="fa-solid fa-cloud-arrow-up text-blue-500"></i> Upload File</h3>
            <button id="closeFileModalBtn" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>
          <form id="createFileForm" class="space-y-4">
            <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center">
              <label class="cursor-pointer block">
                <i class="fa-solid fa-file-arrow-up text-blue-500 text-2xl mb-1"></i>
                <p class="text-xs font-semibold text-slate-700">Select Image, Video, Text or PDF</p>
                <input type="file" id="chunkFileInput" multiple required class="mt-2 block w-full text-xs text-slate-500 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700">
              </label>
            </div>
            <div class="pt-2 flex gap-3 justify-end">
              <button type="button" id="cancelFileBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" id="submitFileBtn" class="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Upload File</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlaysHTML);
  }

  mountUI() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 justify-between items-center">
        <div class="flex items-center gap-2"></div>
        <div class="flex items-center gap-2">
          <button id="openFolderModalBtn" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition flex items-center gap-2">
            <i class="fa-solid fa-folder-plus text-amber-600"></i> New Folder
          </button>
          <button id="openCreateModalBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm">
            <i class="fa-solid fa-cloud-arrow-up"></i> Upload File
          </button>
          <button id="backupDataBtn" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold px-3 py-2 rounded-xl text-xs transition flex items-center gap-2">
            <i class="fa-solid fa-file-arrow-down"></i> Backup All Files
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col space-y-4">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div id="breadcrumbsBar" class="flex items-center gap-2 text-xs font-semibold text-slate-700"></div>
          <span id="fileCountBadge" class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">0 items</span>
        </div>
        <div id="fileGridContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"></div>
      </div>
    `;

    this.previewer.initEvents();
  }

  async loadCurrentFolder() {
    const breadcrumbs = this.container.querySelector("#breadcrumbsBar");
    const grid = this.container.querySelector("#fileGridContainer");
    if (!grid) return;

    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-blue-500 block"></i>Loading folder...</div>`;

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

      // Separate folders and files from the unified collection using isFolder flag
      const subFolders = allItems.filter(item => item.isFolder === true);
      const dirFiles = allItems.filter(item => !item.isFolder);

      if (this.currentFolderId === "root") {
        breadcrumbs.innerHTML = `<span class="text-blue-600 font-bold"><i class="fa-solid fa-house"></i> Home</span>`;
      } else {
        breadcrumbs.innerHTML = `
          <button onclick="fileManager.navigateToFolder('root')" class="hover:text-blue-600"><i class="fa-solid fa-house"></i> Home</button>
          <i class="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
          <span class="text-blue-600 font-bold">${escapeHtml(currentFolderName)}</span>
        `;
      }

      this.container.querySelector("#fileCountBadge").textContent = `${subFolders.length} folders, ${dirFiles.length} files`;

      let html = "";
      subFolders.forEach(folder => {
        html += `
          <div ondblclick="fileManager.navigateToFolder('${folder.id}')" onclick="fileManager.navigateToFolder('${folder.id}')" oncontextmenu="fileManager.openContextMenu(event, 'folder', '${folder.id}')" class="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition group shadow-sm select-none">
            <i class="fa-solid fa-folder text-amber-400 text-4xl group-hover:scale-110 transition"></i>
            <span class="text-xs font-bold text-slate-700 truncate w-full text-center">${escapeHtml(folder.title || folder.name)}</span>
          </div>
        `;
      });

      dirFiles.forEach(file => {
        let thumbHtml = `<i class="fa-solid fa-file-lines text-blue-400 text-4xl"></i>`;
        if (file.thumbnail) {
          thumbHtml = `<img src="${file.thumbnail}" class="w-full h-20 object-cover rounded-xl shadow-inner">`;
        } else if (file.category === 'Media') {
          thumbHtml = `<i class="fa-solid fa-file-video text-purple-400 text-4xl"></i>`;
        }

        html += `
          <div onclick="fileManager.viewFile('${file.id}', '${file.fileId}')" oncontextmenu="fileManager.openContextMenu(event, 'file', '${file.id}', '${file.fileId}')" class="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 flex flex-col items-center justify-between gap-2 cursor-pointer transition group shadow-sm select-none">
            <div class="w-full flex justify-center items-center h-20 bg-slate-100 rounded-xl overflow-hidden">
              ${thumbHtml}
            </div>
            <span class="text-xs font-semibold text-slate-800 truncate w-full text-center" title="${escapeHtml(file.title)}">${escapeHtml(file.title)}</span>
            <div class="w-full text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
              <span>${file.totalParts || 1} chunks</span>
            </div>
          </div>
        `;
      });

      if (subFolders.length === 0 && dirFiles.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs"><i class="fa-regular fa-folder-open text-3xl mb-2 text-slate-300 block"></i>This folder is empty</div>`;
      } else {
        grid.innerHTML = html;
      }
    } catch (err) {
      ToastManager.show(`Error loading folder: ${err.message}`, "error");
    }
  }

  navigateToFolder(folderId) {
    this.currentFolderId = folderId;
    this.loadCurrentFolder();
  }

  openContextMenu(e, type, id, fileId = null) {
    e.preventDefault();
    this.contextTarget = { type, id, fileId };
    const menu = document.getElementById("contextMenu");
    const downloadBtn = document.getElementById("ctxDownloadBtn");

    if (type === 'file') {
      downloadBtn.classList.remove("hidden");
    } else {
      downloadBtn.classList.add("hidden");
    }

    menu.style.top = `${Math.min(e.clientY, window.innerHeight - 120)}px`;
    menu.style.left = `${Math.min(e.clientX, window.innerWidth - 160)}px`;
    menu.classList.remove("hidden");
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
    this.mountUI();

    document.addEventListener("click", () => {
      document.getElementById("contextMenu")?.classList.add("hidden");
    });

    this.container.querySelector("#backupDataBtn")?.addEventListener("click", async () => {
      ToastManager.show("Preparing ZIP backup...", "info");
      try {
        let items = [], file_chunks = [];
        if (this.fbService.isLiveMode) {
          items = await this.fbService.getAll(this.collections.items);
          file_chunks = await this.fbService.getAll(this.collections.fileChunks);
        } else {
          items = JSON.parse(localStorage.getItem(`demo_${this.collections.items}`) || "[]");
          file_chunks = JSON.parse(localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]");
        }

        const zip = new JSZip();
        const folders = items.filter(i => i.isFolder);
        const files = items.filter(i => !i.isFolder);

        const getFolderPath = (parentId) => {
          let pathParts = [];
          let currentId = parentId;
          while (currentId && currentId !== "root") {
            const folder = folders.find(f => f.id === currentId);
            if (folder) {
              pathParts.unshift(folder.title || folder.name);
              currentId = folder.parentId;
            } else {
              break;
            }
          }
          return pathParts.join("/");
        };

        for (const fileRecord of files) {
          const chunks = file_chunks
            .filter(c => c.fileId === fileRecord.fileId)
            .sort((a, b) => a.partIndex - b.partIndex);

          const fullBase64 = chunks.map(c => c.chunkData).join("");
          const base64Data = fullBase64.split(',')[1];
          if (!base64Data) continue;

          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const folderPath = getFolderPath(fileRecord.parentId);
          const filePath = folderPath ? `${folderPath}/${fileRecord.title}` : fileRecord.title;

          zip.file(filePath, bytes);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = URL.createObjectURL(content);
        downloadAnchor.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        ToastManager.show("ZIP backup downloaded successfully!", "success");
      } catch (err) {
        ToastManager.show(`Failed to generate ZIP: ${err.message}`, "error");
      }
    });

    document.getElementById("ctxDeleteBtn")?.addEventListener("click", async () => {
      if (!this.contextTarget) return;
      if (this.contextTarget.type === 'folder') {
        if (!confirm("Delete folder?")) return;
        await this.fbService.delete(this.collections.items, this.contextTarget.id);
        ToastManager.show("Folder deleted", "success");
      } else if (this.contextTarget.type === 'file') {
        if (!confirm("Delete file and its chunks?")) return;
        const fileRecord = this.fbService.isLiveMode ?
          await this.fbService.getById(this.collections.items, this.contextTarget.id) :
          JSON.parse(localStorage.getItem(`demo_${this.collections.items}`) || "[]").find(f => f.id === this.contextTarget.id);

        await this.fbService.delete(this.collections.items, this.contextTarget.id);

        const chunks = this.fbService.isLiveMode ?
          await this.fbService.getByField(this.collections.fileChunks, "fileId", fileRecord?.fileId || this.contextTarget.fileId) :
          JSON.parse(localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]").filter(c => c.fileId === (fileRecord?.fileId || this.contextTarget.fileId));

        for (const chunk of chunks) {
          await this.fbService.delete(this.collections.fileChunks, chunk.id);
        }
        ToastManager.show("File deleted", "success");
      }
      document.getElementById("contextMenu").classList.add("hidden");
      this.loadCurrentFolder();
    });

    document.getElementById("ctxDownloadBtn")?.addEventListener("click", async () => {
      if (!this.contextTarget || this.contextTarget.type !== 'file') return;

      const fileRecord = this.fbService.isLiveMode ?
        await this.fbService.getById(this.collections.items, this.contextTarget.id) :
        JSON.parse(localStorage.getItem(`demo_${this.collections.items}`) || "[]").find(f => f.id === this.contextTarget.id);
      if (!fileRecord) return;
      const chunks = this.fbService.isLiveMode ?
        await this.fbService.getByField(this.collections.fileChunks, "fileId", fileRecord.fileId) :
        JSON.parse(localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]").filter(c => c.fileId === fileRecord.fileId);
      chunks.sort((a, b) => a.partIndex - b.partIndex);
      const fullBase64 = chunks.map(c => c.chunkData).join("");
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = fullBase64;
      downloadAnchor.download = fileRecord.title;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      ToastManager.show(`Downloaded ${fileRecord.title}`, "success");
      document.getElementById("contextMenu").classList.add("hidden");
    });

    this.container.querySelector("#openFolderModalBtn")?.addEventListener("click", () => {
      document.getElementById("folderNameInput").value = "";
      document.getElementById("createFolderModal").classList.remove("hidden");
    });
    document.getElementById("cancelFolderBtn")?.addEventListener("click", () => {
      document.getElementById("createFolderModal").classList.add("hidden");
    });

    // Create Folder as a record inside the unified items collection
    document.getElementById("submitFolderBtn")?.addEventListener("click", async () => {
      const name = document.getElementById("folderNameInput").value.trim();
      if (!name) return;
      await this.fbService.create(this.collections.items, {
        title: name,
        isFolder: true,
        parentId: this.currentFolderId
      });
      ToastManager.show("Folder created!", "success");
      document.getElementById("createFolderModal").classList.add("hidden");
      this.loadCurrentFolder();
    });

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

    document.getElementById("createFileForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("chunkFileInput");
      const files = fileInput.files;
      if (!files || files.length === 0) return;

      const submitBtn = document.getElementById("submitFileBtn");
      submitBtn.disabled = true;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading (${i + 1}/${files.length}): ${file.name}`;

        try {
          const base64Data = await this.readFileAsDataURL(file);

          let thumbnail = "";
          if (file.type.startsWith("image/")) {
            thumbnail = await this.generateThumbnail(base64Data, 150);
          }

          const CHUNK_SIZE = 700000;
          const totalParts = Math.ceil(base64Data.length / CHUNK_SIZE);
          const fileId = "file_" + Date.now() + "_" + i;

          // Create File record in the unified items collection with isFolder: false
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
            await this.fbService.create(this.collections.fileChunks, {
              fileId,
              partIndex: c,
              chunkData
            });
          }

          ToastManager.show(`Uploaded: ${file.name}`, "success");
        } catch (err) {
          ToastManager.show(`Failed to upload ${file.name}: ${err.message}`, "error");
        }
      }

      submitBtn.disabled = false;
      submitBtn.textContent = "Upload File";
      document.getElementById("createFileModal").classList.add("hidden");
      this.loadCurrentFolder();
    });

    this.loadCurrentFolder();
  }
}
