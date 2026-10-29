import { FirebaseService } from "./firebase-service.js";

// Helper for HTML escaping
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Utility class for UI Notifications
export class ToastManager {
  static show(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    const bgColors = {
      success: "bg-emerald-600",
      error: "bg-red-600",
      info: "bg-slate-900"
    };
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-medium text-white ${
      bgColors[type] || bgColors.info
    } transition-all transform translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-base"></i> <span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("translate-y-2", "opacity-0"));
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Class: Breadcrumb Navigation Bar
class BreadcrumbsComponent {
  constructor(containerId, onNavigate) {
    this.container = document.getElementById(containerId);
    this.onNavigate = onNavigate;
  }

  render(folderId, folderName) {
    if (!this.container) return;
    if (folderId === "root") {
      this.container.innerHTML = `<span class="text-blue-600 font-bold"><i class="fa-solid fa-house"></i> Home</span>`;
    } else {
      this.container.innerHTML = `
        <button id="navHomeBtn" class="hover:text-blue-600"><i class="fa-solid fa-house"></i> Home</button>
        <i class="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
        <span class="text-blue-600 font-bold">${escapeHtml(folderName)}</span>
      `;
      const homeBtn = this.container.querySelector("#navHomeBtn");
      if (homeBtn) homeBtn.addEventListener("click", () => this.onNavigate("root"));
    }
  }
}

// Class: Main Grid Display for Folders and Files
class FileGridComponent {
  constructor(gridId, badgeId, handlers) {
    this.grid = document.getElementById(gridId);
    this.badge = document.getElementById(badgeId);
    this.handlers = handlers; // { onOpenFolder, onViewFile, onContextMenu }
  }

  showLoading() {
    if (this.grid) {
      this.grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-blue-500 block"></i>Loading folder...</div>`;
    }
  }

  render(subFolders, dirFiles) {
    if (this.badge) {
      this.badge.textContent = `${subFolders.length} folders, ${dirFiles.length} files`;
    }

    if (!this.grid) return;

    if (subFolders.length === 0 && dirFiles.length === 0) {
      this.grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs"><i class="fa-regular fa-folder-open text-3xl mb-2 text-slate-300 block"></i>This folder is empty</div>`;
      return;
    }

    this.grid.innerHTML = "";

    // Render Folders
    subFolders.forEach((folder) => {
      const card = document.createElement("div");
      card.className =
        "bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition group shadow-sm select-none";
      card.innerHTML = `
        <i class="fa-solid fa-folder text-amber-400 text-4xl group-hover:scale-110 transition"></i>
        <span class="text-xs font-bold text-slate-700 truncate w-full text-center">${escapeHtml(folder.name)}</span>
      `;
      card.addEventListener("click", () => this.handlers.onOpenFolder(folder.id));
      card.addEventListener("contextmenu", (e) =>
        this.handlers.onContextMenu(e, "folder", folder.id)
      );
      this.grid.appendChild(card);
    });

    // Render Files
    dirFiles.forEach((file) => {
      let thumbHtml = `<i class="fa-solid fa-file-lines text-blue-400 text-4xl"></i>`;
      if (file.thumbnail) {
        thumbHtml = `<img src="${file.thumbnail}" class="w-full h-20 object-cover rounded-xl shadow-inner">`;
      } else if (file.category === "Media") {
        thumbHtml = `<i class="fa-solid fa-file-video text-purple-400 text-4xl"></i>`;
      }

      const card = document.createElement("div");
      card.className =
        "bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 flex flex-col items-center justify-between gap-2 cursor-pointer transition group shadow-sm select-none";
      card.innerHTML = `
        <div class="w-full flex justify-center items-center h-20 bg-slate-100 rounded-xl overflow-hidden">
          ${thumbHtml}
        </div>
        <span class="text-xs font-semibold text-slate-800 truncate w-full text-center" title="${escapeHtml(file.title)}">${escapeHtml(file.title)}</span>
        <div class="w-full text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          <span>${file.totalParts || 1} chunks</span>
        </div>
      `;
      card.addEventListener("click", () => this.handlers.onViewFile(file.id, file.fileId));
      card.addEventListener("contextmenu", (e) =>
        this.handlers.onContextMenu(e, "file", file.id, file.fileId)
      );
      this.grid.appendChild(card);
    });
  }
}

// Class: Context Menu
class ContextMenuComponent {
  constructor(menuId, deleteBtnId, downloadBtnId, handlers) {
    this.menu = document.getElementById(menuId);
    this.deleteBtn = document.getElementById(deleteBtnId);
    this.downloadBtn = document.getElementById(downloadBtnId);
    this.handlers = handlers; // { onDelete, onDownload }
    this.currentTarget = null;

    this.initEvents();
  }

  initEvents() {
    document.addEventListener("click", () => this.hide());
    if (this.deleteBtn) {
      this.deleteBtn.addEventListener("click", () => {
        if (this.currentTarget) this.handlers.onDelete(this.currentTarget);
        this.hide();
      });
    }
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener("click", () => {
        if (this.currentTarget) this.handlers.onDownload(this.currentTarget);
        this.hide();
      });
    }
  }

  open(e, type, id, fileId = null) {
    e.preventDefault();
    this.currentTarget = { type, id, fileId };
    if (type === "file") {
      this.downloadBtn?.classList.remove("hidden");
    } else {
      this.downloadBtn?.classList.add("hidden");
    }
    this.menu.style.top = `${Math.min(e.clientY, window.innerHeight - 120)}px`;
    this.menu.style.left = `${Math.min(e.clientX, window.innerWidth - 160)}px`;
    this.menu.classList.remove("hidden");
  }

  hide() {
    this.menu?.classList.add("hidden");
  }
}

// Class: Folder Creation Modal
class FolderModalComponent {
  constructor(modalId, openBtnId, cancelBtnId, submitBtnId, inputId, onCreate) {
    this.modal = document.getElementById(modalId);
    this.openBtn = document.getElementById(openBtnId);
    this.cancelBtn = document.getElementById(cancelBtnId);
    this.submitBtn = document.getElementById(submitBtnId);
    this.input = document.getElementById(inputId);
    this.onCreate = onCreate;

    this.initEvents();
  }

  initEvents() {
    this.openBtn?.addEventListener("click", () => {
      if (this.input) this.input.value = "";
      this.modal?.classList.remove("hidden");
    });
    this.cancelBtn?.addEventListener("click", () => this.modal?.classList.add("hidden"));
    this.submitBtn?.addEventListener("click", async () => {
      const name = this.input?.value.trim();
      if (!name) return;
      await this.onCreate(name);
      this.modal?.classList.add("hidden");
    });
  }
}

// Class: Chunked File Upload Modal
class UploadModalComponent {
  constructor(modalId, openBtnId, closeBtnId, cancelBtnId, formId, fileInputId, submitBtnId, onUpload) {
    this.modal = document.getElementById(modalId);
    this.openBtn = document.getElementById(openBtnId);
    this.closeBtn = document.getElementById(closeBtnId);
    this.cancelBtn = document.getElementById(cancelBtnId);
    this.form = document.getElementById(formId);
    this.fileInput = document.getElementById(fileInputId);
    this.submitBtn = document.getElementById(submitBtnId);
    this.onUpload = onUpload;

    this.initEvents();
  }

  initEvents() {
    this.openBtn?.addEventListener("click", () => {
      this.form?.reset();
      this.modal?.classList.remove("hidden");
    });
    this.closeBtn?.addEventListener("click", () => this.modal?.classList.add("hidden"));
    this.cancelBtn?.addEventListener("click", () => this.modal?.classList.add("hidden"));

    this.form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const files = this.fileInput?.files;
      if (!files || files.length === 0) return;

      this.submitBtn.disabled = true;
      await this.onUpload(files, (current, total, name) => {
        this.submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading (${current}/${total}): ${escapeHtml(name)}`;
      });

      this.submitBtn.disabled = false;
      this.submitBtn.textContent = "Upload File";
      this.modal?.classList.add("hidden");
    });
  }
}

// Class: File View & Reassembly Preview Modal
class ViewModalComponent {
  constructor(modalId, closeBtnId, titleId, contentId, downloadBtnId, dateId) {
    this.modal = document.getElementById(modalId);
    this.closeBtn = document.getElementById(closeBtnId);
    this.title = document.getElementById(titleId);
    this.content = document.getElementById(contentId);
    this.downloadBtn = document.getElementById(downloadBtnId);
    this.date = document.getElementById(dateId);

    this.closeBtn?.addEventListener("click", () => {
      if (this.content) this.content.innerHTML = "";
      this.modal?.classList.add("hidden");
    });
  }

  showLoading(fileName) {
    if (this.title) this.title.textContent = fileName;
    if (this.date) this.date.innerHTML = `<i class="fa-regular fa-clock"></i> Recent`;
    if (this.content) {
      this.content.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i><p class="text-xs text-slate-500">Reassembling file chunks...</p>`;
    }
    this.modal?.classList.remove("hidden");
  }

  renderContent(fileRecord, fullBase64) {
    if (fullBase64.startsWith("data:image/")) {
      this.content.innerHTML = `<img src="${fullBase64}" class="max-h-85 rounded-xl shadow-md object-contain">`;
    } else if (fullBase64.startsWith("data:video/")) {
      this.content.innerHTML = `<video controls class="w-full max-h-85 rounded-xl shadow-md bg-black"><source src="${fullBase64}"></video>`;
    } else {
      this.content.innerHTML = `<div class="text-center py-6"><i class="fa-solid fa-file-arrow-down text-4xl text-blue-500 mb-2"></i><p class="text-sm font-semibold">${escapeHtml(fileRecord.title)}</p></div>`;
    }

    if (this.downloadBtn) {
      this.downloadBtn.href = fullBase64;
      this.downloadBtn.download = fileRecord.title;
    }
  }
}

// Class: Backup Service (Zipping all folders and files)
class BackupService {
  constructor(fbService, collections) {
    this.fbService = fbService;
    this.collections = collections;
  }

  async exportZip() {
    ToastManager.show("Preparing ZIP backup...", "info");
    try {
      let folders = [], files = [], file_chunks = [];
      if (this.fbService.isLiveMode) {
        folders = await this.fbService.getAll(this.collections.folders);
        files = await this.fbService.getAll(this.collections.files);
        file_chunks = await this.fbService.getAll(this.collections.fileChunks);
      } else {
        folders = JSON.parse(localStorage.getItem(`demo_${this.collections.folders}`) || "[]");
        files = JSON.parse(localStorage.getItem(`demo_${this.collections.files}`) || "[]");
        file_chunks = JSON.parse(localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]");
      }

      const zip = new JSZip();

      const getFolderPath = (folderId) => {
        let pathParts = [];
        let currentId = folderId;
        while (currentId && currentId !== "root") {
          const folder = folders.find((f) => f.id === currentId);
          if (folder) {
            pathParts.unshift(folder.name);
            currentId = folder.parentId;
          } else {
            break;
          }
        }
        return pathParts.join("/");
      };

      for (const fileRecord of files) {
        const chunks = file_chunks
          .filter((c) => c.fileId === fileRecord.fileId)
          .sort((a, b) => a.partIndex - b.partIndex);

        const fullBase64 = chunks.map((c) => c.chunkData).join("");
        const base64Data = fullBase64.split(",")[1];
        if (!base64Data) continue;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const folderPath = getFolderPath(fileRecord.folderId);
        const filePath = folderPath ? `${folderPath}/${fileRecord.title}` : fileRecord.title;

        zip.file(filePath, bytes);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = URL.createObjectURL(content);
      downloadAnchor.download = `file_manager_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      ToastManager.show("ZIP backup downloaded successfully!", "success");
    } catch (err) {
      ToastManager.show(`Failed to generate ZIP: ${err.message}`, "error");
    }
  }
}

// MAIN CLASS: Unifies data operations & orchestrates sub-components
export class FileManager {
  constructor(config = {}) {
    this.fbService = config.fbService || new FirebaseService();
    this.currentFolderId = "root";

    // Configurable Firestore Collection / Storage keys
    this.collections = {
      folders: config.foldersCollection || "folders",
      files: config.filesCollection || "files",
      fileChunks: config.fileChunksCollection || "file_chunks"
    };

    // Instantiate Sub-Components
    this.breadcrumbs = new BreadcrumbsComponent(
      config.breadcrumbsId || "breadcrumbsBar",
      (folderId) => this.navigateToFolder(folderId)
    );

    this.grid = new FileGridComponent(
      config.gridId || "fileGridContainer",
      config.badgeId || "fileCountBadge",
      {
        onOpenFolder: (id) => this.navigateToFolder(id),
        onViewFile: (id, fileId) => this.viewFile(id, fileId),
        onContextMenu: (e, type, id, fileId) => this.contextMenu.open(e, type, id, fileId)
      }
    );

    this.contextMenu = new ContextMenuComponent(
      config.contextMenuId || "contextMenu",
      config.ctxDeleteBtnId || "ctxDeleteBtn",
      config.ctxDownloadBtnId || "ctxDownloadBtn",
      {
        onDelete: (target) => this.deleteTarget(target),
        onDownload: (target) => this.downloadTarget(target)
      }
    );

    this.folderModal = new FolderModalComponent(
      config.createFolderModalId || "createFolderModal",
      config.openFolderModalBtnId || "openFolderModalBtn",
      config.cancelFolderBtnId || "cancelFolderBtn",
      config.submitFolderBtnId || "submitFolderBtn",
      config.folderNameInputId || "folderNameInput",
      (name) => this.createFolder(name)
    );

    this.uploadModal = new UploadModalComponent(
      config.createFileModalId || "createFileModal",
      config.openCreateModalBtnId || "openCreateModalBtn",
      config.closeFileModalBtnId || "closeFileModalBtn",
      config.cancelFileBtnId || "cancelFileBtn",
      config.createFileFormId || "createFileForm",
      config.chunkFileInputId || "chunkFileInput",
      config.submitFileBtnId || "submitFileBtn",
      (files, progressCb) => this.uploadFiles(files, progressCb)
    );

    this.viewModal = new ViewModalComponent(
      config.viewModalId || "viewModal",
      config.closeViewModalBtnId || "closeViewModalBtn",
      config.viewModalTitleId || "viewModalTitle",
      config.viewContentContainerId || "viewContentContainer",
      config.downloadFileBtnId || "downloadFileBtn",
      config.viewDateId || "viewDate"
    );

    this.backupService = new BackupService(this.fbService, this.collections);

    const backupBtn = document.getElementById(config.backupDataBtnId || "backupDataBtn");
    backupBtn?.addEventListener("click", () => this.backupService.exportZip());
  }

  async navigateToFolder(folderId) {
    this.currentFolderId = folderId;
    await this.loadCurrentFolder();
  }

  async loadCurrentFolder() {
    this.grid.showLoading();

    try {
      let subFolders = [];
      let dirFiles = [];
      let currentFolderName = "Home";

      if (this.fbService.isLiveMode) {
        subFolders = await this.fbService.getByField(
          this.collections.folders,
          "parentId",
          this.currentFolderId
        );
        dirFiles = await this.fbService.getByField(
          this.collections.files,
          "folderId",
          this.currentFolderId
        );
        if (this.currentFolderId !== "root") {
          const parentFolder = await this.fbService.getById(
            this.collections.folders,
            this.currentFolderId
          );
          if (parentFolder) currentFolderName = parentFolder.name;
        }
      } else {
        const allFolders = JSON.parse(
          localStorage.getItem(`demo_${this.collections.folders}`) || "[]"
        );
        const allFiles = JSON.parse(
          localStorage.getItem(`demo_${this.collections.files}`) || "[]"
        );
        subFolders = allFolders.filter((f) => f.parentId === this.currentFolderId);
        dirFiles = allFiles.filter((f) => f.folderId === this.currentFolderId);
        if (this.currentFolderId !== "root") {
          const found = allFolders.find((f) => f.id === this.currentFolderId);
          if (found) currentFolderName = found.name;
        }
      }

      this.breadcrumbs.render(this.currentFolderId, currentFolderName);
      this.grid.render(subFolders, dirFiles);
    } catch (err) {
      ToastManager.show(`Error loading folder: ${err.message}`, "error");
    }
  }

  async createFolder(name) {
    await this.fbService.create(this.collections.folders, {
      name,
      parentId: this.currentFolderId
    });
    ToastManager.show("Folder created!", "success");
    await this.loadCurrentFolder();
  }

  async uploadFiles(files, progressCb) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (progressCb) progressCb(i + 1, files.length, file.name);

      try {
        const base64Data = await this.readFileAsDataURL(file);

        let thumbnail = "";
        if (file.type.startsWith("image/")) {
          thumbnail = await this.generateThumbnail(base64Data, 150);
        }

        const CHUNK_SIZE = 700000; // ~700KB chunks
        const totalParts = Math.ceil(base64Data.length / CHUNK_SIZE);
        const fileId = "file_" + Date.now() + "_" + i;

        await this.fbService.create(this.collections.files, {
          fileId,
          title: file.name,
          category: file.type.startsWith("image/") ? "Image" : "Media",
          folderId: this.currentFolderId,
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
    await this.loadCurrentFolder();
  }

  async viewFile(id, fileId) {
    let fileRecord = null;
    if (this.fbService.isLiveMode) {
      fileRecord = await this.fbService.getById(this.collections.files, id);
    } else {
      const allFiles = JSON.parse(
        localStorage.getItem(`demo_${this.collections.files}`) || "[]"
      );
      fileRecord = allFiles.find((f) => f.id === id || f.fileId === fileId);
    }

    if (!fileRecord) return;

    this.viewModal.showLoading(fileRecord.title);

    let chunks = [];
    if (this.fbService.isLiveMode) {
      chunks = await this.fbService.getByField(
        this.collections.fileChunks,
        "fileId",
        fileRecord.fileId
      );
    } else {
      const allChunks = JSON.parse(
        localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]"
      );
      chunks = allChunks.filter((c) => c.fileId === fileRecord.fileId);
    }

    chunks.sort((a, b) => a.partIndex - b.partIndex);
    const fullBase64 = chunks.map((c) => c.chunkData).join("");

    this.viewModal.renderContent(fileRecord, fullBase64);
  }

  async deleteTarget(target) {
    if (target.type === "folder") {
      if (!confirm("Delete folder?")) return;
      await this.fbService.delete(this.collections.folders, target.id);
      ToastManager.show("Folder deleted", "success");
    } else if (target.type === "file") {
      if (!confirm("Delete file and its chunks?")) return;
      await this.fbService.delete(this.collections.files, target.id);

      let chunks = [];
      if (this.fbService.isLiveMode) {
        chunks = await this.fbService.getByField(
          this.collections.fileChunks,
          "fileId",
          target.fileId
        );
      } else {
        chunks = JSON.parse(
          localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]"
        ).filter((c) => c.fileId === target.fileId);
      }

      for (const chunk of chunks) {
        await this.fbService.delete(this.collections.fileChunks, chunk.id);
      }
      ToastManager.show("File deleted", "success");
    }
    await this.loadCurrentFolder();
  }

  async downloadTarget(target) {
    if (target.type !== "file") return;

    let fileRecord = null;
    if (this.fbService.isLiveMode) {
      fileRecord = await this.fbService.getById(this.collections.files, target.id);
    } else {
      fileRecord = JSON.parse(
        localStorage.getItem(`demo_${this.collections.files}`) || "[]"
      ).find((f) => f.id === target.id);
    }

    if (!fileRecord) return;

    let chunks = [];
    if (this.fbService.isLiveMode) {
      chunks = await this.fbService.getByField(
        this.collections.fileChunks,
        "fileId",
        fileRecord.fileId
      );
    } else {
      chunks = JSON.parse(
        localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]"
      ).filter((c) => c.fileId === fileRecord.fileId);
    }

    chunks.sort((a, b) => a.partIndex - b.partIndex);
    const fullBase64 = chunks.map((c) => c.chunkData).join("");

    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = fullBase64;
    downloadAnchor.download = fileRecord.title;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    ToastManager.show(`Downloaded ${fileRecord.title}`, "success");
  }

  startLocalDemo() {
    if (!localStorage.getItem(`demo_${this.collections.folders}`)) {
      localStorage.setItem(
        `demo_${this.collections.folders}`,
        JSON.stringify([
          {
            id: "f-1",
            name: "Sample Folder",
            parentId: "root",
            createdAt: new Date().toISOString()
          }
        ])
      );
    }
    if (!localStorage.getItem(`demo_${this.collections.files}`)) {
      localStorage.setItem(`demo_${this.collections.files}`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`demo_${this.collections.fileChunks}`)) {
      localStorage.setItem(`demo_${this.collections.fileChunks}`, JSON.stringify([]));
    }
    this.loadCurrentFolder();
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
        let w = img.width,
          h = img.height;
        if (w > h) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        } else {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = () => resolve("");
    });
  }
}
