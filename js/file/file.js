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
    FileManagerUI.bindEvents(this.container, {
      isEditableFile: (filename) => this.isEditableFile(filename),
      onBack: () => this.navigateUp(),
      onNavigate: (id) => this.navigateToFolder(id),
      onView: (id, fileId) => this.viewFile(id, fileId),
      onContextMenuTrigger: (target) => { this.contextTarget = target; },
      onCtxEdit: () => { if (this.contextTarget) this.openTextEditorForEdit(this.contextTarget); },
      onCtxDelete: () => { if (this.contextTarget) this.deleteItem(this.contextTarget); },
      onCtxDownload: () => { if (this.contextTarget && this.contextTarget.type === "file") this.downloadFile(this.contextTarget); },
      onCreateFolder: (name) => this.createFolder(name, this.currentFolderId),
      onOpenTextCreate: () => {
        this.editingFileTarget = null;
        this.openTextEditorForCreate();
      },
      onSaveTextFile: () => this.saveTextFile(),
      onUploadFiles: (files) => this.uploadFiles(files, this.currentFolderId)
    });
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

    grid.innerHTML = FileManagerUI.getLoadingHTML();

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

    if (folders.length === 0 && files.length === 0) {
      grid.innerHTML = FileManagerUI.getEmptyFolderHTML();
      return;
    }

    let html = "";

    folders.forEach(folder => {
      const name = folder.title || folder.name || "Untitled";
      const folderSubtext = folder.size > 0 ? this._formatBytes(folder.size) : "Folder";
      html += FileManagerUI.renderFolderItem(folder.id, name, folderSubtext);
    });

    files.forEach(file => {
      const name = file.title || "Untitled";
      const ext = file.extension || name.split(".").pop()?.toLowerCase() || "";
      const sizeLabel = file.size != null ? this._formatBytes(file.size) : `${file.totalParts || 1} chunks`;
      const previewHTML = FileManagerUI.getFilePreviewHTML(file, ext, name);

      html += FileManagerUI.renderFileItem(file.id, file.fileId, name, previewHTML, sizeLabel);
    });

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
    FileManagerUI.setEditorTitle('Create Text File');
    FileManagerUI.setEditorInputs("untitled.txt", "", false);
    FileManagerUI.showTextEditorModal();
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

    FileManagerUI.setEditorTitle(`Edit File: ${fileRecord.title}`);
    FileManagerUI.setEditorInputs(fileRecord.title, fileContent, true);
    
    this.editingFileTarget = target;
    FileManagerUI.showTextEditorModal();
  }

  async saveTextFile() {
    const fileName = FileManagerUI.getFileNameInputValue();
    if (!fileName) return;

    const finalName = (!this.editingFileTarget && !fileName.includes(".")) ? `${fileName}.txt` : fileName;
    const content = FileManagerUI.getFileContentInputValue();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const fileObj = new File([blob], finalName, { type: "text/plain" });

    if (this.editingFileTarget) {
      try {
        await this.service.deleteFile(this.editingFileTarget.id, this.editingFileTarget.fileId);
      } catch (e) {
        console.error(e);
      }
      this.editingFileTarget = null;
    }

    await this.uploadFiles([fileObj], this.currentFolderId);
    FileManagerUI.hideTextEditorModal();
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
}
