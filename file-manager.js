export class FileManager {
  constructor(config = {}) {
    this.fbService = config.fbService;
    this.collections = {
      folders: config.foldersCollection,
      files: config.filesCollection,
      fileChunks: config.fileChunksCollection
    };

    this.currentFolderId = "root";
    this.contextTarget = null;
  }

  showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    const bgColors = { success: "bg-emerald-600", error: "bg-red-600", info: "bg-slate-900" };
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-medium text-white ${bgColors[type]} transition-all transform translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-base"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("translate-y-2", "opacity-0"));
    setTimeout(() => { toast.classList.add("opacity-0", "translate-y-2"); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  async loadCurrentFolder() {
    const breadcrumbs = document.getElementById("breadcrumbsBar");
    const grid = document.getElementById("fileGridContainer");
    if (!grid) return;
    
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-blue-500 block"></i>Loading folder...</div>`;

    try {
      let subFolders = [];
      let dirFiles = [];
      let currentFolderName = "Home";

      if (this.fbService.isLiveMode) {
        subFolders = await this.fbService.getByField(this.collections.folders, "parentId", this.currentFolderId);
        dirFiles = await this.fbService.getByField(this.collections.files, "folderId", this.currentFolderId);
        if (this.currentFolderId !== "root") {
          const parentFolder = await this.fbService.getById(this.collections.folders, this.currentFolderId);
          if (parentFolder) currentFolderName = parentFolder.name;
        }
      } else {
        const allFolders = JSON.parse(localStorage.getItem(`demo_${this.collections.folders}`) || "[]");
        const allFiles = JSON.parse(localStorage.getItem(`demo_${this.collections.files}`) || "[]");
        subFolders = allFolders.filter(f => f.parentId === this.currentFolderId);
        dirFiles = allFiles.filter(f => f.folderId === this.currentFolderId);
        if (this.currentFolderId !== "root") {
          const found = allFolders.find(f => f.id === this.currentFolderId);
          if (found) currentFolderName = found.name;
        }
      }

      if (this.currentFolderId === "root") {
        breadcrumbs.innerHTML = `<span class="text-blue-600 font-bold"><i class="fa-solid fa-house"></i> Home</span>`;
      } else {
        breadcrumbs.innerHTML = `
          <button onclick="fileManager.navigateToFolder('root')" class="hover:text-blue-600"><i class="fa-solid fa-house"></i> Home</button>
          <i class="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
          <span class="text-blue-600 font-bold">${this.escapeHtml(currentFolderName)}</span>
        `;
      }

      document.getElementById("fileCountBadge").textContent = `${subFolders.length} folders, ${dirFiles.length} files`;

      let html = "";
      subFolders.forEach(folder => {
        html += `
          <div ondblclick="fileManager.navigateToFolder('${folder.id}')" onclick="fileManager.navigateToFolder('${folder.id}')" oncontextmenu="fileManager.openContextMenu(event, 'folder', '${folder.id}')" class="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition group shadow-sm select-none">
            <i class="fa-solid fa-folder text-amber-400 text-4xl group-hover:scale-110 transition"></i>
            <span class="text-xs font-bold text-slate-700 truncate w-full text-center">${this.escapeHtml(folder.name)}</span>
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
            <span class="text-xs font-semibold text-slate-800 truncate w-full text-center" title="${this.escapeHtml(file.title)}">${this.escapeHtml(file.title)}</span>
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
      this.showToast(`Error loading folder: ${err.message}`, "error");
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
      await this.fbService.getById(this.collections.files, id) :
      JSON.parse(localStorage.getItem(`demo_${this.collections.files}`) || "[]").find(f => f.id === id || f.fileId === fileId);

    if (!fileRecord) return;

    document.getElementById("viewModalTitle").textContent = fileRecord.title;
    document.getElementById("viewDate").innerHTML = `<i class="fa-regular fa-clock"></i> Recent`;
    
    const container = document.getElementById("viewContentContainer");
    const downloadBtn = document.getElementById("downloadFileBtn");
    
    container.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i><p class="text-xs text-slate-500">Reassembling file chunks...</p>`;
    document.getElementById("viewModal").classList.remove("hidden");

    const chunks = this.fbService.isLiveMode ?
      await this.fbService.getByField(this.collections.fileChunks, "fileId", fileRecord.fileId) :
      JSON.parse(localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]").filter(c => c.fileId === fileRecord.fileId);

    chunks.sort((a, b) => a.partIndex - b.partIndex);
    const fullBase64 = chunks.map(c => c.chunkData).join("");

    if (fullBase64.startsWith("data:image/")) {
      container.innerHTML = `<img src="${fullBase64}" class="max-h-85 rounded-xl shadow-md object-contain">`;
    } else if (fullBase64.startsWith("data:video/")) {
      container.innerHTML = `<video controls class="w-full max-h-85 rounded-xl shadow-md bg-black"><source src="${fullBase64}"></video>`;
    } else {
      container.innerHTML = `<div class="text-center py-6"><i class="fa-solid fa-file-arrow-down text-4xl text-blue-500 mb-2"></i><p class="text-sm font-semibold">${this.escapeHtml(fileRecord.title)}</p></div>`;
    }

    downloadBtn.href = fullBase64;
    downloadBtn.download = fileRecord.title;
  }

  init() {
    document.addEventListener("click", () => {
      document.getElementById("contextMenu")?.classList.add("hidden");
    });

    document.getElementById("backupDataBtn")?.addEventListener("click", async () => {
      this.showToast("Preparing ZIP backup...", "info");
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
            const folder = folders.find(f => f.id === currentId);
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
    
          const folderPath = getFolderPath(fileRecord.folderId);
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
        
        this.showToast("ZIP backup downloaded successfully!", "success");
      } catch (err) {
        this.showToast(`Failed to generate ZIP: ${err.message}`, "error");
      }
    });

    document.getElementById("ctxDeleteBtn")?.addEventListener("click", async () => {
      if (!this.contextTarget) return;
      if (this.contextTarget.type === 'folder') {
        if (!confirm("Delete folder?")) return;
        await this.fbService.delete(this.collections.folders, this.contextTarget.id);
        this.showToast("Folder deleted", "success");
      } else if (this.contextTarget.type === 'file') {
        if (!confirm("Delete file and its chunks?")) return;
        await this.fbService.delete(this.collections.files, this.contextTarget.id);
        
        const chunks = this.fbService.isLiveMode ? 
          await this.fbService.getByField(this.collections.fileChunks, "fileId", this.contextTarget.fileId) :
          JSON.parse(localStorage.getItem(`demo_${this.collections.fileChunks}`) || "[]").filter(c => c.fileId === this.contextTarget.fileId);
        
        for (const chunk of chunks) {
          await this.fbService.delete(this.collections.fileChunks, chunk.id);
        }
        this.showToast("File deleted", "success");
      }
      document.getElementById("contextMenu").classList.add("hidden");
      this.loadCurrentFolder();
    });

    document.getElementById("ctxDownloadBtn")?.addEventListener("click", async () => {
      if (!this.contextTarget || this.contextTarget.type !== 'file') return;
            
      const fileRecord = this.fbService.isLiveMode ?
        await this.fbService.getById(this.collections.files, this.contextTarget.id) :
        JSON.parse(localStorage.getItem(`demo_${this.collections.files}`) || "[]").find(f => f.id === this.contextTarget.id);
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
      this.showToast(`Downloaded ${fileRecord.title}`, "success");
      document.getElementById("contextMenu").classList.add("hidden");
    });

    document.getElementById("openFolderModalBtn")?.addEventListener("click", () => {
      document.getElementById("folderNameInput").value = "";
      document.getElementById("createFolderModal").classList.remove("hidden");
    });
    document.getElementById("cancelFolderBtn")?.addEventListener("click", () => document.getElementById("createFolderModal").classList.add("hidden"));
    
    document.getElementById("submitFolderBtn")?.addEventListener("click", async () => {
      const name = document.getElementById("folderNameInput").value.trim();
      if (!name) return;
      await this.fbService.create(this.collections.folders, { name, parentId: this.currentFolderId });
      this.showToast("Folder created!", "success");
      document.getElementById("createFolderModal").classList.add("hidden");
      this.loadCurrentFolder();
    });

    document.getElementById("openCreateModalBtn")?.addEventListener("click", () => {
      document.getElementById("createFileForm").reset();
      document.getElementById("createFileModal").classList.remove("hidden");
    });

    document.getElementById("closeFileModalBtn")?.addEventListener("click", () => document.getElementById("createFileModal").classList.add("hidden"));
    document.getElementById("cancelFileBtn")?.addEventListener("click", () => document.getElementById("createFileModal").classList.add("hidden"));

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

          this.showToast(`Uploaded: ${file.name}`, "success");
        } catch (err) {
          this.showToast(`Failed to upload ${file.name}: ${err.message}`, "error");
        }
      }

      submitBtn.disabled = false;
      submitBtn.textContent = "Upload File";
      document.getElementById("createFileModal").classList.add("hidden");
      this.loadCurrentFolder();
    });

    document.getElementById("closeViewModalBtn")?.addEventListener("click", () => {
      document.getElementById("viewContentContainer").innerHTML = "";
      document.getElementById("viewModal").classList.add("hidden");
    });

    this.loadCurrentFolder();
  }
}
