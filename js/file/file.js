import { FilePreviewComponent } from "./preview.js";
import { FileManagerUI } from "./ui.js";

export class FileManager {
  constructor(config = {}) {
    this.container = document.getElementById(config.containerId);

    this.service = config.service;

    this.currentFolderId = "root";
    this.contextTarget = null;
    this.editingFileTarget = null;
    this.previewer = new FilePreviewComponent();

    this.editableExtensions = new Set([
      "txt", "js", "ts", "jsx", "tsx", "html", "htm", "css", "scss",
      "json", "md", "py", "sh", "xml", "csv", "svg", "yaml", "yml",
      "env", "ini", "sql", "c", "cpp", "h", "java"
    ]);
  }

  init() {
    this._mountUI();
    this._bindEvents();
    this.loadCurrentFolder();
  }

  async switch(collections) {
    await this.service.switch(collections);
    this.currentFolderId = "root";
    await this.loadCurrentFolder();
  }

  isEditableFile(filename = "") {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return this.editableExtensions.has(ext);
  }

  _mountUI() {
    if (!this.container) return;

    // Call static UI methods
    this.container.innerHTML = FileManagerUI.getMainLayoutHTML();
    document.body.insertAdjacentHTML("beforeend", FileManagerUI.getOverlaysHTML());
    
    this.previewer.initEvents();
  }

  getFolderSize(node) {
    let totalSize = 0;
    const children = node.__children || {};
    const files = node.__files || [];
    
    for (const file of files) {
      totalSize += file.size || 0;
    }
    for (const key in children) {
      totalSize += this.getFolderSize(children[key]);
    }
    return totalSize;
  }

  _formatBytes(bytes) {
    if (bytes === 0 || isNaN(bytes) || bytes == null) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

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
      folders.forEach(folder => {
        const name = folder.title || folder.name || "Untitled";
        const folderSubtext = folder.size > 0 ? this._formatBytes(folder.size) : "Folder";

        html += `
          <div data-action="navigate" data-id="${folder.id}"
               data-context="folder" data-context-id="${folder.id}"
               class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden">
            <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-folder text-5xl"></i>
            </div>
            <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
              <span class="w-full text-xs font-bold text-slate-700 truncate" title="${name}">${name}</span>
              <span class="text-[9px] text-slate-400 font-mono mt-0.5">${folderSubtext}</span>
            </div>
          </div>`;
      });

      files.forEach(file => {
        const name = file.title || "Untitled";
        const ext = file.extension || name.split(".").pop()?.toLowerCase() || "";
        let previewHTML = `<i class="fa-regular fa-file-lines text-slate-400 text-3xl"></i>`;

        if (file.previewType === 'image' && file.thumbnail) {
          previewHTML = `<img src="${file.thumbnail}" alt="${name}" class="w-full h-full object-cover rounded-lg" />`;
        } else if (file.previewType === 'video' && file.thumbnail) {
          previewHTML = `
            <video src="${file.thumbnail}" class="widget-video-preview w-full h-full object-cover rounded-lg pointer-events-none" muted playsinline preload="metadata"></video>
            <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">VIDEO</div>
          `;
        } else if (file.previewType === 'audio') {
          previewHTML = `
            <div class="flex flex-col items-center justify-center text-blue-500">
              <i class="fa-solid fa-file-audio text-3xl mb-1"></i>
              <span class="text-[9px] font-mono text-slate-500 uppercase">${ext}</span>
            </div>`;
        } else if (file.previewType === 'text' && file.thumbnail) {
          const escapedText = String(file.thumbnail).replace(/[&<>"']/g, (m) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
          );
          previewHTML = `<pre class="text-[8px] leading-tight text-slate-500 font-mono text-left p-1.5 overflow-hidden w-full h-full select-none opacity-80">${escapedText}</pre>`;
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
               data-context="file" data-context-id="${file.id}" data-file-id="${file.fileId}" data-file-name="${name}"
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

    grid.querySelectorAll('.widget-video-preview').forEach((videoEl) => {
      videoEl.addEventListener('loadedmetadata', () => {
        videoEl.currentTime = Math.min(1, videoEl.duration / 4);
      });
    });
  }

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

  openTextEditorForCreate() {
    document.getElementById("textEditorTitle").innerHTML = `<i class="fa-solid fa-file-pen text-blue-500"></i> Create Text File`;
    document.getElementById("textFileNameInput").value = "untitled.txt";
    document.getElementById("textFileNameInput").disabled = false;
    document.getElementById("textContentInput").value = "";
    document.getElementById("textEditorModal").classList.remove("hidden");
  }

  async openTextEditorForEdit(target) {
    const fileRecord = await this.service.getFileRecord(target.id);
    if (!fileRecord) return;

    const fullBase64 = await this.service.getFullBase64(fileRecord.fileId);
    
    let fileContent = "";
    try {
      const base64Data = fullBase64.split(",")[1] || fullBase64;
      fileContent = decodeURIComponent(escape(atob(base64Data)));
    } catch (e) {
      fileContent = "";
    }

    document.getElementById("textEditorTitle").innerHTML = `<i class="fa-solid fa-file-pen text-blue-500"></i> Edit File: ${fileRecord.title}`;
    document.getElementById("textFileNameInput").value = fileRecord.title;
    document.getElementById("textFileNameInput").disabled = true;
    document.getElementById("textContentInput").value = fileContent;
    
    this.editingFileTarget = target;
    document.getElementById("textEditorModal").classList.remove("hidden");
  }

  async saveTextFile() {
    const nameInput = document.getElementById("textFileNameInput");
    const contentInput = document.getElementById("textContentInput");
    
    let fileName = nameInput.value.trim();
    if (!fileName) return;

    if (!this.editingFileTarget && !fileName.includes(".")) {
      fileName += ".txt";
    }

    const content = contentInput.value;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const fileObj = new File([blob], fileName, { type: "text/plain" });

    if (this.editingFileTarget) {
      try {
        await this.service.deleteFile(this.editingFileTarget.id, this.editingFileTarget.fileId);
      } catch (e) {
        console.error(e);
      }
      this.editingFileTarget = null;
    }

    await this.uploadFiles([fileObj], this.currentFolderId);
    document.getElementById("textEditorModal").classList.add("hidden");
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

  _bindEvents() {
    document.addEventListener("click", () => {
      document.getElementById("contextMenu")?.classList.add("hidden");
    });

    this.container.querySelector("#backBtn")?.addEventListener("click", () => {
      this.navigateUp();
    });

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

    this.container.addEventListener("contextmenu", (e) => {
      const target = e.target.closest("[data-context]");
      if (!target) return;

      e.preventDefault();
      const type = target.dataset.context;
      const id = target.dataset.contextId;
      const fileId = target.dataset.fileId || null;
      const fileName = target.dataset.fileName || "";

      this.contextTarget = { type, id, fileId, fileName };

      const menu = document.getElementById("contextMenu");
      const downloadBtn = document.getElementById("ctxDownloadBtn");
      const editBtn = document.getElementById("ctxEditBtn");

      if (type === "file") {
        downloadBtn.classList.remove("hidden");
        if (this.isEditableFile(fileName)) {
          editBtn.classList.remove("hidden");
        } else {
          editBtn.classList.add("hidden");
        }
      } else {
        downloadBtn.classList.add("hidden");
        editBtn.classList.add("hidden");
      }

      menu.style.top = `${Math.min(e.clientY, window.innerHeight - 120)}px`;
      menu.style.left = `${Math.min(e.clientX, window.innerWidth - 160)}px`;
      menu.classList.remove("hidden");
    });

    document.getElementById("ctxEditBtn")?.addEventListener("click", () => {
      if (!this.contextTarget) return;
      this.openTextEditorForEdit(this.contextTarget);
      document.getElementById("contextMenu").classList.add("hidden");
    });

    document.getElementById("ctxDeleteBtn")?.addEventListener("click", () => {
      if (!this.contextTarget) return;
      this.deleteItem(this.contextTarget);
      document.getElementById("contextMenu").classList.add("hidden");
    });

    document.getElementById("ctxDownloadBtn")?.addEventListener("click", () => {
      if (!this.contextTarget || this.contextTarget.type !== "file") return;
      this.downloadFile(this.contextTarget);
      document.getElementById("contextMenu").classList.add("hidden");
    });

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

    this.container.querySelector("#openTextModalBtn")?.addEventListener("click", () => {
      this.editingFileTarget = null;
      this.openTextEditorForCreate();
    });
    document.getElementById("closeTextModalBtn")?.addEventListener("click", () => {
      document.getElementById("textEditorModal").classList.add("hidden");
    });
    document.getElementById("cancelTextBtn")?.addEventListener("click", () => {
      document.getElementById("textEditorModal").classList.add("hidden");
    });
    document.getElementById("submitTextBtn")?.addEventListener("click", () => {
      this.saveTextFile();
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
    document.getElementById("createFileForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const files = document.getElementById("chunkFileInput").files;
      if (!files?.length) return;
      this.uploadFiles(files, this.currentFolderId);
      document.getElementById("createFileModal").classList.add("hidden");
    });
  }
}
