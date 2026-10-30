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
    
    // Dedicated Upload Component
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

  async loadCurrentFolder() {
    this.showLoadingState();

    try {
      let allItems = [];
      let currentFolderName = "Home";

      console.log("Loading folder. LiveMode:", this.fbService.isLiveMode, "Collection:", this.collections.items);

      if (this.fbService.isLiveMode) {
        allItems = await this.fbService.getByField(this.collections.items, "parentId", this.currentFolderId);
        console.log("Firebase fetched items:", allItems);
      } else {
        const stored = JSON.parse(localStorage.getItem(`demo_${this.collections.items}`) || "[]");
        allItems = stored.filter(item => item.parentId === this.currentFolderId);
        console.log("LocalStorage fetched items:", allItems);
      }

      const subFolders = allItems.filter(item => item.isFolder === true);
      const dirFiles = allItems.filter(item => !item.isFolder);

      this.renderItems(subFolders, dirFiles, currentFolderName);
    } catch (err) {
      console.error("Error in loadCurrentFolder:", err);
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
    console.log("init");
    this.previewer.initEvents();
    this.uploader.initEvents(); // Initialize upload component events

    document.addEventListener("click", () => this.hideContextMenu());

    // Event Listeners for folder modal triggers
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
