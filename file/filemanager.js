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
    updated_at = null
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
    this._storage = null;
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

  async getContent(params = {}) {
    const storage = this._storage || FileRecord.current;
    if (!storage) throw new Error("No storage service selected.");
  
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

  static async list(path = "", options = {}) {
    const storage = this.current;
    if (!storage) throw new Error("No storage service selected.");

    const { data, error } = await storage.list(path, options);
    if (error || !data) return { data: [], error };

    const cleanBase = String(path || "").replace(/^\/+|\/+$/g, "");
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
    const storage = this.current;
    if (!storage) throw new Error("No storage service selected.");

    const name = path.split("/").pop();
    const namedFile = file instanceof File && file.name === name
      ? file
      : new File([file], name, { type: file.type || "application/octet-stream" });

    return await storage.upload(path, namedFile, options);
  }

  async remove() {
    const storage = this._storage || FileRecord.current;
    if (!storage) throw new Error("No storage service selected.");

    const target = storage instanceof SupabaseStorageService
      ? (this._full_path || this._id)
      : (this._id || this._full_path);

    return await storage.remove([target]);
  }
}

class FileManager {
  static _TEMPLATES = {
    grid: {
      containerClass: "grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4",
      cardClass: "group relative bg-transparent border border-white/20 hover:border-indigo-400 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden",
      emptyState: `<div class="col-span-full py-16 text-center text-slate-400 text-sm"><i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-90 hover:opacity-100"></i>No items found</div>`,
      folderIcon: `<div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><i class="fa-solid fa-folder text-5xl"></i></div>`,
      fileMedia: (file) => {
        const mediaClass = "widget-preview-area flex-1 w-full h-full object-cover overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors";
        if (file.isVideo()) {
          return `<video class="${mediaClass}" muted preload="metadata" aria-label="${escapeHtml(file.getDisplayName())}"></video>`;
        }
        if (file.getThumbnail() || file.isImage()) {
          return `<img class="${mediaClass}">`;
        }
        return `<div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors"><i class="fa-solid fa-file text-3xl"></i></div>`;
      },
      menuTrigger: (record, index) => `
        <button type="button" data-item-menu-btn="${index}" aria-label="Actions for ${escapeHtml(record.getDisplayName())}"
                class="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
          <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
        </button>`,
      card: (record, mediaHTML, menuHTML = "") =>
        `${menuHTML}${mediaHTML}<div class="w-full pt-2 border-t border-white/20 flex flex-col"><span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(record.getDisplayName())}">${escapeHtml(record.getDisplayName())}</span><span class="text-[9px] text-slate-300 font-mono mt-0.5">${record.isFolderNode() ? "Folder" : `${record.getSize()} B`}</span></div>`
    },
    breadcrumb: {
      crumb: (name, isRoot) => isRoot
        ? `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(name)}</span>`
        : `<span>${escapeHtml(name)}</span>`,
      separatorClass: "opacity-50 mx-1",
      crumbClass: (isLast) => (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center"
    }
  };

  constructor(gridId = "itemsGrid", breadcrumbId = "breadcrumbNav") {
    this.items = [];
    this.listRequestId = 0;

    this.gridContainer = document.getElementById(gridId);
    this.contextRecord = null;
    this.itemMenu = null;

    this.breadcrumbContainer = document.getElementById(breadcrumbId);
    this.path = "";
    this.history = [{ path: "", name: "root" }];

    this._initItemMenu();
    this._bindEvents();
    this._renderBreadcrumb();
    this._renderGrid([]);

    const storage = this._ensureStorage();
    if (typeof storage.isAvailable !== "function" || storage.isAvailable()) {
      this.action("listFiles");
    }
  }

  _initItemMenu() {
    document.getElementById("itemContextMenu")?.remove();
    const menu = document.createElement("div");
    menu.id = "itemContextMenu";
    menu.className = "hidden fixed z-[110] w-44 rounded-lg border border-white/20 bg-zinc-900 py-1 text-xs text-slate-200 shadow-xl";
    menu.setAttribute("role", "menu");
    menu.innerHTML = `
      <button type="button" data-item-action="open" role="menuitem" class="w-full text-left flex items-center px-3 py-2 hover:bg-white/10 hover:text-white transition">
        <i class="fa-solid fa-arrow-up-right-from-square mr-2.5 text-indigo-400 w-4"></i>
        <span data-open-label>Open</span>
      </button>
      <button type="button" data-item-action="download" role="menuitem" class="w-full text-left flex items-center px-3 py-2 hover:bg-white/10 hover:text-white transition">
        <i class="fa-solid fa-download mr-2.5 text-emerald-400 w-4"></i>
        <span>Download</span>
      </button>
      <div class="border-t border-white/10 my-1"></div>
      <button type="button" data-item-action="delete" role="menuitem" class="w-full text-left flex items-center px-3 py-2 text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition">
        <i class="fa-solid fa-trash mr-2.5 text-rose-400 w-4"></i>
        <span>Delete</span>
      </button>
    `;
    document.body.appendChild(menu);
    this.itemMenu = menu;

    menu.addEventListener("click", async (event) => {
      event.stopPropagation();
      const btn = event.target instanceof Element ? event.target.closest("[data-item-action]") : null;
      const record = this.contextRecord;
      this.closeItemMenu();
      if (!btn || !record) return;

      const actionType = btn.dataset.itemAction;
      if (actionType === "open") {
        this.action(record.isFolderNode() ? "navigate" : "openFilePreview", record);
      } else if (actionType === "download") {
        await this.action("downloadRecord", record);
      } else if (actionType === "delete") {
        await this.action("removeRecord", record);
      }
    });
  }

  openItemMenu(record, anchorEl) {
    if (!this.itemMenu || !record || !anchorEl) return;
    this.contextRecord = record;

    const openLabel = this.itemMenu.querySelector("[data-open-label]");
    if (openLabel) openLabel.textContent = record.isFolderNode() ? "Open folder" : "Preview";

    const downloadBtn = this.itemMenu.querySelector('[data-item-action="download"]');
    if (downloadBtn) downloadBtn.classList.toggle("hidden", record.isFolderNode());

    this.itemMenu.classList.remove("hidden");

    const rect = anchorEl.getBoundingClientRect();
    const menuRect = this.itemMenu.getBoundingClientRect();
    const pad = 8;
    let left = rect.right - menuRect.width;
    let top = rect.bottom + 4;

    if (left < pad) left = pad;
    if (left + menuRect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - menuRect.width - pad);
    }
    if (top + menuRect.height > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - menuRect.height - 4);
    }

    this.itemMenu.style.left = `${left}px`;
    this.itemMenu.style.top = `${top}px`;
  }

  closeItemMenu() {
    this.itemMenu?.classList.add("hidden");
    this.contextRecord = null;
  }

  _bindEvents() {
    document.getElementById("openLocalFolderBtn")?.addEventListener("click", () => {
      const local = FileRecord.use("local", {
        folderButtonId: "openLocalFolderBtn",
        onConnectionChange: () => {
          if (FileRecord.current === local) {
            this.resetBreadcrumb();
            this.listFiles();
          }
        }
      }).current;
    
      FileRecord.current = local;
    });
    document.getElementById("authBtn")?.addEventListener("click", () => {
      const hasSupabase = Boolean(localStorage.getItem("sb_url") && localStorage.getItem("sb_key"));
      const drive = FileRecord.use("drive", {
        onConnectionChange: ({ error }) => {
          if (error) {
            showToast(error, "error");
            return;
          }
          if (FileRecord.current === drive && drive.isAvailable()) {
            this.listFiles();
          }
        }
      }).current;

      if (!hasSupabase || FileRecord.current === drive) {
        FileRecord.current = drive;
      }

      if (drive.isAvailable()) {
        this.listFiles();
      }
    });

    const actionsMenu = document.getElementById("actionsMenu");
    const actionsDropdown = document.getElementById("actionsMenuToggleBtn");
    actionsMenu?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.closeItemMenu();
      actionsDropdown?.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
      if (!actionsMenu?.contains(event.target) && !actionsDropdown?.contains(event.target)) {
        actionsDropdown?.classList.add("hidden");
      }
      if (!this.itemMenu?.contains(event.target) && !(event.target instanceof Element && event.target.closest("[data-item-menu-btn]"))) {
        this.closeItemMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.closeItemMenu();
    });

    this.gridContainer?.addEventListener("scroll", () => this.closeItemMenu());

    this.gridContainer?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const menuBtn = event.target.closest("[data-item-menu-btn]");
      if (menuBtn) {
        event.stopPropagation();
        const record = this.items[Number(menuBtn.dataset.itemMenuBtn)];
        if (record) this.openItemMenu(record, menuBtn);
        return;
      }
      this.closeItemMenu();
      const card = event.target.closest("[data-item-index]");
      if (!card) return;
      const record = this.items[Number(card.dataset.itemIndex)];
      if (!record) return;
      this.action(record.isFolderNode() ? "navigate" : "openFilePreview", record);
    });


    this.breadcrumbContainer?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const crumb = event.target.closest("[data-breadcrumb-index]");
      if (crumb) this.jumpToBreadcrumb(Number(crumb.dataset.breadcrumbIndex));
    });
  }

  _ensureStorage() {
    if (!FileRecord.current) {
      FileRecord.use(localStorage.getItem("sb_url") && localStorage.getItem("sb_key") ? "supabase" : "drive");
    }
    return FileRecord.current;
  }

  _renderBreadcrumb() {
    if (!this.breadcrumbContainer) return;
    const tpl = FileManager._TEMPLATES.breadcrumb;
    this.breadcrumbContainer.innerHTML = "";

    this.history.forEach((crumb, idx) => {
      const isLast = idx === this.history.length - 1;
      const btn = document.createElement("button");
      btn.className = tpl.crumbClass(isLast);
      btn.dataset.breadcrumbIndex = String(idx);
      btn.innerHTML = tpl.crumb(crumb.name, crumb.name.toLowerCase() === "root");
      this.breadcrumbContainer.appendChild(btn);

      if (!isLast) {
        const sep = document.createElement("span");
        sep.className = tpl.separatorClass;
        sep.textContent = "/";
        this.breadcrumbContainer.appendChild(sep);
      }
    });
  }

  _renderGrid(items = []) {
    if (!this.gridContainer) return [];

    this.closeItemMenu();
    const tpl = FileManager._TEMPLATES.grid;
    const previewMedia = [];

    this.gridContainer.className = tpl.containerClass;
    this.gridContainer.innerHTML = "";

    if (!items.length) {
      this.gridContainer.innerHTML = tpl.emptyState;
      return previewMedia;
    }

    items.forEach((record, index) => {
      const card = document.createElement("div");
      card.className = tpl.cardClass;
      card.dataset.itemIndex = String(index);

      const mediaHTML = record.isFolderNode() ? tpl.folderIcon : tpl.fileMedia(record);
      const menuHTML = tpl.menuTrigger(record, index);
      card.innerHTML = tpl.card(record, mediaHTML, menuHTML);
      this.gridContainer.appendChild(card);

      const previewEl = card.querySelector(".widget-preview-area");
      if (
        ((record.getThumbnail() || record.isImage()) && previewEl instanceof HTMLImageElement) ||
        (record.isVideo() && previewEl instanceof HTMLVideoElement)
      ) {
        previewMedia.push({ file: record, element: previewEl });
      }
    });

    return previewMedia;
  }

  navigateToFolder(path, name, breadcrumbIndex = null) {
    if (breadcrumbIndex === null && this.path === path) return;
    if (breadcrumbIndex === null) {
      this.history.push({ path, name });
    } else {
      this.history = this.history.slice(0, breadcrumbIndex + 1);
    }
    this.path = path;
    this._renderBreadcrumb();
    this.action("listFiles");
  }

  jumpToBreadcrumb(index) {
    this.navigateToFolder(this.history[index].path, null, index);
  }

  resetBreadcrumb() {
    this.path = "";
    this.history = [{ path: "", name: "root" }];
    this._renderBreadcrumb();
  }

  action(actionName, ...args) {
    switch (actionName) {
      case "refresh":
      case "listFiles": return this.listFiles();
      case "navigate": return this.navigate(args[0]);
      case "openFilePreview": return this.openFilePreview(args[0]);
      case "upload": return this.handleFileUpload(args[0], args[1], args[2]);
      case "downloadRecord": return this.downloadRecord(args[0]);
      case "removeRecord": return this.removeRecord(args[0]);
      default: throw new Error(`Unknown file-manager action: ${actionName}`);
    }
  }

  async listFiles() {
    const requestId = ++this.listRequestId;
    try {
      const storage = this._ensureStorage();
      if (typeof storage.isAvailable === "function" && !storage.isAvailable()) return;

      const queryPath = storage instanceof DriveStorageService ? (this.path || "root") : this.path;
      const { data, error } = await FileRecord.list(queryPath);
      if (requestId !== this.listRequestId) return;
      if (error) throw error;

      this.items = [...(data || [])].sort((a, b) => {
        if (a.isFolderNode() !== b.isFolderNode()) return a.isFolderNode() ? -1 : 1;
        return a.getDisplayName().localeCompare(b.getDisplayName());
      });

      const label = document.getElementById("itemCountLabel");
      if (label) label.textContent = `${this.items.length} item${this.items.length !== 1 ? "s" : ""}`;

      const previewMedia = this._renderGrid(this.items);
      previewMedia.forEach(({ file, element }) => this.loadPreviewMedia(file, element));
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to list files", "error");
    }
  }

  async handleFileUpload(event, isFolderUpload = false, options = {}) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    this._ensureStorage();
    showToast(`Uploading ${files.length} item(s)...`, "info", 2500);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const rel = isFolderUpload && file.webkitRelativePath ? file.webkitRelativePath : file.name;
        const targetPath = this.path ? `${this.path}/${rel}` : rel;
        const { error } = await FileRecord.upload(targetPath, file, options);
        if (error) throw error;
        success++;
      } catch (err) {
        console.error(err);
        failed++;
        showToast(`Failed: ${file.name}`, "error", 2500);
      }
    }

    await this.listFiles();
    if (failed === 0) {
      showToast(`Uploaded ${success} item(s)`, "success");
    } else {
      showToast(`Uploaded ${success}, failed ${failed}`, "warning");
    }
    event.target.value = "";
  }

  navigate(file) {
    const isDrive = (file._storage || FileRecord.current) instanceof DriveStorageService;
    const nextPath = isDrive ? file.getId() : file.getFullPath();
    this.navigateToFolder(nextPath, file.getDisplayName());
  }

  async openFilePreview(file) {
    this._ensureStorage();
    this.activeFilePreview?.close();

    const panel = document.createElement("div");
    panel.className = "fixed inset-0 z-[120] flex items-center justify-center bg-black/60";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", `Preview: ${file.getDisplayName()}`);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className =
      "absolute right-4 top-4 z-[1] rounded-full border border-white/20 bg-zinc-900/80 px-3 py-2 text-sm text-white shadow-lg backdrop-blur";
    closeButton.setAttribute("aria-label", "Close preview");
    closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';

    let objectUrl;
    const close = () => {
      if (!panel.isConnected) return;
      document.removeEventListener("keydown", handleKeydown);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      panel.remove();
      if (this.activeFilePreview?.panel === panel) this.activeFilePreview = null;
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") close();
    };

    closeButton.addEventListener("click", close);
    document.addEventListener("keydown", handleKeydown);
    panel.appendChild(closeButton);
    document.body.appendChild(panel);
    this.activeFilePreview = { panel, close };

    try {
      const raw = await file.getContent();
      const blob = file.isEncryptedFile()
        ? await EncryptionMiddleware.decrypt(raw, file.getMimeType())
        : (raw instanceof Blob ? raw : (raw instanceof Response ? await raw.blob() : new Blob([raw])));
      if (!panel.isConnected) return;

      if (file.isHtml()) {
        const frame = document.createElement("iframe");
        frame.title = file.getDisplayName();
        frame.setAttribute("sandbox", "allow-scripts");
        frame.setAttribute("allowtransparency", "true");
        frame.className = "absolute inset-0 w-full h-full border-0 bg-transparent";
        frame.srcdoc = await blob.text();
        panel.appendChild(frame);
        return;
      }

      objectUrl = URL.createObjectURL(blob);

      if (file.isImage()) {
        const img = document.createElement("img");
        img.src = objectUrl;
        img.alt = file.getDisplayName();
        img.className = "max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl";
        panel.appendChild(img);
        return;
      }

      const frame = document.createElement("iframe");
      frame.title = file.getDisplayName();
      frame.setAttribute("allowtransparency", "true");
      frame.className =
        "w-[100vw] h-[100vh] max-w-5xl border-0 rounded-lg bg-transparent shadow-2xl";
      frame.src = objectUrl;
      panel.appendChild(frame);
    } catch (error) {
      console.error("Failed to open file:", error);
      if (!panel.isConnected) return;
      close();
      showToast(error.message || "Failed to open file", "error");
    }
  }

  async loadPreviewMedia(file, element, useThumbnail = true) {
    try {
      this._ensureStorage();
      if (useThumbnail && element instanceof HTMLImageElement && file.getThumbnail()) {
        element.loading = "lazy";
        element.onerror = () => {
          element.onerror = null;
          if (!file.isImage()) {
            element.remove();
            return;
          }
          void this.loadPreviewMedia(file, element, false);
        };
        element.src = file.getThumbnail();
        return;
      }

      if (file.getUrl()?.startsWith("blob:")) {
        element.loading = "lazy";
        element.src = file.getUrl();
        return;
      }

      const raw = await file.getContent();
      const blob = file.isEncryptedFile()
        ? await EncryptionMiddleware.decrypt(raw, file.getMimeType())
        : (raw instanceof Blob ? raw : (raw instanceof Response ? await raw.blob() : new Blob([raw])));
      element.loading = "lazy";
      element.preload = "auto";
      element.src = URL.createObjectURL(blob);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Failed to load file preview:", error);
    }
  }

  async downloadRecord(file) {
    try {
      this._ensureStorage();
      const raw = await file.getContent();
      const blob = file.isEncryptedFile()
        ? await EncryptionMiddleware.decrypt(raw, file.getMimeType())
        : (raw instanceof Blob ? raw : (raw instanceof Response ? await raw.blob() : new Blob([raw])));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.getDisplayName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Download failed:", error);
      showToast(error.message || "Download failed", "error");
    }
  }

  async removeRecord(file) {
    try {
      this._ensureStorage();
      const { error } = await file.remove();
      if (error) throw error;
      showToast(`Deleted ${file.getDisplayName()}`, "success");
      await this.listFiles();
    } catch (error) {
      console.error("Delete failed:", error);
      showToast(error.message || "Delete failed", "error");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileUpload");
  const encryptedInput = document.getElementById("encryptedFileUpload");
  const folderInput = document.getElementById("folderUpload");

  fileInput?.addEventListener("change", (e) => fileManager.action("upload", e, false, {}));
  encryptedInput?.addEventListener("change", (e) => fileManager.action("upload", e, false, { encrypt: true }));
  folderInput?.addEventListener("change", (e) => fileManager.action("upload", e, true, {}));
  set_bg();
});
const fileManager = new FileManager();
