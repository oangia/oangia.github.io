class SupabaseStorageService extends BaseStorageService {
  constructor(config = {}) {
    super(config);

    this._bucket = localStorage.getItem("sb_bucket") || config.bucket || "files";
    this.client = null;
    this.init(config);
  }

  get bucket() {
    return this._bucket;
  }

  // Standardized initialization method
  init(config = {}) {
    const savedUrl = localStorage.getItem("sb_url") || config.url;
    const savedKey = localStorage.getItem("sb_key") || config.key;
    const savedBucket = localStorage.getItem("sb_bucket") || config.bucket;

    if (savedUrl && savedKey) {
      this.client = window.supabase.createClient(savedUrl, savedKey);
    }
    if (savedBucket) {
      this._bucket = savedBucket;
    }
  }

  // =========================================================================
  // PUBLIC INTERFACE IMPLEMENTATIONS
  // =========================================================================

  async list(path, options = {}) {
    if (!this.client) return { data: null, error: new Error("Supabase client not initialized") };

    return this._execute(async () => {
      const cleanPath = this._normalizePath(path);
      const { data, error } = await this.client.storage.from(this._bucket).list(cleanPath, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy || { column: "name", order: "asc" }
      });
      if (error) throw error;

      const files = (data || []).map(item => {
        const isFolder = !item.id;
        const itemPath = cleanPath ? `${cleanPath}/${item.name}` : item.name;
        const metadata = this._getUserMetadata(item);
        return {
          id: itemPath, // Treat Supabase storage path as unique id
          name: item.name,
          mimeType: isFolder ? "application/vnd.google-apps.folder" : (item.metadata?.mimetype || "application/octet-stream"),
          size: item.metadata?.size || 0,
          modifiedTime: item.updated_at || item.created_at || new Date().toISOString(),
          metadata: { ...metadata, hash_content: metadata.hash_content || null },
          webContentLink: null
        };
      });

      console.log(files);
      return files;
    });
  }

  async fetchContent({ id = null, path = null, metadata = null, metadataKnown = false } = {}) {
    return this._execute(async () => {
      this._requireClient();
      const targetPath = this._normalizePath(id || path);
      if (!targetPath) throw new Error("File ID or path required for fetching content");

      const { data, error } = await this.client.storage.from(this._bucket).createSignedUrl(targetPath, 60);
      if (error) throw error;

      const res = await fetch(data.signedUrl, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to fetch file content: ${res.statusText}`);
      }

      return this._ensureContentHash(res, targetPath, metadata, metadataKnown);
    });
  }

  async getByPath(path) {
    if (!this.client) return { data: null, error: new Error("Supabase client not initialized") };

    return this._execute(async () => {
      const { cleanPath, dirPath, fileName } = this._parsePath(path);
      const { data, error } = await this.client.storage.from(this._bucket).list(dirPath, {
        search: fileName
      });
      if (error) throw error;

      const match = (data || []).find(f => f.name === fileName);
      if (!match) throw new Error("File not found");

      const isFolder = !match.id;
      const metadata = this._getUserMetadata(match);
      return {
        id: cleanPath,
        name: match.name,
        mimeType: isFolder ? "application/vnd.google-apps.folder" : (match.metadata?.mimetype || "application/octet-stream"),
        size: match.metadata?.size || 0,
        modifiedTime: match.updated_at || match.created_at || new Date().toISOString(),
        metadata: { ...metadata, hash_content: metadata.hash_content || null },
        webContentLink: null
      };
    });
  }

  async getById(id) {
    // In Supabase, the path acts as the ID
    return this.getByPath(id);
  }

  async updateMetadata({ id = null, path = null } = {}, metadata = {}, content = null) {
    if (!this.client) return { data: null, error: new Error("Supabase client not initialized") };

    return this._execute(async () => {
      const { cleanPath: targetPath, fileName } = this._parsePath(id || path || "");
      if (!targetPath) throw new Error("File ID or path required to update Supabase metadata");
      if (!content) throw new Error("File content is required to update Supabase metadata");

      const file = new File([content], fileName, {
        type: content.type || "application/octet-stream"
      });
      const { error } = await this.client.storage.from(this._bucket).update(targetPath, file, {
        contentType: file.type,
        metadata
      });
      if (error) throw error;

      return { id: targetPath, metadata };
    });
  }

  async upload(path, file, options = {}) {
    if (!this.client) return { data: null, error: new Error("Supabase client not initialized") };

    return this._execute(async () => {
      const { cleanPath, fileName } = this._parsePath(path);
      const upsert = options.upsert !== undefined ? options.upsert : true;
      const metadata = {
        ...(options.metadata || {}),
        hash_content: await this._computeFileHash(file)
      };

      const { error } = await this.client.storage.from(this._bucket).upload(cleanPath, file, {
        upsert,
        contentType: file.type || "application/octet-stream",
        metadata
      });
      if (error) throw error;

      return {
        id: cleanPath,
        name: fileName,
        mimeType: file.type || "application/octet-stream",
        size: file.size || 0,
        modifiedTime: new Date().toISOString(),
        metadata,
        webContentLink: null
      };
    });
  }

  async uploadById(id, file, options = {}) {
    return this.upload(id, file, { ...options, upsert: true });
  }

  async remove(paths) {
    if (!this.client) return { data: null, error: new Error("Supabase client not initialized") };

    return this._execute(async () => {
      const cleanPaths = paths.map(p => this._normalizePath(p));
      const { data, error } = await this.client.storage.from(this._bucket).remove(cleanPaths);
      if (error) throw error;

      return data || {};
    });
  }

  async removeById(ids) {
    return this.remove(ids);
  }

  // =========================================================================
  // SUPABASE-SPECIFIC HELPERS & BACKUP METHODS
  // =========================================================================

  async downloadFile(path, name) {
    return this._execute(async () => {
      const { data, error } = await this.fetchContent({ path });
      if (error) throw error;

      const blob = await data.blob();
      this._triggerDownload(blob, name);
      return {};
    });
  }

  async runBackup() {
    try {
      this.onProgress("Collecting all files...", "info");
      const allFiles = await this._listAllFilesRecursive("");

      if (allFiles.length === 0) {
        this.onProgress("Bucket is empty – nothing to backup", "warning");
        return { success: false, error: "Bucket is empty" };
      }

      this.onProgress(`Found ${allFiles.length} file(s). Downloading fresh copies...`, "info");
      const zip = new JSZip();
      const hashParts = [];
      let processed = 0;

      for (const filePath of allFiles) {
        try {
          const { data: res, error: fetchErr } = await this.fetchContent({ path: filePath });
          if (fetchErr) throw fetchErr;

          const arrayBuffer = await res.arrayBuffer();
          zip.file(filePath, arrayBuffer);
          hashParts.push({ path: filePath, buffer: arrayBuffer });
        } catch (err) {
          console.warn(`Failed to download ${filePath}:`, err);
          this.onProgress(`Skipped ${filePath}`, "warning");
        }
        processed++;
        if (processed % 5 === 0 || processed === allFiles.length) {
          this.onProgress(`Downloaded ${processed} / ${allFiles.length}`, "info");
        }
      }

      this.onProgress("Calculating archive hash...", "info");
      const shortHash = await this._computeBackupHash(hashParts);
      const today = new Date().toISOString().slice(0, 10);
      const zipName = `${this._bucket}_${today}_${shortHash}.zip`;

      this.onProgress("Compressing into ZIP archive...", "info");
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });

      this._triggerDownload(blob, zipName);
      this.onProgress(`Backup ready: ${zipName}`, "success");
      return { success: true, filename: zipName };
    } catch (err) {
      console.error("Backup failed:", err);
      this.onProgress(err.message || "Backup failed", "error");
      return { success: false, error: err.message };
    }
  }

  _requireClient() {
    if (!this.client) throw new Error("Supabase client not initialized");
  }

  _getUserMetadata(item) {
    return item?.user_metadata
      || item?.userMetadata
      || item?.metadata?.user_metadata
      || item?.metadata?.userMetadata
      || item?.metadata
      || {};
  }

  async _ensureContentHash(response, path, metadata, metadataKnown) {
    let fileMetadata = metadata;
    if (!metadataKnown) {
      const { data, error } = await this.getByPath(path);
      if (error) throw error;
      fileMetadata = data.metadata || {};
    }
    if (fileMetadata?.hash_content) return response;

    const buffer = await response.arrayBuffer();
    const hash_content = await this._computeFileHash(buffer);
    fileMetadata = { ...fileMetadata, hash_content };
    const content = new Blob([buffer], {
      type: response.headers.get("Content-Type") || "application/octet-stream"
    });
    const { error } = await this.updateMetadata({ path }, fileMetadata, content);
    if (error) throw error;
    if (metadata) metadata.hash_content = hash_content;

    return new Response(buffer, { headers: response.headers });
  }

  async _listAllFilesRecursive(prefix = "") {
    const results = [];
    const { data, error } = await this.list(prefix, { limit: 1000, offset: 0 });
    if (error) throw error;

    for (const item of (data || [])) {
      if (item.name === ".emptyFolderPlaceholder") continue;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.mimeType === "application/vnd.google-apps.folder") {
        const subFiles = await this._listAllFilesRecursive(fullPath);
        results.push(...subFiles);
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  async _computeBackupHash(hashParts) {
    hashParts.sort((a, b) => a.path.localeCompare(b.path));
    const encoder = new TextEncoder();
    const chunks = [];
    let totalLength = 0;

    for (const part of hashParts) {
      const pathBytes = encoder.encode(part.path);
      const contentBytes = new Uint8Array(part.buffer);
      chunks.push(pathBytes);
      chunks.push(new Uint8Array([0]));
      chunks.push(contentBytes);
      totalLength += pathBytes.length + 1 + contentBytes.length;
    }

    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  }

  _triggerDownload(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
