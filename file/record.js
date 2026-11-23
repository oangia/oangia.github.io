class FileEntity {
  constructor({id = null, name = "", full_path = "", size = 0, mime_type = null, url = null, is_folder = false, created_at = null, updated_at = null, metadata = {}} = {}) {
    this._id = id;
    this._name = name;
    this._full_path = full_path;
    this._is_folder = is_folder;
    this._size = size;
    this._mime_type = this._is_folder? "inode/directory" : (mime_type || this._guessMimeType());
    this._url = url;
    this._created_at = created_at;
    this._updated_at = updated_at;
    this._metadata = { ...metadata };
  }
  
  getId() { return this._id; }
  getName() { return this._name; }
  getFullPath() { return this._full_path; }
  getSize() { return this._size; }
  getMimeType() { return this._mime_type; }
  getUrl(expiresIn = 60) { return this._url; }
  getCreatedAt() { return this._created_at; }
  getUpdatedAt() { return this._updated_at; }
  getMetadata() { return this._metadata; }

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
}

/**
 * BaseStorageRecord: Focuses solely on storage CRUD operations, remote downloads, 
 * active-record instance actions, and storage driver management.
 */
class BaseStorageRecord extends FileEntity {
  static SUPABASE_ENABLED = true;
  static _storageService = null;
  static _storageServices = null;
  static _serviceChangeHandler = null;
  
  constructor(data = {}) {
    super(data);
    this._storageService = data.storageService || null;
    this._storageName = data.storageName || "Google Drive";
  }

  getStorageName() { return this._storageName; }

  static getStorage() {
    if (!BaseStorageRecord._storageService) {
      BaseStorageRecord._storageService = new DriveStorageService({
        onConnectionChange: () => BaseStorageRecord.notifyServicesChanged()
      });
    }
    return BaseStorageRecord._storageService;
  }

  static getStorageServices() {
    if (!BaseStorageRecord._storageServices) {
      const onConnectionChange = () => BaseStorageRecord.notifyServicesChanged();
      BaseStorageRecord._storageServices = [
        {
          name: "Google Drive",
          storage: this.getStorage(),
          isAvailable: storage => Boolean(storage.token)
        },
        {
          name: "Supabase",
          storage: BaseStorageRecord.SUPABASE_ENABLED ? new SupabaseStorageService() : null,
          isAvailable: storage => BaseStorageRecord.SUPABASE_ENABLED && Boolean(storage?.client)
        },
        {
          name: "Local folder",
          storage: new LocalFileService({
            folderButtonId: "openLocalFolderBtn",
            onConnectionChange
          }),
          isAvailable: storage => Boolean(storage.isLoaded)
        }
      ];
    }
    return BaseStorageRecord._storageServices;
  }

  static getServiceStatuses() {
    return this.getStorageServices().map(({ name, storage, isAvailable }) => ({
      name,
      isAvailable: isAvailable(storage)
    }));
  }

  static setServiceChangeHandler(handler) {
    BaseStorageRecord._serviceChangeHandler = handler;
    this.getStorageServices();
  }

  static notifyServicesChanged() {
    BaseStorageRecord._serviceChangeHandler?.();
  }

  static async allFromServices(path = "", options = {}) {
    const services = this.getStorageServices().filter(({ storage, isAvailable }) => isAvailable(storage));
    const results = await Promise.all(services.map(async ({ name, storage }) => {
      const { data, error } = await this.all(path, options, storage, name);
      return { data, error, name };
    }));

    return {
      data: results.flatMap(result => result.data),
      errors: results.filter(result => result.error).map(result => ({
        service: result.name,
        error: result.error
      }))
    };
  }

  static async all(path = "", options = {}, storage = this.getStorage(), storageName = "Google Drive") {
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
      cleanBasePath ? `${cleanBasePath}/${file.name}` : file.name,
      storage,
      storageName
    ));

    return { data: fileRecords, error: null };
  }
  
  static _fromDriveMetadata(file, path, storage = this.getStorage(), storageName = "Google Drive") {
    const is_folder = file.mimeType === "application/vnd.google-apps.folder" || file.mimeType === "inode/directory";
    return new this({
      id: file.id || null,
      name: file.name,
      full_path: path,
      size: Number(file.size || 0),
      mime_type: file.mimeType,
      url: file.webContentLink || null,
      updated_at: file.modifiedTime ? new Date(file.modifiedTime).getTime() : null,
      is_folder,
      metadata: file.appProperties || file.metadata || {},
      storageService: storage,
      storageName
    });
  }

  static _namedUploadFile(path, file) {
    const name = path.split("/").pop();
    if (file instanceof File && file.name === name) return file;
    return new File([file], name, { type: file.type || "application/octet-stream" });
  }

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

  static async create(path, file, options = { upsert: false }) {
    let uploadFile = this._namedUploadFile(path, file);
    return await this._uploadToStorage(this.getStorage(), path, uploadFile, options);
  }

  static async update(path, file, options = {}) {
    return await this._uploadToStorage(
      this.getStorage(),
      path,
      this._namedUploadFile(path, file),
      { ...options, upsert: true }
    );
  }

  static async updateById(id, file) {
    return await this._uploadToStorage(this.getStorage(), id, file, {}, true);
  }

  static async _uploadToStorage(storage, path, file, options = {}, byId = false) {
    return byId
      ? await storage.uploadById(path, file, options)
      : await storage.upload(path, file, options);
  }

  static async download(path, downloadName = null) {
    const fileName = downloadName || path.split("/").pop();
    const storage = this.getStorage();
    // Assuming storage has a download method or fallback URL logic
    const { data } = await storage.getByPath(path);
    const url = data?.webContentLink;
    if (!url) return;
    
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async save(newFileBlob) {
    if (!this._full_path && !this._id) throw new Error("Cannot save BaseStorageRecord without an ID or full_path.");
    const namedFile = BaseStorageRecord._namedUploadFile(this._full_path || this._name, newFileBlob);
    const storage = this._storageService || BaseStorageRecord.getStorage();
    const { data, error } = await this.constructor._uploadToStorage(
      storage,
      this._id || this._full_path,
      namedFile,
      { upsert: true },
      Boolean(this._id)
    );
    if (error) throw error;

    if (data) {
      this._id = data.id || this._id;
      this._name = data.name || this._name;
      this._size = Number(data.size || 0);
      this._mime_type = data.mimeType || this._mime_type;
      this._updated_at = data.modifiedTime ? new Date(data.modifiedTime).getTime() : Date.now();
      this._url = data.webContentLink || null;
      this._metadata = data.appProperties || data.metadata || this._metadata;
    }
    return this;
  }

  async delete({ recursive = false } = {}) {
    const storage = this._storageService || BaseStorageRecord.getStorage();
    const path = this._full_path || this._name;

    if (this.isFolderNode()) {
      const { data: items, error } = await BaseStorageRecord.all(path, {}, storage, this._storageName);
      if (error) throw error;
      if (items?.length) {
        if (!recursive) throw new Error(`Folder "${path}" is not empty. Pass { recursive: true }.`);
        await Promise.all(items.map(item => item.delete({ recursive: true })));
      }
    }

    return await storage.remove([path]);
  }

  async fetchContent(expiresIn = 60) {
    const storage = this._storageService || BaseStorageRecord.getStorage();
    const { data: response, error } = await storage.fetchContent({
      id: this.getId(),
      path: this.getFullPath(),
      metadata: this._metadata,
      metadataKnown: true
    });
    if (error) throw error;
    return response;
  }

  async loadPreviewMedia(element, expiresIn = 60) {
    if (this.getUrl()?.startsWith("blob:")) {
      element.loading = "lazy";
      element.src = this.getUrl();
      return;
    }

    const content = await this.fetchContent(expiresIn);
    const blob = await content.blob();
    const objectUrl = URL.createObjectURL(blob);

    element.loading = "lazy";
    element.preload = "auto";
    element.src = objectUrl;
  }

  async downloadInstance() {
    const url = await this.getUrl();
    const link = document.createElement("a");
    link.href = url;
    link.download = this.getDisplayName();
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * FileRecord: Extends BaseStorageRecord to add Cryptography (AES-GCM), 
 * Hashing (SHA-256), and secure wrappers over storage operations.
 */
class Crypto{static PBKDF2_ITERATIONS=1e5;static async sha256(e){const t=e instanceof ArrayBuffer?e:(new TextEncoder).encode(e),r=await window.crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(r)).map(e=>e.toString(16).padStart(2,"0")).join("")}static async _deriveKey(e,t){if(!e)throw new Error("Encryption passphrase is required.");if(!t)throw new Error("Salt is required for key derivation.");const r=new TextEncoder,n=await window.crypto.subtle.importKey("raw",r.encode(e),{name:"PBKDF2"},!1,["deriveKey"]);return window.crypto.subtle.deriveKey({name:"PBKDF2",salt:"string"==typeof t?r.encode(t):t,iterations:this.PBKDF2_ITERATIONS,hash:"SHA-256"},n,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}static async encrypt(e,t,r){const n=await this._deriveKey(t,r),a=window.crypto.getRandomValues(new Uint8Array(12)),i=e instanceof ArrayBuffer?e:(new TextEncoder).encode(e),o=await window.crypto.subtle.encrypt({name:"AES-GCM",iv:a},n,i),s=new Uint8Array(a.byteLength+o.byteLength);s.set(a,0),s.set(new Uint8Array(o),a.byteLength);let c="";for(let e=0;e<s.byteLength;e++)c+=String.fromCharCode(s[e]);return btoa(c)}static async decrypt(e,t,r){const n=await this._deriveKey(t,r),a=atob(e),i=new Uint8Array(a.length);for(let e=0;e<a.length;e++)i[e]=a.charCodeAt(e);const o=i.slice(0,12),s=i.slice(12);return await window.crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,s)}}

class FileRecord extends BaseStorageRecord {
  static SALT = "DriveManagerSecureSalt123";
  hash_filename = null;
  hash_content = null;
  hash_file = null;

  constructor(data = {}) {
    super(data);
    this.hash_content = data.hash_content || null;
    this.hashFullpath();
  }

  getHashContent() { return this.hash_content || null; }

  async hashFullpath() {
    this.hash_filename = await Crypto.sha256(this.getFullPath());
  }

  async hashContent(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    await this._setHashes(await blob.arrayBuffer());
  }

  async _setHashes(buffer) {
    await this.hashFullpath();
    this.hash_content = await Crypto.sha256(buffer);
    this.hash_file = await Crypto.sha256(this.hash_filename + this.hash_content);
  }

  static async computeBackupHash(hashParts) {
    hashParts.sort((a, b) => a.path.localeCompare(b.path));
    const encoder = new TextEncoder();
    const chunks = [];
    let totalLength = 0;

    for (const part of hashParts) {
      const pathBytes = encoder.encode(part.path);
      const contentBytes = new Uint8Array(part.buffer);
      chunks.push(pathBytes, new Uint8Array([0]), contentBytes);
      totalLength += pathBytes.length + 1 + contentBytes.length;
    }

    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return (await Crypto.sha256(combined.buffer)).slice(0, 16);
  }

  async _fetchContentWithHash(expiresIn = 60) {
    const response = await super.fetchContent(expiresIn);
    if (this.hash_content) return response;

    const buffer = await response.arrayBuffer();
    await this._setHashes(buffer);
    return new Response(buffer, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  async save(newFileBlob) {
    const buffer = await newFileBlob.arrayBuffer();
    const savedRecord = await super.save(newFileBlob);
    await this._setHashes(buffer);
    return savedRecord;
  }

  static async compareCopies(records) {
    if (records.length < 2) return "Only one copy";
    const paths = new Set(records.map(record => record.getFullPath().replace(/^\/+|\/+$/g, "")));
    if (paths.size > 1) return "Different path";
    if (new Set(records.map(record => record.getSize())).size > 1) return "Different size";
    if (!records.every(record => record.isEditable())) return "Synced";

    const hashes = await Promise.all(records.map(async record => {
      try {
        if (!record.getHashContent()) await record.fetchContent();
        const hash = record.getHashContent();
        if (!hash) throw new Error(`Missing content hash for "${record.getFullPath()}"`);
        return hash;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Could not fetch "${record.getFullPath()}" from ${record.getStorageName()}: ${reason}`,
          { cause: error }
        );
      }
    }));
    return hashes.every(hash => hash === hashes[0]) ? "Synced" : "Different content";
  }

  static async backup() {
    let storage;
    try {
      storage = this.getStorageServices().find(service => service.name === "Supabase")?.storage;
      if (!storage?.client) throw new Error("Supabase client not initialized");

      storage.onProgress("Collecting all files...", "info");
      const allFiles = await this._listAllFilesRecursive(storage);
      if (allFiles.length === 0) {
        storage.onProgress("Bucket is empty – nothing to backup", "warning");
        return { success: false, error: "Bucket is empty" };
      }

      storage.onProgress(`Found ${allFiles.length} file(s). Downloading fresh copies...`, "info");
      const zip = new JSZip();
      const hashParts = [];
      let processed = 0;

      for (const filePath of allFiles) {
        try {
          const { data: response, error } = await storage.fetchContent({ path: filePath });
          if (error) throw error;

          const buffer = await response.arrayBuffer();
          zip.file(filePath, buffer);
          hashParts.push({ path: filePath, buffer });
        } catch (error) {
          console.warn(`Failed to download ${filePath}:`, error);
          storage.onProgress(`Skipped ${filePath}`, "warning");
        }
        processed++;
        if (processed % 5 === 0 || processed === allFiles.length) {
          storage.onProgress(`Downloaded ${processed} / ${allFiles.length}`, "info");
        }
      }

      storage.onProgress("Calculating archive hash...", "info");
      const shortHash = await this.computeBackupHash(hashParts);
      const today = new Date().toISOString().slice(0, 10);
      const filename = `${storage.bucket}_${today}_${shortHash}.zip`;

      storage.onProgress("Compressing into ZIP archive...", "info");
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      this._triggerDownload(blob, filename);
      storage.onProgress(`Backup ready: ${filename}`, "success");
      return { success: true, filename };
    } catch (error) {
      console.error("Backup failed:", error);
      storage?.onProgress(error.message || "Backup failed", "error");
      return { success: false, error: error.message };
    }
  }

  static async _listAllFilesRecursive(storage, prefix = "") {
    const { data, error } = await storage.list(prefix, { limit: 1000, offset: 0 });
    if (error) throw error;

    const results = [];
    for (const item of data || []) {
      if (item.name === ".emptyFolderPlaceholder") continue;
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.mimeType === "application/vnd.google-apps.folder") {
        const nestedFiles = await this._listAllFilesRecursive(storage, path);
        for (const nestedFile of nestedFiles) results.push(nestedFile);
      } else {
        results.push(path);
      }
    }
    return results;
  }

  static _triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
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

      const encryptedCipher = await Crypto.encrypt(
        base64Data,
        passphrase,
        this.SALT
      );
      const originalName = uploadFile.name;
      uploadFile = new File([encryptedCipher], originalName + ".enc", {
        type: "application/octet-stream",
      });
      finalPath = path + ".enc";
    }

    return await super.create(finalPath, uploadFile, options);
  }

  async fetchContent(expiresIn = 60) {
    const response = await this._fetchContentWithHash(expiresIn);

    if (!this.isEncryptedFile()) {
      return response;
    }

    const passphrase = localStorage.getItem("gdrive_encryption_password");
    if (!passphrase) {
      throw new Error("Encryption passphrase missing. Cannot decrypt encrypted file.");
    }

    const encryptedBase64 = await response.text();
    const decryptedArrayBuffer = await Crypto.decrypt(
      encryptedBase64,
      passphrase,
      FileRecord.SALT
    );

    const dataUrl = new TextDecoder().decode(decryptedArrayBuffer);
    const blob = this._dataUrlToBlob(dataUrl);

    return new Response(blob, {
      status: 200,
      headers: { "Content-Type": blob.type || this._guessMimeType() },
    });
  }

  _dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

    const binaryString = atob(parts[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  }
}
