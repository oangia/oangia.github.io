class SupabaseStorageService extends BaseStorageService {
  constructor(config = {}) {
    super({ ...config, name: config.name || "Supabase" });
    this.client = null;
    this._bucket = localStorage.getItem("sb_bucket") || config.bucket || "files";
    const savedUrl = localStorage.getItem("sb_url") || config.url;
    const savedKey = localStorage.getItem("sb_key") || config.key;

    this.client = savedUrl && savedKey
      ? window.supabase.createClient(savedUrl, savedKey)
      : null;
  }

  isAvailable() { return Boolean(this.client); }

  async load(path, options = {}) {
    const { data, error } = await this.client.storage.from(this._bucket).list(path, options);
    console.log(path, { data, error });
    return { data, error };
  }

  async fetchContent({ id } = {}) {
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
