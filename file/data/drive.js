class StorageServiceInterface {
  constructor() {
    if (new.target === StorageServiceInterface) {
      throw new Error("StorageServiceInterface is an abstract class and cannot be instantiated directly.");
    }
  }

  async list(path, options = {}) {
    throw new Error(`${this.constructor.name} must implement list(path, options)`);
  }

  async fetchContent({ id = null, path = null } = {}) {
    throw new Error(`${this.constructor.name} must implement fetchContent(params)`);
  }

  async getByPath(path) {
    throw new Error(`${this.constructor.name} must implement getByPath(path)`);
  }

  async getById(id) {
    throw new Error(`${this.constructor.name} must implement getById(id)`);
  }

  async upload(path, file, options = {}) {
    throw new Error(`${this.constructor.name} must implement upload(path, file, options)`);
  }

  async uploadById(id, file, options = {}) {
    throw new Error(`${this.constructor.name} must implement uploadById(id, file, options)`);
  }

  async remove(paths) {
    throw new Error(`${this.constructor.name} must implement remove(paths)`);
  }

  async removeById(ids) {
    throw new Error(`${this.constructor.name} must implement removeById(ids)`);
  }
}

class BaseStorageService extends StorageServiceInterface {
  constructor(config = {}) {
    super();
    this.onConnectionChange = config.onConnectionChange || (() => {});
  }

  // =========================================================================
  // SHARED HELPER METHODS FOR CHILD CLASSES
  // =========================================================================

  _normalizePath(path = "") {
    return String(path).replace(/^\/+/, "").replace(/\/+$/, "");
  }

  _parsePath(path = "") {
    const cleanPath = String(path).replace(/^\/+/, "");
    const lastSlashIdx = cleanPath.lastIndexOf("/");
    return {
      cleanPath,
      dirPath: lastSlashIdx !== -1 ? cleanPath.substring(0, lastSlashIdx) : "",
      fileName: lastSlashIdx !== -1 ? cleanPath.substring(lastSlashIdx + 1) : cleanPath
    };
  }

}

class DriveStorageService extends BaseStorageService {
  constructor(config = {}) {
    super(config);

    this.clientId = localStorage.getItem("gdrive_oauth_client_id") || config.gdrive_oauth_client_id;
    this.apiBase = "https://www.googleapis.com/drive/v3/files";
    this.uploadBase = "https://www.googleapis.com/upload/drive/v3/files";

    this._folderCache = { "": "root" };
    this._pathCache = new Map();
    this._childrenCache = new Map();
    this._allItemsLoaded = false;
    this._allItemsPromise = null;
    this.tokenClient = null;
    this._refreshTimer = null;
    this._authRequestMode = null;
    this._silentAuthAttempted = false;

    const savedToken = localStorage.getItem("gdrive_access_token");
    const savedExpiry = Number(localStorage.getItem("gdrive_token_expiry"));

    if (savedToken && savedExpiry && Date.now() < savedExpiry) {
      this.token = savedToken;
      this.tokenExpiry = savedExpiry;
    } else {
      this.token = null;
      this.tokenExpiry = 0;
      localStorage.removeItem("gdrive_access_token");
      localStorage.removeItem("gdrive_token_expiry");
    }

    const init = () => {
      this._initOAuthClient();
      this._bindAuthButton();
      if (this.token) this._scheduleTokenRefresh();
      else this._requestSilentAccessToken();
    };

    init();
    window.addEventListener("load", init);
  }

  // =========================================================================
  // PUBLIC INTERFACE IMPLEMENTATIONS
  // =========================================================================

  async list(path, options = {}) {
    if (!this.token) return { data: [], error: null };

    try {
      await this.loadAll();
      const cleanPath = this._normalizePath(path);
      const children = this._childrenCache.get(cleanPath) || [];
      const offset = Number(options.offset || 0);
      const limit = Number(options.limit || 0);
      const paged = limit > 0 ? children.slice(offset, offset + limit) : children.slice(offset);
      return { data: paged, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async loadAll() {
    if (!this.token) return { data: [], error: null };
    if (this._allItemsLoaded) {
      return {
        data: Array.from(this._pathCache.entries()).map(([path, item]) => ({ ...item, path })),
        error: null
      };
    }
    if (this._allItemsPromise) return this._allItemsPromise;

    this._allItemsPromise = (async () => {
      try {
        this._pathCache = new Map();
        this._childrenCache = new Map();
        this._childrenCache.set("", []);
        this._folderCache = { "": "root" };

        await this._scanFolder("root", "");
        this._allItemsLoaded = true;

        return {
          data: Array.from(this._pathCache.entries()).map(([path, item]) => ({ ...item, path })),
          error: null
        };
      } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
      } finally {
        this._allItemsPromise = null;
      }
    })();
    console.log(this._allItemsPromise);
    return this._allItemsPromise;
  }

  invalidateCache() {
    this._allItemsLoaded = false;
    this._allItemsPromise = null;
    this._pathCache = new Map();
    this._childrenCache = new Map();
  }

  async fetchContent({ id = null, path = null } = {}) {
    try {
      let fileId = id;
      if (!fileId && path) {
        const { data, error } = await this.getByPath(path);
        if (error) throw error;
        fileId = data.id;
      }
      if (!fileId) throw new Error("File ID or path required to fetch content");

      const res = await fetch(`${this.apiBase}/${encodeURIComponent(fileId)}?alt=media`, {
        headers: this._headers()
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Failed to fetch file content: ${res.statusText}`);
      }

      return { data: res, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getByPath(path) {
    if (!this.token) return { data: null, error: new Error("Not authenticated") };

    try {
      await this.loadAll();
      const cleanPath = this._normalizePath(path);
      const item = this._pathCache.get(cleanPath);
      if (!item) throw new Error("File not found");
      return { data: item, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getById(id) {
    if (!this.token) return { data: null, error: new Error("Not authenticated") };

    try {
      const fields = "id, name, mimeType, size, modifiedTime, webContentLink, thumbnailLink";
      const res = await fetch(`${this.apiBase}/${encodeURIComponent(id)}?fields=${fields}`, {
        headers: this._headers()
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to fetch file metadata");

      return { data: await res.json(), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async upload(path, file, options = {}) {
    try {
      const { dirPath, fileName } = this._parsePath(path);
      const parentId = await this._resolveFolderId(dirPath);

      const query = new URLSearchParams({
        q: `'${parentId}' in parents and name = '${fileName}' and trashed = false`,
        fields: "files(id)"
      });
      const searchRes = await fetch(`${this.apiBase}?${query}`, { headers: this._headers() });
      if (!searchRes.ok) throw new Error((await searchRes.json()).error?.message || "Failed to check for existing file");
      const searchJson = await searchRes.json();

      if (searchJson.files?.length > 0 && options.upsert === false) {
        throw new Error("File already exists and upsert is disabled");
      }
      if (searchJson.files?.length > 1) {
        throw new Error(`Multiple files match path: ${path}`);
      }
      if (searchJson.files?.length === 1) {
        const { data, error } = await this.uploadById(searchJson.files[0].id, file);
        if (error) throw error;
        this.invalidateCache();
        return data;
      }

      const metadata = {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        parents: [parentId]
      };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      const fields = "id,name,mimeType,size,modifiedTime,webContentLink";
      const res = await fetch(`${this.uploadBase}?uploadType=multipart&fields=${fields}`, {
        method: "POST",
        headers: this._headers(),
        body: form
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Upload failed");

      const uploaded = await res.json();
      this.invalidateCache();
      return { data: uploaded, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async uploadById(id, file) {
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type || "application/octet-stream"
      };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      const fields = "id,name,mimeType,size,modifiedTime,webContentLink";
      const res = await fetch(`${this.uploadBase}/${encodeURIComponent(id)}?uploadType=multipart&fields=${fields}`, {
        method: "PATCH",
        headers: this._headers(),
        body: form
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Upload failed");

      const uploaded = await res.json();
      this.invalidateCache();
      return { data: uploaded, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async remove(paths) {
    try {
      for (const path of paths) {
        const { dirPath, fileName } = this._parsePath(path);
        const parentId = await this._resolveFolderId(dirPath);

        const params = new URLSearchParams({
          q: `'${parentId}' in parents and name = '${fileName}' and trashed = false`,
          fields: "files(id)"
        });
        const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
        if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to find file to delete");
        const json = await res.json();

        if (json.files?.length > 1) {
          throw new Error(`Multiple files match path: ${path}; delete by ID instead`);
        }
        if (json.files?.length === 1) {
          const { error } = await this.removeById([json.files[0].id]);
          if (error) throw error;
        }
      }
      this.invalidateCache();
      return { data: {}, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async removeById(ids) {
    try {
      for (const id of ids) {
        const res = await fetch(`${this.apiBase}/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: this._headers()
        });
        if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to delete file");
      }
      this.invalidateCache();
      return { data: {}, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // =========================================================================
  // GOOGLE DRIVE SPECIFIC PRIVATE METHODS (OAuth & Folder Hierarchy)
  // =========================================================================

  _initOAuthClient() {
    if (this.tokenClient) return true;
    if (!this.clientId || !window.google?.accounts?.oauth2) return false;

    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: "https://www.googleapis.com/auth/drive",
        callback: async (res) => {
          const requestMode = this._authRequestMode || "interactive";
          this._authRequestMode = null;
          if (res.error) {
            if (requestMode === "silent") return;
            if (typeof showToast === "function") showToast(`Auth error: ${res.error}`, "error");
            return;
          }
          this.token = res.access_token;
          this.tokenExpiry = Date.now() + Number(res.expires_in) * 1000;

          localStorage.setItem("gdrive_access_token", this.token);
          localStorage.setItem("gdrive_token_expiry", this.tokenExpiry);
          this._silentAuthAttempted = false;
          this.invalidateCache();
          this._scheduleTokenRefresh();
          void this.loadAll();

          if (requestMode !== "silent") {
            if (typeof showToast === "function") showToast("Connected to Google Drive successfully", "success");
          }

          this.onConnectionChange();
        }
      });
      return true;
    } catch (err) {
      console.error("Failed to initialize Google OAuth client:", err);
      return false;
    }
  }

  _scheduleTokenRefresh() {
    clearTimeout(this._refreshTimer);
    if (!this.tokenExpiry) return;

    const refreshAt = this.tokenExpiry - 5 * 60 * 1000;
    const delay = Math.max(0, refreshAt - Date.now());
    this._refreshTimer = setTimeout(() => this._requestSilentAccessToken(), delay);
  }

  _requestSilentAccessToken() {
    if (!this.tokenClient || this._silentAuthAttempted) return;
    this._silentAuthAttempted = true;
    this._authRequestMode = "silent";
    try {
      this.tokenClient.requestAccessToken({ prompt: "none" });
    } catch (err) {
      this._authRequestMode = null;
      console.warn("Silent Google Drive token refresh failed:", err);
    }
  }

  _bindAuthButton() {
    const authBtn = document.getElementById("authBtn");
    if (!authBtn || authBtn.dataset.driveBound) return;

    authBtn.dataset.driveBound = "true";
    authBtn.onclick = () => {
      const currentClientId = localStorage.getItem("gdrive_oauth_client_id") || this.clientId;
      if (!currentClientId) {
        if (typeof showToast === "function") {
          showToast("Please configure your Google Client ID in settings first!", "error");
        } else {
          alert("Please configure your Google Client ID in settings first!");
        }
        document.getElementById("configModal")?.classList.remove("hidden");
        return;
      }

      this.clientId = currentClientId;
      if (!this.tokenClient && !this._initOAuthClient()) {
        if (typeof showToast === "function") {
          showToast("Google API is still loading. Please try again in a moment.", "error");
        }
        return;
      }

      this._silentAuthAttempted = false;
      this._authRequestMode = "interactive";
      this.tokenClient.requestAccessToken({ prompt: "" });
    };
  }

  _headers(extra = {}) {
    if (!this.token) throw new Error("Not authenticated. Please click 'Connect Drive'.");
    return { Authorization: `Bearer ${this.token}`, ...extra };
  }

  async _listFolderDirect(folderId) {
    const items = [];
    let pageToken = null;

    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken,files(id, name, mimeType, size, modifiedTime, webContentLink, thumbnailLink)",
        orderBy: "folder,name",
        pageSize: "100"
      });
      if (pageToken) params.set("pageToken", pageToken);

      const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to list Drive items");

      const result = await res.json();
      items.push(...(result.files || []));
      pageToken = result.nextPageToken || null;
    } while (pageToken);

    return items;
  }

  async _scanFolder(folderId, parentPath) {
    const items = await this._listFolderDirect(folderId);
    const orderedItems = [...items].sort((a, b) => {
      const aFolder = a.mimeType === "application/vnd.google-apps.folder";
      const bFolder = b.mimeType === "application/vnd.google-apps.folder";
      if (aFolder !== bFolder) return aFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of orderedItems) {
      const path = parentPath ? `${parentPath}/${item.name}` : item.name;
      this._pathCache.set(path, item);

      const siblings = this._childrenCache.get(parentPath) || [];
      siblings.push(item);
      this._childrenCache.set(parentPath, siblings);

      if (item.mimeType === "application/vnd.google-apps.folder") {
        this._childrenCache.set(path, []);
        this._folderCache[path] = item.id;
        await this._scanFolder(item.id, path);
      }
    }
  }

  async _resolveFolderId(pathString) {
    if (!pathString || pathString === "") return "root";
    if (this._folderCache[pathString]) return this._folderCache[pathString];

    const segments = pathString.split("/").filter(Boolean);
    let currentParentId = "root";
    let accumulatedPath = "";

    for (const segment of segments) {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;
      if (this._folderCache[accumulatedPath]) {
        currentParentId = this._folderCache[accumulatedPath];
        continue;
      }

      const query = new URLSearchParams({
        q: `'${currentParentId}' in parents and name = '${segment}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id, name)"
      });
      const res = await fetch(`${this.apiBase}?${query}`, { headers: this._headers() });
      if (!res.ok) throw new Error("Failed to resolve folder hierarchy");
      const data = await res.json();

      if (data.files && data.files.length > 0) {
        currentParentId = data.files[0].id;
        this._folderCache[accumulatedPath] = currentParentId;
      } else {
        const metadata = {
          name: segment,
          mimeType: "application/vnd.google-apps.folder",
          parents: [currentParentId]
        };
        const createRes = await fetch(this.apiBase, {
          method: "POST",
          headers: this._headers({ "Content-Type": "application/json" }),
          body: JSON.stringify(metadata)
        });
        if (!createRes.ok) throw new Error(`Failed to create folder: ${segment}`);
        const folder = await createRes.json();
        currentParentId = folder.id;
        this._folderCache[accumulatedPath] = currentParentId;
      }
    }
    return currentParentId;
  }
}
