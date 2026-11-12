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
    await this._ensureCache();
    const items = this._itemsCache;
  
    if (typeof JSZip === "undefined") {
      throw new Error("JSZip is not loaded or defined in the global scope.");
    }
  
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
  
    // 1. Sort files deterministically so the hash order is always consistent
    const fileEntries = files.map(fileRecord => {
      const folderPath = getFolderPath(fileRecord.parentId);
      const filePath = folderPath ? `${folderPath}/${fileRecord.title}` : fileRecord.title;
      return { fileRecord, filePath };
    });
    fileEntries.sort((a, b) => a.filePath.localeCompare(b.filePath));
  
    // 2. Gather raw file bytes & paths to feed into the hash (completely ignores ZIP metadata)
    const hasherBuffers = [];
    const encoder = new TextEncoder();
  
    for (const { fileRecord, filePath } of fileEntries) {
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
  
      // Include both the file path and its raw byte content in the hash
      hasherBuffers.push(encoder.encode(filePath));
      hasherBuffers.push(bytes);
    }
  
    // Combine all file buffers into a single buffer and create the hash
    const totalLength = hasherBuffers.reduce((acc, buf) => acc + buf.length, 0);
    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of hasherBuffers) {
      combinedBuffer.set(buf, offset);
      offset += buf.length;
    }
  
    const hashBuffer = await crypto.subtle.digest("SHA-256", combinedBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    const shortHash = hashHex.slice(0, 8); // e.g., "a1b2c3d4"
  
    // 3. Generate your normal ZIP blob using your existing function
    const content = await this.generateZipBlob();
  
    // 4. Download file with today's date + the pure content hash
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
