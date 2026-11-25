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

    try {
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
        return {
          id: itemPath, // Treat Supabase storage path as unique id
          name: item.name,
          mimeType: isFolder ? "application/vnd.google-apps.folder" : (item.metadata?.mimetype || "application/octet-stream"),
          size: item.metadata?.size || 0,
          modifiedTime: item.updated_at || item.created_at || new Date().toISOString(),
          webContentLink: null
        };
      });

      return { data: files, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async fetchContent({ id = null, path = null } = {}) {
    try {
      this._requireClient();
      const targetPath = this._normalizePath(id || path);
      if (!targetPath) throw new Error("File ID or path required for fetching content");

      const { data, error } = await this.client.storage.from(this._bucket).createSignedUrl(targetPath, 60);
      if (error) throw error;

      const res = await fetch(data.signedUrl, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to fetch file content: ${res.statusText}`);
      }

      return { data: res, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getByPath(path) {
    if (!this.client) return { data: null, error: new Error("Supabase client not initialized") };

    try {
      const { cleanPath, dirPath, fileName } = this._parsePath(path);
      const { data, error } = await this.client.storage.from(this._bucket).list(dirPath, {
        search: fileName
      });
      if (error) throw error;

      const match = (data || []).find(f => f.name === fileName);
      if (!match) throw new Error("File not found");

      const isFolder = !match.id;
      return {
        data: {
          id: cleanPath,
          name: match.name,
          mimeType: isFolder ? "application/vnd.google-apps.folder" : (match.metadata?.mimetype || "application/octet-stream"),
          size: match.metadata?.size || 0,
          modifiedTime: match.updated_at || match.created_at || new Date().toISOString(),
          webContentLink: null
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getById(id) {
    // In Supabase, the path acts as the ID
    return this.getByPath(id);
  }

  async upload(path, file, options = {}) {
    if (!this.client) return { data: null, error: new Error("Supabase client not initialized") };

    try {
      const { cleanPath, fileName } = this._parsePath(path);
      const upsert = options.upsert !== undefined ? options.upsert : true;

      const { error } = await this.client.storage.from(this._bucket).upload(cleanPath, file, {
        upsert,
        contentType: file.type || "application/octet-stream"
      });
      if (error) throw error;

      return {
        data: {
          id: cleanPath,
          name: fileName,
          mimeType: file.type || "application/octet-stream",
          size: file.size || 0,
          modifiedTime: new Date().toISOString(),
          webContentLink: null
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async uploadById(id, file, options = {}) {
    return this.upload(id, file, { ...options, upsert: true });
  }

  async remove(paths) {
    if (!this.client) return { data: null, error: new Error("Supabase client not initialized") };

    try {
      const cleanPaths = paths.map(p => this._normalizePath(p));
      const { data, error } = await this.client.storage.from(this._bucket).remove(cleanPaths);
      if (error) throw error;

      return { data: data || {}, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async removeById(ids) {
    return this.remove(ids);
  }

  _requireClient() {
    if (!this.client) throw new Error("Supabase client not initialized");
  }

}
