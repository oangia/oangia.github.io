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

  // ---------- helpers ----------
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

  async _buildPreview(item) {
    const title = item.title || item.name || "Untitled";
    const ext = (item.extension || title.split(".").pop() || "").toLowerCase();
    const type = item.type || item.mimeType || "";
    const previewType = item.previewType || this._guessPreviewType(type, ext);

    if (previewType === "audio" || previewType === "generic") {
      return { previewType, previewData: null, thumbnail: null };
    }

    const fullBase64 = await this.getFullBase64(item.fileId || item.id);
    if (!fullBase64) {
      return { previewType, previewData: null, thumbnail: null };
    }

    if (previewType === "image") {
      return {
        previewType,
        previewData: fullBase64,
        thumbnail: fullBase64
      };
    }

    if (previewType === "video") {
      return {
        previewType,
        previewData: fullBase64,
        thumbnail: null
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
        previewData: text.substring(0, 180),
        thumbnail: null
      };
    }

    return { previewType, previewData: null, thumbnail: null };
  }

  async _normalizeFile(item, parentId, { withPreview = false } = {}) {
    const title = item.title || item.name || "Untitled";
    const ext = (item.extension || title.split(".").pop() || "").toLowerCase();
    const type = item.type || item.mimeType || "";
    const previewType = item.previewType || this._guessPreviewType(type, ext);

    const base = {
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
      thumbnail: item.thumbnail || null
    };

    if (!withPreview) return base;

    const preview = await this._buildPreview(item);
    return { ...base, ...preview };
  }

  // ---------- READ ----------
  async getFolderContents(folderId = "root", { withPreviews = false } = {}) {
    const items = await this.fbService.getByField(
      this.collections.items,
      "parentId",
      folderId
    );

    const folders = items
      .filter(item => item.isFolder === true)
      .map(item => this._normalizeFolder(item, folderId));

    const fileItems = items.filter(item => !item.isFolder);
    const files = [];
    for (const item of fileItems) {
      files.push(
        await this._normalizeFile(item, folderId, { withPreview: withPreviews })
      );
    }

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
    return this._normalizeFile(item, item.parentId, { withPreview: true });
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

  // ---------- BACKUP & DOWNLOAD ----------
  async generateZipBlob() {
    const items = await this.fbService.getAll(this.collections.items);
    const file_chunks = await this.fbService.getAll(this.collections.fileChunks);

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

export class FileAdapterService {
  constructor() {
    this.folderStructure = {};
    this.nodeMap = new Map(); // Maps folder IDs to tree nodes
    this.fileMap = new Map();  // Maps file IDs to file objects
  }

  async switch(fileList) {
  const files = Array.from(fileList);
  this.folderStructure = {
    id: 'root',
    name: 'root',          // will be overwritten
    __children: {},
    __files: []
  };
  this.nodeMap.clear();
  this.fileMap.clear();
  this.nodeMap.set('root', this.folderStructure);

  if (!files.length) return;

  // Determine the selected folder name from the first file
  const firstPath = files[0].webkitRelativePath || files[0].name;
  const rootFolderName = firstPath.split('/')[0] || 'root';
  this.folderStructure.name = rootFolderName;

  let folderIdCounter = 1;
  let fileIdCounter = 1;

  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    const parts = relativePath.split('/');

    // Drop the selected-folder prefix so it becomes the root
    if (parts.length > 1 && parts[0] === rootFolderName) {
      parts.shift();
    }

    const fileName = parts.pop();
    if (!fileName) continue; // safety

    let currentLevelNode = this.folderStructure;

    // Build folder hierarchy (now relative to the selected folder)
    for (const part of parts) {
      if (!currentLevelNode.__children[part]) {
        const newFolderId = `folder_${folderIdCounter++}`;
        const newFolderNode = {
          id: newFolderId,
          name: part,
          __children: {},
          __files: []
        };
        currentLevelNode.__children[part] = newFolderNode;
        this.nodeMap.set(newFolderId, newFolderNode);
      }
      currentLevelNode = currentLevelNode.__children[part];
    }

    // … rest of the file-processing logic stays exactly the same …
    const ext = fileName.split('.').pop().toLowerCase();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isText = file.type.startsWith('text/') ||
      ['json', 'js', 'html', 'css', 'md', 'txt', 'xml', 'svg', 'csv'].includes(ext);

    let previewType = 'generic';
    let previewData = null;
    const fileUrl = URL.createObjectURL(file);

    if (isImage) {
      previewType = 'image';
      previewData = fileUrl;
    } else if (isVideo) {
      previewType = 'video';
      previewData = fileUrl;
    } else if (isAudio) {
      previewType = 'audio';
    } else if (isText) {
      previewType = 'text';
      previewData = await this.readTextSnippet(file);
    }

    const fileId = `file_${fileIdCounter++}`;
    const fileRecord = {
      id: fileId,
      fileId: fileId,
      title: fileName,
      path: relativePath,          // keep original path if you need it
      size: file.size,
      type: file.type,
      extension: ext,
      fileUrl,
      previewType,
      previewData,
      thumbnail: previewType === 'image' ? fileUrl : null
    };

    currentLevelNode.__files.push(fileRecord);
    this.fileMap.set(fileId, fileRecord);
  }
}

  _calculateFolderSize(node) {
    let totalSize = 0;
    const children = node.__children || {};
    const files = node.__files || [];
    
    for (const file of files) {
      totalSize += file.size || 0;
    }
    for (const key in children) {
      totalSize += this._calculateFolderSize(children[key]);
    }
    return totalSize;
  }

  async getFolderContents(folderId) {
    const node = this.nodeMap.get(folderId) || this.folderStructure;
    
    const folders = Object.values(node.__children).map(child => ({
      id: child.id,
      title: child.name,
      name: child.name,
      size: this._calculateFolderSize(child) // Pre-calculate the total recursive size here!
    }));

    const files = node.__files || [];
    console.log({
      folders,
      files,
      currentFolderName: node.name
    });
    return {
      folders,
      files,
      currentFolderName: node.name
    };
  }

  async getFileRecord(id) {
    return this.fileMap.get(id);
  }

  async getFullBase64(fileId) {
    const file = this.fileMap.get(fileId);
    return file ? file.fileUrl : null;
  }

  readTextSnippet(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.substring(0, 180));
      reader.onerror = () => resolve('');
      reader.readAsText(file.slice(0, 300));
    });
  }
}
