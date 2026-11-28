class FileEntity {
  constructor({id = null, name = "", full_path = "", size = 0, mime_type = null, url = null, thumbnail = null, is_folder = false, created_at = null, updated_at = null} = {}) {
    this._id = id;
    this._name = name;
    this._full_path = full_path;
    this._is_folder = is_folder;
    this._size = size;
    this._mime_type = this._is_folder? "inode/directory" : (mime_type || this._guessMimeType());
    this._url = url;
    this._thumbnail = thumbnail || null;
    this._created_at = created_at;
    this._updated_at = updated_at;
    if (!this._thumbnail && this.isImage()) this._thumbnail = this._url;
  }
  
  getId() { return this._id; }
  getName() { return this._name; }
  getFullPath() { return this._full_path; }
  getSize() { return this._size; }
  getMimeType() { return this._mime_type; }
  getUrl(expiresIn = 60) { return this._url; }
  getThumbnail() { return this._thumbnail; }
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

  _checkMineType(exts, prefix) {return exts.includes(this.getExtension()) || this.getMimeType().startsWith(prefix)}
  isImage() {return this._checkMineType(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"], "image/")}
  isVideo() {return this._checkMineType(["mp4","webm","mov","avi","mkv"], "video/")}
  isAudio() {return this._checkMineType(["mp3", "wav", "ogg"], "audio/")}
  isHtml() {return this._checkMineType(["html", "htm"], "html/")}
  isEditable() {
    return !this.isImage() && !this.isVideo() && !this.isAudio()
      && this._checkMineType(
        ["txt", "md", "log", "html", "htm", "css", "js", "ts", "json", "py", "java", "sql", "yml", "yaml"],
        "text/"
      );
  }

  _guessMimeType() {
    const ext = this.getDisplayName().toLowerCase().split(".").pop();
    const mimeMap = {
      txt: "text/plain", html: "text/html", css: "text/css",
      js: "application/javaseateipt", json: "application/json",
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      gif: "image/gif", svg: "image/svg+xml", pdf: "application/pdf", zip: "application/zip"
    };
    return mimeMap[ext] || "application/octet-stream";
  }
}

class StorageManager {
  constructor(initialService = null) {
    this.current = initialService;
    this.services = new Map();
  }

  register(name, service) {
    if (service) {
      this.services.set(name, service);
      if (!this.current) this.current = service;
    }
    return this;
  }

  get(name) {
    return this.services.get(name) || null;
  }

  use(serviceOrName) {
    const resolved = typeof serviceOrName === "string"
      ? this.services.get(serviceOrName)
      : serviceOrName;

    if (!resolved) {
      throw new Error(`Unknown storage service: ${String(serviceOrName)}`);
    }

    this.current = resolved;
    return this;
  }

  currentService() {
    if (!this.current) {
      throw new Error("No storage service selected. Call .use(service) first.");
    }
    return this.current;
  }

  list(path = "", options = {}) {
    return this.currentService().list(path, options);
  }

  download(target, options = {}) {
    return this.currentService().download(target, options);
  }

  upload(path, file, options = {}) {
    return this.currentService().upload(path, file, options);
  }

  remove(targets) {
    const list = Array.isArray(targets) ? targets : [targets];
    return this.currentService().remove(list);
  }
}

/**
 * BaseStorageRecord: Focuses solely on storage CRUD operations, remote downloads, 
 * active-record instance actions, and storage driver management.
 */
/**
 * FileRecord: Extends BaseStorageRecord to add Cryptography (AES-GCM), 
 * and secure wrappers over storage operations.
 */
class Crypto{static PBKDF2_ITERATIONS=1e5;static async _deriveKey(e,t){if(!e)throw new Error("Encryption passphrase is required.");if(!t)throw new Error("Salt is required for key derivation.");const r=new TextEncoder,n=await window.crypto.subtle.importKey("raw",r.encode(e),{name:"PBKDF2"},!1,["deriveKey"]);return window.crypto.subtle.deriveKey({name:"PBKDF2",salt:"string"==typeof t?r.encode(t):t,iterations:this.PBKDF2_ITERATIONS,hash:"SHA-256"},n,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}static async encrypt(e,t,r){const n=await this._deriveKey(t,r),a=window.crypto.getRandomValues(new Uint8Array(12)),i=e instanceof ArrayBuffer?e:(new TextEncoder).encode(e),o=await window.crypto.subtle.encrypt({name:"AES-GCM",iv:a},n,i),s=new Uint8Array(a.byteLength+o.byteLength);s.set(a,0),s.set(new Uint8Array(o),a.byteLength);let c="";for(let e=0;e<s.byteLength;e++)c+=String.fromCharCode(s[e]);return btoa(c)}static async decrypt(e,t,r){const n=await this._deriveKey(t,r),a=atob(e),i=new Uint8Array(a.length);for(let e=0;e<a.length;e++)i[e]=a.charCodeAt(e);const o=i.slice(0,12),s=i.slice(12);return await window.crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,s)}}

class FileRecord extends FileEntity {
  static SALT = "DriveManagerSecureSalt123";
  static storage = new StorageManager();

  constructor(data = {}) {
    super(data);
    this._storageName = data.storageName || null;
  }

  getStorageName() { return this._storageName; }

  static use(serviceOrName) {
    this.storage.use(serviceOrName);
    return this;
  }

  static _client(storageName) {
    if (storageName && this.storage.get(storageName)) {
      return this.storage.use(storageName);
    }
    return this.storage;
  }

  static _namedUploadFile(path, file) {
    const name = path.split("/").pop();
    if (file instanceof File && file.name === name) return file;
    return new File([file], name, { type: file.type || "application/octet-stream" });
  }

  static fromMetadata(item, basePath = "", storageName = null) {
    const cleanBase = String(basePath).replace(/^\/+|\/+$/g, "");
    const fullPath = item.full_path
      || (cleanBase ? `${cleanBase}/${item.name}` : item.name).replace(/^\/+|\/+$/g, "");
    const mimeType = item.mime_type || item.mimeType || null;
    const isFolder = Boolean(
      item.is_folder
      || mimeType === "application/vnd.google-apps.folder"
      || mimeType === "inode/directory"
    );

    return new this({
      id: item.id ?? null,
      name: item.name,
      full_path: fullPath,
      size: Number(item.size ?? item.metadata?.size ?? 0),
      mime_type: mimeType,
      url: item.url || item.webContentLink || null,
      thumbnail: item.thumbnail || item.thumbnailLink || null,
      updated_at: item.updated_at
        || (item.modifiedTime ? new Date(item.modifiedTime).getTime() : null),
      is_folder: isFolder,
      storageName
    });
  }

  static async listRecords(path = "", options = {}, storageName = null) {
    const client = this._client(storageName);
    const { data, error } = await client.list(path, options);
    if (error || !data) return { data: [], error };

    return {
      data: data.map(item =>
        item instanceof FileRecord ? item : this.fromMetadata(item, path, storageName)
      ),
      error: null
    };
  }

  static async create(path, file, options = { upsert: false, encrypt: false }) {
    let uploadFile = this._namedUploadFile(path, file);
    let finalPath = path;

    if (options.encrypt) {
      const passphrase = localStorage.getItem("gdrive_encryption_password");
      if (!passphrase) {
        throw new Error("Encryption passphrase missing. Cannot encrypt file.");
      }

      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });

      const encryptedCipher = await Crypto.encrypt(base64Data, passphrase, this.SALT);
      uploadFile = new File([encryptedCipher], `${uploadFile.name}.enc`, {
        type: "application/octet-stream"
      });
      finalPath = `${path}.enc`;
    }

    return await this.storage.upload(finalPath, uploadFile, options);
  }

  async save(newFileBlob) {
    const targetPath = this._full_path || this._name;
    if (!targetPath && !this._id) {
      throw new Error("Cannot save record without a path or ID.");
    }
    const namedFile = FileRecord._namedUploadFile(targetPath || this._id, newFileBlob);
    const client = FileRecord._client(this._storageName);
    const { data, error } = await client.upload(
      this._id || targetPath,
      namedFile,
      { upsert: true, id: this._id }
    );
    if (error) throw error;

    if (data && typeof data === "object") {
      this._id = data.id || this._id;
      this._name = data.name || this._name;
      this._size = Number(data.size ?? this._size ?? 0);
      this._mime_type = data.mime_type || data.mimeType || this._mime_type;
      this._updated_at = Date.now();
    }
    return this;
  }

  async delete({ recursive = false } = {}) {
    const client = FileRecord._client(this._storageName);
    const path = this._full_path || this._name;

    if (this.isFolderNode()) {
      const { data: items, error } = await FileRecord.listRecords(path, {}, this._storageName);
      if (error) throw error;
      if (items?.length) {
        if (!recursive) {
          throw new Error(`Folder "${path}" is not empty. Pass { recursive: true }.`);
        }
        await Promise.all(items.map(item => item.delete({ recursive: true })));
      }
    }

    return await client.remove([this._id || path]);
  }

  async getContent() {
    const client = FileRecord._client(this._storageName);
    const { data, error } = await client.download({
      id: this.getId(),
      path: this.getFullPath()
    });
    if (error) throw error;

    const response = data instanceof Response ? data : new Response(data);
    if (!this.isEncryptedFile()) return response;

    const passphrase = localStorage.getItem("gdrive_encryption_password");
    if (!passphrase) {
      throw new Error("Encryption passphrase missing. Cannot decrypt encrypted file.");
    }

    const encryptedBase64 = await response.text();
    const decryptedBuffer = await Crypto.decrypt(encryptedBase64, passphrase, FileRecord.SALT);
    const dataUrl = new TextDecoder().decode(decryptedBuffer);
    const blob = this._dataUrlToBlob(dataUrl);

    return new Response(blob, {
      status: 200,
      headers: { "Content-Type": blob.type || this._guessMimeType() }
    });
  }

  async downloadFile(downloadName = null) {
    const response = await this.getContent();
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName || this.getDisplayName();
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  _dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const binaryString = atob(parts[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  getFormattedSize() {
    if (this.isFolderNode()) return "";
    const bytes = this._size || 0;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  getSubtext() {
    if (this.isFolderNode()) return "Folder";
    let text = this.getFormattedSize();
    if (this.isEncryptedFile()) {
      text += ' <span class="text-emerald-400">Encrypted</span>';
    }
    return text;
  }

  getFileIconClass() {
    if (this.isFolderNode()) return "fa-solid fa-folder text-amber-500";
    if (this.isEncryptedFile()) return "fa-solid fa-file-shield text-emerald-400";

    const ext = this.getExtension();
    if (["txt", "md", "log"].includes(ext)) return "fa-solid fa-file-lines";
    if (["json", "js", "ts", "html", "css", "py", "java", "sql", "yml", "yaml"].includes(ext)) {
      return "fa-solid fa-file-code";
    }
    if (this.isImage()) return "fa-solid fa-file-image";
    if (this.isAudio()) return "fa-solid fa-file-audio";
    if (this.isVideo()) return "fa-solid fa-file-video";
    if (ext === "pdf") return "fa-solid fa-file-pdf";
    if (["zip", "rar", "7z"].includes(ext)) return "fa-solid fa-file-zipper";
    return "fa-solid fa-file";
  }
}
