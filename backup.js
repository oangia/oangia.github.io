class FirebaseUploaderWidget {
    constructor(collectionName = "uploaded_files") {
        this.collectionName = collectionName;
        this.fbService = new FirebaseService();
        this.isRendered = false;
    }

    init(triggerBtnId) {
        const triggerBtn = document.getElementById(triggerBtnId);
        if (!triggerBtn) {
            console.error(`Trigger button with ID "${triggerBtnId}" not found.`);
            return;
        }

        triggerBtn.addEventListener("click", () => {
            if (this.isRendered) {
                const overlay = document.getElementById("fb-modal-overlay");
                if (overlay) {
                    overlay.classList.remove("hidden");
                    this._checkAndConnect();
                }
                return;
            }
            this._renderPanel();
            this._bindEvents();
            this._checkAndConnect();
            this.isRendered = true;
        });
    }

    _renderPanel() {
        const style = document.createElement("style");
        style.innerHTML = `
            #fb-modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
            #fb-modal-overlay.hidden { display: none !important; }
            .fb-widget-container { font-family: ui-sans-serif, system-ui, sans-serif; width: 100%; max-width: 650px; max-height: 85vh; background: #18181b; color: #f4f4f5; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); display: flex; flex-direction: column; overflow: hidden; }
            .fb-widget-header { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; background: #09090b; }
            .fb-widget-header h2 { font-size: 1rem; font-weight: bold; color: #fff; margin: 0; }
            .fb-widget-actions { display: flex; align-items: center; gap: 0.75rem; }
            .fb-widget-close { background: transparent; border: none; color: #a1a1aa; font-size: 1.2rem; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 0.375rem; }
            .fb-widget-close:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
            .fb-widget-body { padding: 1.5rem; overflow-y: auto; flex: 1; }
            .fb-widget-container .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1rem; }
            .fb-widget-container h3 { font-size: 0.875rem; font-weight: 600; color: #e4e4e7; margin-top: 0; margin-bottom: 0.75rem; }
            #fb-status { font-size: 0.75rem; font-weight: 500; color: #38bdf8; margin-top: 0.5rem; }
            .fb-widget-container ul { padding-left: 0; list-style: none; margin: 0; }
            .fb-widget-container li { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
            .fb-widget-container .btn-group { display: flex; gap: 0.375rem; }
            .fb-widget-container li button { width: auto; margin: 0; padding: 0.25rem 0.5rem; font-size: 0.7rem; border-radius: 0.375rem; border: none; font-weight: 600; cursor: pointer; color: white; }
            .fb-widget-container .btn-download { background: #16a34a; }
            .fb-widget-container .btn-download:hover { background: #15803d; }
            .fb-widget-container .btn-delete { background: #dc2626; }
            .fb-widget-container .btn-delete:hover { background: #b91c1c; }
            .fb-widget-container .file-info span { display: block; font-size: 0.75rem; font-weight: 500; color: #f4f4f5; }
            .fb-widget-container .file-info small { color: #a1a1aa; font-size: 0.7rem; }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement("div");
        overlay.id = "fb-modal-overlay";
        overlay.innerHTML = `
            <div class="fb-widget-container">
                <div class="fb-widget-header">
                    <h2>Firebase Storage</h2>
                    <div class="fb-widget-actions">
                        <label class="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-indigo-200 hover:text-white text-xs font-semibold rounded-lg cursor-pointer transition flex items-center gap-1.5">
                            <i class="fa-solid fa-upload"></i>
                            <span id="fb-uploadBtnText">Upload File</span>
                            <input type="file" id="fb-fileInput" class="hidden">
                        </label>
                        <button class="fb-widget-close" id="fb-closeModalBtn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div class="fb-widget-body">
                    <div id="fb-status" style="margin-bottom: 1rem;"></div>
                    <div class="card" style="margin-bottom: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <h3 style="margin: 0;">Uploaded Files</h3>
                            <button id="fb-refreshBtn" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.7rem; margin: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 0.375rem; color: #fff; cursor: pointer;">Refresh</button>
                        </div>
                        <ul id="fb-fileList"></ul>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    _checkAndConnect() {
        const fileList = document.getElementById("fb-fileList");
        const statusDiv = document.getElementById("fb-status");

        const apiKey = localStorage.getItem("fb_apikey") || localStorage.getItem("firebase_api_key");
        const projectId = localStorage.getItem("fb_projectid") || "freedata-4c235";
        const appId = localStorage.getItem("fb_appid") || "1:906764667278:web:aa229456f8de0740923cdf";

        if (!apiKey) {
            fileList.innerHTML = "<li style='justify-content:center; color:#f87171;'>Firebase API Key missing! Please configure it in Settings.</li>";
            return;
        }

        try {
            this.fbService.init({ apiKey, projectId, appId });
            this._loadFiles(fileList, statusDiv);
        } catch (err) {
            console.error(err);
            fileList.innerHTML = `<li style='justify-content:center; color:#f87171;'>Connection error: ${err.message}</li>`;
        }
    }

    _bindEvents() {
        const overlay = document.getElementById("fb-modal-overlay");
        const closeBtn = document.getElementById("fb-closeModalBtn");
        const fileInput = document.getElementById("fb-fileInput");
        const uploadBtnText = document.getElementById("fb-uploadBtnText");
        const statusDiv = document.getElementById("fb-status");
        const refreshBtn = document.getElementById("fb-refreshBtn");
        const fileList = document.getElementById("fb-fileList");

        closeBtn.addEventListener("click", () => {
            overlay.classList.add("hidden");
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.classList.add("hidden");
            }
        });

        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            uploadBtnText.textContent = "Uploading...";
            try {
                await this.fbService.uploadFile(this.collectionName, file, (msg) => {
                    statusDiv.textContent = msg;
                });
                fileInput.value = "";
                statusDiv.textContent = "";
                this._loadFiles(fileList, statusDiv);
            } catch (err) {
                console.error(err);
                statusDiv.textContent = "Error: " + err.message;
            } finally {
                uploadBtnText.textContent = "Upload File";
            }
        });

        refreshBtn.addEventListener("click", () => this._loadFiles(fileList, statusDiv));
    }

    async _loadFiles(fileListEl, statusDiv) {
        fileListEl.innerHTML = "<li style='justify-content:center; color:#a1a1aa;'>Loading files...</li>";
        try {
            const files = await this.fbService.getAllFilenames(this.collectionName);
            fileListEl.innerHTML = "";
            if (files.length === 0) {
                fileListEl.innerHTML = "<li style='justify-content:center; color:#a1a1aa;'>No files found in collection.</li>";
                return;
            }
            files.forEach(f => {
                const li = document.createElement("li");
                const infoDiv = document.createElement("div");
                infoDiv.className = "file-info";
                infoDiv.innerHTML = `<span><strong>${f.filename}</strong></span><small>${f.type} (${f.totalParts} chunks)</small>`;
                
                const btnGroup = document.createElement("div");
                btnGroup.className = "btn-group";

                const downloadBtn = document.createElement("button");
                downloadBtn.textContent = "Download";
                downloadBtn.className = "btn-download";
                downloadBtn.onclick = async () => {
                    downloadBtn.disabled = true;
                    downloadBtn.textContent = "Downloading...";
                    try {
                        const fileRecord = await this.fbService.getFileByFilename(this.collectionName, f.filename, (msg) => {
                            statusDiv.textContent = msg;
                        });
                        if (fileRecord) {
                            const a = document.createElement("a");
                            a.href = fileRecord.dataUrl;
                            a.download = fileRecord.filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            statusDiv.textContent = `Successfully downloaded ${f.filename}!`;
                        }
                    } catch (err) {
                        console.error(err);
                        statusDiv.textContent = "Download failed: " + err.message;
                    } finally {
                        downloadBtn.disabled = false;
                        downloadBtn.textContent = "Download";
                    }
                };

                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                deleteBtn.className = "btn-delete";
                deleteBtn.onclick = async () => {
                    if (!confirm(`Are you sure you want to delete ${f.filename}?`)) return;
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = "Deleting...";
                    try {
                        await this.fbService.deleteFileByFilename(this.collectionName, f.filename, (msg) => {
                            statusDiv.textContent = msg;
                        });
                        this._loadFiles(fileListEl, statusDiv);
                    } catch (err) {
                        console.error(err);
                        statusDiv.textContent = "Deletion failed: " + err.message;
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = "Delete";
                    }
                };

                btnGroup.appendChild(downloadBtn);
                btnGroup.appendChild(deleteBtn);
                li.appendChild(infoDiv);
                li.appendChild(btnGroup);
                fileListEl.appendChild(li);
            });
        } catch (err) {
            console.error(err);
            fileListEl.innerHTML = "<li style='justify-content:center; color:#f87171;'>Failed to load files.</li>";
        }
    }
}
class FolderManagerPanel {
      constructor(triggerSelector) {
        this.trigger = document.querySelector(triggerSelector);
        this.container = null;
        this.localService = null;
        this.isInitialized = false;

        if (this.trigger) {
          this.trigger.addEventListener('click', () => this.open());
        }
      }

      init() {
        if (this.isInitialized) return;

        this.container = document.createElement('div');
        this.container.className = 'fixed inset-0 z-50 bg-slate-950 text-slate-100 font-sans flex flex-col h-screen w-screen overflow-hidden m-0 p-0 hidden';
        this.container.innerHTML = `
          <!-- Toast Container (required by backup.js showToast) -->
          <div id="toastContainer" class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full"></div>

          <!-- Header -->
          <div class="bg-slate-900 px-5 py-3 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center text-lg">
                <i class="fa-solid fa-folder-tree"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white">Folder Manager</h3>
                <p id="itemCountLabel" class="text-[11px] text-slate-400">No folder loaded</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <input
                id="searchInput"
                type="text"
                placeholder="Filter current folder..."
                class="hidden sm:block bg-white/5 border border-white/15 text-slate-200 placeholder-slate-500 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 w-48"
              />
              <label class="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
                <i class="fa-solid fa-folder-plus"></i> Select Folder
                <input type="file" class="widget-folder-input-header hidden" webkitdirectory directory multiple>
              </label>
              <button id="closeFolderPanelBtn" class="text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition cursor-pointer">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Breadcrumb Bar (used by backup.js BreadcrumbManager) -->
          <div id="breadcrumbBar" class="hidden bg-slate-900/70 border-b border-white/10 px-5 py-2 flex items-center justify-between text-xs shrink-0">
            <nav id="breadcrumbNav" class="flex items-center flex-wrap gap-1"></nav>
          </div>

          <!-- Main Content Area -->
          <div id="widget-browser-wrapper" class="flex-1 bg-slate-950 overflow-hidden flex flex-col min-h-0 relative">
            <!-- Initial Select Screen -->
            <div id="selectScreen" class="flex-1 bg-slate-900/40 hover:bg-indigo-950/20 transition-all p-8 flex flex-col items-center justify-center text-center relative cursor-pointer group border-2 border-dashed border-white/15 hover:border-indigo-400 m-4 rounded-2xl">
              <input type="file" class="widget-folder-input-main absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" webkitdirectory directory multiple>
              <div class="pointer-events-none flex flex-col items-center justify-center">
                <div class="w-20 h-20 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform mb-4">
                  <i class="fa-solid fa-folder-open"></i>
                </div>
                <h4 class="text-sm font-bold text-slate-100 mb-1">Click anywhere to select a folder</h4>
                <p class="text-xs text-slate-400 max-w-sm">Loads directory layout with instant previews, SHA-256 hashes, and computed folder sizes.</p>
              </div>
            </div>

            <!-- Grid Container (used by backup.js ItemsGridRenderer) -->
            <div id="gridScrollArea" class="hidden flex-1 overflow-y-auto">
              <div id="itemsGrid"></div>
            </div>
          </div>

          <!-- Preview Modal (required by backup.js FilePreviewManager) -->
          <div id="modalPreview" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <!-- Modal Header -->
              <div class="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
                <h3 id="previewTitle" class="text-sm font-bold text-white truncate">Preview</h3>
                <div class="flex items-center gap-2">
                  <button id="previewCancelEditBtn" onclick="cancelEditText()" class="hidden px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 transition">
                    Discard
                  </button>
                  <button id="previewSaveBtn" onclick="saveEditedText()" class="hidden px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition">
                    <i class="fa-solid fa-floppy-disk mr-1"></i> Save Changes
                  </button>
                  <a id="previewDownloadBtn" href="#" download="" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-download"></i> Download
                  </a>
                  <button onclick="closeModals()" class="text-slate-400 hover:text-white px-2 py-1 text-sm">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>

              <!-- Modal Body + Sidebar -->
              <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div id="previewBody" class="flex-1 p-4 flex items-center justify-center overflow-auto bg-black/40"></div>
                <aside class="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 p-4 overflow-y-auto bg-slate-900/90 shrink-0">
                  <div id="previewSidebarDetails"></div>
                </aside>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(this.container);
        this.bindLogic();
        this.isInitialized = true;
      }

      bindLogic() {
        this.localService = new LocalFileAdapterService();

        const renderLocalFolder = () => {
          const currentPath = breadcrumbManager.path;
          const searchVal = document.getElementById('searchInput').value.toLowerCase();
          let items = this.localService.getItemsAtPath(currentPath);

          if (searchVal) {
            items = items.filter(i => i.name.toLowerCase().includes(searchVal));
          }

          document.getElementById('itemCountLabel').textContent =
            `${items.length} item${items.length !== 1 ? 's' : ''}`;

          gridRenderer.render(items, currentPath);
        };

        // Reuse FilePreviewManager from backup.js
        filePreviewManager = new FilePreviewManager({
          service: this.localService,
          onToast: (msg, type, duration) => showToast(msg, type, duration),
          onSaveSuccess: () => renderLocalFolder()
        });

        // Reuse ItemsGridRenderer from backup.js
        gridRenderer = new ItemsGridRenderer('itemsGrid', {
          onItemClick: (item, fullPath, isFolder) => {
            if (isFolder) {
              breadcrumbManager.navigateToFolder(fullPath, item.name);
            } else {
              const record = this.localService.pathToFile.get(fullPath);
              filePreviewManager.openPreview(fullPath, item.name, record?.size || 0);
            }
          },
          onDeleteClick: (fullPath, isFolder) => {
            this.localService.deleteLocalPath(fullPath, isFolder);
            showToast(`Removed "${fullPath}" from view`, 'success', 2000);
            renderLocalFolder();
          }
        });

        // Reuse BreadcrumbManager from backup.js
        breadcrumbManager = new BreadcrumbManager('breadcrumbNav', {
          onNavigate: () => renderLocalFolder()
        });

        document.getElementById('searchInput').addEventListener('input', renderLocalFolder);

        document.querySelectorAll('.widget-folder-input-main, .widget-folder-input-header').forEach(input => {
          input.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            await this.localService.loadFiles(files);

            document.getElementById('selectScreen').classList.add('hidden');
            document.getElementById('breadcrumbBar').classList.remove('hidden');
            document.getElementById('gridScrollArea').classList.remove('hidden');

            breadcrumbManager.reset();
            breadcrumbManager.history[0].name = this.localService.rootNode.name || 'root';
            breadcrumbManager.render();
            renderLocalFolder();

            showToast(`Loaded "${this.localService.rootNode.name}"`, 'success', 2500);
            e.target.value = '';
          });
        });

        document.getElementById('closeFolderPanelBtn').addEventListener('click', () => this.close());
      }

      open() {
        this.init();
        this.container.classList.remove('hidden');
      }

      close() {
        if (this.container) {
          this.container.classList.add('hidden');
        }
      }
    }
class LocalFileAdapterService {
  constructor() {
    this.rootNode = { name: 'root', children: {}, files: [] };
    this.pathToFile = new Map();
    this.pathToNode = new Map();
  }

  async loadFiles(fileList) {
    // Revoke old blob URLs
    for (const record of this.pathToFile.values()) {
      if (record.fileUrl) URL.revokeObjectURL(record.fileUrl);
    }

    const files = Array.from(fileList || []);
    this.rootNode = { name: 'root', children: {}, files: [] };
    this.pathToFile.clear();
    this.pathToNode.clear();
    this.pathToNode.set('', this.rootNode);

    if (!files.length) return;

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const rootFolderName = firstPath.split('/')[0] || 'root';
    this.rootNode.name = rootFolderName;

    for (const file of files) {
      const rawPath = file.webkitRelativePath || file.name;
      const parts = rawPath.split('/');
      if (parts.length > 1 && parts[0] === rootFolderName) {
        parts.shift();
      }

      const fileName = parts.pop();
      if (!fileName) continue;

      let currentNode = this.rootNode;
      let runningPath = '';

      for (const folderName of parts) {
        runningPath = runningPath ? `${runningPath}/${folderName}` : folderName;
        if (!currentNode.children[folderName]) {
          const newNode = {
            name: folderName,
            path: runningPath,
            children: {},
            files: []
          };
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

  getItemsAtPath(folderPath = '') {
    const node = this.pathToNode.get(folderPath) || this.rootNode;

    // Folders in backup.js ItemsGridRenderer are identified by `!item.id`
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

  // ---- Interface compatibility for backup.js FilePreviewManager ----
  async createSignedUrl(path) {
    const record = this.pathToFile.get(path);
    if (!record) return { data: null, error: new Error('File not found') };
    return { data: { signedUrl: record.fileUrl }, error: null };
  }

  async upload(path, blob) {
    const record = this.pathToFile.get(path);
    if (!record) return { error: new Error('File not found') };
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
        if (key === path || key.startsWith(`${path}/`)) {
          this.pathToNode.delete(key);
        }
      }
      const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      const folderName = path.includes('/') ? path.slice(path.lastIndexOf('/') + 1) : path;
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) delete parentNode.children[folderName];
    } else {
      const rec = this.pathToFile.get(path);
      if (rec?.fileUrl) URL.revokeObjectURL(rec.fileUrl);
      this.pathToFile.delete(path);
      const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      const parentNode = this.pathToNode.get(parentPath);
      if (parentNode) {
        parentNode.files = parentNode.files.filter(f => f.fullPath !== path);
      }
    }
  }
}

function isHtml(filename) {
  return /\.(html|htm)$/i.test(filename);
}
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getExtension(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop() : 'File';
}

function getFileIcon(name) {
  const e = getExtension(name).toLowerCase();
  if (['txt','md','log'].includes(e)) return '<i class="fa-solid fa-file-lines opacity-90 hover:opacity-100"></i>';
  if (['json','js','ts','html','css','py','java','sql'].includes(e)) return '<i class="fa-solid fa-file-code opacity-90 hover:opacity-100"></i>';
  if (['png','jpg','jpeg','gif','webp','svg'].includes(e)) return '<i class="fa-solid fa-file-image opacity-90 hover:opacity-100"></i>';
  if (['mp3','wav','ogg'].includes(e)) return '<i class="fa-solid fa-file-audio opacity-90 hover:opacity-100"></i>';
  if (['mp4','webm','mov'].includes(e)) return '<i class="fa-solid fa-file-video opacity-90 hover:opacity-100"></i>';
  if (['pdf'].includes(e)) return '<i class="fa-solid fa-file-pdf opacity-90 hover:opacity-100"></i>';
  if (['zip','rar','7z'].includes(e)) return '<i class="fa-solid fa-file-zipper opacity-90 hover:opacity-100"></i>';
  return '<i class="fa-solid fa-file opacity-90 hover:opacity-100"></i>';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isImage(name) {
  const e = getExtension(name).toLowerCase();
  return ['png','jpg','jpeg','gif','webp','svg','bmp','ico'].includes(e);
}

function isVideo(name) {
  const e = getExtension(name).toLowerCase();
  return ['mp4','webm','mov','avi','mkv','ogg'].includes(e);
}

function isAudio(name) {
  const e = getExtension(name).toLowerCase();
  return ['mp3','wav','ogg','m4a','flac','aac'].includes(e);
}

function isText(name) {
  const e = getExtension(name).toLowerCase();
  return ['txt','md','json','js','ts','html','css','xml','csv','log','py','sql','yml','yaml'].includes(e);
}

function updateConnectionStatus(connected, message) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (!text || !dot) return;
  text.textContent = message;
  if (connected === true) dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
  else if (connected === false) dot.className = 'w-2 h-2 rounded-full bg-rose-500';
  else dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
}

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');

  let bg = 'bg-slate-900/90 border-slate-700 text-slate-100 backdrop-blur-md';
  let icon = '<i class="fa-solid fa-circle-info text-sky-400 text-base mr-3"></i>';
  let accent = 'border-l-4 border-l-sky-500';

  if (type === 'success') {
    bg = 'bg-slate-900/90 border-emerald-800 text-emerald-100 backdrop-blur-md';
    icon = '<i class="fa-solid fa-circle-check text-emerald-400 text-base mr-3"></i>';
    accent = 'border-l-4 border-l-emerald-500';
  } else if (type === 'error') {
    bg = 'bg-slate-900/90 border-rose-800 text-rose-100 backdrop-blur-md';
    icon = '<i class="fa-solid fa-circle-exclamation text-rose-400 text-base mr-3"></i>';
    accent = 'border-l-4 border-l-rose-500';
  } else if (type === 'warning') {
    bg = 'bg-slate-900/90 border-amber-800 text-amber-100 backdrop-blur-md';
    icon = '<i class="fa-solid fa-triangle-exclamation text-amber-400 text-base mr-3"></i>';
    accent = 'border-l-4 border-l-amber-500';
  }

  toast.className = `pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl ${bg} ${accent} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`;
  toast.innerHTML = `
    <div class="flex items-center">${icon}<span>${escapeHtml(message)}</span></div>
    <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.remove('translate-x-12', 'opacity-0'));
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('translate-x-12', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

function closeModals() {
  document.querySelectorAll('.fixed').forEach(m => {
    if (m.id !== 'toastContainer') m.classList.add('hidden');
  });
  if (filePreviewManager) {
    filePreviewManager.isTextEditor = false;
  }
  document.getElementById('previewSaveBtn')?.classList.add('hidden');
  document.getElementById('previewCancelEditBtn')?.classList.add('hidden');
}

function switchTab(tab) {
  const viewExp = document.getElementById('viewExplorer');
  const viewSet = document.getElementById('viewSettings');
  const tabExp = document.getElementById('navExplorerTab');
  const tabSet = document.getElementById('navSettingsTab');

  if (tab === 'explorer') {
    viewExp.classList.remove('hidden');
    viewSet.classList.add('hidden');
    tabExp.className = "px-3 py-1.5 text-xs font-semibold rounded-md border border-white/75 wire-text transition";
    tabSet.className = "px-3 py-1.5 text-xs font-semibold rounded-md border border-transparent wire-subtext hover:border-white/40 transition";
  } else {
    viewExp.classList.add('hidden');
    viewSet.classList.remove('hidden');
    tabSet.className = "px-3 py-1.5 text-xs font-semibold rounded-md border border-white/75 wire-text transition";
    tabExp.className = "px-3 py-1.5 text-xs font-semibold rounded-md border border-transparent wire-subtext hover:border-white/40 transition";
  }
}

async function computeSha256(messageOrBuffer) {
  const msgBuffer = typeof messageOrBuffer === 'string' 
    ? new TextEncoder().encode(messageOrBuffer) 
    : messageOrBuffer;
    
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class Config {
  constructor(btnId) {
    this.btnId = btnId;
    this.panelId = "configPanel";
    this.overlayId = "configOverlay";

    this.#createPanel();
    this.#bindButton();
    this.#load();

    // Auto-open if no credentials
    if (!localStorage.getItem("sb_url") || !localStorage.getItem("sb_key")) {
      this.open();
    }
  }

  open() {
    document.getElementById(this.overlayId)?.classList.remove("hidden");
    document.getElementById(this.panelId)?.classList.remove("hidden");
  }

  close() {
    document.getElementById(this.overlayId)?.classList.add("hidden");
    document.getElementById(this.panelId)?.classList.add("hidden");
  }

  #createPanel() {
    document.getElementById(this.overlayId)?.remove();
    document.getElementById(this.panelId)?.remove();

    const overlay = document.createElement("div");
    overlay.id = this.overlayId;
    overlay.className = "hidden fixed inset-0 z-[60] bg-black/40";

    const panel = document.createElement("div");
    panel.id = this.panelId;
    panel.className = "hidden fixed inset-0 z-[70] flex items-center justify-center p-6 overflow-y-auto";

    panel.innerHTML = `
      <div class="max-w-4xl w-full bg-zinc-900/0 border border-white/15 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-2xl relative">
        
        <button id="configCloseBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>

        <div class="border-b border-white/10 pb-4">
          <h2 class="text-lg font-bold text-white mb-1">Configuration</h2>
          <p class="text-xs text-slate-400">Enter your Supabase and Firebase credentials.</p>
        </div>
    
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Supabase Card -->
          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">
            <h3 class="font-semibold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-bolt text-emerald-400"></i> Supabase Credentials
            </h3>
            
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Project URL</label>
              <input type="text" name="sb_url" placeholder="https://xxxxx.supabase.co" 
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
            </div>
    
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Anon Public Key</label>
              <input type="text" name="sb_key" placeholder="eyJhbGciOiJIUzI1NiIsIn..." 
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
            </div>
    
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Storage Bucket Name</label>
              <input type="text" name="sb_bucket" placeholder="files" value="files" data-default="files"
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
            </div>
          </div>
    
          <!-- Firebase Card -->
          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">
            <h3 class="font-semibold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-fire text-amber-400"></i> Firebase Credentials
            </h3>
    
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Firebase API Key (<code class="text-[11px] text-indigo-300">apiKey</code>)</label>
              <input type="text" name="fb_apikey" placeholder="AIzaSy..." 
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
            </div>
    
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Project ID (<code class="text-[11px] text-indigo-300">projectId</code>)</label>
              <input type="text" name="fb_projectid" placeholder="my-firebase-project" 
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
            </div>
    
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">App ID (<code class="text-[11px] text-indigo-300">appId</code>)</label>
              <input type="text" name="fb_appid" placeholder="1:123456789:web:abc123" 
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
            </div>
          </div>
        </div>
    
        <div class="pt-2 flex justify-end gap-3">
          <button id="configCancelBtn" class="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">
            Cancel
          </button>
          <button id="configSaveBtn" class="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">
            Save & Connect
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // Events
    document.getElementById("configCloseBtn").onclick = () => this.close();
    document.getElementById("configCancelBtn").onclick = () => this.close();
    overlay.onclick = () => this.close();
    panel.querySelector("div").onclick = (e) => e.stopPropagation();

    document.getElementById("configSaveBtn").onclick = () => this.#save();
  }

  #bindButton() {
    const btn = document.getElementById(this.btnId);
    if (!btn) return;

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.open();
    };
  }

  #load() {
    const panel = document.getElementById(this.panelId);
    if (!panel) return;

    panel.querySelectorAll("input[name]").forEach(el => {
      const saved = localStorage.getItem(el.name);
      if (saved !== null && saved !== "") {
        el.value = saved;
      } else if (el.dataset.default) {
        el.value = el.dataset.default;
      }
    });
  }

  #save() {
    const panel = document.getElementById(this.panelId);
    const inputs = panel.querySelectorAll("input[name]");
    const cfg = Object.fromEntries(
      [...inputs].map(el => [el.name, el.value.trim() || el.dataset.default || ""])
    );

    if (!cfg.sb_url || !cfg.sb_key) {
      showToast("URL and Anon Key are required", "warning");
      return;
    }

    // Only save to localStorage
    Object.entries(cfg).forEach(([k, v]) => localStorage.setItem(k, v));

    this.close();

    // Let the outside world handle the real connection logic
    location.reload();
  }
}

class Tracker {
  constructor(btnId, tasks = null, title = 'Tasks Tracker', options = {}) {
    this.btnId = btnId;
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.title = title;
    this.storageKey = options.storageKey || 'daily_tasks_status';

    this.tasks = tasks || [
      {
        name: 'Learn songs',
        type: 'daily',
        desc: 'Learn as much as possible',
        priority: 0,
        timeline: 2,
        section: 'Music',
        objective: 'useful'
      },
      {
        name: 'Exercise',
        type: 'daily',
        priority: 1,
        timeline: 0,
        section: 'Foundation',
        objective: 'healthy'
      },
      {
        name: 'Reading',
        type: 'daily',
        desc: 'Try to understand how girls, social, the world work',
        priority: 2,
        timeline: 1,
        section: 'Foundation',
        objective: 'useful'
      },
      {
        name: 'Fun',
        type: 'daily',
        desc: 'Having fun is the extension, practice singing, social/girls',
        priority: 3,
        timeline: 3,
        section: 'Fun',
        objective: 'fun',
        alwaysChecked: true
      }
    ];

    this.options = {
      defaultSort: options.defaultSort || 'timeline',
      sortOptions: options.sortOptions || [
        { value: 'timeline', label: 'Timeline (Default)' },
        { value: 'priority', label: 'Priority' },
        { value: 'section', label: 'Section' },
        { value: 'objective', label: 'Objective' }
      ],
      ...options
    };

    this.currentSort = this.options.defaultSort;

    this.objectiveColors = {
      healthy: {
        border: 'border-emerald-500',
        bg: 'peer-checked:bg-emerald-600',
        badge: 'text-emerald-700 bg-emerald-50 border border-emerald-200'
      },
      useful: {
        border: 'border-sky-500',
        bg: 'peer-checked:bg-sky-600',
        badge: 'text-sky-700 bg-sky-50 border border-sky-200'
      },
      fun: {
        border: 'border-amber-400',
        bg: 'peer-checked:bg-amber-500',
        badge: 'text-amber-700 bg-amber-50 border border-amber-200'
      },
      default: {
        border: 'border-slate-300',
        bg: 'peer-checked:bg-slate-600',
        badge: 'text-slate-700 bg-slate-50 border border-slate-200'
      }
    };

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.createPanel();
    this.loadState();
    this.attachEvents();
    this.bindTrigger();
  }

  bindTrigger() {
    const btn = document.getElementById(this.btnId);
    if (btn) {
      btn.addEventListener('click', () => this.open());
    }
  }

  open() {
    this.backdrop.classList.remove('hidden');
    requestAnimationFrame(() => {
      this.backdrop.classList.remove('opacity-0');
      this.panel.classList.remove('translate-x-full');
    });
  }

  close() {
    this.backdrop.classList.add('opacity-0');
    this.panel.classList.add('translate-x-full');
    setTimeout(() => {
      this.backdrop.classList.add('hidden');
    }, 300);
  }

  createPanel() {
    if (this.wrapper) this.wrapper.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = `tracker-wrapper-${this.id}`;

    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className =
      'fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 hidden opacity-0 transition-opacity duration-300';
    this.backdrop.addEventListener('click', () => this.close());

    // Slide-over Panel
    this.panel = document.createElement('div');
    this.panel.className =
      'fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl z-50 flex flex-col transform translate-x-full transition-transform duration-300 ease-out border-l border-slate-200';

    const header = document.createElement('header');
    header.className =
      'w-full bg-slate-900 text-white px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 shadow-sm sticky top-0 z-10';

    const todayFormatted = new Date().toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const sortOptionsHTML = this.options.sortOptions
      .map(
        (opt) =>
          `<option value="${opt.value}" ${this.currentSort === opt.value ? 'selected' : ''}>Sort: ${opt.label}</option>`
      )
      .join('');

    header.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <i class="fa-solid fa-list-check text-xs"></i>
        </div>
        <div>
          <h1 class="text-xs font-bold tracking-tight">${this.title}</h1>
          <p class="text-[10px] text-slate-400">${todayFormatted}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <select id="sort-select-${this.id}" class="text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-slate-700 transition">
          ${sortOptionsHTML}
        </select>
        <div id="progress-badge-${this.id}" class="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          0 / 0 Completed
        </div>
        <button id="close-panel-${this.id}" type="button" class="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer" title="Close">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
    `;

    const main = document.createElement('main');
    main.className = 'w-full flex-grow overflow-y-auto px-3 py-4';

    const mainCard = document.createElement('section');
    mainCard.className = 'w-full bg-white rounded-lg border border-slate-200 shadow-sm p-3.5 space-y-4';
    mainCard.id = `main-card-${this.id}`;

    this.renderTaskListContainer(mainCard);

    main.appendChild(mainCard);
    this.panel.appendChild(header);
    this.panel.appendChild(main);

    this.wrapper.appendChild(this.backdrop);
    this.wrapper.appendChild(this.panel);
    document.body.appendChild(this.wrapper);

    header.querySelector(`#close-panel-${this.id}`).addEventListener('click', () => this.close());

    header.querySelector(`#sort-select-${this.id}`).addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      const currentState = this.captureCurrentCheckStates();
      mainCard.innerHTML = '';
      this.renderTaskListContainer(mainCard);
      this.restoreCheckStates(currentState);
      this.attachEvents();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.backdrop.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  renderTaskListContainer(mainCard) {
    let tasksCopy = [...this.tasks];

    if (this.currentSort === 'timeline') {
      tasksCopy.sort((a, b) => (a.timeline ?? 99) - (b.timeline ?? 99));
    } else if (this.currentSort === 'priority') {
      tasksCopy.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    } else if (this.currentSort === 'section') {
      tasksCopy.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
    } else if (this.currentSort === 'objective') {
      const objectiveRank = { useful: 1, healthy: 2, fun: 3 };
      tasksCopy.sort((a, b) => (objectiveRank[a.objective] || 99) - (objectiveRank[b.objective] || 99));
    }

    const sectionWrapper = document.createElement('div');
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'flex items-center justify-between pb-1.5 mb-2';

    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'text-[10px] font-bold uppercase tracking-wider text-slate-400';
    sectionTitle.textContent = `Sorted by ${this.currentSort}`;

    const sectionCount = document.createElement('span');
    sectionCount.className = 'text-[10px] font-medium text-slate-400';
    sectionCount.textContent = `${tasksCopy.length} ${tasksCopy.length === 1 ? 'task' : 'tasks'}`;

    sectionHeader.appendChild(sectionTitle);
    sectionHeader.appendChild(sectionCount);
    sectionWrapper.appendChild(sectionHeader);

    const ul = document.createElement('ul');
    ul.className = 'space-y-1.5';

    tasksCopy.forEach((taskItem, index) => {
      ul.appendChild(
        this.createTaskListItem(
          taskItem.name,
          taskItem.type || 'daily',
          taskItem.desc || '',
          !!taskItem.disabled,
          taskItem.objective || 'default',
          taskItem.section || 'General',
          index,
          !!taskItem.alwaysChecked
        )
      );
    });

    sectionWrapper.appendChild(ul);
    mainCard.appendChild(sectionWrapper);
  }

  createTaskListItem(taskName, taskType, taskDesc, isDisabled, objectiveKey, sectionName, index, isAlwaysChecked = false) {
    const colors = this.objectiveColors[objectiveKey] || this.objectiveColors.default;
    const id = `task-${this.id}-${index}`;
    const li = document.createElement('li');
    li.className = `flex items-start justify-between p-2 rounded-md border transition ${
      isDisabled
        ? 'opacity-50 bg-slate-50 border-slate-100 cursor-not-allowed'
        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
    }`;

    li.innerHTML = `
      <div class="flex items-start gap-2.5 w-full">
        <label for="${id}" class="relative flex items-start gap-2.5 w-full ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
          <input type="checkbox" id="${id}" data-task="${taskName}" data-type="${taskType}" ${
            isDisabled ? 'disabled' : ''
          } ${isAlwaysChecked ? 'checked data-always-checked="true"' : ''} class="sr-only peer">

          <div class="mt-0.5 w-3.5 h-3.5 rounded border ${colors.border} bg-white ${colors.bg} peer-checked:border-transparent flex items-center justify-center transition flex-shrink-0 ${isDisabled ? 'opacity-50' : ''}">
            <svg class="w-2.5 h-2.5 text-white ${isAlwaysChecked ? 'opacity-100' : 'opacity-0'} transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <div class="flex flex-col flex-grow min-w-0">
            <span class="text-xs font-medium select-none flex items-center flex-wrap gap-1 ${
              isDisabled ? 'text-slate-400 line-through' : 'text-slate-800'
            }">
              <span class="break-words">${taskName}</span>
              <span class="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">${sectionName}</span>
              ${taskType === 'weekly' ? `<span class="text-[9px] px-1 py-0.2 rounded no-underline font-semibold ${colors.badge}">Weekly</span>` : ''}
              ${isDisabled ? '<span class="text-[9px] text-slate-500 bg-slate-200 px-1 py-0.2 rounded no-underline font-normal">Disabled</span>' : ''}
            </span>
            ${taskDesc ? `<span class="text-[10px] text-slate-400 mt-0.5 break-words leading-tight">${taskDesc}</span>` : ''}
          </div>
        </label>
      </div>
    `;

    const checkbox = li.querySelector('input[type="checkbox"]');
    const checkIcon = li.querySelector('svg');

    checkbox.addEventListener('change', () => {
      if (isAlwaysChecked) checkbox.checked = true;
      checkIcon.classList.toggle('opacity-0', !checkbox.checked);
      checkIcon.classList.toggle('opacity-100', checkbox.checked);
    });

    return li;
  }

  captureCurrentCheckStates() {
    const states = {};
    this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach((chk) => {
      states[chk.dataset.task] = chk.checked || chk.dataset.alwaysChecked === 'true';
    });
    return states;
  }

  restoreCheckStates(states) {
    this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach((chk) => {
      if (states[chk.dataset.task] || chk.dataset.alwaysChecked === 'true') {
        chk.checked = true;
        const checkIcon = chk.parentElement.querySelector('svg');
        if (checkIcon) {
          checkIcon.classList.remove('opacity-0');
          checkIcon.classList.add('opacity-100');
        }
      }
    });
  }

  updateProgress() {
    const checkboxes = Array.from(this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])'));
    const total = checkboxes.length;
    const completed = checkboxes.filter((chk) => chk.checked).length;
    const badge = document.getElementById(`progress-badge-${this.id}`);
    if (badge) {
      badge.textContent = `${completed} / ${total} Completed`;
      const ratio = total > 0 ? completed / total : 0;
      let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

      if (ratio === 1 && total > 0) {
        colorClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      } else if (ratio >= 0.75) {
        colorClasses = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      } else if (ratio >= 0.4) {
        colorClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      } else if (completed > 0) {
        colorClasses = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      }

      badge.className = `text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors duration-300 ${colorClasses}`;
    }
  }

  attachEvents() {
    this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach((chk) => {
      chk.addEventListener('change', () => {
        this.saveState();
        this.updateProgress();
      });
    });
    this.updateProgress();
  }

  getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  getWeekKey() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
  }

  saveState() {
    const checkboxes = this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])');
    let existingData = {};
    const storedValue = localStorage.getItem(this.storageKey);
    if (storedValue) {
      try {
        existingData = JSON.parse(storedValue);
      } catch (e) {}
    }

    const currentDailyDate = this.getTodayDateString();
    const currentWeekKey = this.getWeekKey();
    const activeDaily = existingData.dailyDate === currentDailyDate ? existingData.dailyTasks || {} : {};
    const activeWeekly = existingData.weekKey === currentWeekKey ? existingData.weeklyTasks || {} : {};

    checkboxes.forEach((chk) => {
      if (chk.dataset.type === 'weekly') {
        activeWeekly[chk.dataset.task] = chk.checked;
      } else {
        activeDaily[chk.dataset.task] = chk.checked;
      }
    });

    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        dailyDate: currentDailyDate,
        weekKey: currentWeekKey,
        dailyTasks: activeDaily,
        weeklyTasks: activeWeekly
      })
    );
  }

  loadState() {
    const storedValue = localStorage.getItem(this.storageKey);
    const checkboxes = this.panel.querySelectorAll('input[type="checkbox"]:not([disabled])');

    if (!storedValue) {
      checkboxes.forEach((chk) => {
        if (chk.dataset.alwaysChecked === 'true') {
          chk.checked = true;
          const checkIcon = chk.parentElement.querySelector('svg');
          if (checkIcon) {
            checkIcon.classList.remove('opacity-0');
            checkIcon.classList.add('opacity-100');
          }
        }
      });
      return;
    }

    try {
      const data = JSON.parse(storedValue);
      const today = this.getTodayDateString();
      const currentWeek = this.getWeekKey();

      checkboxes.forEach((chk) => {
        const taskName = chk.dataset.task;
        const checkIcon = chk.parentElement.querySelector('svg');

        if (chk.dataset.alwaysChecked === 'true') {
          chk.checked = true;
        } else if (chk.dataset.type === 'weekly') {
          if (data.weekKey === currentWeek && data.weeklyTasks?.[taskName]) chk.checked = true;
        } else {
          if (data.dailyDate === today && data.dailyTasks?.[taskName]) chk.checked = true;
        }

        if (chk.checked && checkIcon) {
          checkIcon.classList.remove('opacity-0');
          checkIcon.classList.add('opacity-100');
        }
      });
    } catch (e) {
      console.error('Failed to parse task localStorage state:', e);
    }
  }
}

(function() {
  'use strict';
  const scriptTag = document.currentScript;
  if (scriptTag) {
    const src = scriptTag.getAttribute('src');
    try {
      const url = new URL(src, window.location.origin);
      const btnId = url.searchParams.get('id');
      if (btnId) {
        window.currentTrackerInstance = new Tracker(btnId);
      }
    } catch (e) {
      // Fallback regex parsing if URL construction fails
      const match = src && src.match(/[?&]id=([^&]+)/);
      if (match) {
        window.currentTrackerInstance = new Tracker(match[1]);
      }
    }
  }
})();
// ==========================================
// ---------- Supabase Manager Class --------
// ==========================================
class SupabaseManager {
  constructor() {
    this.client = null;
    this.bucket = 'files';
  }

  init(config) {
    this.client = window.supabase.createClient(config.url, config.key);
    if (config.bucket) this.bucket = config.bucket;
    this.backup = new SupabaseBackupManager(sbManager, (message, type) => {
      showToast(message, type, type === 'warning' ? 2500 : 3500);
    });
  }

  async list(path, options) {
    if (!this.client) throw new Error('Supabase client not initialized');
    return await this.client.storage.from(this.bucket).list(path, options);
  }

  async createSignedUrl(path, expiresIn) {
    if (!this.client) throw new Error('Supabase client not initialized');
    return await this.client.storage.from(this.bucket).createSignedUrl(path, expiresIn);
  }

  async upload(path, file, options) {
    if (!this.client) throw new Error('Supabase client not initialized');
    return await this.client.storage.from(this.bucket).upload(path, file, options);
  }

  async remove(paths) {
    if (!this.client) throw new Error('Supabase client not initialized');
    return await this.client.storage.from(this.bucket).remove(paths);
  }

  async runBackup() {
    await this.backup.runBackup();
  }
}

class SupabaseBackupManager {
  constructor(supabaseClient, bucketName, onProgress = null) {
    if (!supabaseClient) throw new Error('Supabase client is required for backup.');
    this.supabase = supabaseClient;
    this.bucket = bucketName;
    this.onProgress = onProgress || ((msg) => console.log(msg));
  }

  async runBackup() {
    try {
      this.onProgress('Collecting all files...', 'info');
      const allFiles = await this._listAllFilesRecursive('');

      if (allFiles.length === 0) {
        this.onProgress('Bucket is empty – nothing to backup', 'warning');
        return { success: false, error: 'Bucket is empty' };
      }

      this.onProgress(`Found ${allFiles.length} file(s). Downloading fresh copies...`, 'info');

      const zip = new JSZip();
      const hashParts = [];
      let processed = 0;

      for (const filePath of allFiles) {
        try {
          const { data: signed, error: signErr } = await this.supabase
            .storage
            .from(this.bucket)
            .createSignedUrl(filePath, 60);

          if (signErr) throw signErr;

          const res = await fetch(signed.signedUrl, { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const arrayBuffer = await res.arrayBuffer();
          zip.file(filePath, arrayBuffer);

          hashParts.push({ path: filePath, buffer: arrayBuffer });
        } catch (err) {
          console.warn(`Failed to download ${filePath}:`, err);
          this.onProgress(`Skipped ${filePath}`, 'warning');
        }

        processed++;
        if (processed % 5 === 0 || processed === allFiles.length) {
          this.onProgress(`Downloaded ${processed} / ${allFiles.length}`, 'info');
        }
      }

      this.onProgress('Calculating archive hash...', 'info');
      const shortHash = await this._computeHash(hashParts);

      const today = new Date().toISOString().slice(0, 10);
      const zipName = `${this.bucket}_${today}_${shortHash}.zip`;

      this.onProgress('Compressing into ZIP archive...', 'info');
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      this._triggerDownload(blob, zipName);

      this.onProgress(`Backup ready: ${zipName}`, 'success');
      return { success: true, filename: zipName };
    } catch (err) {
      console.error('Backup failed:', err);
      this.onProgress(err.message || 'Backup failed', 'error');
      return { success: false, error: err.message };
    }
  }

  async _listAllFilesRecursive(prefix = '') {
    const results = [];
    const { data, error } = await this.supabase
      .storage
      .from(this.bucket)
      .list(prefix, { limit: 1000, offset: 0 });

    if (error) throw error;

    for (const item of (data || [])) {
      if (item.name === '.emptyFolderPlaceholder') continue;
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

    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }

  _triggerDownload(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

class FilePreviewManager {
  constructor(options = {}) {
    this.service = options.service;
    
    // Editor State
    this.currentPreviewPath = null;
    this.currentPreviewName = null;
    this.currentPreviewText = null;
    this.isTextEditor = false;
    this.currentArrayBuffer = null;
    this.cachedContentHash = null;
    this.fileSize = 0;

    // Callbacks
    this.onToast = options.onToast || ((msg, type) => showToast(msg, type));
    this.onSaveSuccess = options.onSaveSuccess || (() => {});
  }

  setService(service) {
    this.service = service;
  }

  async openPreview(path, name, fileSize = 0) {
    const title = document.getElementById('previewTitle');
    const body = document.getElementById('previewBody');
    const sidebarDetails = document.getElementById('previewSidebarDetails');
    const downloadBtn = document.getElementById('previewDownloadBtn');
    const saveBtn = document.getElementById('previewSaveBtn');
    const cancelBtn = document.getElementById('previewCancelEditBtn');

    this.currentPreviewPath = path;
    this.currentPreviewName = name;
    this.currentPreviewText = null;
    this.currentArrayBuffer = null;
    this.cachedContentHash = null;
    this.fileSize = fileSize;
    this.isTextEditor = false;

    if (saveBtn) saveBtn.classList.add('hidden');
    if (cancelBtn) cancelBtn.classList.add('hidden');

    if (title) title.textContent = name;
    if (body) body.innerHTML = '<div class="wire-subtext py-12 flex justify-center"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>';
    
    if (sidebarDetails) {
      sidebarDetails.innerHTML = `
        <div class="text-center py-10 space-y-2 wire-subtext">
          <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-400"></i>
          <p class="text-xs">Loading info...</p>
        </div>
      `;
    }

    const modal = document.getElementById('modalPreview');
    if (modal) modal.classList.remove('hidden');

    try {
      const { data, error } = await this.service.createSignedUrl(path, 60);

      if (error) throw error;

      const url = data.signedUrl;
      if (downloadBtn) {
        downloadBtn.href = url;
        downloadBtn.download = name;
      }

      // Render preview based on file type
      if (isImage(name)) {
        body.innerHTML = `<img src="${url}" alt="${escapeHtml(name)}" class="max-w-full h-full shadow-md object-contain">`;
      } else if (isAudio(name)) {
        body.innerHTML = `
          <div class="w-full max-w-lg text-center">
            <audio controls class="w-full mb-3" src="${url}"></audio>
            <p class="text-xs wire-text">${escapeHtml(name)}</p>
          </div>`;
      } else if (isVideo(name)) {
        body.innerHTML = `<video controls class="max-w-full max-h-[70vh] rounded-lg shadow-md wire-border" src="${url}"></video>`;
      } else if (isText(name) || isHtml(name)) {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch file content');
        this.currentArrayBuffer = await res.arrayBuffer();
        if (!this.fileSize) this.fileSize = this.currentArrayBuffer.byteLength;
        const text = new TextDecoder().decode(this.currentArrayBuffer);
        this.currentPreviewText = text;
        this.isTextEditor = true;

        if (isHtml(name)) {
          // Render HTML with a View/Edit Mode Toggle Toolbar & Sandboxed iframe
          body.innerHTML = `
            <div class="flex flex-col h-full w-full">
              <div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
                <div class="flex items-center gap-1 bg-black/40 p-1 rounded wire-border text-xs">
                  <button type="button" onclick="filePreviewManager.switchHtmlView('preview')" id="htmlPreviewTab" class="px-3 py-1 rounded bg-indigo-600 text-white font-medium transition">Preview</button>
                  <button type="button" onclick="filePreviewManager.switchHtmlView('editor')" id="htmlEditorTab" class="px-3 py-1 rounded wire-subtext hover:text-white transition">Code Editor</button>
                </div>
                <span class="text-[11px] wire-subtext italic">HTML Interactive File</span>
              </div>
              <div id="htmlPreviewContainer" class="w-full h-[70vh] bg-white rounded-lg overflow-hidden wire-border">
                <iframe id="htmlPreviewFrame" class="w-full h-full border-0" sandbox="allow-scripts allow-modals"></iframe>
              </div>
              <div id="htmlEditorContainer" class="w-full h-[70vh] hidden">
                <textarea id="editTextarea" class="w-full h-full font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${escapeHtml(text)}</textarea>
              </div>
            </div>
          `;
          setTimeout(() => {
            const frame = document.getElementById('htmlPreviewFrame');
            if (frame) frame.srcdoc = text;
          }, 50);
        } else {
          // Standard text editor view
          body.innerHTML = `<textarea id="editTextarea" class="w-full h-[75vh] font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${escapeHtml(text)}</textarea>`;
        }

        if (saveBtn) saveBtn.classList.remove('hidden');
        if (cancelBtn) cancelBtn.classList.remove('hidden');
      } else {
        body.innerHTML = `
          <div class="text-center space-y-4 py-12 wire-subtext">
            <i class="fa-solid fa-file text-5xl"></i>
            <p class="text-sm">Preview not available for this file type.</p>
          </div>`;
      }

      // Pass the url parameter here
      await this.renderSidebarLazy(path, name, this.fileSize, url);

    } catch (err) {
      this.onToast(err.message || 'Failed to load file', 'error');
      if (sidebarDetails) {
        sidebarDetails.innerHTML = `<div class="p-3 bg-rose-950/60 border border-rose-500/50 text-rose-200 rounded text-xs">Failed to load details</div>`;
      }
    }
  }

  switchHtmlView(mode) {
    const previewTab = document.getElementById('htmlPreviewTab');
    const editorTab = document.getElementById('htmlEditorTab');
    const previewContainer = document.getElementById('htmlPreviewContainer');
    const editorContainer = document.getElementById('htmlEditorContainer');
    const textarea = document.getElementById('editTextarea');

    if (!previewTab || !editorTab || !previewContainer || !editorContainer) return;

    if (mode === 'preview') {
      if (textarea && this.currentPreviewText !== textarea.value) {
        this.currentPreviewText = textarea.value;
        const frame = document.getElementById('htmlPreviewFrame');
        if (frame) frame.srcdoc = this.currentPreviewText;
      }

      previewTab.className = "px-3 py-1 rounded bg-indigo-600 text-white font-medium transition";
      editorTab.className = "px-3 py-1 rounded wire-subtext hover:text-white transition";
      previewContainer.classList.remove('hidden');
      editorContainer.classList.add('hidden');
    } else {
      previewTab.className = "px-3 py-1 rounded wire-subtext hover:text-white transition";
      editorTab.className = "px-3 py-1 rounded bg-indigo-600 text-white font-medium transition";
      previewContainer.classList.add('hidden');
      editorContainer.classList.remove('hidden');
      if (textarea) textarea.focus();
    }
  }

  async renderSidebarLazy(path, name, fileSize, url) {
    const sidebarDetails = document.getElementById('previewSidebarDetails');
    if (!sidebarDetails) return;

    const pathHash = await computeSha256(path);

    sidebarDetails.innerHTML = `
      <div class="space-y-4 text-xs wire-subtext">
        <div>
          <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Name</span>
          <p class="wire-text font-medium break-all">${escapeHtml(name)}</p>
        </div>
        <div>
          <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Size</span>
          <p class="wire-text font-mono text-xs">${fileSize ? formatBytes(fileSize) + ` (${fileSize} bytes)` : 'Unknown'}</p>
        </div>

        <!-- Signed URL & Direct Download -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">Signed URL</span>
            <div class="space-x-2">
              <button onclick="navigator.clipboard.writeText('${escapeHtml(url)}'); showToast('URL copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy</button>
              <a href="${escapeHtml(url)}" download="${escapeHtml(name)}" class="text-[11px] text-indigo-300 hover:text-indigo-200"><i class="fa-solid fa-download"></i> Download</a>
            </div>
          </div>
          <div class="font-mono text-[9px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all max-h-16 overflow-y-auto">${escapeHtml(url)}</div>
        </div>

        <hr class="border-white/20">

        <!-- 1. Path Hash (Instant) -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">1. Path Hash</span>
            <button onclick="navigator.clipboard.writeText('${pathHash}'); showToast('Path hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
          </div>
          <div>
            <span class="text-[10px] wire-subtext block mb-0.5">Exact string hashed: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">${escapeHtml(path)}</code></span>
            <div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${pathHash}</div>
          </div>
        </div>

        <!-- 2. Content & Combined Hashes Trigger -->
        <div class="space-y-3" id="hashesComputeContainer">
          <div>
            <span class="text-[10px] wire-subtext block mb-1">Content & Combined Hashes are uncalculated</span>
            <button onclick="filePreviewManager.computeContentAndCombinedHashes()" class="w-full py-2.5 bg-transparent hover:border-indigo-300 wire-border text-indigo-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-fingerprint"></i> Calculate Content & Combined Hashes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async computeContentAndCombinedHashes() {
    const container = document.getElementById('hashesComputeContainer');
    if (!container || !this.currentPreviewPath) return;

    container.innerHTML = `
      <div class="flex items-center justify-center py-4 wire-subtext text-xs gap-2">
        <i class="fa-solid fa-spinner fa-spin text-indigo-400 text-base"></i> Fetching file & computing hashes...
      </div>
    `;

    try {
      if (!this.currentArrayBuffer) {
        const { data, error } = await this.service.createSignedUrl(this.currentPreviewPath, 60);

        if (error) throw error;

        const res = await fetch(data.signedUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch file content');
        this.currentArrayBuffer = await res.arrayBuffer();
        if (!this.fileSize) this.fileSize = this.currentArrayBuffer.byteLength;
      }

      const pathHash = await computeSha256(this.currentPreviewPath);
      const contentHash = await computeSha256(this.currentArrayBuffer);
      this.cachedContentHash = contentHash;

      const rawCombinedString = pathHash + contentHash;
      const combinedHash = await computeSha256(rawCombinedString);

      container.innerHTML = `
        <div class="space-y-4">
          <!-- 2. Content Hash -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">2. Content Hash</span>
              <button onclick="navigator.clipboard.writeText('${contentHash}'); showToast('Content hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
            </div>
            <div>
              <span class="text-[10px] wire-subtext block mb-0.5">Hashed input: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">ArrayBuffer (${this.currentArrayBuffer.byteLength} bytes)</code></span>
              <div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${contentHash}</div>
            </div>
          </div>

          <!-- 3. Combined Hash -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">3. Combined Hash</span>
              <button onclick="navigator.clipboard.writeText('${combinedHash}'); showToast('Combined hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
            </div>
            <div>
              <span class="text-[10px] wire-subtext block mb-0.5">Exact concatenated string hashed:</span>
              <div class="font-mono text-[9px] bg-black/40 wire-subtext p-1.5 rounded wire-border break-all select-all max-h-14 overflow-y-auto mb-1">${escapeHtml(rawCombinedString)}</div>
              <div class="font-mono text-[10px] bg-slate-950/90 text-emerald-400 p-2 rounded wire-border break-all select-all">${combinedHash}</div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="text-xs text-rose-400 p-2 bg-rose-950/60 wire-border rounded">Failed to compute hashes: ${escapeHtml(err.message)}</div>`;
    }
  }

  cancelEditText() {
    if (!this.isTextEditor || this.currentPreviewText === null) return;
    const textarea = document.getElementById('editTextarea');
    if (textarea) {
      textarea.value = this.currentPreviewText;
    }
    this.onToast('Changes discarded', 'info', 1500);
  }

  async saveEditedText() {
    const textarea = document.getElementById('editTextarea');
    if (!textarea || !this.currentPreviewPath || !this.isTextEditor) return;

    const newContent = textarea.value;
    try {
      this.onToast('Saving...', 'info', 1500);
      const contentType = isHtml(this.currentPreviewName) ? 'text/html' : 'text/plain;charset=utf-8';
      const blob = new Blob([newContent], { type: contentType });
      
      const { error } = await this.service.upload(this.currentPreviewPath, blob, {
        cacheControl: 'no-cache',
        upsert: true,
        contentType: isHtml(this.currentPreviewName) ? 'text/html' : 'text/plain'
      });

      if (error) throw error;

      this.currentPreviewText = newContent;
      this.currentArrayBuffer = await blob.arrayBuffer();
      this.fileSize = this.currentArrayBuffer.byteLength;
      this.cachedContentHash = null;
      
      // Re-fetch a fresh URL/sidebar state after saving
      const { data } = await this.service.createSignedUrl(this.currentPreviewPath, 60);
      await this.renderSidebarLazy(this.currentPreviewPath, this.currentPreviewName, this.fileSize, data?.signedUrl);

      this.onToast('File saved successfully', 'success');
      this.onSaveSuccess();
    } catch (err) {
      console.error(err);
      this.onToast(err.message || 'Failed to save file', 'error');
    }
  }
}

class ItemsGridRenderer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onItemClick = options.onItemClick || (() => {});
    this.onDeleteClick = options.onDeleteClick || (() => {});
  }

  render(items, currentPath) {
    if (!this.container) return;
    
    this.container.className = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 p-4 text-slate-100";
    this.container.innerHTML = '';

    if (!items || items.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400 text-sm">
          <i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-90 hover:opacity-100"></i>
          No items found
        </div>`;
      return;
    }

    items.forEach(item => {
      const isFolder = !item.id;
      const fullPath = item.fullPath || (currentPath ? `${currentPath}/${item.name}` : item.name);
      const sizeStr = isFolder ? '' : formatBytes(item.metadata?.size || 0);

      const card = document.createElement('div');
      
      card.className = `
        group relative bg-transparent border border-white/20 hover:border-indigo-400 
        rounded-xl p-3 flex flex-col items-center justify-between text-center 
        cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 
        aspect-square overflow-hidden
      `;

      card.onclick = () => this.onItemClick(item, fullPath, isFolder);

      const mediaHTML = this.buildMediaPreview(item, isFolder);

      card.innerHTML = `
        <button 
          class="delete-btn absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 
                 w-6 h-6 flex items-center justify-center rounded-full 
                 bg-black/50 hover:bg-red-500 text-white transition"
          title="Delete">
          <i class="fa-solid fa-xmark text-[10px]"></i>
        </button>

        ${mediaHTML}

        <div class="w-full pt-2 border-t border-white/20 flex flex-col">
          <span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(item.name)}">
            ${escapeHtml(item.name)}
          </span>
          <span class="text-[9px] text-slate-300 font-mono mt-0.5">
            ${isFolder ? (sizeStr || 'Folder') : sizeStr}
          </span>
        </div>
      `;

      const deleteBtn = card.querySelector('.delete-btn');
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.onDeleteClick(fullPath, isFolder);
      };

      this.container.appendChild(card);
    });
  }

  buildMediaPreview(item, isFolder) {
    if (isFolder) {
      return `
        <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-folder text-5xl opacity-90 hover:opacity-100"></i>
        </div>`;
    }

    if (item.thumbUrl && isImage(item.name)) {
      return `
        <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors opacity-90 hover:opacity-100">
          <img src="${item.thumbUrl}" alt="" class="w-full h-full object-cover rounded-lg" loading="lazy" onerror="this.style.display='none'">
        </div>`;
    }

    if (item.thumbUrl && isVideo(item.name)) {
      return `
        <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors opacity-90 hover:opacity-100">
          <video src="${item.thumbUrl}#t=0.5" class="w-full h-full object-cover rounded-lg pointer-events-none" muted playsinline preload="metadata"></video>
          <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">VIDEO</div>
        </div>`;
    }

    const ext = (getExtension(item.name) || 'FILE').toUpperCase();
    return `
      <div class="widget-preview-area flex-1 w-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-transparent relative transition-colors gap-1">
        <div class="text-3xl text-slate-200">${getFileIcon(item.name)}</div>
        <span class="text-[9px] font-mono text-slate-300 uppercase tracking-wide">${escapeHtml(ext)}</span>
      </div>`;
  }
}

class BreadcrumbManager {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onNavigate = options.onNavigate || (() => {});
    this.history = [{ path: '', name: 'root' }];
    this.currentPath = '';
  }

  get path() {
    return this.currentPath;
  }

  navigateToFolder(path, name) {
    if (this.currentPath === path) return;
    this.currentPath = path;
    this.history.push({ path, name });
    this.render();
    this.onNavigate(this.currentPath);
  }

  jumpToBreadcrumb(index) {
    this.history = this.history.slice(0, index + 1);
    this.currentPath = this.history[this.history.length - 1].path;
    this.render();
    this.onNavigate(this.currentPath);
  }

  reset() {
    this.currentPath = '';
    this.history = [{ path: '', name: 'root' }];
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.history.forEach((crumb, idx) => {
      const isLast = idx === this.history.length - 1;
      const btn = document.createElement('button');
      
      btn.className = (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center";
      
      if (crumb.name.toLowerCase() === 'root') {
        btn.innerHTML = `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(crumb.name)}</span>`;
      } else {
        btn.textContent = crumb.name;
      }

      btn.onclick = () => this.jumpToBreadcrumb(idx);
      this.container.appendChild(btn);

      if (!isLast) {
        const sep = document.createElement('span');
        sep.className = "opacity-50 mx-1";
        sep.textContent = '/';
        this.container.appendChild(sep);
      }
    });
  }
}

// ==========================================
// ---------- Global State & Init -----------
// ==========================================

let allItems = [];
let filteredItems = [];
let filePreviewManager = null;
let gridRenderer = null;
let breadcrumbManager = null;
const sbManager = new SupabaseManager();

window.addEventListener('DOMContentLoaded', () => {
  filePreviewManager = new FilePreviewManager({
    service: sbManager,
    onToast: (msg, type, duration) => showToast(msg, type, duration),
    onSaveSuccess: () => listFiles()
  });

  gridRenderer = new ItemsGridRenderer('itemsGrid', {
    onItemClick: (item, fullPath, isFolder) => {
      if (isFolder) {
        breadcrumbManager.navigateToFolder(fullPath, item.name);
      } else {
        openPreview(fullPath, item.name);
      }
    },
    onDeleteClick: (fullPath, isFolder) => {
      deleteItem(fullPath, isFolder);
    }
  });

  breadcrumbManager = new BreadcrumbManager('breadcrumbNav', {
    onNavigate: (path) => {
      listFiles();
    }
  });

  // Only this line is needed for config
new Config("navSettingsTab");
new FolderManagerPanel('#openFolderManagerBtn');
  // Auto connect if credentials exist
  const savedUrl = localStorage.getItem('sb_url');
  const savedKey = localStorage.getItem('sb_key');
  const savedBucket = localStorage.getItem('sb_bucket') || 'files';

  if (savedUrl && savedKey) {
    try {
      sbManager.init({ url: savedUrl, key: savedKey, bucket: savedBucket });
      if (filePreviewManager) {
        filePreviewManager.setService(sbManager);
      }
      document.getElementById('headerUrl').innerHTML = savedUrl + '<br />Bucket: ' + savedBucket;
      if (breadcrumbManager) {
        breadcrumbManager.reset();
      }
      listFiles();
    } catch (err) {
      console.error(err);
      showToast('Failed to initialize Supabase client', 'error');
    }
  } else {
    updateConnectionStatus(false, 'Please configure credentials in Settings');
  }
});

// ==========================================
// ---------- File Operations ---------------
// ==========================================

async function listFiles() {
  updateConnectionStatus(null, 'Loading...');
  try {
    const activePath = breadcrumbManager ? breadcrumbManager.path : '';
    const { data, error } = await sbManager.list(activePath, {
      limit: 500,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) throw error;

    allItems = (data || []).filter(item => item.name !== '.emptyFolderPlaceholder');

    await Promise.all(allItems.map(async (item) => {
      const isFolder = !item.id;
      if (isFolder) return;

      const activePath = breadcrumbManager ? breadcrumbManager.path : '';
      const fullPath = activePath ? `${activePath}/${item.name}` : item.name;
      item.fullPath = fullPath;

      if (isImage(item.name) || isVideo(item.name)) {
        try {
          const { data: signed, error: signErr } = await sbManager.createSignedUrl(fullPath, 60);
          if (!signErr && signed?.signedUrl) {
            item.thumbUrl = signed.signedUrl;
          }
        } catch (e) {}
      }
    }));

    updateConnectionStatus(true, `Connected • Bucket: ${sbManager.bucket}`);
    renderView();
  } catch (err) {
    console.error(err);
    updateConnectionStatus(false, err.message || 'Failed to list files');
    showToast(err.message || 'Failed to list files', 'error');
  }
}

function renderView() {
  if (breadcrumbManager) {
    breadcrumbManager.render();
  }

  const searchVal = document.getElementById('searchInput').value.toLowerCase();
  filteredItems = searchVal
    ? allItems.filter(i => i.name.toLowerCase().includes(searchVal))
    : [...allItems];

  filteredItems.sort((a, b) => {
    const aFolder = !a.id;
    const bFolder = !b.id;
    if (aFolder !== bFolder) return aFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  document.getElementById('itemCountLabel').textContent = `${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`;

  if (gridRenderer) {
    const activePath = breadcrumbManager ? breadcrumbManager.path : '';
    gridRenderer.render(filteredItems, activePath);
  }
}

function handleSearch() {
  renderView();
}

function openCreateFolderModal() {
  document.getElementById('folderNameInput').value = '';
  document.getElementById('modalCreateFolder').classList.remove('hidden');
}

async function submitCreateFolder() {
  const name = document.getElementById('folderNameInput').value.trim();
  if (!name) return;

  const activePath = breadcrumbManager ? breadcrumbManager.path : '';
  const folderPath = activePath ? `${activePath}/${name}/.emptyFolderPlaceholder` : `${name}/.emptyFolderPlaceholder`;

  try {
    const { error } = await sbManager.upload(folderPath, new Blob(['']), { upsert: false });
    if (error) throw error;

    closeModals();
    showToast(`Folder "${name}" created`, 'success');
    listFiles();
  } catch (err) {
    showToast(err.message || 'Failed to create folder', 'error');
  }
}

function toggleActionsMenu() {
  const menu = document.getElementById("actionsMenu");
  if (menu) menu.classList.toggle("hidden");
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('actionsMenu');
  if (!menu) return;
  if (!menu.contains(e.target) && !e.target.closest('button')?.getAttribute('onclick')?.includes('toggleActionsMenu')) {
    menu.classList.add('hidden');
  }
});

async function handleFileUpload(event, isFolderUpload = false) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  showToast(`Uploading ${files.length} item(s) sequentially...`, 'info', 2500);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const activePath = breadcrumbManager ? breadcrumbManager.path : '';
      let targetPath = activePath ? `${activePath}/` : '';

      if (isFolderUpload && file.webkitRelativePath) {
        targetPath += file.webkitRelativePath;
      } else {
        targetPath += file.name;
      }

      const { error } = await sbManager.upload(targetPath, file, {
        cacheControl: '3600',
        upsert: true
      });

      if (error) throw error;
      success++;

      if ((i + 1) % 5 === 0 || i === files.length - 1) {
        showToast(`Uploaded ${i + 1} / ${files.length}`, 'info', 1200);
      }
    } catch (err) {
      console.error(err);
      failed++;
      showToast(`Failed: ${file.name}`, 'error', 2500);
    }
  }

  await listFiles();

  if (failed === 0) {
    showToast(`Successfully uploaded ${success} item(s)`, 'success');
  } else {
    showToast(`Uploaded ${success}, failed ${failed}`, 'warning');
  }

  event.target.value = '';
}

async function openPreview(path, name) {
  if (filePreviewManager) {
    await filePreviewManager.openPreview(path, name);
  }
}

function cancelEditText() {
  if (filePreviewManager) {
    filePreviewManager.cancelEditText();
  }
}

async function saveEditedText() {
  if (filePreviewManager) {
    await filePreviewManager.saveEditedText();
  }
}

async function downloadFile(path, name) {
  try {
    const { data, error } = await sbManager.createSignedUrl(path, 60);
    if (error) throw error;

    const res = await fetch(data.signedUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    showToast(err.message || 'Download failed', 'error');
  }
}

async function createBackup() {
  const btn = document.getElementById('backupBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Backing up...</span>';

  await sbManager.runBackup();

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-box-archive"></i> <span>Backup</span>';
}

async function deleteItem(path, isFolder) {
  if (!confirm(isFolder
    ? `Delete folder "${path}" and all its contents?`
    : `Delete file "${path}"?`)) return;

  try {
    if (isFolder) {
      const { data: files, error: listError } = await sbManager.list(path, { limit: 1000 });
      if (listError) throw listError;

      const pathsToDelete = [];
      if (files && files.length > 0) {
        for (const f of files) {
          pathsToDelete.push(`${path}/${f.name}`);
        }
      }
      pathsToDelete.push(`${path}/.emptyFolderPlaceholder`);

      if (pathsToDelete.length > 0) {
        const { error } = await sbManager.remove(pathsToDelete);
        if (error) throw error;
      }
    } else {
      const { error } = await sbManager.remove([path]);
      if (error) throw error;
    }

    showToast('Deleted successfully', 'success');
    listFiles();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Delete failed', 'error');
  }
}
