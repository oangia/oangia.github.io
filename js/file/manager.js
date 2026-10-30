import { Toast } from "./toast.js";
import { FilePreviewComponent } from "./preview.js";
import { FileUploadComponent } from "./upload.js";

class BackupManager {
  constructor(config = {}) {
    this.fbService = config.fbService;
    this.collections = config.collections || {};
    this.buttonId = config.buttonId || "backupDataBtn";
    this.initEvents();
  }

  initEvents() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(`#${this.buttonId}`);
      if (btn) {
        this.downloadBackup();
      }
    });
  }

  async downloadBackup() {
    Toast.show("Preparing ZIP backup...", "info");
    try {
      let items = [], file_chunks = [];
      
      if (this.fbService.isLiveMode) {
        items = await this.fbService.getAll(this.collections.items);
        file_chunks = await this.fbService.getAll(this.collections.fileChunks);
      } else {
        items = JSON.parse(localStorage.getItem(`demo_${this.collections.items}`) || "[]");
        file_chunks = JSON.parse(localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]");
      }

      if (!window.JSZip && typeof JSZip === 'undefined') {
        throw new Error("JSZip library is not loaded!");
      }

      const ZipClass = window.JSZip || JSZip;
      const zip = new ZipClass();
      const folders = items.filter(i => i.isFolder);
      const files = items.filter(i => !i.isFolder);

      if (files.length === 0) {
        Toast.show("No files found to backup!", "error");
        return;
      }

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

        if (chunks.length === 0) continue;

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

        zip.file(filePath, bytes, { compression: "STORE" });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(content);

      const parentDoc = window.parent.document;
      const downloadAnchor = parentDoc.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`;
      parentDoc.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      Toast.show("ZIP backup downloaded successfully!", "success");
    } catch (err) {
      console.error("Backup error:", err);
      Toast.show(`Failed to generate ZIP: ${err.message}`, "error");
    }
  }
}
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
    
    // Instantiate Upload Component cleanly
    this.uploader = new FileUploadComponent({
      fbService: this.fbService,
      collections: this.collections,
      getCurrentFolderId: () => this.currentFolderId,
      onUploadComplete: () => this.loadCurrentFolder()
    });

    this.backupManager = new BackupManager({
      fbService: this.fbService,
      collections: this.collections,
      buttonId: "backupDataBtn"
    });
  }

  // (renderItems, loadCurrentFolder, navigateToFolder, viewFile methods remain here...)

  init() {
    this.previewer.initEvents();
    this.uploader.initEvents(); // Initialize all upload modal & form event handlers

    document.addEventListener("click", () => this.hideContextMenu());

    // Folder Modal Events
    document.getElementById("openFolderModalBtn")?.addEventListener("click", () => this.toggleModal("folderModal", true));
    document.getElementById("cancelFolderBtn")?.addEventListener("click", () => this.toggleModal("folderModal", false));

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

    this.loadCurrentFolder();
  }
}
