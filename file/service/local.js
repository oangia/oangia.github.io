class LocalFileService {
  constructor(config = {}) {
    this.rootNode = { name: "root", children: {}, files: [] };
    this.pathToFile = new Map();
    this.pathToNode = new Map();
    this.isLoaded = false;
    this.pathToNode.set("", this.rootNode);
    this.onProgress = config.onProgress || ((msg, type) => console.log(`[${type}] ${msg}`));
    this.onConnectionChange = config.onConnectionChange || (() => {});

    // Automatically bind to folder selector button if ID is provided or defaults to "selectFolderBtn"
    this.folderButtonId = config.folderButtonId || "selectFolderBtn";
    this._bindFolderButton();

    window.addEventListener("load", () => {
      this._bindFolderButton();
    });
  }

  // Bind an HTML button or input to trigger folder selection natively
  _bindFolderButton() {
    const btn = document.getElementById(this.folderButtonId);
    if (!btn || btn.dataset.localDriveBound) return;

    btn.dataset.localDriveBound = "true";
    
    // Create a hidden file input element for directory selection
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.webkitdirectory = true;
    fileInput.multiple = true;
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.onchange = async (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        this.onProgress(`Loading ${files.length} local files...`, "info");
        await this.loadFiles(files);
        this.onProgress(`Loaded folder: ${this.rootNode.name}`, "success");
        this.onConnectionChange();
      }
    };

    btn.onclick = () => {
      fileInput.click();
    };
  }

  async loadFiles(fileList) {
    for (const record of this.pathToFile.values()) {
      if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
    }
    const files = Array.from(fileList || []);
    this.rootNode = { name: "root", children: {}, files: [] };
    this.pathToFile.clear();
    this.pathToNode.clear();
    this.pathToNode.set("", this.rootNode);
    this.isLoaded = files.length > 0;
    if (!files.length) return;

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const rootFolderName = firstPath.split("/")[0] || "root";
    this.rootNode.name = rootFolderName;

    for (const file of files) {
      const rawPath = file.webkitRelativePath || file.name;
      const parts = rawPath.split("/");
      if (parts.length > 1 && parts[0] === rootFolderName) parts.shift();
      const fileName = parts.pop();
      if (!fileName) continue;

      let currentNode = this.rootNode;
      let runningPath = "";
      for (const folderName of parts) {
        runningPath = runningPath ? `${runningPath}/${folderName}` : folderName;
        if (!currentNode.children[folderName]) {
          const newNode = { name: folderName, path: runningPath, children: {}, files: [] };
          currentNode.children[folderName] = newNode;
          this.pathToNode.set(runningPath, newNode);
        }
        currentNode = currentNode.children[folderName];
      }

      const fullPath = runningPath ? `${runningPath}/${fileName}` : fileName;
      const fileUrl = URL.createObjectURL(file);
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(fileName);

      const record = {
        id: fullPath,
        name: fileName,
        fullPath,
        fileUrl,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        modifiedTime: new Date(file.lastModified || Date.now()).toISOString(),
        metadata: { size: file.size },
        thumbUrl: (isImage || isVideo) ? fileUrl : null
      };
      currentNode.files.push(record);
      this.pathToFile.set(fullPath, record);
    }
  }

  // Standardized list method mirroring Drive / Supabase storage services
  async list(path = "", options = {}) {
    try {
      const cleanPath = path ? path.replace(/^\/+/, '').replace(/\/+$/, '') : '';
      const node = this.pathToNode.get(cleanPath) || (cleanPath === "" ? this.rootNode : null);
      
      if (!node) {
        return { data: null, error: new Error("Folder not found") };
      }

      const folderItems = Object.values(node.children).map(child => ({
        id: child.path,
        name: child.name,
        mimeType: 'application/vnd.google-apps.folder',
        size: this._calculateFolderSize(child),
        modifiedTime: new Date().toISOString(),
        webContentLink: null
      }));

      const fileItems = [...node.files].map(f => ({
        id: f.fullPath,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        modifiedTime: f.modifiedTime,
        metadata: f.metadata,
        webContentLink: f.fileUrl
      }));

      folderItems.sort((a, b) => a.name.localeCompare(b.name));
      fileItems.sort((a, b) => a.name.localeCompare(b.name));

      const items = [...folderItems, ...fileItems];
      return { data: items, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async fetchContent({ id = null, path = null, metadata = null } = {}) {
    try {
      const file = this.pathToFile.get(id || path);
      if (!file) throw new Error("Local file not found");
      const res = await fetch(file.fileUrl);
      if (!res.ok) throw new Error(`Failed to fetch local file content: ${res.statusText}`);
      const fileMetadata = metadata || file.metadata || {};
      if (fileMetadata.hash_content) return { data: res, error: null };

      const buffer = await res.arrayBuffer();
      const hash_content = await Crypto.sha256(buffer);
      const { error } = await this.updateMetadata({ id: file.fullPath }, {
        ...fileMetadata,
        hash_content
      });
      if (error) throw error;
      if (metadata) metadata.hash_content = hash_content;
      return { data: new Response(buffer, { headers: res.headers }), error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async getByPath(path) {
    try {
      const cleanPath = path.replace(/^\/+/, '');
      const record = this.pathToFile.get(cleanPath);
      if (record) {
        return {
          data: {
            id: record.fullPath,
            name: record.name,
            mimeType: record.mimeType,
            size: record.size,
            modifiedTime: record.modifiedTime,
            metadata: record.metadata,
            webContentLink: record.fileUrl
          },
          error: null
        };
      }

      // Check if it's a folder
      const node = this.pathToNode.get(cleanPath);
      if (node) {
        return {
          data: {
            id: cleanPath,
            name: node.name,
            mimeType: 'application/vnd.google-apps.folder',
            size: this._calculateFolderSize(node),
            modifiedTime: new Date().toISOString(),
            webContentLink: null
          },
          error: null
        };
      }

      throw new Error("Path not found");
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async getById(id) {
    return this.getByPath(id);
  }

  async updateMetadata({ id = null, path = null } = {}, metadata = {}) {
    try {
      const record = this.pathToFile.get(id || path);
      if (!record) throw new Error("Local file not found");
      record.metadata = { ...record.metadata, ...metadata };
      return { data: record.metadata, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async getFileUrl(path) {
    const record = this.pathToFile.get(path);
    if (!record) return { data: null, error: new Error("File not found") };
    return { data: { signedUrl: record.fileUrl }, error: null };
  }

  async upload(path, blob, options = {}) {
    try {
      const cleanPath = path.replace(/^\/+/, '');
      let record = this.pathToFile.get(cleanPath);
      const metadata = {
        ...(options.metadata || {}),
        size: blob.size,
        hash_content: await Crypto.sha256(await blob.arrayBuffer())
      };

      if (record) {
        if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
        record.fileUrl = URL.createObjectURL(blob);
        record.size = blob.size;
        record.metadata = metadata;
        record.modifiedTime = new Date().toISOString();
      } else {
        // Create new virtual file in tree
        const lastSlashIdx = cleanPath.lastIndexOf("/");
        const dirPath = lastSlashIdx !== -1 ? cleanPath.substring(0, lastSlashIdx) : "";
        const fileName = lastSlashIdx !== -1 ? cleanPath.substring(lastSlashIdx + 1) : cleanPath;
        
        let parentNode = this.pathToNode.get(dirPath);
        if (!parentNode) {
          parentNode = this.rootNode; // fallback
        }

        const fileUrl = URL.createObjectURL(blob);
        record = {
          id: cleanPath,
          name: fileName,
          fullPath: cleanPath,
          fileUrl,
          size: blob.size,
          mimeType: blob.type || 'application/octet-stream',
          modifiedTime: new Date().toISOString(),
          metadata
        };
        parentNode.files.push(record);
        this.pathToFile.set(cleanPath, record);
      }

      return {
        data: {
          id: record.fullPath,
          name: record.name,
          mimeType: record.mimeType,
          size: record.size,
          modifiedTime: record.modifiedTime,
          metadata: record.metadata,
          webContentLink: record.fileUrl
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async uploadById(id, file) {
    return this.upload(id, file);
  }

  async remove(paths) {
    try {
      for (const path of paths) {
        const cleanPath = path.replace(/^\/+/, '');
        // Check if it's a folder node
        if (this.pathToNode.has(cleanPath)) {
          this.deleteLocalPath(cleanPath, true);
        } else {
          this.deleteLocalPath(cleanPath, false);
        }
      }
      return { data: {}, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async removeById(ids) {
    return this.remove(ids);
  }

  deleteLocalPath(path, isFolder) {
    if (isFolder) {
      for (const key of Array.from(this.pathToFile.keys())) {
        if (key === path || key.startsWith(`${path}/`)) {
          const rec = this.pathToFile.get(key);
          if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
          this.pathToFile.delete(key);
        }
      }
      for (const key of Array.from(this.pathToNode.keys())) {
        if (key === path || key.startsWith(`${path}/`)) this.pathToNode.delete(key);
      }
      const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      const folderName = path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) delete parentNode.children[folderName];
    } else {
      const rec = this.pathToFile.get(path);
      if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
      this.pathToFile.delete(path);
      const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) parentNode.files = parentNode.files.filter(f => f.fullPath !== path);
    }
  }

  _calculateFolderSize(node) {
    let total = node.files.reduce((sum, f) => sum + (f.size || 0), 0);
    for (const child of Object.values(node.children)) {
      total += this._calculateFolderSize(child);
    }
    return total;
  }
}
