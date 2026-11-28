class DriveStorageService {
  constructor(config = {}) {
    this.onConnectionChange = config.onConnectionChange || (() => {});
    this.clientId = localStorage.getItem("gdrive_oauth_client_id") || config.gdrive_oauth_client_id;
    this.apiBase = "https://www.googleapis.com/drive/v3/files";
    this.uploadBase = "https://www.googleapis.com/upload/drive/v3/files";
    this.scope = config.scope || "https://www.googleapis.com/auth/drive";
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

  isAvailable() {
    return Boolean(this.token);
  }

  async list(folderId, options = {}) {
    try {
      const targetFolder = folderId || "root";
      const nameFilter = options.name
        ? ` and name = '${String(options.name).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
        : "";
      const mimeTypeFilter = options.mimeType ? ` and mimeType = '${options.mimeType}'` : "";
      const params = new URLSearchParams({
        q: `'${targetFolder}' in parents and trashed = false${nameFilter}${mimeTypeFilter}`,
        fields: "nextPageToken,files(id, name, mimeType, size, modifiedTime, webContentLink, thumbnailLink)",
        orderBy: "name",
        pageSize: "100"
      });
      if (options.pageToken) params.set("pageToken", options.pageToken);

      const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to list Drive items");
      const data = await res.json();
      return { data: data.files || [], error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async download({ id } = {}) {
    try {
      if (!id) throw new Error("File ID required to fetch content");
      const res = await fetch(`${this.apiBase}/${encodeURIComponent(id)}?alt=media`, {
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

  async upload(folderId = "root", file, options = {}) {
    try {
      if (!file) throw new Error("File is required to upload");

      const fileName = options.name || file.name || "untitled";
      const mimeType = options.mimeType || file.type || "application/octet-stream";

      const metadata = {
        name: fileName,
        mimeType,
        ...(options.fileId ? {} : { parents: folderId ? [folderId] : ["root"] })
      };

      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      formData.append("file", file, fileName);

      const url = options.fileId
        ? `${this.uploadBase}/${encodeURIComponent(options.fileId)}?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webContentLink,thumbnailLink`
        : `${this.uploadBase}?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webContentLink,thumbnailLink`;

      const res = await fetch(url, {
        method: options.fileId ? "PATCH" : "POST",
        headers: this._headers(),
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Failed to upload file: ${res.statusText}`);
      }

      const uploadedFile = await res.json();
      return { data: uploadedFile, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async remove(fileIds, options = {}) {
    try {
      const ids = (Array.isArray(fileIds) ? fileIds : [fileIds]).filter(Boolean);
      if (!ids.length) throw new Error("File ID(s) required to remove");

      const permanent = Boolean(options.permanent);
      const results = await Promise.all(
        ids.map(async (id) => {
          const url = `${this.apiBase}/${encodeURIComponent(id)}`;
          const res = await fetch(url, {
            method: permanent ? "DELETE" : "PATCH",
            headers: this._headers({ "Content-Type": "application/json" }),
            ...(permanent ? {} : { body: JSON.stringify({ trashed: true }) })
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `Failed to remove ${id}: ${res.statusText}`);
          }
          return { id, removed: true, permanent };
        })
      );

      return { data: results, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
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

      try {
        this.clientId = currentClientId;
        if (!this.tokenClient && !this._initOAuthClient()) {
          throw new Error("Google API is still loading. Please try again in a moment.");
        }

        this._silentAuthAttempted = false;
        this._authRequestMode = "interactive";
        this.tokenClient.requestAccessToken({ prompt: "" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (typeof showToast === "function") showToast(message, "error");
        else alert(message);
      }
    };
  }

  _initOAuthClient() {
    if (this.tokenClient) return true;
    this.clientId = localStorage.getItem("gdrive_oauth_client_id") || this.clientId;
    if (!this.clientId || !window.google?.accounts?.oauth2) return false;

    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scope,
        callback: (res) => {
          const requestMode = this._authRequestMode || "interactive";
          this._authRequestMode = null;
          if (res.error) {
            if (requestMode !== "silent") {
              this.onConnectionChange({ error: res.error, requestMode });
            }
            return;
          }
          this.token = res.access_token;
          this.tokenExpiry = Date.now() + Number(res.expires_in) * 1000;

          localStorage.setItem("gdrive_access_token", this.token);
          localStorage.setItem("gdrive_token_expiry", this.tokenExpiry);
          this._silentAuthAttempted = false;
          this._scheduleTokenRefresh();

          this.onConnectionChange({ requestMode });
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

  _headers(extra = {}) {
    if (!this.token) throw new Error("Not authenticated. Please click 'Connect Drive'.");
    return { Authorization: `Bearer ${this.token}`, ...extra };
  }
}

class LocalFileService {
  constructor(config = {}) {
    this.onConnectionChange = config.onConnectionChange || (() => {});
    this.files = [];
    this._byPath = new Map();
    const button = document.getElementById(config.folderButtonId);
    if (!button || button.dataset.localDriveBound) return;

    button.dataset.localDriveBound = "true";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.webkitdirectory = true;
    fileInput.multiple = true;
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.onchange = event => {
      this.files = Array.from(event.target.files || []);
      this._byPath.clear();
      for (const file of this.files) {
        const rel = file.webkitRelativePath || file.name;
        const cleanPath = rel.split("/").slice(rel.includes("/") ? 1 : 0).join("/");
        if (cleanPath) this._byPath.set(cleanPath, file);
      }
      this.onConnectionChange(this.files);
    };

    button.onclick = () => fileInput.click();
  }

  isAvailable() {
    return Boolean(this.files?.length);
  }

  async list(path = "") {
    const base = String(path || "").replace(/^\/+|\/+$/g, "");
    const folders = new Map();
    const items = [];

    for (const [fullPath, file] of this._byPath.entries()) {
      if (base && !fullPath.startsWith(`${base}/`)) continue;
      const rest = base ? fullPath.slice(base.length + 1) : fullPath;
      if (!rest) continue;

      const slashIndex = rest.indexOf("/");
      if (slashIndex === -1) {
        items.push({
          id: fullPath,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          modifiedTime: file.lastModified
        });
      } else {
        const folderName = rest.slice(0, slashIndex);
        folders.set(folderName, (folders.get(folderName) || 0) + (file.size || 0));
      }
    }

    for (const [name, size] of folders.entries()) {
      items.unshift({
        id: base ? `${base}/${name}` : name,
        name,
        size,
        mimeType: "application/vnd.google-apps.folder"
      });
    }

    return { data: items, error: null };
  }

  async download({ id, path } = {}) {
    const key = String(path || id || "").replace(/^\/+|\/+$/g, "");
    const file = this._byPath.get(key);
    if (!file) {
      return { data: null, error: new Error(`Local file not found: ${key}`) };
    }
    return { data: file, error: null };
  }
}

class SupabaseStorageService {
  constructor(config = {}) {
    this.onConnectionChange = config.onConnectionChange || (() => {});
    this._bucket = localStorage.getItem("sb_bucket") || config.bucket || "files";
    const savedUrl = localStorage.getItem("sb_url") || config.url;
    const savedKey = localStorage.getItem("sb_key") || config.key;

    this.client = savedUrl && savedKey && window.supabase
      ? window.supabase.createClient(savedUrl, savedKey)
      : null;
  }

  isAvailable() {
    return Boolean(this.client);
  }

  async list(path = "", options = {}) {
    if (!this.client) return { data: null, error: new Error("Supabase is not configured.") };
    const cleanPath = String(path || "").replace(/^\/+|\/+$/g, "");
    const { data, error } = await this.client.storage.from(this._bucket).list(cleanPath, options);
    return { data, error };
  }

  async download({ id, path } = {}) {
    if (!this.client) return { data: null, error: new Error("Supabase is not configured.") };
    const target = String(path || id || "").replace(/^\/+|\/+$/g, "");
    if (!target) return { data: null, error: new Error("File path required.") };
    const { data, error } = await this.client.storage.from(this._bucket).download(target);
    return { data, error };
  }

  async upload(path, file, options = {}) {
    if (!this.client) return { data: null, error: new Error("Supabase is not configured.") };
    const cleanPath = String(path || "").replace(/^\/+|\/+$/g, "");
    const { data, error } = await this.client.storage.from(this._bucket).upload(cleanPath, file, options);
    return { data, error };
  }

  async remove(paths) {
    if (!this.client) return { data: null, error: new Error("Supabase is not configured.") };
    const cleanPaths = (Array.isArray(paths) ? paths : [paths])
      .map(p => String(p || "").replace(/^\/+|\/+$/g, ""))
      .filter(Boolean);
    const { data, error } = await this.client.storage.from(this._bucket).remove(cleanPaths);
    return { data, error };
  }
}

class Crypto {
  static PBKDF2_ITERATIONS = 1e5;

  static async _deriveKey(e, t) {
    if (!e) throw new Error("Encryption passphrase is required.");
    if (!t) throw new Error("Salt is required for key derivation.");
    const r = new TextEncoder();
    const n = await window.crypto.subtle.importKey(
      "raw",
      r.encode(e),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: typeof t === "string" ? r.encode(t) : t,
        iterations: this.PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      n,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(e, t, r) {
    const n = await this._deriveKey(t, r);
    const a = window.crypto.getRandomValues(new Uint8Array(12));
    const i = e instanceof ArrayBuffer ? e : new TextEncoder().encode(e);
    const o = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: a }, n, i);
    const s = new Uint8Array(a.byteLength + o.byteLength);
    s.set(a, 0);
    s.set(new Uint8Array(o), a.byteLength);
    let c = "";
    for (let idx = 0; idx < s.byteLength; idx++) c += String.fromCharCode(s[idx]);
    return btoa(c);
  }

  static async decrypt(e, t, r) {
    const n = await this._deriveKey(t, r);
    const a = atob(e);
    const i = new Uint8Array(a.length);
    for (let idx = 0; idx < a.length; idx++) i[idx] = a.charCodeAt(idx);
    const o = i.slice(0, 12);
    const s = i.slice(12);
    return await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: o }, n, s);
  }
}

class FileRecord {
  static services = {};
  static current = null;

  constructor({
    id = null,
    name = "",
    full_path = "",
    size = 0,
    mime_type = null,
    url = null,
    thumbnail = null,
    is_folder = false,
    created_at = null,
    updated_at = null,
    storage = null
  } = {}) {
    this._id = id;
    this._name = name;
    this._full_path = full_path;
    this._is_folder = is_folder;
    this._size = size;
    this._mime_type = this._is_folder
      ? "inode/directory"
      : (mime_type || this._guessMimeType());
    this._url = url;
    this._thumbnail = thumbnail;
    this._created_at = created_at;
    this._updated_at = updated_at;
    this._storage = storage;
  }

  getId() { return this._id; }
  getName() { return this._name; }
  getFullPath() { return this._full_path; }
  getSize() { return this._size; }
  getMimeType() { return this._mime_type; }
  getUrl() { return this._url; }
  getThumbnail() {
    if (!this._thumbnail && this.isImage()) return this._url;
    return this._thumbnail;
  }
  getCreatedAt() { return this._created_at; }
  getUpdatedAt() { return this._updated_at; }

  _resolveStorage() {
    const storage = this._storage || FileRecord.current;
    if (!storage) throw new Error("No storage service selected.");
    return storage;
  }

  getNavigationTarget() {
    const storage = this._storage || FileRecord.current;
    return storage instanceof DriveStorageService ? this._id : this._full_path;
  }

  async getContent(params = {}) {
    const storage = this._resolveStorage();
    const target = storage instanceof SupabaseStorageService
      ? (this._full_path || this._id)
      : (this._id || this._full_path);

    const { data, error } = await storage.download({
      id: target,
      path: this._full_path,
      ...params
    });
    if (error) throw error;
    return data;
  }

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

  _checkMineType(exts, prefix) {
    return exts.includes(this.getExtension()) || this.getMimeType().startsWith(prefix);
  }

  isImage() { return this._checkMineType(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"], "image/"); }
  isVideo() { return this._checkMineType(["mp4", "webm", "mov", "avi", "mkv"], "video/"); }
  isAudio() { return this._checkMineType(["mp3", "wav", "ogg"], "audio/"); }
  isHtml() { return this._checkMineType(["html", "htm"], "html/"); }
  isEditable() {
    return !this.isImage() && !this.isVideo() && !this.isAudio()
      && this._checkMineType(
        ["txt", "md", "log", "html", "htm", "css", "js", "ts", "json", "py", "java", "sql", "yml", "yaml"],
        "text/"
      );
  }

  _guessMimeType() {
    const ext = this.getExtension();
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

  static use(nameOrService, options = {}) {
    if (typeof nameOrService !== "string") {
      this.current = nameOrService;
      return this;
    }

    if (!this.services[nameOrService]) {
      const factories = {
        drive: () => new DriveStorageService(options),
        supabase: () => new SupabaseStorageService(options),
        local: () => new LocalFileService(options)
      };
      if (!factories[nameOrService]) throw new Error(`Unknown service: ${nameOrService}`);
      this.services[nameOrService] = factories[nameOrService]();
    }

    this.current = this.services[nameOrService];
    return this;
  }

  static ensureService() {
    if (!this.current) {
      this.use(localStorage.getItem("sb_url") && localStorage.getItem("sb_key") ? "supabase" : "drive");
    }
    return this.current;
  }

  static isAvailable() {
    const storage = this.ensureService();
    return typeof storage.isAvailable === "function" ? storage.isAvailable() : true;
  }

  static async list(path = "", options = {}) {
    const storage = this.ensureService();
    const queryPath = storage instanceof DriveStorageService ? (path || "root") : path;

    const { data, error } = await storage.list(queryPath, options);
    if (error || !data) return { data: [], error };

    const cleanBase = storage instanceof DriveStorageService
      ? ""
      : String(path || "").replace(/^\/+|\/+$/g, "");

    const records = data.map(item => {
      const fullPath = cleanBase ? `${cleanBase}/${item.name}` : item.name;
      const isFolder = item.mimeType === "application/vnd.google-apps.folder"
        || (storage instanceof SupabaseStorageService && !item.id);
      return new this({
        id: item.id || fullPath,
        name: item.name,
        full_path: fullPath,
        size: Number(item.size ?? item.metadata?.size ?? 0),
        mime_type: isFolder
          ? "inode/directory"
          : (item.mimeType || item.metadata?.mimetype || null),
        url: item.webContentLink || null,
        thumbnail: item.thumbnailLink || null,
        updated_at: item.modifiedTime || item.updated_at || null,
        is_folder: isFolder,
        storage
      });
    });

    return { data: records, error: null };
  }

  static async upload(path, file, options = {}) {
    const storage = this.ensureService();

    const name = path.split("/").pop();
    const namedFile = file instanceof File && file.name === name
      ? file
      : new File([file], name, { type: file.type || "application/octet-stream" });

    return await storage.upload(path, namedFile, options);
  }

  async remove() {
    const storage = this._resolveStorage();
    const target = storage instanceof SupabaseStorageService
      ? (this._full_path || this._id)
      : (this._id || this._full_path);

    return await storage.remove([target]);
  }
}
