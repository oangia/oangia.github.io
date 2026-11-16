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

  isImage() {
    return !this.isFolder && (
      this.mimetype?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(this.display_name)
    );
  }

  static async computeSha256(input) {
    const buffer = input instanceof ArrayBuffer ? input : new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // 1. Hash the filename / full path
  async hashFullpath() {
    const targetString = this.full_path || this.name;
    if (!targetString) return null;
    
    this.hash_filename = await FileRecord.computeSha256(targetString);
  }

  // 2. Hash content & combine using the URL directly
  async hashContent() {
    try {
      if (!this.url) throw new Error("No URL provided for this file record.");

      // Fetch the binary content from the URL
      const response = await fetch(this.url);
      if (!response.ok) throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
      
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      
      // Hash the binary content payload
      this.hash_content = await FileRecord.computeSha256(buffer);

      // Combine the two existing hashes (Merkle style) and hash them
      const combinedHashes = this.hash_filename + this.hash_content;
      this.hash_file = await FileRecord.computeSha256(combinedHashes);

    } catch (err) {
      console.error("Failed to compute hashes from URL:", err);
      return null;
    }
  }
}
