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
