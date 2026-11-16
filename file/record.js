class FileRecord {
  constructor({
    id = null,
    name = "",
    full_path = "",
    size = 0,
    mimetype = null,
    url = null,
    created_at = null,
    updated_at = null,
    isFolder = false
  } = {}) {
    this._id = id;
    this._name = name;
    this._full_path = full_path;
    this._isFolder = isFolder;
    this._size = size;
    
    if (this._isFolder) {
      this._mimetype = "application/vnd.google-apps.folder";
    } else {
      this._mimetype = mimetype || this._guessMimeType(name);
    }
    
    this._url = url;
    this._created_at = created_at || Date.now();
    this._updated_at = updated_at || Date.now();

    this.hash_filename = null;
    this.hash_content = null;
    this.hash_file = null;

    this.hashFullpath();
  }

  // --- Encapsulated Getters ---
  getId() { return this._id; }
  getName() { return this._name; }
  getFullPath() { return this._full_path; }
  getSize() { return this._size; }
  getMimeType() { return this._mimetype; }
  getUrl() { return this._url; }
  getCreatedAt() { return this._created_at; }
  getUpdatedAt() { return this._updated_at; }

  isFolderNode() {
    return this._isFolder;
  }

  isEncryptedFile() {
    return this._name.endsWith(".enc");
  }

  getDisplayName() {
    return this.isEncryptedFile() ? this._name.replace(/\.enc$/, "") : this._name;
  }

  getExtension() {
    const realName = this.getDisplayName(); // Strips ".enc" if present
    const lastDot = realName.lastIndexOf(".");
    return lastDot !== -1 ? realName.substring(lastDot + 1).toLowerCase() : "";
  }

  getFormattedSize() {
    if (this.isFolderNode()) return "";
    const bytes = this._size || 0;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  getSubtext() {
    if (this.isFolderNode()) return "Folder";
    let text = this.getFormattedSize();
    if (this.isEncryptedFile()) {
      text += ' <span class="text-emerald-400">Encrypted</span>';
    }
    return text;
  }

  isImage() {
    const ext = this.getExtension(); // Now uses getDisplayName() under the hood
    return !this.isFolderNode() && (
      this.getMimeType()?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)
    );
  }

  isVideo() {
    const ext = this.getExtension();
    return !this.isFolderNode() && (
      this.getMimeType()?.startsWith("video/") ||
      ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)
    );
  }

  isAudio() {
    const ext = this.getExtension();
    return !this.isFolderNode() && (
      this.getMimeType()?.startsWith("audio/") ||
      ["mp3", "wav", "ogg"].includes(ext)
    );
  }

  isHtml() {
    const ext = this.getExtension();
    return !this.isFolderNode() && ["html", "htm"].includes(ext);
  }
  
  getFileIconClass() {
    if (this.isFolderNode()) return "fa-solid fa-folder text-amber-500";
    if (this.isEncryptedFile()) return "fa-solid fa-file-shield text-emerald-400";
    
    const ext = this.getExtension();
    if (["txt", "md", "log"].includes(ext)) return "fa-solid fa-file-lines";
    if (["json", "js", "ts", "html", "css", "py", "java", "sql", "yml", "yaml"].includes(ext)) return "fa-solid fa-file-code";
    if (this.isImage()) return "fa-solid fa-file-image";
    if (this.isAudio()) return "fa-solid fa-file-audio";
    if (this.isVideo()) return "fa-solid fa-file-video";
    if (ext === "pdf") return "fa-solid fa-file-pdf";
    if (["zip", "rar", "7z"].includes(ext)) return "fa-solid fa-file-zipper";
    return "fa-solid fa-file";
  }

  _guessMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeMap = {
      txt: "text/plain", html: "text/html", css: "text/css",
      js: "application/javascript", json: "application/json",
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      gif: "image/gif", svg: "image/svg+xml", pdf: "application/pdf", zip: "application/zip"
    };
    return mimeMap[ext] || "application/octet-stream";
  }

  static async computeSha256(input) {
    const buffer = input instanceof ArrayBuffer ? input : new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async hashFullpath() {
    const targetString = this.getFullPath() || this.getName();
    if (!targetString) return null;
    this.hash_filename = await FileRecord.computeSha256(targetString);
  }

  async hashContent(overrideUrl = null) {
    try {
      const targetUrl = overrideUrl || this.getUrl();
      if (!targetUrl) throw new Error("No URL provided for this file record.");

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
      
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      
      this.hash_content = await FileRecord.computeSha256(buffer);

      const combinedHashes = this.hash_filename + this.hash_content;
      this.hash_file = await FileRecord.computeSha256(combinedHashes);
    } catch (err) {
      console.error("Failed to compute hashes from URL:", err);
      return null;
    }
  }
}
