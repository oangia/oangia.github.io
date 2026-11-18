class FileEntity {
  constructor({
    id = null,
    name = "",
    full_path = "",
    size = 0,
    mime_type = null,
    url = null,
    created_at = null,
    updated_at = null,
    is_folder = false
  } = {}) {
    this._id = id;
    this._name = name;
    this._full_path = full_path;
    this._is_folder = is_folder;
    this._size = size;

    if (this._is_folder) {
      this._mime_type = "inode/directory";
    } else {
      this._mime_type = mime_type || this._guessMimeType();
    }

    this._url = url;
    this._created_at = created_at || Date.now();
    this._updated_at = updated_at || Date.now();

    this.hash_filename = null;
    this.hash_content = null;
    this.hash_file = null;

    this.hashFullpath();
  }

  // =========================================================================
  // ENCAPSULATED GETTERS & HELPERS
  // =========================================================================
  getId() { return this._id; }
  getName() { return this._name; }
  getFullPath() { return this._full_path; }
  getSize() { return this._size; }
  getMimeType() { return this._mime_type; }
  getUrl() { return this._url; }
  getCreatedAt() { return this._created_at; }
  getUpdatedAt() { return this._updated_at; }

  isFolderNode() {
    return this._is_folder;
  }

  isEncryptedFile() {
    return this._name.endsWith(".enc");
  }

  getDisplayName() {
    return this.isEncryptedFile() ? this._name.replace(/\.enc$/, "") : this._name;
  }

  getExtension() {
    const realName = this.getDisplayName();
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
    const ext = this.getExtension();
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

  _guessMimeType() {
    const ext = this.getDisplayName().toLowerCase().split(".").pop();
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
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async hashFullpath() {
    const targetString = this.getFullPath() || this.getName();
    if (!targetString) return null;
    this.hash_filename = await FileEntity.computeSha256(targetString);
  }

  async hashContent(overrideUrl = null) {
    try {
      const targetUrl = overrideUrl || this.getUrl();
      if (!targetUrl) throw new Error("No URL provided for this file record.");

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`Failed to fetch file from URL: ${response.statusText}`);

      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      this.hash_content = await FileEntity.computeSha256(buffer);

      const combinedHashes = this.hash_filename + this.hash_content;
      this.hash_file = await FileEntity.computeSha256(combinedHashes);
    } catch (err) {
      console.error("Failed to compute hashes from URL:", err);
      return null;
    }
  }
}

/**
 * FileRecord: Focuses on processing, storage CRUD operations, 
 * cryptography, remote downloads, previews, and active-record instance actions.
 */
class FileRecord extends FileEntity {
  // Shared static storage driver across all static & instance calls
  static _storageService = null;

  /**
   * Initialize or retrieve the StorageService instance
   */
  static getStorage() {
    if (!this._storageService) {
      this._storageService = new DriveStorageService();
    }
    return this._storageService;
  }

  static getEncryptionPassphrase() {
    return localStorage.getItem("gdrive_encryption_password") || null;
  }

  // =========================================================================
  // CRYPTO HELPERS (AES-GCM)
  // =========================================================================
  static async _getCryptoKey(passphrase) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    const salt = enc.encode("DriveManagerSecureSalt123");
    return window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async _encryptData(inputData, passphrase) {
    const key = await this._getCryptoKey(passphrase);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = inputData instanceof ArrayBuffer ? inputData : new TextEncoder().encode(inputData);
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

    const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.byteLength);

    let binary = "";
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  }

  static async _decryptData(base64Cipher, passphrase) {
    const key = await this._getCryptoKey(passphrase);
    const binary = atob(base64Cipher);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return decrypted;
  }

  /**
   * Retrieve all files/folders in a directory
   * Usage: const { data, error } = await FileRecord.all("documents/2026");
   */
  static async all(path = "", options = {}) {
    const storage = this.getStorage();
    const { data, error } = await storage.list(path, {
      limit: 500,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
      ...options
    });

    if (error || !data) {
      return { data: [], error };
    }

    const cleanBasePath = path ? path.replace(/^\/+|\/+$/g, "") : "";

    const fileRecords = data.map((file) => this._fromDriveMetadata(
      file,
      cleanBasePath ? `${cleanBasePath}/${file.name}` : file.name
    ));
    console.log(fileRecords);

    return { data: fileRecords, error: null };
  }

  static _fromDriveMetadata(file, path) {
    const is_folder = file.mimeType === "application/vnd.google-apps.folder";
    return new FileRecord({
      id: file.id || null,
      name: file.name,
      full_path: path,
      size: Number(file.size || 0),
      mimetype: file.mimeType,
      url: file.webContentLink || null,
      updated_at: file.modifiedTime ? new Date(file.modifiedTime).getTime() : null,
      isFolder
    });
  }

  /**
   * Find a single file or folder by path (alias: get)
   * Usage: const { data: file, error } = await FileRecord.find("docs/report.pdf");
   */
  static async find(path) {
    const { data, error } = await this.getStorage().getByPath(path);
    if (error || !data) return { data: null, error };

    const cleanPath = path.replace(/^\/+|\/+$/g, "");
    return { data: this._fromDriveMetadata(data, cleanPath), error: null };
  }

  static async findById(id) {
    const { data, error } = await this.getStorage().getById(id);
    if (error || !data) return { data: null, error };

    return { data: this._fromDriveMetadata(data, ""), error: null };
  }

  static async get(path) {
    return await this.find(path);
  }

  /**
   * Create/Upload a new file (or folder placeholder)
   * Usage: const { data: record, error } = await FileRecord.create("docs/report.pdf", fileObj);
   */
  static async create(path, file, options = { upsert: false, encrypt: false }) {
    let uploadFile = this._namedUploadFile(path, file);
    let finalPath = path;

    if (options.encrypt) {
      const passphrase = this.getEncryptionPassphrase();
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });

      const encryptedCipher = await this._encryptData(base64Data, passphrase);
      const originalName = uploadFile.name;
      uploadFile = new File([encryptedCipher], originalName + ".enc", { type: "application/octet-stream" });
      finalPath = path + ".enc";
    }
    const res = await this.getStorage().upload(finalPath, uploadFile, options);
    console.log(res);
    return res;
  }

  static _namedUploadFile(path, file) {
    const name = path.split("/").pop();
    if (file instanceof File && file.name === name) return file;
    return new File([file], name, { type: file.type || "application/octet-stream" });
  }

  /**
   * Update/Overwrite an existing file at path
   * Usage: const { data: record, error } = await FileRecord.update("docs/report.pdf", newFileObj);
   */
  static async update(path, file, options = {}) {
    return await this.getStorage().upload(
      path,
      this._namedUploadFile(path, file),
      { ...options, upsert: true }
    );
  }

  static async updateById(id, file) {
    return await this.getStorage().uploadById(id, file);
  }

  /**
   * Delete one or multiple paths
   */
  static async destroy(paths) {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    return await this.getStorage().remove(pathArray);
  }

  static async destroyById(ids) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    return await this.getStorage().removeById(idArray);
  }

  /**
   * Get a decrypted/signed blob URL for a file path
   */
  static async getFileUrl(path, expiresIn = 60) {
    try {
      const storage = this.getStorage();
      const { data: file, error } = await storage.getByPath(path);
      if (error) throw error;
      if (!file?.id) throw new Error("File not found");

      return await this.getFileUrlById(file.id, path, expiresIn);
    } catch (error) {
      return { data: null, error };
    }
  }

  static async getFileUrlById(id, filename = "", expiresIn = 60) {
    try {
      const storage = this.getStorage();
      if (!filename) {
        const { data: file, error } = await storage.getById(id);
        if (error) throw error;
        filename = file?.name || "";
      }

      const response = await fetch(`${storage.apiBase}/${encodeURIComponent(id)}?alt=media`, {
        headers: storage._headers()
      });
      if (!response.ok) {
        throw new Error((await response.json()).error?.message || "Failed to fetch file content");
      }

      let blob = await response.blob();
      const passphrase = this.getEncryptionPassphrase();
      if (filename.endsWith(".enc") && passphrase) {
        const decrypted = await this._decryptData(await blob.text(), passphrase);
        const decryptedText = new TextDecoder().decode(decrypted);
        const dataUrlMatch = decryptedText.match(/^data:(.*?);base64,(.*)$/s);
        if (dataUrlMatch) {
          blob = await (await fetch(decryptedText)).blob();
        } else {
          blob = new Blob([decryptedText]);
        }
      }

      return { data: { signedUrl: URL.createObjectURL(blob) }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Trigger a browser download directly by path
   */
  static async download(path, downloadName = null) {
    const fileName = downloadName || path.split("/").pop().replace(/\.enc$/, "");
    const { data, error } = await this.getFileUrl(path);
    if (error) throw error;

    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(data.signedUrl), 1000);
  }

  // =========================================================================
  // INSTANCE ACTIVE-RECORD METHODS
  // =========================================================================

  async save(newFileBlob) {
    if (!this._full_path && !this._id) throw new Error("Cannot save FileRecord without an ID or full_path.");
    const namedFile = FileRecord._namedUploadFile(this._full_path || this._name, newFileBlob);
    const { data, error } = this._id
      ? await FileRecord.updateById(this._id, namedFile)
      : await FileRecord.update(this._full_path, namedFile);
    if (error) throw error;

    if (data) {
      this._id = data.id || this._id;
      this._name = data.name || this._name;
      this._size = Number(data.size || 0);
      this._mimetype = data.mimeType || this._mimetype;
      this._updated_at = data.modifiedTime ? new Date(data.modifiedTime).getTime() : Date.now();
      this._url = data.webContentLink || null;
    }
    return this;
  }

  async delete() {
    if (!this._full_path && !this._id) throw new Error("Cannot delete FileRecord without an ID or full_path.");
    return this._id
      ? await FileRecord.destroyById(this._id)
      : await FileRecord.destroy(this._full_path);
  }

  async fetchSignedUrl(expiresIn = 60) {
    return this._id
      ? await FileRecord.getFileUrlById(this._id, this._name, expiresIn)
      : await FileRecord.getFileUrl(this._full_path, expiresIn);
  }

  static _createPreviewDataUrl(source, sourceWidth, sourceHeight) {
    if (!sourceWidth || !sourceHeight) {
      throw new Error("Cannot create a preview from media with no dimensions.");
    }

    const maxDimension = 320;
    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create a canvas context for the media preview.");

    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.8);
  }

  async loadPreviewMedia(element, expiresIn = 60) {
    const isImage = element instanceof HTMLImageElement;
    const isVideo = element instanceof HTMLVideoElement;
    if (!isImage && !isVideo) {
      throw new TypeError("Preview media element must be an image or video.");
    }

    const { data, error } = await this.fetchSignedUrl(expiresIn);
    if (error) throw error;
    if (!data?.signedUrl) throw new Error(`No signed URL available for ${this.getFullPath()}.`);

    let previewVideo = null;
    try {
      if (isImage) {
        const response = await fetch(data.signedUrl);
        if (!response.ok) throw new Error("Failed to read fetched image for preview.");

        const bitmap = await createImageBitmap(await response.blob());
        try {
          element.loading = "lazy";
          element.alt = this.getDisplayName();
          element.src = FileRecord._createPreviewDataUrl(bitmap, bitmap.width, bitmap.height);
        } finally {
          bitmap.close();
        }
        return;
      }

      previewVideo = document.createElement("video");
      previewVideo.muted = true;
      previewVideo.preload = "auto";
      await new Promise((resolve, reject) => {
        previewVideo.addEventListener("loadeddata", resolve, { once: true });
        previewVideo.addEventListener("error", () => {
          reject(previewVideo.error || new Error("Failed to decode video preview."));
        }, { once: true });
        previewVideo.src = data.signedUrl;
        previewVideo.load();
      });

      element.preload = "none";
      element.poster = FileRecord._createPreviewDataUrl(
        previewVideo,
        previewVideo.videoWidth,
        previewVideo.videoHeight
      );
    } finally {
      if (previewVideo) {
        previewVideo.pause();
        previewVideo.removeAttribute("src");
        previewVideo.load();
      }
      if (data.signedUrl.startsWith("blob:")) URL.revokeObjectURL(data.signedUrl);
    }
  }

  async downloadInstance() {
    const { data, error } = await this.fetchSignedUrl();
    if (error) throw error;

    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = this.getDisplayName();

    link.click();
    setTimeout(() => URL.revokeObjectURL(data.signedUrl), 1000);
  }
}
