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

class DriveStorageService {
  constructor(config = {}) {
    this.onConnectionChange = config.onConnectionChange || (() => {});

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
      if (this.token) this._scheduleTokenRefresh();
      else this._requestSilentAccessToken();
    };

    init();
    window.addEventListener("load", init);
  }

  async fetchContent(id) {
    const res = await fetch(`${this.apiBase}/${encodeURIComponent(id)}?alt=media`, {
      headers: this._headers()
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to fetch file content: ${res.statusText}`);
    }
    return res;
  }

  async getById(id) {
    const fields = "id, name, mimeType, size, modifiedTime, webContentLink, thumbnailLink";
    const res = await fetch(`${this.apiBase}/${encodeURIComponent(id)}?fields=${fields}`, {
      headers: this._headers()
    });
    if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to fetch file metadata");
    return res.json();
  }

  async searchFiles(parentId, name) {
    const query = new URLSearchParams({
      q: `'${parentId}' in parents and name = '${name}' and trashed = false`,
      fields: "files(id)"
    });
    const res = await fetch(`${this.apiBase}?${query}`, { headers: this._headers() });
    if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to find Drive item");
    return res.json();
  }

  async createFile(parentId, file) {
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
    return res.json();
  }

  async updateFile(id, file) {
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
    return res.json();
  }

  async deleteFile(id) {
    const res = await fetch(`${this.apiBase}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: this._headers()
    });
    if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to delete file");
  }

  connect(clientId = this.clientId) {
    if (!clientId) throw new Error("Google Client ID is not configured");
    this.clientId = clientId;
    if (!this.tokenClient && !this._initOAuthClient()) {
      throw new Error("Google API is still loading. Please try again in a moment.");
    }

    this._silentAuthAttempted = false;
    this._authRequestMode = "interactive";
    this.tokenClient.requestAccessToken({ prompt: "" });
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

  async _listFolderPage(folderId, pageToken = null) {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id, name, mimeType, size, modifiedTime, webContentLink, thumbnailLink)",
      orderBy: "folder,name",
      pageSize: "100"
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
    if (!res.ok) throw new Error((await res.json()).error?.message || "Failed to list Drive items");
    return res.json();
  }

  async _findFolderDirect(parentId, name) {
    const query = new URLSearchParams({
      q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)"
    });
    const res = await fetch(`${this.apiBase}?${query}`, { headers: this._headers() });
    if (!res.ok) throw new Error("Failed to resolve folder hierarchy");
    return res.json();
  }

  async _createFolderDirect(parentId, name) {
    const metadata = {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId]
    };
    const res = await fetch(this.apiBase, {
      method: "POST",
      headers: this._headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(metadata)
    });
    if (!res.ok) throw new Error(`Failed to create folder: ${name}`);
    return res.json();
  }
}
