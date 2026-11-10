class FileService {
  constructor() {}

  async switch(configOrFiles) {
    throw new Error("Method 'switch()' must be implemented.");
  }

  async getFolderContents(folderId = "root") {
    throw new Error("Method 'getFolderContents()' must be implemented.");
  }

  async getFileRecord(id) {
    throw new Error("Method 'getFileRecord()' must be implemented.");
  }

  async getFullBase64(fileId) {
    throw new Error("Method 'getFullBase64()' must be implemented.");
  }

  async createFolder(name, parentId = "root") {
    throw new Error("Method 'createFolder()' must be implemented.");
  }

  async uploadFile(file, parentId = "root", onProgress) {
    throw new Error("Method 'uploadFile()' must be implemented.");
  }

  async deleteFolder(id) {
    throw new Error("Method 'deleteFolder()' must be implemented.");
  }

  async deleteFile(id, fileId) {
    throw new Error("Method 'deleteFile()' must be implemented.");
  }

  async generateZipBlob() {
    throw new Error("Method 'generateZipBlob()' must be implemented.");
  }

  async downloadBackup() {
  const content = await this.generateZipBlob();
  
  // 1. Convert the Blob/Zip content into an ArrayBuffer
  const arrayBuffer = await content.arrayBuffer();
  
  // 2. Generate the cryptographic hash using the browser's native SubtleCrypto API
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  
  // 3. Convert the buffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  // 4. Take the first 8 characters of the hash for a clean filename suffix
  const shortHash = hashHex.slice(0, 8);
  
  // 5. Create the download with the hash included in the filename
  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadAnchor = document.createElement("a");
  
  downloadAnchor.href = URL.createObjectURL(content);
  downloadAnchor.download = `backup_${dateStr}_${shortHash}.zip`;
  
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

  // ---------- helpers ----------
  _guessPreviewType(type = "", ext = "") {
    const t = (type || "").toLowerCase();
    const e = (ext || "").toLowerCase();

    if (
      t.startsWith("image/") ||
      ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"].includes(e)
    ) {
      return "image";
    }
    if (
      t.startsWith("video/") ||
      ["mp4", "webm", "ogg", "mov", "mkv"].includes(e)
    ) {
      return "video";
    }
    if (
      t.startsWith("audio/") ||
      ["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(e)
    ) {
      return "audio";
    }
    if (
      t.startsWith("text/") ||
      [
        "json", "js", "ts", "jsx", "tsx", "html", "htm", "css", "scss",
        "md", "txt", "xml", "svg", "csv"
      ].includes(e)
    ) {
      return "text";
    }
    return "generic";
  }

  _toDataUrl(fullBase64, mime = "application/octet-stream") {
    if (!fullBase64) return null;
    if (fullBase64.startsWith("data:")) return fullBase64;
    return `data:${mime};base64,${fullBase64}`;
  }

  /** Detect mime from data-URL header or binary magic bytes */
  _detectMimeFromBase64(fullBase64) {
    if (!fullBase64 || typeof fullBase64 !== "string") return null;

    if (fullBase64.startsWith("data:")) {
      const comma = fullBase64.indexOf(",");
      if (comma === -1) return null;
      const header = fullBase64.slice(5, comma);
      return header.split(";")[0].toLowerCase() || null;
    }

    let bytes;
    try {
      const sample = atob(fullBase64.slice(0, 64));
      bytes = new Uint8Array(sample.length);
      for (let i = 0; i < sample.length; i++) bytes[i] = sample.charCodeAt(i);
    } catch {
      return null;
    }

    // PNG
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return "image/png";
    }
    // JPEG
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }
    // GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return "image/gif";
    }
    // WEBP: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return "image/webp";
    }
    // BMP
    if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return "image/bmp";
    }
    // MP4 / ftyp
    if (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    ) {
      return "video/mp4";
    }

    return null;
  }
  async _buildPreview(item) {
    const title = item.title || item.name || "Untitled";
    const type = item.type || item.mimeType || "";
    const ext = (item.extension || title.split(".").pop() || "").toLowerCase();

    const fullBase64 = await this.getFullBase64(item.fileId || item.id);
    if (!fullBase64) {
      return {
        previewType: this._guessPreviewType(type, ext),
        thumbnail: null
      };
    }

    const detectedMime = this._detectMimeFromBase64(fullBase64);

    let previewType = "generic";
    if (detectedMime) {
      if (detectedMime.startsWith("image/")) previewType = "image";
      else if (detectedMime.startsWith("video/")) previewType = "video";
      else if (detectedMime.startsWith("audio/")) previewType = "audio";
      else if (
        detectedMime.startsWith("text/") ||
        detectedMime === "application/json" ||
        detectedMime === "application/xml" ||
        detectedMime.includes("javascript")
      ) {
        previewType = "text";
      }
    }

    if (previewType === "generic") {
      previewType = this._guessPreviewType(type, ext);
    }

    if (previewType === "image") {
      const mime = detectedMime?.startsWith("image/")
        ? detectedMime
        : type.startsWith("image/")
          ? type
          : "image/png";
      return {
        previewType,
        thumbnail: this._toDataUrl(fullBase64, mime)
      };
    }

    if (previewType === "video") {
      const mime = detectedMime?.startsWith("video/")
        ? detectedMime
        : type.startsWith("video/")
          ? type
          : "video/mp4";
      return {
        previewType,
        thumbnail: this._toDataUrl(fullBase64, mime)
      };
    }

    if (previewType === "text") {
      let text = fullBase64;
      try {
        const raw = fullBase64.includes(",")
          ? fullBase64.split(",")[1]
          : fullBase64;
        text = atob(raw);
      } catch {
        // already plain text
      }
      return {
        previewType,
        thumbnail: text.substring(0, 180)
      };
    }

    return { previewType, thumbnail: null };
  }
  _readTextSnippet(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result.substring(0, 180));
      reader.onerror = () => resolve("");
      reader.readAsText(file.slice(0, 300));
    });
  }
  _calculateFolderSize(node) {
    let totalSize = 0;
    const children = node.__children || {};
    const files = node.__files || [];

    for (const file of files) totalSize += file.size || 0;
    for (const key in children) {
      totalSize += this._calculateFolderSize(children[key]);
    }
    return totalSize;
  }
}

export class FileManagerFirebase extends FileService {
  constructor(fbService, collections = {}) {
    super();
    this.fbService = fbService;
    this.collections = {
      items: collections.items || "files",
      fileChunks: collections.fileChunks || "file_chunks"
    };

    // Only cache metadata items for fast navigation — NO chunks cached upfront!
    this._itemsCache = null;
  }

  async switch(collections) {
    this.collections = collections;
    await this.refreshCache();
  }

  /** Load ONLY file/folder metadata items once. Chunks stay out of memory! */
  async refreshCache() {
    this._itemsCache = await this.fbService.getAll(this.collections.items);
  }

  async _ensureCache() {
    if (!this._itemsCache) {
      await this.refreshCache();
    }
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
      fileUrl: null,
      previewType: item.previewType || this._guessPreviewType(type, ext),
      thumbnail: item.thumbnail || null
    };
  }

  // ---------- READ (Instant, zero chunk queries) ----------
  async getFolderContents(folderId = "root") {
    await this._ensureCache();

    const items = this._itemsCache.filter(item => item.parentId === folderId);

    const folders = items
      .filter(item => item.isFolder === true)
      .map(item => this._normalizeFolder(item, folderId));

    const files = items
      .filter(item => !item.isFolder)
      .map(item => this._normalizeFile(item, folderId));

    let currentFolderName = "Home";
    if (folderId !== "root") {
      const folder = this._itemsCache.find(i => i.id === folderId);
      if (folder) {
        currentFolderName = folder.title || folder.name || "Untitled";
      }
    }

    return { folders, files, currentFolderName };
  }

  async getFileRecord(id) {
    await this._ensureCache();
    const item = this._itemsCache.find(i => i.id === id);
    if (!item) return null;
    if (item.isFolder) return this._normalizeFolder(item, item.parentId);
    return this._normalizeFile(item, item.parentId);
  }

  // ---------- ON-DEMAND CHUNK FETCHING (Only when viewing/previewing a file) ----------
  async getFileChunks(fileId) {
    // Fetches chunks from Firebase ONLY when requested for a specific file
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
    const res = await this.fbService.create(this.collections.items, {
      title: name,
      name: name,
      isFolder: true,
      parentId,
      size: 0
    });
    await this.refreshCache();
    return res;
  }

  async uploadFile(file, parentId = "root", onProgress) {
    const res = await this.fbService.uploadFile(
      this.collections,
      parentId,
      file,
      onProgress
    );
    await this.refreshCache();
    return res;
  }

  async deleteFolder(id) {
    const res = await this.fbService.delete(this.collections.items, id);
    await this.refreshCache();
    return res;
  }

  async deleteFile(id, fileId) {
    await this.fbService.delete(this.collections.items, id);

    // Clean up chunks only when deleting the specific file
    const chunks = await this.getFileChunks(fileId);
    for (const chunk of chunks) {
      await this.fbService.delete(this.collections.fileChunks, chunk.id);
    }
    
    await this.refreshCache();
  }

  // ---------- BACKUP & DOWNLOAD ----------
  async generateZipBlob() {
    await this._ensureCache();
    const items = this._itemsCache;

    if (typeof JSZip === "undefined") {
      throw new Error("JSZip is not loaded or defined in the global scope.");
    }

    const zip = new JSZip();
    const folders = items.filter(i => i.isFolder);
    const files = items.filter(i => !i.isFolder);

    const getFolderPath = parentId => {
      const pathParts = [];
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
      // Fetch chunks on-demand during backup generation
      const chunks = await this.getFileChunks(fileRecord.fileId || fileRecord.id);

      const fullBase64 = chunks.map(c => c.chunkData).join("");
      const base64Data = fullBase64.includes(",")
        ? fullBase64.split(",")[1]
        : fullBase64;
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
}

export class FileAdapterService extends FileService {
  constructor() {
    super();
    this.folderStructure = {};
    this.nodeMap = new Map();
    this.fileMap = new Map();
  }

  async switch(fileList) {
    const files = Array.from(fileList);

    this.folderStructure = {
      id: "root",
      name: "root",
      __children: {},
      __files: []
    };
    this.nodeMap.clear();
    this.fileMap.clear();
    this.nodeMap.set("root", this.folderStructure);

    if (!files.length) return;

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const rootFolderName = firstPath.split("/")[0] || "root";
    this.folderStructure.name = rootFolderName;

    let folderIdCounter = 1;
    let fileIdCounter = 1;

    for (const file of files) {
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split("/");

      if (parts.length > 1 && parts[0] === rootFolderName) {
        parts.shift();
      }

      const fileName = parts.pop();
      if (!fileName) continue;

      let currentLevelNode = this.folderStructure;

      for (const part of parts) {
        if (!currentLevelNode.__children[part]) {
          const newFolderId = `folder_${folderIdCounter++}`;
          const newFolderNode = {
            id: newFolderId,
            name: part,
            parentId: currentLevelNode.id,
            __children: {},
            __files: []
          };
          currentLevelNode.__children[part] = newFolderNode;
          this.nodeMap.set(newFolderId, newFolderNode);
        }
        currentLevelNode = currentLevelNode.__children[part];
      }

      const ext = fileName.split(".").pop().toLowerCase();
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isAudio = file.type.startsWith("audio/");
      const isText =
        file.type.startsWith("text/") ||
        [
          "json", "js", "ts", "jsx", "tsx", "html", "htm", "css", "scss",
          "md", "txt", "xml", "svg", "csv"
        ].includes(ext);

      let previewType = "generic";
      let thumbnail = null;
      const fileUrl = URL.createObjectURL(file);

      if (isImage) {
        previewType = "image";
        thumbnail = fileUrl;
      } else if (isVideo) {
        previewType = "video";
        thumbnail = fileUrl;
      } else if (isAudio) {
        previewType = "audio";
      } else if (isText) {
        previewType = "text";
        thumbnail = await this._readTextSnippet(file);
      }

      const fileId = `file_${fileIdCounter++}`;
      const fileRecord = {
        id: fileId,
        fileId: fileId,
        title: fileName,
        name: fileName,
        isFolder: false,
        parentId: currentLevelNode.id,
        path: relativePath,
        size: file.size,
        type: file.type,
        extension: ext,
        fileUrl,
        previewType,
        thumbnail
      };

      currentLevelNode.__files.push(fileRecord);
      this.fileMap.set(fileId, fileRecord);
    }
  }

  async getFolderContents(folderId = "root") {
    const node = this.nodeMap.get(folderId) || this.folderStructure;
    const children = node.__children || {};
    const files = node.__files || [];

    const folders = Object.values(children).map(child => ({
      id: child.id,
      title: child.name,
      name: child.name,
      isFolder: true,
      parentId: node.id,
      size: this._calculateFolderSize(child)
    }));

    return {
      folders,
      files,
      currentFolderName: node.name || "Home"
    };
  }

  async getFileRecord(id) {
    return this.fileMap.get(id) || null;
  }

  /** Local: returns blob URL (not base64). */
  async getFullBase64(fileId) {
    const file = this.fileMap.get(fileId);
    return file ? file.fileUrl : null;
  }
}
