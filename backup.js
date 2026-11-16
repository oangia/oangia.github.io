class FolderManagerPanel {
  constructor(triggerSelector) {
    this.trigger = document.querySelector(triggerSelector);
    this.container = null;
    this.localService = null;
    this.isInitialized = false;
    
    // Isolated sub-managers for local folder view
    this.localBreadcrumbManager = null;
    this.localGridRenderer = null;
    this.localFilePreviewManager = null;

    if (this.trigger) {
      this.trigger.addEventListener("click", () => this.open());
    }
  }

  init() {
    if (this.isInitialized) return;
    this.container = document.createElement("div");
    this.container.className = Theme.getFolderManagerContainerClasses();
    this.container.innerHTML = Theme.getFolderManagerPanelHTML();
    document.body.appendChild(this.container);
    this.bindLogic();
    this.isInitialized = true;
  }

  bindLogic() {
    this.localService = new LocalFileAdapterService();

    const renderLocalFolder = () => {
      const currentPath = this.localBreadcrumbManager ? this.localBreadcrumbManager.path : "";
      const searchVal = document.getElementById("searchInput")?.value.toLowerCase() || "";
      let items = this.localService.getItemsAtPath(currentPath);
      
      if (searchVal) {
        items = items.filter(i => i.name.toLowerCase().includes(searchVal));
      }
      
      const label = document.getElementById("itemCountLabel");
      if (label) {
        label.textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;
      }
      
      this.localGridRenderer?.render(items, currentPath);
    };

    // Use local instances instead of overwriting global ones
    this.localFilePreviewManager = new FilePreviewManager({
      service: this.localService,
      onToast: (msg, type, duration) => showToast(msg, type, duration),
      onSaveSuccess: () => renderLocalFolder()
    });

    this.localGridRenderer = new ItemsGridRenderer("itemsGrid", {
      onItemClick: (item, fullPath, isFolder) => {
        if (isFolder) {
          this.localBreadcrumbManager?.navigateToFolder(fullPath, item.name);
        } else {
          const record = this.localService.pathToFile.get(fullPath);
          this.localFilePreviewManager?.openPreview(fullPath, item.name, record?.size || 0);
        }
      },
      onDeleteClick: (fullPath, isFolder) => {
        this.localService.deleteLocalPath(fullPath, isFolder);
        showToast(`Removed "${fullPath}" from view`, "success", 2000);
        renderLocalFolder();
      }
    });

    this.localBreadcrumbManager = new BreadcrumbManager("breadcrumbNav", {
      onNavigate: () => renderLocalFolder()
    });

    document.getElementById("searchInput")?.addEventListener("input", renderLocalFolder);

    document.querySelectorAll(".widget-folder-input-main, .widget-folder-input-header").forEach(input => {
      input.addEventListener("change", async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        await this.localService.loadFiles(files);
        
        document.getElementById("selectScreen")?.classList.add("hidden");
        document.getElementById("breadcrumbBar")?.classList.remove("hidden");
        document.getElementById("gridScrollArea")?.classList.remove("hidden");
        
        if (this.localBreadcrumbManager) {
          this.localBreadcrumbManager.reset();
          if (this.localBreadcrumbManager.history[0]) {
            this.localBreadcrumbManager.history[0].name = this.localService.rootNode.name || "root";
          }
          this.localBreadcrumbManager.render();
        }
        
        renderLocalFolder();
        showToast(`Loaded "${this.localService.rootNode.name}"`, "success", 2500);
        e.target.value = "";
      });
    });

    document.getElementById("closeFolderPanelBtn")?.addEventListener("click", () => this.close());
  }

  open() {
    this.init();
    this.container.classList.remove("hidden");
  }

  close() {
    if (this.container) this.container.classList.add("hidden");
  }
}

class LocalFileAdapterService {
  constructor() {
    this.rootNode = { name: "root", children: {}, files: [] };
    this.pathToFile = new Map();
    this.pathToNode = new Map();
  }

  async loadFiles(fileList) {
    for (const record of this.pathToFile.values()) {
      if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
    }
    const files = Array.from(fileList || []);
    this.rootNode = { name: "root", children: {}, files: [] };
    this.pathToFile.clear();
    this.pathToNode.clear();
    this.pathToNode.set("", this.rootNode);
    if (!files.length) return;

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const rootFolderName = firstPath.split("/")[0] || "root";
    this.rootNode.name = rootFolderName;

    for (const file of files) {
      const rawPath = file.webkitRelativePath || file.name;
      const parts = rawPath.split("/");
      if (parts.length > 1 && parts[0] === rootFolderName) parts.shift();
      const fileName = parts.pop();
      if (!fileName) continue;

      let currentNode = this.rootNode;
      let runningPath = "";
      for (const folderName of parts) {
        runningPath = runningPath ? `${runningPath}/${folderName}` : folderName;
        if (!currentNode.children[folderName]) {
          const newNode = { name: folderName, path: runningPath, children: {}, files: [] };
          currentNode.children[folderName] = newNode;
          this.pathToNode.set(runningPath, newNode);
        }
        currentNode = currentNode.children[folderName];
      }

      const fullPath = runningPath ? `${runningPath}/${fileName}` : fileName;
      const fileUrl = URL.createObjectURL(file);
      const record = {
        id: fullPath,
        name: fileName,
        fullPath,
        fileUrl,
        size: file.size,
        metadata: { size: file.size },
        thumbUrl: (isImage(fileName) || isVideo(fileName)) ? fileUrl : null
      };
      currentNode.files.push(record);
      this.pathToFile.set(fullPath, record);
    }
  }

  getItemsAtPath(folderPath = "") {
    const node = this.pathToNode.get(folderPath) || this.rootNode;
    const folderItems = Object.values(node.children).map(child => ({
      id: null,
      name: child.name,
      fullPath: child.path,
      metadata: { size: this._calculateFolderSize(child) }
    }));
    folderItems.sort((a, b) => a.name.localeCompare(b.name));
    const fileItems = [...node.files].sort((a, b) => a.name.localeCompare(b.name));
    return [...folderItems, ...fileItems];
  }

  _calculateFolderSize(node) {
    let total = node.files.reduce((sum, f) => sum + (f.size || 0), 0);
    for (const child of Object.values(node.children)) {
      total += this._calculateFolderSize(child);
    }
    return total;
  }

  async getFileUrl(path) {
    const record = this.pathToFile.get(path);
    if (!record) return { data: null, error: new Error("File not found") };
    return { data: { signedUrl: record.fileUrl }, error: null };
  }

  async upload(path, blob) {
    const record = this.pathToFile.get(path);
    if (!record) return { error: new Error("File not found") };
    if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
    record.fileUrl = URL.createObjectURL(blob);
    record.size = blob.size;
    record.metadata.size = blob.size;
    return { error: null };
  }

  deleteLocalPath(path, isFolder) {
    if (isFolder) {
      for (const key of Array.from(this.pathToFile.keys())) {
        if (key === path || key.startsWith(`${path}/`)) {
          const rec = this.pathToFile.get(key);
          if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
          this.pathToFile.delete(key);
        }
      }
      for (const key of Array.from(this.pathToNode.keys())) {
        if (key === path || key.startsWith(`${path}/`)) this.pathToNode.delete(key);
      }
      const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      const folderName = path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) delete parentNode.children[folderName];
    } else {
      const rec = this.pathToFile.get(path);
      if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
      this.pathToFile.delete(path);
      const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) parentNode.files = parentNode.files.filter(f => f.fullPath !== path);
    }
  }
}

/**
 * Global Utilities & Helpers
 */
const formatBytes=(e,t=1)=>{if(!e)return"0 B";const a=Math.floor(Math.log(e)/Math.log(1024));return`${parseFloat((e/Math.pow(1024,a)).toFixed(t))} ${["B","KB","MB","GB"][a]}`},escapeHtml=e=>String(e||"").replace(/[&<>'"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[e]||e)),getExtension=e=>e.includes(".")?e.split(".").pop().toLowerCase():"file",isType=(e,t)=>t.includes(getExtension(e)),isImage=e=>isType(e,["png","jpg","jpeg","gif","webp","svg","bmp","ico"]),isVideo=e=>isType(e,["mp4","webm","mov","avi","mkv","ogg"]),isText=e=>isType(e,["txt","md","json","js","ts","html","css","xml","csv","log","py","sql","yml","yaml"]);async function computeSha256(e){const t="string"==typeof e?(new TextEncoder).encode(e):e,a=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(a)).map(e=>e.toString(16).padStart(2,"0")).join("")}function showToast(e,t="info",a=4e3){const n=document.getElementById("toastContainer");n||(n=document.createElement("div"),n.id="toastContainer",n.className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full",document.body.appendChild(n));const o={success:{border:"border-emerald-800",text:"text-emerald-100",icon:"fa-circle-check text-emerald-400",bar:"border-l-emerald-500"},error:{border:"border-rose-800",text:"text-rose-100",icon:"fa-circle-exclamation text-rose-400",bar:"border-l-rose-500"},warning:{border:"border-amber-800",text:"text-amber-100",icon:"fa-triangle-exclamation text-amber-400",bar:"border-l-amber-500"},info:{border:"border-slate-700",text:"text-slate-100",icon:"fa-circle-info text-sky-400",bar:"border-l-sky-500"}}[t]||o.info,s=document.createElement("div");s.className=`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${o.border} ${o.text} ${o.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`,s.innerHTML=`\n    <div class="flex items-center"><i class="fa-solid ${o.icon} text-base mr-3"></i><span>${escapeHtml(e)}</span></div>\n    <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>\n  `,n.appendChild(s),requestAnimationFrame(()=>s.classList.remove("translate-x-12","opacity-0")),a>0&&setTimeout(()=>{s.classList.add("translate-x-12","opacity-0"),setTimeout(()=>s.remove(),300)},a)}const isAudio=e=>isType(e,["mp3","wav","ogg","m4a","flac","aac"]);function isHtml(e){return/\.(html|htm)$/i.test(e)}function updateConnectionStatus(e,t){const a=document.getElementById("statusDot"),n=document.getElementById("statusText");n&&a&&(n.textContent=t,a.className=!0===e?"w-2 h-2 rounded-full bg-emerald-500":!1===e?"w-2 h-2 rounded-full bg-rose-500":"w-2 h-2 rounded-full bg-amber-400 animate-pulse")}function closeModals(){document.querySelectorAll(".fixed").forEach(e=>{"toastContainer"!==e.id&&e.classList.add("hidden")}),filePreviewManager&&(filePreviewManager.isTextEditor=!1),document.getElementById("previewSaveBtn")?.classList.add("hidden"),document.getElementById("previewCancelEditBtn")?.classList.add("hidden")}function showToast(e,t="info",a=4e3){let n=document.getElementById("toastContainer");n||(n=document.createElement("div"),n.id="toastContainer",n.className=Theme.getToastContainerClasses(),document.body.appendChild(n));const o=document.createElement("div");o.className=Theme.getToastClasses(t),o.innerHTML=Theme.getToastHTML(e,t),n.appendChild(o),requestAnimationFrame(()=>o.classList.remove("translate-x-12","opacity-0")),a>0&&setTimeout(()=>{o.classList.add("translate-x-12","opacity-0"),setTimeout(()=>o.remove(),300)},a)}function updateConnectionStatus(e,t){const a=document.getElementById("statusDot"),n=document.getElementById("statusText");n&&a&&(n.textContent=t,a.className=Theme.getStatusDotClasses(e))}function closeModals(){document.querySelectorAll(".fixed").forEach(e=>{"toastContainer"!==e.id&&e.classList.add("hidden")}),filePreviewManager&&(filePreviewManager.isTextEditor=!1),document.getElementById("previewSaveBtn")?.classList.add("hidden"),document.getElementById("previewCancelEditBtn")?.classList.add("hidden")}

(function () {
  "use strict";
  const scriptTag = document.currentScript;
  if (scriptTag) {
    const src = scriptTag.getAttribute("src");
    try {
      const url = new URL(src, window.location.origin);
      const btnId = url.searchParams.get("id");
      if (btnId) window.currentTrackerInstance = new Tracker(btnId);
    } catch (e) {
      const match = src && src.match(/[?&]id=([^&]+)/);
      if (match) window.currentTrackerInstance = new Tracker(match[1]);
    }
  }
})();

/**
 * ==========================================
 * 1. STANDARDIZED STORAGE SERVICE (Supabase)
 * ==========================================
 * Encapsulates all provider-specific configs, keys, 
 * buckets, signed URLs, backups, and local storage keys.
 */
class SupabaseStorageService {
  constructor(config = {}) {
    // Service manages its own keys/buckets internally
    const savedUrl = localStorage.getItem("sb_url") || config.url;
    const savedKey = localStorage.getItem("sb_key") || config.key;
    
    this._bucket = localStorage.getItem("sb_bucket") || config.bucket || "files";
    this.client = savedUrl && savedKey ? window.supabase.createClient(savedUrl, savedKey) : null;
    this.onProgress = config.onProgress || ((msg, type) => console.log(`[${type}] ${msg}`));
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

  async list(path, options) {
    if (!this.client) throw new Error("Supabase client not initialized");
    return await this.client.storage.from(this._bucket).list(path, options);
  }

  async getFileUrl(path, expiresIn) {
    if (!this.client) throw new Error("Supabase client not initialized");
    return await this.client.storage.from(this._bucket).getFileUrl(path, expiresIn);
  }

  async upload(path, file, options) {
    if (!this.client) throw new Error("Supabase client not initialized");
    return await this.client.storage.from(this._bucket).upload(path, file, options);
  }

  async remove(paths) {
    if (!this.client) throw new Error("Supabase client not initialized");
    return await this.client.storage.from(this._bucket).remove(paths);
  }

  async downloadFile(path, name) {
    try {
      const { data, error } = await this.getFileUrl(path, 60);
      if (error) throw error;

      const res = await fetch(data.signedUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      this._triggerDownload(blob, name);
    } catch (err) {
      throw new Error(err.message || "Download failed");
    }
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
          const { data: signed, error: signErr } = await this.getFileUrl(filePath, 60);
          if (signErr) throw signErr;
          
          const res = await fetch(signed.signedUrl, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
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
      const shortHash = await this._computeHash(hashParts);
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

  async _listAllFilesRecursive(prefix = "") {
    const results = [];
    const { data, error } = await this.list(prefix, { limit: 1000, offset: 0 });
    if (error) throw error;
    
    for (const item of (data || [])) {
      if (item.name === ".emptyFolderPlaceholder") continue;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id) {
        const subFiles = await this._listAllFilesRecursive(fullPath);
        results.push(...subFiles);
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  async _computeHash(hashParts) {
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

/**
 * ==========================================
 * 2. PURE FILE MANAGER (100% Agnostic)
 * ==========================================
 * Does not know what "sb_url", keys, or buckets are. 
 * Just calls standard service methods.
 */
class FileManager {
  constructor(config = {}) {
    this.storageService = config.storageService;
    if (!this.storageService) throw new Error("A storage service is required.");

    this.allItems = [];
    this.filteredItems = [];

    this.filePreviewManager = null;
    this.gridRenderer = null;
    this.breadcrumbManager = null;
    this.configManager = null;
  }

  init() {
    this.breadcrumbManager = new BreadcrumbManager("breadcrumbNav", {
      onNavigate: () => this.listFiles()
    });

    this.filePreviewManager = new FilePreviewManager({
      service: this.storageService,
      onToast: (msg, type, duration) => this.showToast(msg, type, duration),
      onSaveSuccess: () => this.listFiles()
    });

    this.gridRenderer = new ItemsGridRenderer("itemsGrid", {
     storageService: this.storageService, // <-- Pass this so cards can load thumbs lazily
     onItemClick: (item, fullPath, isFolder) => {
       if (isFolder) {
         this.breadcrumbManager.navigateToFolder(fullPath, item.name);
       } else {
         this.openPreview(fullPath, item.name);
       }
     },
     onDeleteClick: (fullPath, isFolder) => this.deleteItem(fullPath, isFolder)
   });
    this.bindGlobalEvents();
    this.initializeServiceConnection();
  }

  bindGlobalEvents() {
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("actionsMenu");
      if (!menu) return;
      if (!menu.contains(e.target) && !e.target.closest("button")?.getAttribute("onclick")?.includes("toggleActionsMenu")) {
        menu.classList.add("hidden");
      }
    });
  }

  initializeServiceConnection() {
    try {
      if (typeof this.storageService.init === "function") {
        this.storageService.init();
      }
      this.filePreviewManager?.setService(this.storageService);

      const headerUrl = document.getElementById("headerUrl");
      if (headerUrl && this.storageService.bucket) {
        headerUrl.innerHTML = `Storage Active<br />Container: ${this.storageService.bucket}`;
      }

      this.breadcrumbManager?.reset();
      this.listFiles();
    } catch (err) {
      console.error(err);
      this.updateConnectionStatus(false, err.message || "Failed to initialize storage service");
      this.showToast("Failed to initialize storage service", "error");
    }
  }

  get activePath() {
    return this.breadcrumbManager ? this.breadcrumbManager.path : "";
  }

  async listFiles() {
    this.updateConnectionStatus(null, "Loading...");
    try {
      const currentPath = this.activePath;
      const { data, error } = await this.storageService.list(currentPath, {
        limit: 500, offset: 0, sortBy: { column: "name", order: "asc" }
      });
      if (error) throw error;

      this.allItems = (data || []).filter(item => item.name !== ".emptyFolderPlaceholder");

      // FIX: Just assign paths and names instantly. No network downloads or decryption here!
      this.allItems.forEach(item => {
        const isFolder = !item.id;
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        item.fullPath = fullPath;
        item.isEncrypted = this.isEncryptedFile(item.name);
        item.displayName = item.isEncrypted ? this.getOriginalFilename(item.name) : item.name;
      });

      this.updateConnectionStatus(true, `Connected • Encrypted Vault Active`);
      this.renderView();
    } catch (err) {
      console.error(err);
      this.updateConnectionStatus(false, err.message || "Failed to list files");
      this.showToast(err.message || "Failed to list files", "error");
    }
  }

  renderView() {
    this.breadcrumbManager?.render();

    const searchVal = document.getElementById("searchInput")?.value.toLowerCase() || "";
    this.filteredItems = searchVal
      ? this.allItems.filter(i => (i.displayName || i.name).toLowerCase().includes(searchVal))
      : [...this.allItems];

    this.filteredItems.sort((a, b) => {
      const aFolder = !a.id;
      const bFolder = !b.id;
      if (aFolder !== bFolder) return aFolder ? -1 : 1;
      return (a.displayName || a.name).localeCompare(b.displayName || b.name);
    });

    const label = document.getElementById("itemCountLabel");
    if (label) label.textContent = `${this.filteredItems.length} item${this.filteredItems.length !== 1 ? "s" : ""}`;

    this.gridRenderer?.render(this.filteredItems, this.activePath);
  }

  openCreateFolderModal() {
    const input = document.getElementById("folderNameInput");
    const modal = document.getElementById("modalCreateFolder");
    if (input) input.value = "";
    if (modal) modal.classList.remove("hidden");
  }

  async submitCreateFolder() {
    const name = document.getElementById("folderNameInput")?.value.trim();
    if (!name) return;

    const currentPath = this.activePath;
    const folderPath = currentPath
      ? `${currentPath}/${name}/.emptyFolderPlaceholder`
      : `${name}/.emptyFolderPlaceholder`;

    try {
      const { error } = await this.storageService.upload(folderPath, new Blob([""]), { upsert: false });
      if (error) throw error;

      this.closeModals();
      this.showToast(`Folder "${name}" created`, "success");
      this.listFiles();
    } catch (err) {
      this.showToast(err.message || "Failed to create folder", "error");
    }
  }

  toggleActionsMenu() {
    document.getElementById("actionsMenu")?.classList.toggle("hidden");
  }

  async handleFileUpload(event, isFolderUpload = false, isEncrypted = false) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    this.showToast(`Uploading ${files.length} item(s) (${isEncrypted ? 'Encrypted' : 'Normal'})...`, "info", 2500);
    let success = 0, failed = 0;
    const currentPath = this.activePath;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let targetPath = currentPath ? `${currentPath}/` : "";
        if (isFolderUpload && file.webkitRelativePath) {
          targetPath += file.webkitRelativePath;
        } else {
          targetPath += file.name;
        }

        // If storage service handles transparent encryption when passphrase is active or via flags
        const { error } = await this.storageService.upload(targetPath, file, { cacheControl: "3600", upsert: true, isEncrypted });
        if (error) throw error;

        success++;
        if ((i + 1) % 5 === 0 || i === files.length - 1) {
          this.showToast(`Uploaded ${i + 1} / ${files.length}`, "info", 1200);
        }
      } catch (err) {
        console.error(err);
        failed++;
        this.showToast(`Failed: ${file.name}`, "error", 2500);
      }
    }

    await this.listFiles();
    if (failed === 0) {
      this.showToast(`Successfully uploaded ${success} item(s)`, "success");
    } else {
      this.showToast(`Uploaded ${success}, failed ${failed}`, "warning");
    }
    event.target.value = "";
  }

  async openPreview(path, name) {
    if (this.filePreviewManager) await this.filePreviewManager.openPreview(path, name);
  }

  cancelEditText() {
    this.filePreviewManager?.cancelEditText();
  }

  async saveEditedText() {
    await this.filePreviewManager?.saveEditedText();
  }

  async downloadFile(path, name) {
    try {
      await this.storageService.downloadFile(path, name);
    } catch (err) {
      this.showToast(err.message || "Download failed", "error");
    }
  }

  async createBackup() {
    const btn = document.getElementById("backupBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = Theme.getBackupLoadingHTML();
    }
    
    await this.storageService.runBackup();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = Theme.getBackupIdleHTML();
    }
  }

  async deleteItem(path, isFolder) {
    const confirmMsg = isFolder
      ? `Delete folder "${path}" and all its contents?`
      : `Delete file "${path}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      if (isFolder) {
        const { data: files, error: listError } = await this.storageService.list(path, { limit: 1000 });
        if (listError) throw listError;

        const pathsToDelete = (files || []).map(f => `${path}/${f.name}`);
        pathsToDelete.push(`${path}/.emptyFolderPlaceholder`);

        if (pathsToDelete.length > 0) {
          const { error } = await this.storageService.remove(pathsToDelete);
          if (error) throw error;
        }
      } else {
        const { error } = await this.storageService.remove([path]);
        if (error) throw error;
      }

      this.showToast("Deleted successfully", "success");
      this.listFiles();
    } catch (err) {
      console.error(err);
      this.showToast(err.message || "Delete failed", "error");
    }
  }

  isEncryptedFile(name) { return String(name || "").endsWith(".enc"); }
  getOriginalFilename(name) { return this.isEncryptedFile(name) ? name.slice(0, -4) : name; }
  isImage(name) { return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(this.getOriginalFilename(name)); }
  isVideo(name) { return /\.(mp4|webm|ogg|mov)$/i.test(this.getOriginalFilename(name)); }
  showToast(msg, type, duration) { if (typeof showToast === "function") showToast(msg, type, duration); }
  updateConnectionStatus(status, msg) { if (typeof updateConnectionStatus === "function") updateConnectionStatus(status, msg); }
  closeModals() {
    document.getElementById("modalCreateFolder")?.classList.add("hidden");
    document.getElementById("modalPreview")?.classList.add("hidden");
    if (typeof closeModals === "function") closeModals();
  }
}

class DriveStorageService {
  constructor(config = {}) {
    this.clientId = localStorage.getItem("gdrive_oauth_client_id") || config.gdrive_oauth_client_id;
    this.passphrase = localStorage.getItem("gdrive_encryption_password") || config.gdrive_encryption_password;
    
    this._bucket = localStorage.getItem("sb_bucket") || config.bucket || "Google Drive Vault";
    this.token = localStorage.getItem("gdrive_access_token") || null;
    this.tokenExpiry = localStorage.getItem("gdrive_token_expiry") || null;
    
    this.apiBase = "https://www.googleapis.com/drive/v3/files";
    this.uploadBase = "https://www.googleapis.com/upload/drive/v3/files";
    
    this._folderCache = { "": "root" };
    this.tokenClient = null;
    this.onProgress = config.onProgress || ((msg, type) => console.log(`[${type}] ${msg}`));
  }

  get bucket() {
    return this._bucket;
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

  async _getCryptoKey(passphrase) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    const salt = enc.encode("DriveManagerSecureSalt123");
    return window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async _encryptText(text, passphrase) {
    const key = await this._getCryptoKey(passphrase);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encoded);
    
    const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.byteLength);
    
    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  }

  async _decryptText(base64Cipher, passphrase) {
    const key = await this._getCryptoKey(passphrase);
    const binary = atob(base64Cipher);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }
    
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
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
        fields: 'files(id, name, mimeType, size, modifiedTime)',
        orderBy: 'folder,name',
        pageSize: String(options.limit || 100)
      });
      const res = await fetch(`${this.apiBase}?${params}`, { headers: this._headers() });
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Failed to list items');
      
      const files = (await res.json()).files || [];
      const mapped = files.map(f => {
        const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
        return {
          name: f.name,
          updated_at: f.modifiedTime,
          metadata: { size: Number(f.size || 0) },
          ...(isFolder ? { id: null } : { id: f.id })
        };
      });
      return { data: mapped, error: null };
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
          const decryptedBase64 = await this._decryptText(ciphertext, currentPassphrase);
          const match = decryptedBase64.match(/^data:(.*?);base64,(.*)$/s);
          if (match) {
            const resData = await fetch(`data:${match[1]};base64,${match[2]}`);
            finalBlob = await resData.blob();
          }
        } catch (e) {
          console.warn("Could not decrypt payload, serving raw cipher:", e);
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
      const currentPassphrase = localStorage.getItem("gdrive_encryption_password") || this.passphrase;
      
      if (currentPassphrase && fileName !== ".emptyFolderPlaceholder" && !fileName.endsWith(".enc")) {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const encryptedCipher = await this._encryptText(base64Data, currentPassphrase);
        uploadFile = new File([encryptedCipher], fileName + ".enc", { type: "application/octet-stream" });
      } else if (fileName === ".emptyFolderPlaceholder") {
        uploadFile = new File([file], ".emptyFolderPlaceholder", { type: "text/plain" });
      }

      if (searchJson.files && searchJson.files.length > 0) {
        for (const existing of searchJson.files) {
          await fetch(`${this.apiBase}/${existing.id}`, { method: 'DELETE', headers: this._headers() });
        }
      }

      const metadata = { 
        name: uploadFile.name, 
        mimeType: uploadFile.type || 'application/octet-stream',
        parents: [parentId]
      };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', uploadFile);

      const res = await fetch(`${this.uploadBase}?uploadType=multipart&fields=id,name,mimeType,size`, {
        method: 'POST',
        headers: this._headers(),
        body: form
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Upload failed');
      return { data: await res.json(), error: null };
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
