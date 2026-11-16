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
    this.id = id;
    this.name = name;
    this.full_path = full_path;
    this.isFolder = isFolder;
    this.size = size;
    
    if (this.isFolder) {
      this.mimetype = "application/vnd.google-apps.folder";
    } else {
      this.mimetype = mimetype || this._guessMimeType(name);
    }
    
    this.url = url;
    this.isEncrypted = name.endsWith(".enc");
    this.display_name = this.isEncrypted ? name.replace(/\.enc$/, "") : name;

    this.hash_filename = null;
    this.hash_content = null;
    this.hash_file = null;

    this.created_at = created_at || Date.now();
    this.updated_at = updated_at || Date.now();
    
    this.hashFullpath();
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

  // --- Encapsulated Getters & Type Checkers ---

  get extension() {
    const lastDot = this.name.lastIndexOf(".");
    return lastDot !== -1 ? this.name.substring(lastDot + 1).toLowerCase() : "";
  }

  get formattedSize() {
    if (this.isFolder) return "";
    const bytes = this.size || 0;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  isImage() {
    return !this.isFolder && (
      this.mimetype?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(this.extension)
    );
  }

  isVideo() {
    return !this.isFolder && (
      this.mimetype?.startsWith("video/") ||
      ["mp4", "webm", "mov", "avi", "mkv"].includes(this.extension)
    );
  }

  isAudio() {
    return !this.isFolder && (
      this.mimetype?.startsWith("audio/") ||
      ["mp3", "wav", "ogg"].includes(this.extension)
    );
  }

  isHtml() {
    return !this.isFolder && ["html", "htm"].includes(this.extension);
  }

  getFileIconClass() {
    if (this.isFolder) return "fa-solid fa-folder text-amber-500";
    if (this.isEncrypted) return "fa-solid fa-file-shield text-emerald-400";
    
    const ext = this.extension;
    if (["txt", "md", "log"].includes(ext)) return "fa-solid fa-file-lines";
    if (["json", "js", "ts", "html", "css", "py", "java", "sql", "yml", "yaml"].includes(ext)) return "fa-solid fa-file-code";
    if (this.isImage()) return "fa-solid fa-file-image";
    if (this.isAudio()) return "fa-solid fa-file-audio";
    if (this.isVideo()) return "fa-solid fa-file-video";
    if (ext === "pdf") return "fa-solid fa-file-pdf";
    if (["zip", "rar", "7z"].includes(ext)) return "fa-solid fa-file-zipper";
    return "fa-solid fa-file";
  }

  // --- Hashing Methods ---

  static async computeSha256(input) {
    const buffer = input instanceof ArrayBuffer ? input : new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async hashFullpath() {
    const targetString = this.full_path || this.name;
    if (!targetString) return null;
    this.hash_filename = await FileRecord.computeSha256(targetString);
  }

  async hashContent() {
    try {
      if (!this.url) throw new Error("No URL provided for this file record.");

      const response = await fetch(this.url);
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
