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
          metadata,
          webContentLink: null
        };
      });

      return files;
    });
  }

  async fetchContent({ id = null, path = null } = {}) {
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

      return res;
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
        metadata,
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
      const metadata = { ...(options.metadata || {}) };

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

}
