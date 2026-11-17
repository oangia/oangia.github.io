class DriveStorageService {
  constructor(config = {}) {
    this.clientId = localStorage.getItem("gdrive_oauth_client_id") || config.gdrive_oauth_client_id;
    this.passphrase = localStorage.getItem("gdrive_encryption_password") || config.gdrive_encryption_password;

    this.token = localStorage.getItem("gdrive_access_token") || null;
    this.tokenExpiry = localStorage.getItem("gdrive_token_expiry") || null;
    
    this.apiBase = "https://www.googleapis.com/drive/v3/files";
    this.uploadBase = "https://www.googleapis.com/upload/drive/v3/files";
    
    this._folderCache = { "": "root" };
    this.tokenClient = null;
    this.onProgress = config.onProgress || ((msg, type) => console.log(`[${type}] ${msg}`));
  }
  
  init(config = {}) {
    const savedClientId = localStorage.getItem("gdrive_oauth_client_id") || config.gdrive_oauth_client_id;
    if (savedClientId) this.clientId = savedClientId;

    const savedToken = localStorage.getItem("gdrive_access_token");
    const savedExpiry = localStorage.getItem("gdrive_token_expiry");

    if (savedToken && savedExpiry && Date.now() < Number(savedExpiry)) {
      this.token = savedToken;
    } else {
      this.token = null;
    }

    this._initOAuthClient();
    this._bindAuthButton();

    window.addEventListener("load", () => {
      this._initOAuthClient();
      this._bindAuthButton();
    });
  }

  _initOAuthClient() {
    if (this.tokenClient) return true;
    if (!window.google?.accounts?.oauth2) return false;

    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: "https://www.googleapis.com/auth/drive",
        callback: async (res) => {
          if (res.error) {
            this.onProgress(`Auth error: ${res.error}`, "error");
            if (typeof showToast === "function") showToast(`Auth error: ${res.error}`, "error");
            return;
          }
          this.token = res.access_token;
          const expiresAt = Date.now() + (res.expires_in - 60) * 1000;
          
          localStorage.setItem("gdrive_access_token", this.token);
          localStorage.setItem("gdrive_token_expiry", expiresAt);

          this.onProgress("Connected to Google Drive successfully", "success");
          if (typeof showToast === "function") showToast("Connected to Google Drive successfully", "success");

          if (typeof fileManager !== "undefined" && typeof fileManager.initializeServiceConnection === "function") {
            fileManager.initializeServiceConnection();
          } else {
            window.location.reload();
          }
        }
      });
      return true;
    } catch (err) {
      console.error("Failed to initialize Google OAuth client:", err);
      return false;
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

      this.tokenClient.requestAccessToken({ prompt: "" });
    };
  }

  _headers(extra = {}) {
    if (!this.token) throw new Error("Not authenticated. Please click 'Connect Drive'.");
    return { Authorization: `Bearer ${this.token}`, ...extra };
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
        fields: 'files(id, name)'
      });
      const res = await fetch(`${this.apiBase}?${query}`, { headers: this._headers() });
      if (!res.ok) throw new Error('Failed to resolve folder hierarchy');
      const data = await res.json();

      if (data.files && data.files.length > 0) {
        currentParentId = data.files[0].id;
        this._folderCache[accumulatedPath] = currentParentId;
      } else {
        const metadata = {
          name: segment,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentParentId]
        };
        const createRes = await fetch(this.apiBase, {
          method: 'POST',
          headers: this._headers({ 'Content-Type': 'application/json' }),
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

  async list(path, options = {}) {
    if (!this.token) {
      return { data: [], error: null };
    }
    try {
      const folderId = await this._resolveFolderId(path);
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, webContentLink)',
        orderBy: 'folder,name',
        pageSize: String(options.limit || 100)
      });
      const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Failed to list items');
      
      const files = (await res.json()).files;
      return { data: files }
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async get(path) {
    if (!this.token) return { data: null, error: new Error("Not authenticated") };
    try {
      const lastSlashIdx = path.lastIndexOf("/");
      const dirPath = lastSlashIdx !== -1 ? path.substring(0, lastSlashIdx) : "";
      const fileName = lastSlashIdx !== -1 ? path.substring(lastSlashIdx + 1) : path;
      const folderId = await this._resolveFolderId(dirPath);

      const params = new URLSearchParams({
        q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, webContentLink)'
      });
      const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
      if (!res.ok) throw new Error('Failed to fetch file metadata');
      
      const json = await res.json();
      if (!json.files || json.files.length === 0) throw new Error('File not found');

      const f = json.files[0];
      const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
      const cleanPath = path.replace(/^\/+|\/+$/g, '');

      const record = new FileRecord({
        id: isFolder ? null : f.id,
        name: f.name,
        full_path: cleanPath,
        size: Number(f.size || 0),
        mimetype: f.mimeType,
        url: f.webContentLink || null,
        updated_at: f.modifiedTime ? new Date(f.modifiedTime).getTime() : null,
        isFolder: isFolder
      });

      return { data: record, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async getFileUrl(path, expiresIn) {
    try {
      const lastSlashIdx = path.lastIndexOf("/");
      const dirPath = lastSlashIdx !== -1 ? path.substring(0, lastSlashIdx) : "";
      const fileName = lastSlashIdx !== -1 ? path.substring(lastSlashIdx + 1) : path;
      const folderId = await this._resolveFolderId(dirPath);

      const params = new URLSearchParams({
        q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
        fields: 'files(id, name)'
      });
      const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
      const json = await res.json();
      if (!json.files || json.files.length === 0) throw new Error('File not found');
      const fileId = json.files[0].id;

      const mediaRes = await fetch(`${this.apiBase}/${fileId}?alt=media`, { headers: this._headers() });
      if (!mediaRes.ok) throw new Error('Failed to fetch file content');
      const blob = await mediaRes.blob();
      
      let finalBlob = blob;
      const currentPassphrase = localStorage.getItem("gdrive_encryption_password") || this.passphrase;

      if (fileName.endsWith(".enc") && currentPassphrase) {
        try {
          const ciphertext = await blob.text();
          const decryptedText = await this._decryptText(ciphertext, currentPassphrase);
          
          // Check if it's a data URL format
          const match = decryptedText.match(/^data:(.*?);base64,(.*)$/s);
          if (match) {
            const resData = await fetch(`data:${match[1]};base64,${match[2]}`);
            finalBlob = await resData.blob();
          } else {
            // Fallback: Treat decrypted output as raw text or binary blob
            finalBlob = new Blob([decryptedText]);
          }
        } catch (e) {
          console.warn("Could not decrypt thumbnail/file payload:", e);
        }
      }

      const signedUrl = URL.createObjectURL(finalBlob);
      return { data: { signedUrl }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async upload(path, file, options = {}) {
    try {
      const lastSlashIdx = path.lastIndexOf("/");
      const dirPath = lastSlashIdx !== -1 ? path.substring(0, lastSlashIdx) : "";
      const fileName = lastSlashIdx !== -1 ? path.substring(lastSlashIdx + 1) : path;
      const parentId = await this._resolveFolderId(dirPath);

      const query = new URLSearchParams({
        q: `'${parentId}' in parents and name = '${fileName}' and trashed = false`,
        fields: 'files(id)'
      });
      const searchRes = await fetch(`${this.apiBase}?${query}`, { headers: this._headers() });
      const searchJson = await searchRes.json();
      
      if (searchJson.files && searchJson.files.length > 0 && options.upsert === false) {
        return { data: null, error: new Error("File already exists and upsert is disabled") };
      }

      let uploadFile = file;

      const metadata = { 
        name: uploadFile.name, 
        mimeType: uploadFile.type || 'application/octet-stream',
        parents: [parentId]
      };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', uploadFile);

      const res = await fetch(`${this.uploadBase}?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webContentLink`, {
        method: 'POST',
        headers: this._headers(),
        body: form
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Upload failed');
      
      const f = await res.json();
      return { data: f, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async remove(paths) {
    try {
      for (const path of paths) {
        const lastSlashIdx = path.lastIndexOf("/");
        const dirPath = lastSlashIdx !== -1 ? path.substring(0, lastSlashIdx) : "";
        const fileName = lastSlashIdx !== -1 ? path.substring(lastSlashIdx + 1) : path;
        const parentId = await this._resolveFolderId(dirPath);

        const params = new URLSearchParams({
          q: `'${parentId}' in parents and name = '${fileName}' and trashed = false`,
          fields: 'files(id)'
        });
        const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
        const json = await res.json();
        if (json.files) {
          for (const f of json.files) {
            await fetch(`${this.apiBase}/${f.id}`, { method: 'DELETE', headers: this._headers() });
          }
        }
      }
      return { data: {}, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async downloadFile(path, name) {
    const { data, error } = await this.getFileUrl(path, 60);
    if (error) throw error;
    const res = await fetch(data.signedUrl);
    const blob = await res.blob();
    this._triggerDownload(blob, name);
  }

  _triggerDownload(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
