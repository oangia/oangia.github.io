class LocalFileService extends BaseStorageService {
  constructor(config = {}) {
    super(config);

    this.rootNode = { name: "root", children: {}, files: [] };
    this.pathToFile = new Map();
    this.pathToNode = new Map();
    this.isLoaded = false;
    this.pathToNode.set("", this.rootNode);

    this.folderButtonId = config.folderButtonId || "selectFolderBtn";

    const init = () => this._bindFolderButton();
    init();
    window.addEventListener("load", init);
  }

  // =========================================================================
  // PUBLIC INTERFACE IMPLEMENTATIONS
  // =========================================================================

  async list(path = "", options = {}) {
    return this._execute(async () => {
      const cleanPath = this._normalizePath(path);
      const node = this.pathToNode.get(cleanPath) || (cleanPath === "" ? this.rootNode : null);
      if (!node) throw new Error("Folder not found");

      const folderItems = Object.values(node.children).map(child => ({
        id: child.path,
        name: child.name,
        mimeType: "application/vnd.google-apps.folder",
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
        webContentLink: f.fileUrl
      }));

      folderItems.sort((a, b) => a.name.localeCompare(b.name));
      fileItems.sort((a, b) => a.name.localeCompare(b.name));

      return [...folderItems, ...fileItems];
    });
  }

  async fetchContent({ id = null, path = null } = {}) {
    return this._execute(async () => {
      const targetPath = this._normalizePath(id || path);
      const file = this.pathToFile.get(targetPath);
      if (!file) throw new Error("Local file not found");

      const res = await fetch(file.fileUrl);
      if (!res.ok) throw new Error(`Failed to fetch local file content: ${res.statusText}`);

      return res;
    });
  }

  async getByPath(path) {
    return this._execute(async () => {
      const cleanPath = this._normalizePath(path);
      const record = this.pathToFile.get(cleanPath);
      if (record) {
        return {
          id: record.fullPath,
          name: record.name,
          mimeType: record.mimeType,
          size: record.size,
          modifiedTime: record.modifiedTime,
          webContentLink: record.fileUrl
        };
      }

      const node = this.pathToNode.get(cleanPath);
      if (node) {
        return {
          id: cleanPath,
          name: node.name,
          mimeType: "application/vnd.google-apps.folder",
          size: this._calculateFolderSize(node),
          modifiedTime: new Date().toISOString(),
          webContentLink: null
        };
      }

      throw new Error("Path not found");
    });
  }

  async getById(id) {
    return this.getByPath(id);
  }

  async upload(path, blob) {
    return this._execute(async () => {
      const { cleanPath, dirPath, fileName } = this._parsePath(path);
      let record = this.pathToFile.get(cleanPath);

      if (record) {
        if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
        record.fileUrl = URL.createObjectURL(blob);
        record.size = blob.size;
        record.modifiedTime = new Date().toISOString();
      } else {
        const parentNode = this.pathToNode.get(dirPath) || this.rootNode;
        const fileUrl = URL.createObjectURL(blob);
        record = {
          id: cleanPath,
          name: fileName,
          fullPath: cleanPath,
          fileUrl,
          size: blob.size,
          mimeType: blob.type || "application/octet-stream",
          modifiedTime: new Date().toISOString()
        };
        parentNode.files.push(record);
        this.pathToFile.set(cleanPath, record);
      }

      return {
        id: record.fullPath,
        name: record.name,
        mimeType: record.mimeType,
        size: record.size,
        modifiedTime: record.modifiedTime,
        webContentLink: record.fileUrl
      };
    });
  }

  async uploadById(id, file) {
    return this.upload(id, file);
  }

  async remove(paths) {
    return this._execute(async () => {
      for (const path of paths) {
        const cleanPath = this._normalizePath(path);
        const isFolder = this.pathToNode.has(cleanPath);
        this.deleteLocalPath(cleanPath, isFolder);
      }
      return {};
    });
  }

  async removeById(ids) {
    return this.remove(ids);
  }

  // =========================================================================
  // LOCAL FILE SPECIFIC METHODS
  // =========================================================================

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
        mimeType: file.type || "application/octet-stream",
        modifiedTime: new Date(file.lastModified || Date.now()).toISOString(),
        thumbUrl: (isImage || isVideo) ? fileUrl : null
      };
      currentNode.files.push(record);
      this.pathToFile.set(fullPath, record);
    }
  }

  async getFileUrl(path) {
    return this._execute(async () => {
      const cleanPath = this._normalizePath(path);
      const record = this.pathToFile.get(cleanPath);
      if (!record) throw new Error("File not found");
      return { signedUrl: record.fileUrl };
    });
  }

  deleteLocalPath(path, isFolder) {
    const cleanPath = this._normalizePath(path);
    if (isFolder) {
      for (const key of Array.from(this.pathToFile.keys())) {
        if (key === cleanPath || key.startsWith(`${cleanPath}/`)) {
          const rec = this.pathToFile.get(key);
          if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
          this.pathToFile.delete(key);
        }
      }
      for (const key of Array.from(this.pathToNode.keys())) {
        if (key === cleanPath || key.startsWith(`${cleanPath}/`)) this.pathToNode.delete(key);
      }
      const { dirPath: parentPath, fileName: folderName } = this._parsePath(cleanPath);
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) delete parentNode.children[folderName];
    } else {
      const rec = this.pathToFile.get(cleanPath);
      if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
      this.pathToFile.delete(cleanPath);
      const { dirPath: parentPath } = this._parsePath(cleanPath);
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) parentNode.files = parentNode.files.filter(f => f.fullPath !== cleanPath);
    }
  }

  _bindFolderButton() {
    const btn = document.getElementById(this.folderButtonId);
    if (!btn || btn.dataset.localDriveBound) return;

    btn.dataset.localDriveBound = "true";

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

  _calculateFolderSize(node) {
    let total = node.files.reduce((sum, f) => sum + (f.size || 0), 0);
    for (const child of Object.values(node.children)) {
      total += this._calculateFolderSize(child);
    }
    return total;
  }
}
