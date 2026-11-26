class SupabaseStorageService extends BaseStorageService {
  constructor(config = {}) {
    super(config);
    this.client = null;
    this._bucket = localStorage.getItem("sb_bucket") || config.bucket || "files";
    const savedUrl = localStorage.getItem("sb_url") || config.url;
    const savedKey = localStorage.getItem("sb_key") || config.key;

    this.client = savedUrl && savedKey
      ? window.supabase.createClient(savedUrl, savedKey)
      : null;
  }

  load(path, options = {}) {
    return this.client.storage.from(this._bucket).list(path, options);
  }

  fetchContent({ id } = {}) {
    return this.client.storage.from(this._bucket).download(id);
  }

  upload(path, file, options = {}) {
    return this.client.storage.from(this._bucket).upload(path, file, options);
  }

  remove(paths) {
    return this.client.storage.from(this._bucket).remove(paths);
  }
}
