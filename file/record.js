class FileEntity {
  constructor({id = null, name = "", full_path = "", size = 0, mime_type = null, url = null, thumbnail = null, is_folder = false, created_at = null, updated_at = null} = {}) {
    this._id = id;
    this._name = name;
    this._full_path = full_path;
    this._is_folder = is_folder;
    this._size = size;
    this._mime_type = this._is_folder? "inode/directory" : (mime_type || this._guessMimeType());
    this._url = url;
    this._thumbnail = thumbnail;
    this._created_at = created_at;
    this._updated_at = updated_at;
  }
  
  getId() { return this._id; }
  getName() { return this._name; }
  getFullPath() { return this._full_path; }
  getSize() { return this._size; }
  getMimeType() { return this._mime_type; }
  getUrl(expiresIn = 60) { return this._url; }
  getThumbnail() { 
    if (!this._thumbnail && this.isImage()) return this._url;
    return this._thumbnail; 
  }
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
 * FileRecord: Extends BaseStorageRecord to add Cryptography (AES-GCM), 
 * and secure wrappers over storage operations.
 */
class Crypto{static PBKDF2_ITERATIONS=1e5;static async _deriveKey(e,t){if(!e)throw new Error("Encryption passphrase is required.");if(!t)throw new Error("Salt is required for key derivation.");const r=new TextEncoder,n=await window.crypto.subtle.importKey("raw",r.encode(e),{name:"PBKDF2"},!1,["deriveKey"]);return window.crypto.subtle.deriveKey({name:"PBKDF2",salt:"string"==typeof t?r.encode(t):t,iterations:this.PBKDF2_ITERATIONS,hash:"SHA-256"},n,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}static async encrypt(e,t,r){const n=await this._deriveKey(t,r),a=window.crypto.getRandomValues(new Uint8Array(12)),i=e instanceof ArrayBuffer?e:(new TextEncoder).encode(e),o=await window.crypto.subtle.encrypt({name:"AES-GCM",iv:a},n,i),s=new Uint8Array(a.byteLength+o.byteLength);s.set(a,0),s.set(new Uint8Array(o),a.byteLength);let c="";for(let e=0;e<s.byteLength;e++)c+=String.fromCharCode(s[e]);return btoa(c)}static async decrypt(e,t,r){const n=await this._deriveKey(t,r),a=atob(e),i=new Uint8Array(a.length);for(let e=0;e<a.length;e++)i[e]=a.charCodeAt(e);const o=i.slice(0,12),s=i.slice(12);return await window.crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,s)}}

class FileRecord extends FileEntity {
  static SUPABASE_ENABLED = true;
  static SALT = "DriveManagerSecureSalt123";
  static DRIVE_CACHE_KEY = "file_manager_drive_cache_v1";
  static SUPABASE_CACHE_KEY = "file_manager_supabase_cache_v1";

  static _currentService = null;
  static _storageService = null;
  static _storageServices = null;
  static _localFileUrls = new WeakMap();
  static _localFileIndexes = new WeakMap();
  static _listingCaches = new WeakMap();
  static _driveCaches = new WeakMap();
  static _forceNetworkRefresh = false;

  constructor(data = {}) {
    super(data);
    this._storageService = data.storageService || null;
    this._storageName = data.storageName || "Google Drive";
  }

  getStorageName() { return this._storageName; }

  // --- Service switching via .use(...) ---

  static use(serviceOrName) {
    if (!serviceOrName) {
      throw new Error("A service instance or registered service name is required for .use().");
    }

    if (typeof serviceOrName === "string") {
      const entry = this._getStorageService(serviceOrName);
      if (!entry?.storage) {
        throw new Error(`Unknown or unavailable storage service: "${serviceOrName}"`);
      }
      this._currentService = entry.storage;
      this._storageService = entry.storage;
      return this;
    }

    this._currentService = serviceOrName;
    if (serviceOrName instanceof DriveStorageService) {
      this._storageService = serviceOrName;
    }
    return this;
  }

  static _activeStorage(fallback = null) {
    return fallback || this._currentService || this._getStorage();
  }

  static _activeStorageName(storage, fallbackName = null) {
    if (fallbackName) return fallbackName;
    const match = this._getStorageServices().find(item => item.storage === storage);
    return match?.name || "Google Drive";
  }

  static _getStorage() {
    if (!this._storageService) {
      this._storageService = new DriveStorageService({
        onConnectionChange: ({ error, requestMode } = {}) => {
          const storage = this._storageService;
          if (!error && storage) {
            this._invalidateDriveCache(storage);
            void this._driveLoadAll(storage);
          }
          if (error && requestMode !== "silent" && typeof showToast === "function") {
            showToast(`Auth error: ${error}`, "error");
          } else if (!error && requestMode !== "silent" && typeof showToast === "function") {
            showToast("Connected to Google Drive successfully", "success");
          }
          this._notifyServicesChanged();
        }
      });
    }
    if (!this._currentService) {
      this._currentService = this._storageService;
    }
    return this._storageService;
  }

  static _getStorageServices() {
    if (!this._storageServices) {
      let localFiles;
      localFiles = new LocalFileService({
        folderButtonId: "openLocalFolderBtn",
        onConnectionChange: () => {
          this._releaseLocalFileUrls(localFiles);
          this._notifyServicesChanged();
        }
      });
      this._storageServices = [
        {
          name: "Google Drive",
          storage: this._getStorage()
        },
        {
          name: "Supabase",
          storage: this.SUPABASE_ENABLED ? new SupabaseStorageService() : null
        },
        {
          name: "Local folder",
          storage: localFiles
        }
      ];
    }
    return this._storageServices;
  }

  static registerService(name, storage) {
    const services = this._getStorageServices();
    const existing = services.find(s => s.name === name);
    if (existing) {
      existing.storage = storage;
    } else {
      services.push({ name, storage });
    }
    this._notifyServicesChanged();
    return this;
  }

  static getServiceStatuses() {
    return this._getStorageServices().map(({ name, storage }) => ({
      name,
      isAvailable: Boolean(storage?.isAvailable())
    }));
  }

  static _notifyServicesChanged() {
    window.dispatchEvent(new Event("storage-services-changed"));
  }

  static _getStorageService(name) {
    return this._getStorageServices().find(service => service.name === name);
  }

  // --- Path & cache helpers ---

  static _normalizePath(path = "") {
    return String(path).replace(/^\/+/, "").replace(/\/+$/, "");
  }

  static _parsePath(path = "") {
    const cleanPath = String(path).replace(/^\/+/, "");
    const lastSlashIdx = cleanPath.lastIndexOf("/");
    return {
      cleanPath,
      dirPath: lastSlashIdx !== -1 ? cleanPath.substring(0, lastSlashIdx) : "",
      fileName: lastSlashIdx !== -1 ? cleanPath.substring(lastSlashIdx + 1) : cleanPath
    };
  }

  static _namedUploadFile(path, file) {
    const name = path.split("/").pop();
    if (file instanceof File && file.name === name) return file;
    return new File([file], name, { type: file.type || "application/octet-stream" });
  }

  static async reloadStorageDataFromServer() {
    this._forceNetworkRefresh = true;
    try {
      localStorage.removeItem(this.DRIVE_CACHE_KEY);
      localStorage.removeItem(this.SUPABASE_CACHE_KEY);
      this._listingCaches = new WeakMap();

      const drive = this._getStorage();
      if (drive) {
        this._invalidateDriveCache(drive, { clearPersistent: true });
        if (drive.isAvailable()) {
          await this._driveLoadAll(drive);
        }
      }
    } finally {
      this._forceNetworkRefresh = false;
    }
  }

  static _readJsonCache(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  static _writeJsonCache(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("Failed to write storage cache:", err);
    }
  }

  static _loadDriveCacheFromLocalStorage(cache) {
    if (this._forceNetworkRefresh) return false;
    const saved = this._readJsonCache(this.DRIVE_CACHE_KEY);
    if (!saved?.allItemsLoaded || !Array.isArray(saved.pathEntries)) return false;

    cache.pathCache = new Map(saved.pathEntries);
    cache.childrenCache = new Map(
      (saved.childrenEntries || []).map(([path, items]) => [path, items || []])
    );
    cache.folderCache =
      saved.folderCache && typeof saved.folderCache === "object"
        ? { ...saved.folderCache }
        : { "": "root" };
    if (!cache.folderCache[""]) cache.folderCache[""] = "root";
    cache.allItemsLoaded = true;
    cache.allItemsPromise = null;
    return true;
  }

  static _saveDriveCacheToLocalStorage(cache) {
    this._writeJsonCache(this.DRIVE_CACHE_KEY, {
      allItemsLoaded: true,
      savedAt: Date.now(),
      pathEntries: Array.from(cache.pathCache.entries()),
      childrenEntries: Array.from(cache.childrenCache.entries()),
      folderCache: cache.folderCache
    });
  }

  static _getSupabaseListCache() {
    const saved = this._readJsonCache(this.SUPABASE_CACHE_KEY);
    if (!saved || typeof saved.lists !== "object") return { lists: {} };
    return saved;
  }

  static _setSupabaseListCache(cacheObj) {
    this._writeJsonCache(this.SUPABASE_CACHE_KEY, {
      ...cacheObj,
      savedAt: Date.now()
    });
  }

  static async _supabaseListCached(storage, path, options = {}) {
    const cleanPath = this._normalizePath(path);
    const cacheable =
      !this._forceNetworkRefresh &&
      !options.search &&
      !options.name &&
      (options.offset === undefined || options.offset === 0);

    if (cacheable) {
      const bag = this._getSupabaseListCache();
      const hit = bag.lists[cleanPath];
      if (hit && Array.isArray(hit.data)) {
        return { data: hit.data, error: null };
      }
    }

    const { data, error } = await storage.list(cleanPath, options);
    if (!error && cacheable) {
      const bag = this._getSupabaseListCache();
      bag.lists[cleanPath] = { data: data || [], savedAt: Date.now() };
      this._setSupabaseListCache(bag);
    }
    return { data, error };
  }

  static async _supabaseGetByPath(storage, path) {
    const cleanPath = this._normalizePath(path);
    const { dirPath, fileName } = this._parsePath(cleanPath);
    const { data, error } = await storage.list(dirPath, { search: fileName });
    if (error) return { data: null, error };

    const item = (data || []).find(entry => entry.name === fileName);
    if (!item) return { data: null, error: new Error("File not found") };
    return { data: this._supabaseMetadata(item, cleanPath), error: null };
  }

  static _driveCacheFor(storage) {
    let cache = this._driveCaches.get(storage);
    if (!cache) {
      cache = {
        folderCache: { "": "root" },
        pathCache: new Map(),
        childrenCache: new Map(),
        allItemsLoaded: false,
        allItemsPromise: null
      };
      this._driveCaches.set(storage, cache);
    }
    return cache;
  }

  static async _driveList(storage, path, options = {}) {
    if (!storage.isAvailable()) return { data: [], error: null };

    try {
      await this._driveLoadAll(storage);
      const cleanPath = this._normalizePath(path);
      const children = this._driveCacheFor(storage).childrenCache.get(cleanPath) || [];
      const offset = Number(options.offset || 0);
      const limit = Number(options.limit || 0);
      const paged = limit > 0 ? children.slice(offset, offset + limit) : children.slice(offset);
      return { data: paged, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  static async _driveLoadAll(storage) {
    if (!storage.isAvailable()) return { data: [], error: null };
    const cache = this._driveCacheFor(storage);

    if (!cache.allItemsLoaded && this._loadDriveCacheFromLocalStorage(cache)) {
      return {
        data: Array.from(cache.pathCache.entries()).map(([path, item]) => ({ ...item, path })),
        error: null
      };
    }

    if (cache.allItemsLoaded) {
      return {
        data: Array.from(cache.pathCache.entries()).map(([path, item]) => ({ ...item, path })),
        error: null
      };
    }
    if (cache.allItemsPromise) return cache.allItemsPromise;

    cache.allItemsPromise = (async () => {
      try {
        cache.pathCache = new Map();
        cache.childrenCache = new Map();
        cache.childrenCache.set("", []);
        cache.folderCache = { "": "root" };

        await this._scanDriveFolder(storage, cache, "root", "");
        cache.allItemsLoaded = true;
        this._saveDriveCacheToLocalStorage(cache);

        return {
          data: Array.from(cache.pathCache.entries()).map(([path, item]) => ({ ...item, path })),
          error: null
        };
      } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
      } finally {
        cache.allItemsPromise = null;
      }
    })();
    return cache.allItemsPromise;
  }

  static _invalidateDriveCache(storage, { clearPersistent = false } = {}) {
    const cache = this._driveCacheFor(storage);
    cache.allItemsLoaded = false;
    cache.allItemsPromise = null;
    cache.pathCache = new Map();
    cache.childrenCache = new Map();
    cache.folderCache = { "": "root" };
    if (clearPersistent) {
      localStorage.removeItem(this.DRIVE_CACHE_KEY);
    }
  }

  static async _driveGetByPath(storage, path) {
    if (!storage.isAvailable()) return { data: null, error: new Error("Not authenticated") };

    try {
      await this._driveLoadAll(storage);
      const cleanPath = this._normalizePath(path);
      const item = this._driveCacheFor(storage).pathCache.get(cleanPath);
      if (!item) throw new Error("File not found");
      return { data: item, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  static async _scanDriveFolder(storage, cache, folderId, parentPath) {
    const items = [];
    let pageToken = null;
    do {
      const { data: page, error } = await storage.list(folderId, { pageToken });
      if (error) throw error;
      items.push(...(page.files || []));
      pageToken = page.nextPageToken || null;
    } while (pageToken);

    const orderedItems = [...items].sort((a, b) => {
      const aFolder = a.mimeType === "application/vnd.google-apps.folder";
      const bFolder = b.mimeType === "application/vnd.google-apps.folder";
      if (aFolder !== bFolder) return aFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of orderedItems) {
      const path = parentPath ? `${parentPath}/${item.name}` : item.name;
      cache.pathCache.set(path, item);

      const siblings = cache.childrenCache.get(parentPath) || [];
      siblings.push(item);
      cache.childrenCache.set(parentPath, siblings);

      if (item.mimeType === "application/vnd.google-apps.folder") {
        cache.childrenCache.set(path, []);
        cache.folderCache[path] = item.id;
        await this._scanDriveFolder(storage, cache, item.id, path);
      }
    }
  }

  static async _resolveDriveFolderId(storage, pathString) {
    if (!pathString) return "root";
    const cache = this._driveCacheFor(storage);
    if (cache.folderCache[pathString]) return cache.folderCache[pathString];

    const segments = pathString.split("/").filter(Boolean);
    let currentParentId = "root";
    let accumulatedPath = "";

    for (const segment of segments) {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;
      if (cache.folderCache[accumulatedPath]) {
        currentParentId = cache.folderCache[accumulatedPath];
        continue;
      }

      const { data: result, error } = await storage.list(currentParentId, {
        name: segment,
        mimeType: "application/vnd.google-apps.folder"
      });
      if (error) throw error;
      const folder = result.files?.[0];
      if (!folder) return null;
      currentParentId = folder.id;
      cache.folderCache[accumulatedPath] = currentParentId;
    }
    return currentParentId;
  }

  static async _driveUpload(storage, path, file, options = {}, byId = false) {
    try {
      if (byId) {
        const { data: uploaded, error } = await storage.uploadById(path, file);
        if (error) throw error;
        this._invalidateDriveCache(storage, { clearPersistent: true });
        return { data: uploaded, error: null };
      }

      const { dirPath, fileName } = this._parsePath(path);
      const parentId = await this._resolveDriveFolderId(storage, dirPath);
      if (!parentId) throw new Error(`Drive folder not found: ${dirPath}`);
      const { data: searchResult, error } = await storage.list(parentId, { name: fileName });
      if (error) throw error;
      const existing = searchResult.files || [];
      if (existing.length > 0 && options.upsert === false) {
        throw new Error("File already exists and upsert is disabled");
      }
      if (existing.length > 1) throw new Error(`Multiple files match path: ${path}`);

      const result = existing.length === 1
        ? await storage.uploadById(existing[0].id, file)
        : await storage.upload(parentId, file, { name: fileName });
      if (result.error) throw result.error;
      this._invalidateDriveCache(storage, { clearPersistent: true });
      return result;
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  static async _driveRemove(storage, paths) {
    try {
      for (const path of paths) {
        const { dirPath, fileName } = this._parsePath(path);
        const parentId = await this._resolveDriveFolderId(storage, dirPath);
        if (!parentId) continue;
        const { data: searchResult, error } = await storage.list(parentId, { name: fileName });
        if (error) throw error;
        const matches = searchResult.files || [];
        if (matches.length > 1) {
          throw new Error(`Multiple files match path: ${path}; delete by ID instead`);
        }
        if (matches.length === 1) {
          const { error } = await storage.removeById([matches[0].id]);
          if (error) throw error;
        }
      }
      this._invalidateDriveCache(storage, { clearPersistent: true });
      return { data: {}, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  static _listFromStorage(storage, path, options = {}) {
    if (storage instanceof DriveStorageService) return this._driveList(storage, path, options);
    if (storage instanceof SupabaseStorageService) {
      return this._supabaseListCached(storage, path, options);
    }
    return storage.list(path, options);
  }

  static _getByPathFromStorage(storage, path) {
    if (storage instanceof DriveStorageService) return this._driveGetByPath(storage, path);
    if (storage instanceof SupabaseStorageService) return this._supabaseGetByPath(storage, path);
    return storage.getByPath(path);
  }

  static async _getByIdFromStorage(storage, id) {
    if (storage instanceof SupabaseStorageService) return this._supabaseGetByPath(storage, id);
    return storage.getById(id);
  }

  static async _fetchContentFromStorage(storage, params) {
    if (storage instanceof LocalFileService) {
      const { data: files, error } = await storage.list();
      if (error) return { data: null, error };
      const index = this._localFileIndexFor(storage, files);
      const file = index.filesByPath.get(this._normalizePath(params.path || params.id));
      if (!file) return { data: null, error: new Error("Local file not found") };
      return storage.download({ id: file });
    }
    if (storage instanceof SupabaseStorageService) {
      const path = params.id || params.path;
      if (!path) return { data: null, error: new Error("File path required for fetching content") };
      const { data, error } = await storage.download({ id: this._normalizePath(path) });
      return error ? { data: null, error } : { data: new Response(data), error: null };
    }
    if (!(storage instanceof DriveStorageService)) return storage.download(params);
    try {
      let id = params.id;
      if (!id && params.path) {
        const { data, error } = await this._driveGetByPath(storage, params.path);
        if (error) throw error;
        id = data.id;
      }
      if (!id) throw new Error("File ID or path required to fetch content");
      return storage.download({ id });
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  static async _removeFromStorage(storage, paths) {
    if (storage instanceof DriveStorageService) return this._driveRemove(storage, paths);
    if (storage instanceof SupabaseStorageService) {
      return storage.remove(paths.map(path => this._normalizePath(path)));
    }
    return storage.remove(paths);
  }

  static async _uploadToStorage(storage, path, file, options = {}, byId = false) {
    if (storage instanceof DriveStorageService) {
      return this._driveUpload(storage, path, file, options, byId);
    }
    if (storage instanceof SupabaseStorageService) {
      const cleanPath = this._normalizePath(path);
      const uploadOptions = {
        ...options,
        upsert: options.upsert !== undefined ? options.upsert : true,
        contentType: file.type || "application/octet-stream"
      };
      const result = byId
        ? await storage.uploadById(cleanPath, file, uploadOptions)
        : await storage.upload(cleanPath, file, uploadOptions);
      if (result.error) return result;

      return {
        ...result,
        data: {
          ...(result.data || {}),
          id: cleanPath,
          name: cleanPath.split("/").pop(),
          mimeType: file.type || "application/octet-stream",
          size: file.size || 0,
          modifiedTime: new Date().toISOString(),
          webContentLink: null
        }
      };
    }
    return byId
      ? await storage.uploadById(path, file, options)
      : await storage.upload(path, file, options);
  }

  // --- Local folder helpers ---

  static _localFileIndexFor(storage, files) {
    const cached = this._localFileIndexes.get(storage);
    if (cached?.source === files) return cached;

    const index = {
      source: files,
      foldersByParent: new Map(),
      filesByParent: new Map(),
      filesByPath: new Map()
    };

    for (const file of Array.from(files || [])) {
      const filePath = this._localFilePath(file);
      if (!filePath) continue;

      const segments = filePath.split("/");
      segments.pop();
      let parentPath = "";
      for (const folderName of segments) {
        let folders = index.foldersByParent.get(parentPath);
        if (!folders) {
          folders = new Map();
          index.foldersByParent.set(parentPath, folders);
        }
        folders.set(folderName, (folders.get(folderName) || 0) + (file.size || 0));
        parentPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      }

      let filesInFolder = index.filesByParent.get(parentPath);
      if (!filesInFolder) {
        filesInFolder = [];
        index.filesByParent.set(parentPath, filesInFolder);
      }
      filesInFolder.push({ file, path: filePath });
      index.filesByPath.set(filePath, file);
    }

    this._localFileIndexes.set(storage, index);
    return index;
  }

  static _localFilePath(file) {
    const relativePath = file.webkitRelativePath || file.name;
    const segments = relativePath.split("/");
    if (segments.length > 1) segments.shift();
    return segments.join("/");
  }

  static _fromLocalFile(file, path, storage, storageName) {
    let urls = this._localFileUrls.get(storage);
    if (!urls) {
      urls = new Map();
      this._localFileUrls.set(storage, urls);
    }
    let url = urls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      urls.set(file, url);
    }
    const record = this._fromDriveMetadata({
      id: path,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      modifiedTime: new Date(file.lastModified || Date.now()).toISOString(),
      webContentLink: url
    }, path, storage, storageName);
    if (record.isImage()) record._thumbnail = url;
    return record;
  }

  static _releaseLocalFileUrls(storage) {
    this._localFileIndexes.delete(storage);
    const urls = this._localFileUrls.get(storage);
    if (!urls) return;
    for (const url of urls.values()) URL.revokeObjectURL(url);
    this._localFileUrls.delete(storage);
  }

  static _supabaseMetadata(item, path) {
    const isFolder = !item.id;
    return {
      id: path,
      name: item.name,
      mimeType: isFolder
        ? "application/vnd.google-apps.folder"
        : item.metadata?.mimetype || "application/octet-stream",
      size: item.metadata?.size || 0,
      modifiedTime: item.updated_at || item.created_at || new Date().toISOString(),
      webContentLink: null
    };
  }

  static _fromDriveMetadata(file, path, storage = this._activeStorage(), storageName = null) {
    const is_folder = file.mimeType === "application/vnd.google-apps.folder"
      || file.mimeType === "inode/directory";
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
      storageName: this._activeStorageName(storage, storageName)
    });
  }

  // --- CRUD & listing API ---

  static async list(path = "", options = {}) {
    const storage = this._activeStorage();
    const storageName = this._activeStorageName(storage);
    return await this._getAll(path, options, storage, storageName);
  }

  static async getAllFromServices(path = "", options = {}) {
    const services = this._getStorageServices().filter(({ storage }) => storage?.isAvailable());
    for (const { storage } of services) this._listingCaches.set(storage, new Map());
    const results = await Promise.all(services.map(async ({ name, storage }) => {
      const { data, error } = await this._getAll(path, options, storage, name);
      return { data, error, name };
    }));
    const supabaseResult = results.find(result => result.name === "Supabase");

    return {
      data: results.filter(result => result.name !== "Supabase").flatMap(result => result.data),
      comparisonData: supabaseResult?.data || [],
      errors: results.filter(result => result.error).map(result => ({
        service: result.name,
        error: result.error
      }))
    };
  }

  static async _getAll(path = "", options = {}, storage = this._activeStorage(), storageName = null) {
    const resolvedName = this._activeStorageName(storage, storageName);
    let cache = this._listingCaches.get(storage);
    if (!cache) {
      cache = new Map();
      this._listingCaches.set(storage, cache);
    }

    const key = `${this._normalizePath(path)}:${JSON.stringify(options)}`;
    if (cache.has(key)) return cache.get(key);

    const listing = this._getAllUncached(path, options, storage, resolvedName);
    cache.set(key, listing);
    const result = await listing;
    if (result.error) cache.delete(key);
    return result;
  }

  static async _getAllUncached(path, options, storage, storageName) {
    if (storage instanceof LocalFileService) {
      return this._getAllLocalFiles(path, storage, storageName);
    }

    const { data, error } = await this._listFromStorage(storage, path, {
      limit: 500,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
      ...options
    });

    if (error || !data) {
      return { data: [], error };
    }

    const cleanBasePath = path ? path.replace(/^\/+|\/+$/g, "") : "";
    const fileRecords = data.map(file => {
      const filePath = cleanBasePath ? `${cleanBasePath}/${file.name}` : file.name;
      const metadata = storage instanceof SupabaseStorageService
        ? this._supabaseMetadata(file, filePath)
        : file;
      return this._fromDriveMetadata(metadata, filePath, storage, storageName);
    });

    return { data: fileRecords, error: null };
  }

  static async _getAllLocalFiles(path, storage, storageName) {
    const { data: files, error } = await storage.list();
    if (error) return { data: [], error };

    const basePath = this._normalizePath(path);
    const index = this._localFileIndexFor(storage, files);
    const folders = index.foldersByParent.get(basePath) || new Map();
    const filesInFolder = index.filesByParent.get(basePath) || [];
    const folderRecords = Array.from(folders, ([name, size]) => this._fromDriveMetadata({
      id: basePath ? `${basePath}/${name}` : name,
      name,
      mimeType: "application/vnd.google-apps.folder",
      size,
      modifiedTime: new Date().toISOString()
    }, basePath ? `${basePath}/${name}` : name, storage, storageName));
    const fileRecords = filesInFolder.map(({ file, path: filePath }) =>
      this._fromLocalFile(file, filePath, storage, storageName));
    folderRecords.sort((a, b) => a.getName().localeCompare(b.getName()));
    fileRecords.sort((a, b) => a.getName().localeCompare(b.getName()));
    return { data: [...folderRecords, ...fileRecords], error: null };
  }

  static async getByPath(path) {
    const storage = this._activeStorage();
    const { data, error } = await this._getByPathFromStorage(storage, path);
    if (error || !data) return { data: null, error };

    const cleanPath = path.replace(/^\/+|\/+$/g, "");
    return { data: this._fromDriveMetadata(data, cleanPath, storage), error: null };
  }

  static async getById(id) {
    const storage = this._activeStorage();
    const { data, error } = await this._getByIdFromStorage(storage, id);
    if (error || !data) return { data: null, error };

    return { data: this._fromDriveMetadata(data, "", storage), error: null };
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
      uploadFile = new File([encryptedCipher], `${originalName}.enc`, {
        type: "application/octet-stream"
      });
      finalPath = `${path}.enc`;
    }

    return await this._uploadToStorage(this._activeStorage(), finalPath, uploadFile, options);
  }

  static async update(path, file, options = {}) {
    return await this._uploadToStorage(
      this._activeStorage(),
      path,
      this._namedUploadFile(path, file),
      { ...options, upsert: true }
    );
  }

  static async updateById(id, file) {
    return await this._uploadToStorage(this._activeStorage(), id, file, {}, true);
  }

  static async _download(path, downloadName = null) {
    const fileName = downloadName || path.split("/").pop();
    const storage = this._activeStorage();
    const { data } = await this._getByPathFromStorage(storage, path);
    const url = data?.webContentLink;
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async save(newFileBlob) {
    if (!this._full_path && !this._id) {
      throw new Error("Cannot save record without an ID or full_path.");
    }
    const namedFile = FileRecord._namedUploadFile(this._full_path || this._name, newFileBlob);
    const storage = this._storageService || FileRecord._activeStorage();
    const { data, error } = await FileRecord._uploadToStorage(
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
    const storage = this._storageService || FileRecord._activeStorage();
    const path = this._full_path || this._name;

    if (this.isFolderNode()) {
      const { data: items, error } = await FileRecord._getAll(path, {}, storage, this._storageName);
      if (error) throw error;
      if (items?.length) {
        if (!recursive) throw new Error(`Folder "${path}" is not empty. Pass { recursive: true }.`);
        await Promise.all(items.map(item => item.delete({ recursive: true })));
      }
    }

    return await FileRecord._removeFromStorage(storage, [path]);
  }

  async getContent(expiresIn = 60) {
    const storage = this._storageService || FileRecord._activeStorage();
    const { data: rawResponse, error } = await FileRecord._fetchContentFromStorage(storage, {
      id: this.getId(),
      path: this.getFullPath(),
      expiresIn
    });
    if (error) throw error;

    const response = rawResponse instanceof Response ? rawResponse : new Response(rawResponse);
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
      headers: { "Content-Type": blob.type || this._guessMimeType() }
    });
  }

  async _downloadInstance() {
    const url = await this.getUrl();
    const link = document.createElement("a");
    link.href = url;
    link.download = this.getDisplayName();
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  // --- Comparison, backup & sync ---

  static async getCopyComparison(records) {
    if (records.length < 2) return "Only one copy";
    const paths = new Set(records.map(record => record.getFullPath().replace(/^\/+|\/+$/g, "")));
    if (paths.size > 1) return "Different path";
    if (new Set(records.map(record => record.getSize())).size > 1) return "Different size";
    if (!records.every(record => record.isEditable())) return "Synced";

    const contents = await Promise.all(records.map(async record => {
      try {
        const response = await record.getContent();
        return new Uint8Array(await response.arrayBuffer());
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Could not fetch "${record.getFullPath()}" from ${record.getStorageName()}: ${reason}`,
          { cause: error }
        );
      }
    }));
    const first = contents[0];
    const matches = contents.every(content =>
      content.length === first.length && content.every((byte, index) => byte === first[index])
    );
    return matches ? "Synced" : "Different content";
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
      const supabaseService = this._getStorageService("Supabase");
      storage = supabaseService?.storage;
      if (!storage?.isAvailable()) throw new Error("Supabase client not initialized");

      showToast("Collecting all files...", "info");
      const allFiles = await this._listAllFilesRecursive(storage);
      if (allFiles.length === 0) {
        showToast("Bucket is empty – nothing to backup", "warning");
        return { success: false, error: "Bucket is empty" };
      }

      showToast(`Found ${allFiles.length} file(s). Downloading fresh copies...`, "info");
      const zip = new JSZip();
      let processed = 0;

      for (const filePath of allFiles) {
        try {
          const { data: response, error } = await storage.download({ id: filePath });
          if (error) throw error;

          const buffer = await response.arrayBuffer();
          zip.file(filePath, buffer);
        } catch (error) {
          console.warn(`Failed to download ${filePath}:`, error);
          showToast(`Skipped ${filePath}`, "warning");
        }
        processed++;
        if (processed % 5 === 0 || processed === allFiles.length) {
          showToast(`Downloaded ${processed} / ${allFiles.length}`, "info");
        }
      }

      const today = new Date().toISOString().slice(0, 10);
      const filename = `${supabaseService.name}_${today}.zip`;

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
      if (!item.id) {
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
      const supabaseRecord = new this({
        id: existing.id,
        name: existing.name,
        full_path: path,
        size: existing.size,
        mime_type: existing.mimeType,
        storageService: supabase,
        storageName: "Supabase"
      });
      const [driveResponse, supabaseResponse] = await Promise.all([
        driveRecord.getContent(),
        supabaseRecord.getContent()
      ]);
      const [driveContent, supabaseContent] = await Promise.all([
        driveResponse.arrayBuffer(),
        supabaseResponse.arrayBuffer()
      ]);
      const driveBytes = new Uint8Array(driveContent);
      const supabaseBytes = new Uint8Array(supabaseContent);
      const matches = driveBytes.length === supabaseBytes.length
        && driveBytes.every((byte, index) => byte === supabaseBytes[index]);
      return { matches };
    } catch (comparisonError) {
      return { matches: false, comparisonError };
    }
  }

  static async syncFileToSupabase(file, onProgress = () => {}) {
    const driveService = this._getStorageService("Google Drive");
    const supabaseService = this._getStorageService("Supabase");
    if (!driveService?.storage?.isAvailable()
      || !supabaseService?.storage?.isAvailable()) {
      return { status: "unavailable" };
    }
    if (!file || file.isFolderNode() || file.getStorageName() !== "Google Drive") {
      return { status: "invalid-selection" };
    }

    const path = file.getFullPath();
    const drive = driveService.storage;
    const supabase = supabaseService.storage;
    onProgress("Checking Supabase copy", path, 0, 1, "Comparing path and size");
    const { data: existing, error: existingError } = await this._supabaseGetByPath(supabase, path);
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
    if (!driveService?.storage?.isAvailable()
      || !supabaseService?.storage?.isAvailable()) {
      throw new Error("Connect Google Drive and configure Supabase before syncing");
    }

    const drive = driveService.storage;
    const supabase = supabaseService.storage;
    const files = [];
    const emptyFolders = [];
    onProgress("Preparing sync", "Scanning Google Drive...", 0, 0, "In progress");
    const collectDriveFiles = async (path = "") => {
      onProgress("Scanning Google Drive", path || "/", 0, 0, "Building file list");
      const { data, error } = await this._listFromStorage(drive, path, { limit: 1000 });
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
          if (!entry.id) {
            await collectSupabaseFiles(entryPath);
          } else {
            supabaseFiles.set(entryPath, this._supabaseMetadata(entry, entryPath));
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

  // --- UI helpers ---

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
