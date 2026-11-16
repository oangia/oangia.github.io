class LocalFileService {
  constructor() {
    this.rootNode = { name: "root", children: {}, files: [] };
    this.pathToFile = new Map();
    this.pathToNode = new Map();
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
      const record = {
        id: fullPath,
        name: fileName,
        fullPath,
        fileUrl,
        size: file.size,
        metadata: { size: file.size },
        thumbUrl: (isImage(fileName) || isVideo(fileName)) ? fileUrl : null
      };
      currentNode.files.push(record);
      this.pathToFile.set(fullPath, record);
    }
  }

  getItemsAtPath(folderPath = "") {
    const node = this.pathToNode.get(folderPath) || this.rootNode;
    const folderItems = Object.values(node.children).map(child => ({
      id: null,
      name: child.name,
      fullPath: child.path,
      metadata: { size: this._calculateFolderSize(child) }
    }));
    folderItems.sort((a, b) => a.name.localeCompare(b.name));
    const fileItems = [...node.files].sort((a, b) => a.name.localeCompare(b.name));
    return [...folderItems, ...fileItems];
  }

  _calculateFolderSize(node) {
    let total = node.files.reduce((sum, f) => sum + (f.size || 0), 0);
    for (const child of Object.values(node.children)) {
      total += this._calculateFolderSize(child);
    }
    return total;
  }

  async getFileUrl(path) {
    const record = this.pathToFile.get(path);
    if (!record) return { data: null, error: new Error("File not found") };
    return { data: { signedUrl: record.fileUrl }, error: null };
  }

  async upload(path, blob) {
    const record = this.pathToFile.get(path);
    if (!record) return { error: new Error("File not found") };
    if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
    record.fileUrl = URL.createObjectURL(blob);
    record.size = blob.size;
    record.metadata.size = blob.size;
    return { error: null };
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
}
