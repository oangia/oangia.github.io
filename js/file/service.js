export class FileManagerFirebase {
  constructor(fbService, collections = {}) {
    this.fbService = fbService;
    this.collections = {
      items: collections.items || "files",
      fileChunks: collections.fileChunks || "file_chunks"
    };
  }

  async switch(collections) {
    this.collections = {
      items: collections.items || this.collections.items,
      fileChunks: collections.fileChunks || this.collections.fileChunks
    };
  }

  // ---------- helpers (match FileAdapterService) ----------
  _guessPreviewType(type = "", ext = "") {
    const t = (type || "").toLowerCase();
    const e = (ext || "").toLowerCase();

    if (t.startsWith("image/")) return "image";
    if (t.startsWith("video/")) return "video";
    if (t.startsWith("audio/")) return "audio";
    if (
      t.startsWith("text/") ||
      ["json", "js", "html", "css", "md", "txt", "xml", "svg", "csv"].includes(e)
    ) {
      return "text";
    }
    return "generic";
  }

  _normalizeFolder(item, parentId) {
    const title = item.title || item.name || "Untitled";
    return {
      id: item.id,
      title,
      name: title,
      isFolder: true,
      parentId: item.parentId ?? parentId,
      size: item.size || 0
    };
  }

  _normalizeFile(item, parentId) {
    const title = item.title || item.name || "Untitled";
    const ext = (item.extension || title.split(".").pop() || "").toLowerCase();
    const type = item.type || item.mimeType || "";
    const previewType =
      item.previewType || this._guessPreviewType(type, ext);

    return {
      id: item.id,
      fileId: item.fileId || item.id,
      title,
      name: title,
      isFolder: false,
      parentId: item.parentId ?? parentId,
      path: item.path || title,
      size: item.size || 0,
      type,
      extension: ext,
      fileUrl: item.fileUrl || null,
      previewType,
      previewData: item.previewData || null,
      thumbnail:
        item.thumbnail ||
        (previewType === "image" ? item.fileUrl || item.thumbnail : null) ||
        null
    };
  }

  // ---------- READ ----------
  async getFolderContents(folderId = "root") {
    const items = await this.fbService.getByField(
      this.collections.items,
      "parentId",
      folderId
    );

    const folders = items
      .filter(item => item.isFolder === true)
      .map(item => this._normalizeFolder(item, folderId));

    const files = items
      .filter(item => !item.isFolder)
      .map(item => this._normalizeFile(item, folderId));

    let currentFolderName = "Home";
    if (folderId !== "root") {
      const folder = await this.fbService.getById(
        this.collections.items,
        folderId
      );
      if (folder) {
        currentFolderName = folder.title || folder.name || "Untitled";
      }
    }

    return { folders, files, currentFolderName };
  }

  async getFileRecord(id) {
    const item = await this.fbService.getById(this.collections.items, id);
    if (!item) return null;
    if (item.isFolder) return this._normalizeFolder(item, item.parentId);
    return this._normalizeFile(item, item.parentId);
  }

  async getFileChunks(fileId) {
    const chunks = await this.fbService.getByField(
      this.collections.fileChunks,
      "fileId",
      fileId
    );
    return chunks.sort((a, b) => a.partIndex - b.partIndex);
  }

  // Still returns concatenated base64 (Firebase storage model).
  // Local adapter returns a blob URL — UI should treat both as “file payload”.
  async getFullBase64(fileId) {
    const chunks = await this.getFileChunks(fileId);
    return chunks.map(c => c.chunkData).join("");
  }

  // ---------- WRITE (unchanged) ----------
  async createFolder(name, parentId = "root") {
    return this.fbService.create(this.collections.items, {
      title: name,
      name: name,
      isFolder: true,
      parentId,
      size: 0
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

  // ---------- BACKUP & DOWNLOAD (unchanged) ----------
  async generateZipBlob() {
    let items = [],
      file_chunks = [];
    items = await this.fbService.getAll(this.collections.items);
    file_chunks = await this.fbService.getAll(this.collections.fileChunks);

    if (typeof JSZip === "undefined") {
      throw new Error("JSZip is not loaded or defined in the global scope.");
    }

    const zip = new JSZip();
    const folders = items.filter(i => i.isFolder);
    const files = items.filter(i => !i.isFolder);

    const getFolderPath = parentId => {
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
      const base64Data = fullBase64.split(",")[1];
      if (!base64Data) continue;

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const folderPath = getFolderPath(fileRecord.parentId);
      const filePath = folderPath
        ? `${folderPath}/${fileRecord.title}`
        : fileRecord.title;
      zip.file(filePath, bytes);
    }

    const uint8ArrayData = await zip.generateAsync({ type: "uint8array" });
    return new Blob([uint8ArrayData], { type: "application/zip" });
  }

  async downloadBackup() {
    const content = await this.generateZipBlob();
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = URL.createObjectURL(content);
    downloadAnchor.download = `backup_${new Date()
      .toISOString()
      .slice(0, 10)}.zip`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
