import { Toast } from "./toast.js";
import { FilePreviewComponent } from "./preview.js";
import { UI } from "./ui.js"; // Import the new UI manager

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
    
    // Instantiate UI and Preview components
    this.ui = new UI(this.containerId);
    this.previewer = new FilePreviewComponent();
  }

  async loadCurrentFolder() {
    this.ui.showLoadingState();

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

      // Delegate rendering to FileUIManager
      this.ui.renderItems(subFolders, dirFiles, this.currentFolderId, currentFolderName);
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
    this.ui.showContextMenu(e, type);
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
    this.ui.mountMainLayout();
    this.previewer.initEvents();

    document.addEventListener("click", () => this.ui.hideContextMenu());

    // Event Listeners for UI triggers
    document.getElementById("openFolderModalBtn")?.addEventListener("click", () => this.ui.toggleFolderModal(true));
    document.getElementById("cancelFolderBtn")?.addEventListener("click", () => this.ui.toggleFolderModal(false));
    document.getElementById("openCreateModalBtn")?.addEventListener("click", () => this.ui.toggleFileModal(true));
    document.getElementById("closeFileModalBtn")?.addEventListener("click", () => this.ui.toggleFileModal(false));
    document.getElementById("cancelFileBtn")?.addEventListener("click", () => this.ui.toggleFileModal(false));

    // Submit Folder
    document.getElementById("submitFolderBtn")?.addEventListener("click", async () => {
      const name = this.ui.getFolderNameInput();
      if (!name) return;
      await this.fbService.create(this.collections.items, {
        title: name,
        isFolder: true,
        parentId: this.currentFolderId
      });
      Toast.show("Folder created!", "success");
      this.ui.toggleFolderModal(false);
      this.loadCurrentFolder();
    });

    // Submit File Upload
    document.getElementById("createFileForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("chunkFileInput");
      const files = fileInput.files;
      if (!files || files.length === 0) return;

      this.ui.setUploadButtonProgress(true, `Uploading (1/${files.length})...`);

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

      this.ui.setUploadButtonProgress(false, "Upload File");
      this.ui.toggleFileModal(false);
      this.loadCurrentFolder();      
    });

    this.loadCurrentFolder();
    // Backup Data Listener
    this.container.querySelector("#backupDataBtn")?.addEventListener("click", async () => {
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
        console.log(items);

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

        Toast.show("ZIP backup downloaded successfully!", "success");
      } catch (err) {
        Toast.show(`Failed to generate ZIP: ${err.message}`, "error");
      }
    });
  }
}
