class FileInterface {
  getId() { throw new Error("FileInterface.getId() must be implemented."); }
  getName() { throw new Error("FileInterface.getName() must be implemented."); }
  getFullPath() { throw new Error("FileInterface.getFullPath() must be implemented."); }
  getSize() { throw new Error("FileInterface.getSize() must be implemented."); }
  getMimeType() { throw new Error("FileInterface.getMimeType() must be implemented."); }
  getUrl() { throw new Error("FileInterface.getUrl() must be implemented."); }
  getThumbnail() { throw new Error("FileInterface.getThumbnail() must be implemented."); }
  getDisplayName() { throw new Error("FileInterface.getDisplayName() must be implemented."); }
  getStorageName() { throw new Error("FileInterface.getStorageName() must be implemented."); }
  isFolderNode() { throw new Error("FileInterface.isFolderNode() must be implemented."); }
  isEditable() { throw new Error("FileInterface.isEditable() must be implemented."); }
  getContent() { throw new Error("FileInterface.getContent() must be implemented."); }
  getHashContent() { throw new Error("FileInterface.getHashContent() must be implemented."); }
  getHashContentFromUrl() { throw new Error("FileInterface.getHashContentFromUrl() must be implemented."); }
  save() { throw new Error("FileInterface.save() must be implemented."); }
  delete() { throw new Error("FileInterface.delete() must be implemented."); }
  static create() { throw new Error("FileInterface.create() must be implemented."); }
  static getAllFromServices() { throw new Error("FileInterface.getAllFromServices() must be implemented."); }
  static getServiceStatuses() { throw new Error("FileInterface.getServiceStatuses() must be implemented."); }
  static getCopyComparison() { throw new Error("FileInterface.getCopyComparison() must be implemented."); }
  static getFolderCopyComparison() { throw new Error("FileInterface.getFolderCopyComparison() must be implemented."); }
  static backup() { throw new Error("FileInterface.backup() must be implemented."); }
  static syncFileToSupabase() { throw new Error("FileInterface.syncFileToSupabase() must be implemented."); }
  static syncDriveToSupabase() { throw new Error("FileInterface.syncDriveToSupabase() must be implemented."); }
}

class FileEntity extends FileInterface {
  constructor({id = null, name = "", full_path = "", size = 0, mime_type = null, url = null, thumbnail = null, is_folder = false, created_at = null, updated_at = null} = {}) {
    super();
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

/**
 * BaseStorageRecord: Focuses solely on storage CRUD operations, remote downloads, 
 * active-record instance actions, and storage driver management.
 */
class BaseStorageRecord extends FileEntity {
  static SUPABASE_ENABLED = true;
  static _storageService = null;
  static _storageServices = null;
  
  constructor(data = {}) {
    super(data);
    this._storageService = data.storageService || null;
    this._storageName = data.storageName || "Google Drive";
  }

  getStorageName() { return this._storageName; }

  static _getStorage() {
    if (!BaseStorageRecord._storageService) {
      BaseStorageRecord._storageService = new DriveStorageService({
        onConnectionChange: () => BaseStorageRecord._notifyServicesChanged()
      });
    }
    return BaseStorageRecord._storageService;
  }

  static _getStorageServices() {
    if (!BaseStorageRecord._storageServices) {
      const onConnectionChange = () => BaseStorageRecord._notifyServicesChanged();
      BaseStorageRecord._storageServices = [
        {
          name: "Google Drive",
          storage: this._getStorage(),
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
    return this._getStorageServices().map(({ name, storage, isAvailable }) => ({
      name,
      isAvailable: isAvailable(storage)
    }));
  }

  static _notifyServicesChanged() {
    window.dispatchEvent(new Event("storage-services-changed"));
  }

  static _getStorageService(name) {
    return this._getStorageServices().find(service => service.name === name);
  }

  static async getAllFromServices(path = "", options = {}) {
    const services = this._getStorageServices().filter(({ storage, isAvailable }) => isAvailable(storage));
    const results = await Promise.all(services.map(async ({ name, storage }) => {
      const { data, error } = await this._getAll(path, options, storage, name);
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

  static async _getAll(path = "", options = {}, storage = this._getStorage(), storageName = "Google Drive") {
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
  
  static _fromDriveMetadata(file, path, storage = this._getStorage(), storageName = "Google Drive") {
    const is_folder = file.mimeType === "application/vnd.google-apps.folder" || file.mimeType === "inode/directory";
    return new this({
      id: file.id || null,
      name: file.name,
      full_path: path,
      size: Number(file.size || 0),
      mime_type: file.mimeType,
      url: file.webContentLink || null,
      thumbnail: file.thumbnailLink || null,
      updated_at: file.modifiedTime ? new Date(file.modifiedTime).getTime() : null,
      is_folder,
      storageService: storage,
      storageName
    });
  }

  static _namedUploadFile(path, file) {
    const name = path.split("/").pop();
    if (file instanceof File && file.name === name) return file;
    return new File([file], name, { type: file.type || "application/octet-stream" });
  }

  static async getByPath(path) {
    const { data, error } = await this._getStorage().getByPath(path);
    if (error || !data) return { data: null, error };

    const cleanPath = path.replace(/^\/+|\/+$/g, "");
    return { data: this._fromDriveMetadata(data, cleanPath), error: null };
  }

  static async getById(id) {
    const { data, error } = await this._getStorage().getById(id);
    if (error || !data) return { data: null, error };

    return { data: this._fromDriveMetadata(data, ""), error: null };
  }

  static async create(path, file, options = { upsert: false }) {
    let uploadFile = this._namedUploadFile(path, file);
    return await this._uploadToStorage(this._getStorage(), path, uploadFile, options);
  }

  static async update(path, file, options = {}) {
    return await this._uploadToStorage(
      this._getStorage(),
      path,
      this._namedUploadFile(path, file),
      { ...options, upsert: true }
    );
  }

  static async updateById(id, file) {
    return await this._uploadToStorage(this._getStorage(), id, file, {}, true);
  }

  static async _uploadToStorage(storage, path, file, options = {}, byId = false) {
    return byId
      ? await storage.uploadById(path, file, options)
      : await storage.upload(path, file, options);
  }

  static async _download(path, downloadName = null) {
    const fileName = downloadName || path.split("/").pop();
    const storage = this._getStorage();
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
    const storage = this._storageService || BaseStorageRecord._getStorage();
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
      this._thumbnail = data.thumbnailLink || (this.isImage() ? this._url : null);
    }
    return this;
  }

  async delete({ recursive = false } = {}) {
    const storage = this._storageService || BaseStorageRecord._getStorage();
    const path = this._full_path || this._name;

    if (this.isFolderNode()) {
      const { data: items, error } = await BaseStorageRecord._getAll(path, {}, storage, this._storageName);
      if (error) throw error;
      if (items?.length) {
        if (!recursive) throw new Error(`Folder "${path}" is not empty. Pass { recursive: true }.`);
        await Promise.all(items.map(item => item.delete({ recursive: true })));
      }
    }

    return await storage.remove([path]);
  }

  async getContent(expiresIn = 60) {
    const storage = this._storageService || BaseStorageRecord._getStorage();
    const { data: response, error } = await storage.fetchContent({
      id: this.getId(),
      path: this.getFullPath(),
    });
    if (error) throw error;
    return response;
  }

  async _downloadInstance() {
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
    this._hashFullpath();
  }

  getHashContent() { return this.hash_content || null; }

  async _hashFullpath() {
    this.hash_filename = await Crypto.sha256(this.getFullPath());
  }

  async getHashContentFromUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    await this._setHashes(await blob.arrayBuffer());
    return this.getHashContent();
  }

  async _setHashes(buffer) {
    await this._hashFullpath();
    this.hash_content = await Crypto.sha256(buffer);
    this.hash_file = await Crypto.sha256(this.hash_filename + this.hash_content);
  }

  static async _computeBackupHash(hashParts) {
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
    const response = await super.getContent(expiresIn);
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

  static async getCopyComparison(records) {
    if (records.length < 2) return "Only one copy";
    const paths = new Set(records.map(record => record.getFullPath().replace(/^\/+|\/+$/g, "")));
    if (paths.size > 1) return "Different path";
    if (new Set(records.map(record => record.getSize())).size > 1) return "Different size";
    if (!records.every(record => record.isEditable())) return "Synced";

    const hashes = await Promise.all(records.map(async record => {
      try {
        if (!record.getHashContent()) await record.getContent();
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

  static async getFolderCopyComparison(folders) {
    const services = new Map(this._getStorageServices().map(service => [service.name, service]));
    const trees = await Promise.all(folders.map(async folder => {
      const service = services.get(folder.getStorageName());
      if (!service) throw new Error(`Storage service not found: ${folder.getStorageName()}`);

      const rootPath = folder.getFullPath().replace(/^\/+|\/+$/g, "");
      const items = new Map();
      const visitedFolders = new Set();
      const collect = async path => {
        const cleanPath = path.replace(/^\/+|\/+$/g, "");
        if (visitedFolders.has(cleanPath)) return;
        visitedFolders.add(cleanPath);

        const { data, error } = await this._getAll(cleanPath, {}, service.storage, service.name);
        if (error) throw error;

        for (const item of data) {
          const itemPath = item.getFullPath().replace(/^\/+|\/+$/g, "");
          const relativePath = itemPath.slice(rootPath.length).replace(/^\/+/, "");
          items.set(relativePath, item);
          if (item.isFolderNode()) await collect(itemPath);
        }
      };

      await collect(rootPath);
      return items;
    }));

    const paths = new Set(trees.flatMap(tree => Array.from(tree.keys())));
    for (const path of paths) {
      const copies = trees.map(tree => tree.get(path));
      if (copies.some(copy => !copy)
        || new Set(copies.map(copy => copy.isFolderNode())).size > 1) {
        return "Different files";
      }

      if (!copies[0].isFolderNode()) {
        const status = await this.getCopyComparison(copies);
        if (status !== "Synced") return status;
      }
    }

    return "Synced";
  }

  static async backup() {
    let storage;
    try {
      storage = this._getStorageService("Supabase")?.storage;
      if (!storage?.client) throw new Error("Supabase client not initialized");

      showToast("Collecting all files...", "info");
      const allFiles = await this._listAllFilesRecursive(storage);
      if (allFiles.length === 0) {
        showToast("Bucket is empty – nothing to backup", "warning");
        return { success: false, error: "Bucket is empty" };
      }

      showToast(`Found ${allFiles.length} file(s). Downloading fresh copies...`, "info");
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
          showToast(`Skipped ${filePath}`, "warning");
        }
        processed++;
        if (processed % 5 === 0 || processed === allFiles.length) {
          showToast(`Downloaded ${processed} / ${allFiles.length}`, "info");
        }
      }

      showToast("Calculating archive hash...", "info");
      const shortHash = await this._computeBackupHash(hashParts);
      const today = new Date().toISOString().slice(0, 10);
      const filename = `${storage.bucket}_${today}_${shortHash}.zip`;

      showToast("Compressing into ZIP archive...", "info");
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      this._triggerDownload(blob, filename);
      showToast(`Backup ready: ${filename}`, "success");
      return { success: true, filename };
    } catch (error) {
      console.error("Backup failed:", error);
      showToast(error.message || "Backup failed", "error");
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

  static async _compareSyncCopy({ id, size, isEditable }, path, existing, drive, supabase) {
    if (!existing) return { matches: false };
    const normalizePath = value => String(value || "").replace(/^\/+|\/+$/g, "");
    if (normalizePath(path) !== normalizePath(existing.id || path)
      || Number(size) !== Number(existing.size)) {
      return { matches: false };
    }
    if (!isEditable) return { matches: true };

    try {
      const driveRecord = new this({
        id,
        full_path: path,
        storageService: drive,
        storageName: "Google Drive"
      });
      if (!driveRecord.getHashContent()) await driveRecord.getContent();

      const supabaseRecord = new this({
        id: existing.id,
        name: existing.name,
        full_path: path,
        size: existing.size,
        mime_type: existing.mimeType,
        storageService: supabase,
        storageName: "Supabase"
      });
      if (!supabaseRecord.getHashContent()) await supabaseRecord.getContent();

      return { matches: driveRecord.getHashContent() === supabaseRecord.getHashContent() };
    } catch (comparisonError) {
      return { matches: false, comparisonError };
    }
  }

  static async syncFileToSupabase(file, onProgress = () => {}) {
    const driveService = this._getStorageService("Google Drive");
    const supabaseService = this._getStorageService("Supabase");
    if (!driveService?.isAvailable(driveService.storage)
      || !supabaseService?.isAvailable(supabaseService.storage)) {
      return { status: "unavailable" };
    }
    if (!file || file.isFolderNode() || file.getStorageName() !== "Google Drive") {
      return { status: "invalid-selection" };
    }

    const path = file.getFullPath();
    const drive = driveService.storage;
    const supabase = supabaseService.storage;
    onProgress("Checking Supabase copy", path, 0, 1, "Comparing path and size");
    const { data: existing, error: existingError } = await supabase.getByPath(path);
    if (existingError && existingError.message !== "File not found") throw existingError;

    const comparison = await this._compareSyncCopy(
      {
        id: file.getId(),
        size: file.getSize(),
        isEditable: file.isEditable()
      },
      path,
      existing,
      drive,
      supabase
    );
    if (comparison.comparisonError) {
      console.warn(`Could not compare ${path}; replacing the Supabase copy:`, comparison.comparisonError);
    }

    if (comparison.matches) {
      onProgress("Sync complete", path, 1, 1, "Already up to date", true);
      return { status: "up-to-date" };
    }

    onProgress("Syncing file to Supabase", path, 0, 1, "Downloading from Google Drive");
    const response = await file.getContent();
    const blob = await response.blob();
    onProgress("Syncing file to Supabase", path, 0, 1, "Uploading to Supabase");

    const uploadFile = new File([blob], file.getName(), {
      type: file.getMimeType() || blob.type || "application/octet-stream"
    });
    const supabaseRecord = new this({
      name: file.getName(),
      full_path: path,
      storageService: supabase,
      storageName: "Supabase"
    });
    await supabaseRecord.save(uploadFile);
    onProgress("Sync complete", path, 1, 1, "File copied to Supabase", true);
    return { status: "synced" };
  }

  static async syncDriveToSupabase(onProgress = () => {}) {
    const driveService = this._getStorageService("Google Drive");
    const supabaseService = this._getStorageService("Supabase");
    if (!driveService?.isAvailable(driveService.storage)
      || !supabaseService?.isAvailable(supabaseService.storage)) {
      throw new Error("Connect Google Drive and configure Supabase before syncing");
    }

    const drive = driveService.storage;
    const supabase = supabaseService.storage;
    const files = [];
    const emptyFolders = [];
    onProgress("Preparing sync", "Scanning Google Drive...", 0, 0, "In progress");
    const collectDriveFiles = async (path = "") => {
      onProgress("Scanning Google Drive", path || "/", 0, 0, "Building file list");
      const { data, error } = await drive.list(path, { limit: 1000 });
      if (error) throw error;

      const entries = data || [];
      if (path && entries.length === 0) emptyFolders.push(path);
      for (const entry of entries) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name;
        if (entry.mimeType === "application/vnd.google-apps.folder") {
          await collectDriveFiles(entryPath);
        } else {
          files.push({ entry, path: entryPath });
        }
      }
    };
    await collectDriveFiles();

    const drivePaths = new Set(files.map(file => file.path));
    for (const folderPath of emptyFolders) {
      drivePaths.add(`${folderPath}/.emptyFolderPlaceholder`);
    }

    const supabaseFiles = new Map();
    const collectSupabaseFiles = async (path = "") => {
      onProgress("Scanning Supabase", path || "/", 0, 0, "Building file list");
      let offset = 0;
      while (true) {
        const { data, error } = await supabase.list(path, { limit: 1000, offset });
        if (error) throw error;

        const entries = data || [];
        for (const entry of entries) {
          const entryPath = path ? `${path}/${entry.name}` : entry.name;
          if (entry.mimeType === "application/vnd.google-apps.folder") {
            await collectSupabaseFiles(entryPath);
          } else {
            supabaseFiles.set(entryPath, entry);
          }
        }

        if (entries.length < 1000) break;
        offset += entries.length;
      }
    };
    await collectSupabaseFiles();

    const orphanedPaths = [...supabaseFiles.keys()].filter(path => !drivePaths.has(path));
    const totalWork = files.length + emptyFolders.length + orphanedPaths.length;
    let completedWork = 0;
    let synced = 0;
    let skipped = 0;
    let failed = 0;
    let deleted = 0;
    let deleteFailed = 0;

    const uploadFile = async (path, name, mimeType, blob) => {
      const file = new File([blob], name, {
        type: mimeType || blob.type || "application/octet-stream"
      });
      const record = new this({
        name,
        full_path: path,
        storageService: supabase,
        storageName: "Supabase"
      });
      await record.save(file);
    };

    for (const { entry, path } of files) {
      const existing = supabaseFiles.get(path);
      onProgress(
        existing ? "Checking Supabase copy" : "Copying Drive file to Supabase",
        path,
        completedWork,
        totalWork,
        "In progress"
      );
      let itemFailed = false;
      let itemStatus = "Copied to Supabase";
      try {
        const editableFile = new FileEntity({
          name: entry.name,
          full_path: path,
          size: Number(entry.size || 0),
          mime_type: entry.mimeType
        });
        const comparison = await this._compareSyncCopy(
          { id: entry.id, size: entry.size, isEditable: editableFile.isEditable() },
          path,
          existing,
          drive,
          supabase
        );
        if (comparison.comparisonError) {
          console.warn(`Could not compare ${path}; replacing the Supabase copy:`, comparison.comparisonError);
        }

        if (comparison.matches) {
          skipped++;
          itemStatus = "Already up to date";
        } else {
          const driveRecord = new this({
            id: entry.id || null,
            name: entry.name,
            full_path: path,
            size: Number(entry.size || 0),
            mime_type: entry.mimeType,
            url: entry.webContentLink || null,
            updated_at: entry.modifiedTime ? new Date(entry.modifiedTime).getTime() : null,
            is_folder: entry.mimeType === "application/vnd.google-apps.folder" || entry.mimeType === "inode/directory",
            storageService: drive,
            storageName: "Google Drive"
          });
          const response = await driveRecord.getContent();
          await uploadFile(path, entry.name, entry.mimeType, await response.blob());
          synced++;
        }
      } catch (error) {
        console.error(`Failed to sync ${path}:`, error);
        failed++;
        itemFailed = true;
      }

      completedWork++;
      onProgress(
        itemFailed ? "Failed to copy file" : itemStatus,
        path,
        completedWork,
        totalWork,
        `${synced} copied · ${skipped} unchanged · ${failed} failed`
      );
    }

    for (const folderPath of emptyFolders) {
      onProgress("Creating empty folder in Supabase", folderPath, completedWork, totalWork, "In progress");
      let itemFailed = false;
      try {
        await uploadFile(
          `${folderPath}/.emptyFolderPlaceholder`,
          ".emptyFolderPlaceholder",
          "application/octet-stream",
          new Blob([])
        );
        synced++;
      } catch (error) {
        console.error(`Failed to sync empty folder ${folderPath}:`, error);
        failed++;
        itemFailed = true;
      }

      completedWork++;
      onProgress(
        itemFailed ? "Failed to create folder" : "Folder created in Supabase",
        folderPath,
        completedWork,
        totalWork,
        `${synced} copied · ${skipped} unchanged · ${failed} failed`
      );
    }

    for (let index = 0; index < orphanedPaths.length; index += 100) {
      const batch = orphanedPaths.slice(index, index + 100);
      const current = batch.length === 1 ? batch[0] : `${batch[0]} (+${batch.length - 1} more)`;
      onProgress("Removing Supabase-only files", current, completedWork, totalWork, "In progress");
      let batchFailed = false;
      try {
        const { error } = await supabase.remove(batch);
        if (error) throw error;
        deleted += batch.length;
      } catch (error) {
        console.error("Failed to remove Supabase-only files:", error);
        deleteFailed += batch.length;
        batchFailed = true;
      }

      completedWork += batch.length;
      onProgress(
        batchFailed ? "Failed to remove files" : "Removed Supabase-only files",
        current,
        completedWork,
        totalWork,
        `${deleted} removed · ${deleteFailed} failed`
      );
    }

    return { synced, skipped, failed, deleted, deleteFailed, completedWork, totalWork };
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

  async getContent(expiresIn = 60) {
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
}
