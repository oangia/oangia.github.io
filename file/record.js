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
    
    // Assign proper mimetype for folders vs files
    if (this.isFolder) {
      this.mimetype = "application/vnd.google-apps.folder";
    } else {
      this.mimetype = mimetype || this._guessMimeType(name);
    }
    
    this.url = url;
      
    this.isEncrypted = name.endsWith(".enc");
    // Automatically strip .enc for display_name if encrypted
    this.display_name = this.isEncrypted ? name.replace(/\.enc$/, "") : name;

    this.hash_filename = null;
    this.hash_content = null;
    this.hash_file = null;

    this.created_at = created_at || Date.now();
    this.updated_at = updated_at || Date.now();
    this._calculateHash();
  }

  _guessMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeMap = {
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      zip: "application/zip"
    };
    return mimeMap[ext] || "application/octet-stream";
  }

  get isImage() {
    return !this.isFolder && (
      this.mimetype?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(this.name)
    );
  }

  async _calculateHash() {
    if (!this.full_path) return this;

    const encoder = new TextEncoder();
    const buffer = await window.crypto.subtle.digest("SHA-256", encoder.encode(this.full_path));
    const hashHex = Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    this.hash_filename = hashHex;
  }
}
