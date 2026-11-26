class BaseStorageService {
  constructor(config = {}) {
    if (new.target === BaseStorageService) {
      throw new Error("BaseStorageService is abstract and cannot be instantiated directly.");
    }

    this.onConnectionChange = config.onConnectionChange || (() => {});
    this.name = config.name || this.constructor.name;
  }

  getName() { return this.name; }

  isAvailable() { return false; }

  async load(path, options = {}) {
    return this._unsupported("load");
  }

  async getById(id) {
    return this.getByPath(id);
  }

  async getByPath(path) {
    return this._unsupported("getByPath");
  }

  async fetchContent({ id = null, path = null } = {}) {
    return this._unsupported("fetchContent");
  }

  async upload(path, file, options = {}) {
    return this._unsupported("upload");
  }

  async uploadById(id, file, options = {}) {
    return this.upload(id, file, { ...options, upsert: true });
  }

  async remove(paths) {
    return this._unsupported("remove");
  }

  async removeById(ids) {
    return this.remove(ids);
  }

  _unsupported(operation) {
    return {
      data: null,
      error: new Error(`${this.constructor.name} does not support ${operation}`)
    };
  }
}

class DriveStorageService extends BaseStorageService {
  constructor(config = {}) {
    super(config);

    this.clientId = localStorage.getItem("gdrive_oauth_client_id") || config.gdrive_oauth_client_id;
    this.apiBase = "https://www.googleapis.com/drive/v3/files";
    this.uploadBase = "https://www.googleapis.com/upload/drive/v3/files";

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

  async load(folderId, options = {}) {
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
      console.log(files);
      return { data: files, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  isAvailable() { return Boolean(this.token); }

  async getById(id) {
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

  async fetchContent({ id } = {}) {
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

  async upload(parentId, file, options = {}) {
    try {
      const metadata = {
        name: options.name || file.name,
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
      return { data: await res.json(), error: null };
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
      return { data: await res.json(), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async remove(ids) {
    try {
      for (const id of ids) {
        const res = await fetch(`${this.apiBase}/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: this._headers()
        });
        if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to delete file");
      }
      return { data: {}, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // =========================================================================
  // GOOGLE DRIVE SPECIFIC PRIVATE METHODS (OAuth & Folder Hierarchy)
  // =========================================================================

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
        scope: "https://www.googleapis.com/auth/drive",
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
