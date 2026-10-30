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
