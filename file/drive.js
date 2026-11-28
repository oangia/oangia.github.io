const escapeHtml = e => String(e || "").replace(/[&<>'"]/g, e => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[e] || e));

function showToast(e, t = "info", o = 4e3) {
  let r = document.getElementById("toastContainer");
  r || (r = document.createElement("div"), r.id = "toastContainer", r.className = "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full", document.body.appendChild(r));
  const a = document.createElement("div");
  const n = {
    success: { border: "border-emerald-800", text: "text-emerald-100", icon: "fa-circle-check text-emerald-400", bar: "border-l-emerald-500" },
    error: { border: "border-rose-800", text: "text-rose-100", icon: "fa-circle-exclamation text-rose-400", bar: "border-l-rose-500" },
    warning: { border: "border-amber-800", text: "text-amber-100", icon: "fa-triangle-exclamation text-amber-400", bar: "border-l-amber-500" },
    info: { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" }
  }[t] || { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" };
  a.className = `pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${n.border} ${n.text} ${n.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`;
  a.innerHTML = `
    <div class="flex items-center"><i class="fa-solid ${n.icon} text-base mr-3"></i><span>${escapeHtml(e)}</span></div>
    <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>
  `;
  r.appendChild(a);
  requestAnimationFrame(() => a.classList.remove("translate-x-12", "opacity-0"));
  o > 0 && setTimeout(() => {
    a.classList.add("translate-x-12", "opacity-0");
    setTimeout(() => a.remove(), 300);
  }, o);
}

function set_bg() {
  window.self === window.top && (
    document.body.style.backgroundImage = "linear-gradient(rgba(5, 8, 17, 0.45), rgba(5, 8, 17, 0.7)), url('https://images.unsplash.com/photo-1772511988871-a010197b94ae?auto=format&fit=crop&w=1920&q=80')",
    document.body.style.backgroundSize = "cover",
    document.body.style.backgroundPosition = "center",
    document.body.style.backgroundRepeat = "no-repeat",
    document.body.style.backgroundAttachment = "fixed",
    document.body.style.backgroundColor = "#050811"
  );
}

class Config {
  static get _TEMPLATES() {
    return {
      overlayClass: "hidden fixed inset-0 z-[60] bg-black/40",
      panelClass: "hidden fixed inset-0 z-[70] flex items-center justify-center p-6 overflow-y-auto",
      modalBox: e => `
        <div class="max-w-3xl w-full bg-zinc-900/0 border border-white/15 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-2xl relative">
          <button id="configCloseBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>

          <div class="border-b border-white/10 pb-4">
            <h2 class="text-lg font-bold text-white mb-1">Configuration</h2>
            <p class="text-xs text-slate-400">Enter your Google Drive and Supabase credentials.</p>
          </div>

          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">
            <h3 class="font-semibold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-indigo-400"></i> Google Drive & Encryption
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Google Client ID</label>
                <input id="clientIdInput" name="gdrive_oauth_client_id" type="text" placeholder="123456789-abc.apps.googleusercontent.com"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
                <p class="text-[10px] text-slate-400 mt-1">
                  Current origin: <code id="originLabel" class="text-indigo-300">${e}</code>
                </p>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Private Encryption Key / Password</label>
                <input id="secretKeyInput" name="gdrive_encryption_password" type="password" placeholder="Enter a secure encryption passphrase"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
                <p class="text-[10px] text-slate-400 mt-1">Required to encrypt/decrypt secure uploads.</p>
              </div>
            </div>
          </div>

          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">
            <h3 class="font-semibold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-bolt text-emerald-400"></i> Supabase Credentials
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Project URL</label>
                <input type="text" name="sb_url" placeholder="https://xxxxx.supabase.co"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Anon Public Key</label>
                <input type="text" name="sb_key" placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>
              <div class="lg:col-span-2">
                <label class="block text-xs font-medium text-slate-300 mb-1">Storage Bucket Name</label>
                <input type="text" name="sb_bucket" placeholder="files" value="files" data-default="files"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>
            </div>
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button id="configCancelBtn" class="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button>
            <button id="configSaveBtn" class="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">Save & Connect</button>
          </div>
        </div>`
    };
  }

  constructor(e) {
    this.btnId = e;
    this.panelId = "configPanel";
    this.overlayId = "configOverlay";
    this.#e();
    this.#t();
    this.#n();
    localStorage.getItem("sb_url") && localStorage.getItem("sb_key") || this.open();
  }

  open() {
    document.getElementById(this.overlayId)?.classList.remove("hidden");
    document.getElementById(this.panelId)?.classList.remove("hidden");
  }

  close() {
    document.getElementById(this.overlayId)?.classList.add("hidden");
    document.getElementById(this.panelId)?.classList.add("hidden");
  }

  #e() {
    document.getElementById(this.overlayId)?.remove();
    document.getElementById(this.panelId)?.remove();
    const e = document.createElement("div");
    e.id = this.overlayId;
    e.className = Config._TEMPLATES.overlayClass;
    const t = document.createElement("div");
    t.id = this.panelId;
    t.className = Config._TEMPLATES.panelClass;
    t.innerHTML = Config._TEMPLATES.modalBox(window.location.origin);
    document.body.appendChild(e);
    document.body.appendChild(t);
    document.getElementById("configCloseBtn").onclick = () => this.close();
    document.getElementById("configCancelBtn").onclick = () => this.close();
    e.onclick = () => this.close();
    t.querySelector("div").onclick = e => e.stopPropagation();
    document.getElementById("configSaveBtn").onclick = () => this.#o();
  }

  #t() {
    const e = document.getElementById(this.btnId);
    e && (e.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      this.open();
    });
  }

  #n() {
    const e = document.getElementById(this.panelId);
    e && e.querySelectorAll("input[name]").forEach(e => {
      const t = localStorage.getItem(e.name);
      null !== t && "" !== t ? e.value = t : e.dataset.default && (e.value = e.dataset.default);
    });
  }

  #o() {
    const e = document.getElementById(this.panelId).querySelectorAll("input[name]");
    const t = Object.fromEntries([...e].map(e => [e.name, e.value.trim() || e.dataset.default || ""]));
    t.sb_url && t.sb_key ? (Object.entries(t).forEach(([e, t]) => localStorage.setItem(e, t)), this.close(), location.reload()) : showToast("URL and Anon Key are required", "warning");
  }
}
new Config("navSettingsTab");

class DriveStorageService {
  constructor(config = {}) {
    this.onConnectionChange = config.onConnectionChange || (() => {});

    this.clientId = localStorage.getItem("gdrive_oauth_client_id") || config.gdrive_oauth_client_id;
    this.apiBase = "https://www.googleapis.com/drive/v3/files";
    this.uploadBase = "https://www.googleapis.com/upload/drive/v3/files";
    // Cần scope "drive" để upload/xóa mọi file; dùng "drive.file" nếu chỉ cần quyền trên file do app tạo/chọn
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
      const nameFilter = options.name
        ? ` and name = '${String(options.name).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
        : "";
      const mimeTypeFilter = options.mimeType ? ` and mimeType = '${options.mimeType}'` : "";
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false${nameFilter}${mimeTypeFilter}`,
        fields: "nextPageToken,files(id, name, mimeType, size, modifiedTime, webContentLink, thumbnailLink)",
        orderBy: "folder,name",
        pageSize: "100"
      });
      if (options.pageToken) params.set("pageToken", options.pageToken);

      const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to list Drive items");
      const files = await res.json();
      console.log(folderId, files);
      return { data: files, error: null };
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

  /**
   * Upload file lên Google Drive
   * @param {string} folderId - ID thư mục đích trên Drive (vd: "root" hoặc folderId)
   * @param {File|Blob} file - File hoặc Blob cần upload
   * @param {object} options - { name, mimeType, fileId } (truyền fileId nếu muốn ghi đè nội dung file cũ)
   */
  async upload(folderId = "root", file, options = {}) {
    try {
      if (!file) throw new Error("File is required to upload");

      const fileName = options.name || file.name || "untitled";
      const mimeType = options.mimeType || file.type || "application/octet-stream";

      const metadata = {
        name: fileName,
        mimeType,
        // Khi cập nhật file đã tồn tại (PATCH), Drive không cho gửi parents trực tiếp
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

  /**
   * Xóa một hoặc nhiều file/folder trên Google Drive
   * @param {string|string[]} fileIds - Một fileId hoặc mảng fileIds
   * @param {object} options - { permanent: false } (mặc định chuyển vào Thùng rác; true để xóa vĩnh viễn)
   */
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
    this.onConnectionChange = config.onConnectionChange;
    this.files = null;
    const button = document.getElementById(config.folderButtonId);
    if (!button || button.dataset.localDriveBound) return this;

    button.dataset.localDriveBound = "true";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.webkitdirectory = true;
    fileInput.multiple = true;
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.onchange = event => {
      this.files = event.target.files;
      console.log(this.files);
      this.onConnectionChange(this.files);
    };

    button.onclick = () => fileInput.click();
  }

  isAvailable() {
    return Boolean(this.files?.length);
  }

  async list() {
    return { data: this.files, error: null };
  }

  async download({ id } = {}) {
    if (!(id instanceof Blob)) {
      return { data: null, error: new Error("A local File is required to fetch content") };
    }
    return { data: new Response(id), error: null };
  }
}

class SupabaseStorageService {
  constructor(config = {}) {
    this.onConnectionChange = config.onConnectionChange || (() => {});
    this.client = null;
    this._bucket = localStorage.getItem("sb_bucket") || config.bucket || "files";
    const savedUrl = localStorage.getItem("sb_url") || config.url;
    const savedKey = localStorage.getItem("sb_key") || config.key;

    this.client = savedUrl && savedKey
      ? window.supabase.createClient(savedUrl, savedKey)
      : null;
  }

  isAvailable() {
    return Boolean(this.client);
  }

  async list(path, options = {}) {
    const { data, error } = await this.client.storage.from(this._bucket).list(path, options);
    console.log(path, { data, error });
    return { data, error };
  }

  async download({ id } = {}) {
    const { data, error } = await this.client.storage.from(this._bucket).download(id);
    return { data, error };
  }

  async upload(path, file, options = {}) {
    const { data, error } = await this.client.storage.from(this._bucket).upload(path, file, options);
    return { data, error };
  }

  async remove(paths) {
    const { data, error } = await this.client.storage.from(this._bucket).remove(paths);
    return { data, error };
  }
}

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
  static services = {};
  static current = null;

  constructor(data = {}) {
    super(data);
    this._storage = data.storage || FileRecord.current;
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

    const cleanBase = path.replace(/^\/+|\/+$/g, "");
    const records = data.map(item => {
      const fullPath = cleanBase ? `${cleanBase}/${item.name}` : item.name;
      const isFolder = item.mimeType === "application/vnd.google-apps.folder" || !item.id;
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

  async download(params = {}) {
    const storage = this._storage || FileRecord.current;
    if (!storage) throw new Error("No storage service selected.");

    const { data, error } = await storage.download({
      id: this._id,
      path: this._full_path,
      ...params
    });
    if (error) throw error;
    return data instanceof Response ? data : new Response(data);
  }

  async remove() {
    const storage = this._storage || FileRecord.current;
    if (!storage) throw new Error("No storage service selected.");

    const target = this._id || this._full_path;
    return await storage.remove([target]);
  }
}

