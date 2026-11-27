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
  constructor(btnId) {
    this.onConnectionChange = () => {};
    this.files = null;
    const button = document.getElementById(btnId);
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
