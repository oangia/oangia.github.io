export class FileManagerFirebase {
  constructor(fbService, collections = {}) {
    this.fbService = fbService;
    this.collections = {
      items: collections.items || "files",
      fileChunks: collections.fileChunks || "file_chunks"
    };
  }

  switch(collections) {
    this.collections = {
      items: collections.items || this.collections.items,
      fileChunks: collections.fileChunks || this.collections.fileChunks
    };
  }

  // ---------- READ ----------
  async getFolderContents(folderId = "root") {
    const items = await this.fbService.getByField(
      this.collections.items,
      "parentId",
      folderId
    );

    const folders = items.filter(item => item.isFolder === true);
    const files = items.filter(item => !item.isFolder);

    let currentFolderName = "Home";
    if (folderId !== "root") {
      const folder = await this.fbService.getById(this.collections.items, folderId);
      if (folder) currentFolderName = folder.title || folder.name || "Untitled";
    }

    return { folders, files, currentFolderName };
  }

  async getFileRecord(id) {
    return this.fbService.getById(this.collections.items, id);
  }

  async getFileChunks(fileId) {
    const chunks = await this.fbService.getByField(
      this.collections.fileChunks,
      "fileId",
      fileId
    );
    return chunks.sort((a, b) => a.partIndex - b.partIndex);
  }

  async getFullBase64(fileId) {
    const chunks = await this.getFileChunks(fileId);
    return chunks.map(c => c.chunkData).join("");
  }

  // ---------- WRITE ----------
  async createFolder(name, parentId = "root") {
    return this.fbService.create(this.collections.items, {
      title: name,
      isFolder: true,
      parentId
    });
  }

  async uploadFile(file, parentId = "root", onProgress) {
    return this.fbService.uploadFile(
      this.collections,
      parentId,
      file,
      onProgress
    );
  }

  async deleteFolder(id) {
    return this.fbService.delete(this.collections.items, id);
  }

  async deleteFile(id, fileId) {
    await this.fbService.delete(this.collections.items, id);

    const chunks = await this.getFileChunks(fileId);
    for (const chunk of chunks) {
      await this.fbService.delete(this.collections.fileChunks, chunk.id);
    }
  }

  // ---------- BACKUP & DOWNLOAD (Moved to Service) ----------
  async generateZipBlob() {
    let items = [], file_chunks = [];
    items = await this.fbService.getAll(this.collections.items);
    file_chunks = await this.fbService.getAll(this.collections.fileChunks);
    
    if (typeof JSZip === 'undefined') {
      throw new Error("JSZip is not loaded or defined in the global scope.");
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

    const uint8ArrayData = await zip.generateAsync({ type: "uint8array" });
    const content = new Blob([uint8ArrayData], { type: "application/zip" });
    return content;
  }

  async downloadBackup() {
    const content = await this.generateZipBlob();
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(content);
    downloadAnchor.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
