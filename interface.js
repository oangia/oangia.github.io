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
  // Initialize managers
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

  // ===== Config Class – only this line is needed =====
  new Config("navSettingsTab");

  // Auto-connect if credentials already exist
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
// ---------- Config Class ------------------
// ==========================================

class Config {
  constructor(btnId) {
    this.btnId = btnId;
    this.panelId = "configPanel";
    this.overlayId = "configOverlay";

    this.#createPanel();
    this.#bindButton();
    this.#load();

    // Auto-open if no credentials exist
    const hasCreds = localStorage.getItem("sb_url") && localStorage.getItem("sb_key");
    if (!hasCreds) {
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
    overlay.className = "hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm";

    const panel = document.createElement("div");
    panel.id = this.panelId;
    panel.className = "hidden fixed inset-0 z-[70] flex items-center justify-center p-4";

    panel.innerHTML = `
      <div class="bg-zinc-900/95 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/15 bg-zinc-900/95 backdrop-blur">
          <div>
            <h2 class="text-lg font-bold text-white">Configuration</h2>
            <p class="text-xs text-slate-400 mt-0.5">Supabase + Firebase credentials</p>
          </div>
          <button id="configCloseBtn" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Supabase -->
            <div class="bg-black/30 border border-white/10 p-5 rounded-xl space-y-4">
              <h3 class="font-semibold text-sm text-white flex items-center gap-2">
                <i class="fa-solid fa-bolt text-emerald-400"></i> Supabase
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
                <label class="block text-xs font-medium text-slate-300 mb-1">Storage Bucket</label>
                <input type="text" name="sb_bucket" placeholder="files" value="files" data-default="files"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>
            </div>

            <!-- Firebase -->
            <div class="bg-black/30 border border-white/10 p-5 rounded-xl space-y-4">
              <h3 class="font-semibold text-sm text-white flex items-center gap-2">
                <i class="fa-solid fa-fire text-amber-400"></i> Firebase
              </h3>

              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">API Key</label>
                <input type="text" name="fb_apikey" placeholder="AIzaSy..."
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Project ID</label>
                <input type="text" name="fb_projectid" placeholder="my-firebase-project"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">App ID</label>
                <input type="text" name="fb_appid" placeholder="1:123456789:web:abc123"
                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button id="configCancelBtn" class="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">
              Cancel
            </button>
            <button id="configSaveBtn" class="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">
              Save & Connect
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    document.getElementById("configCloseBtn").onclick = () => this.close();
    document.getElementById("configCancelBtn").onclick = () => this.close();
    overlay.onclick = () => this.close();
    panel.querySelector("div").onclick = (e) => e.stopPropagation();

    document.getElementById("configSaveBtn").onclick = () => this.#save();
  }

  #bindButton() {
    const btn = document.getElementById(this.btnId);
    if (!btn) {
      console.warn(`[Config] Button #${this.btnId} not found`);
      return;
    }

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

    Object.entries(cfg).forEach(([k, v]) => localStorage.setItem(k, v));

    try {
      sbManager.init({ url: cfg.sb_url, key: cfg.sb_key, bucket: cfg.sb_bucket });

      if (typeof filePreviewManager !== "undefined" && filePreviewManager) {
        filePreviewManager.setService(sbManager);
      }

      const headerEl = document.getElementById("headerUrl");
      if (headerEl) {
        headerEl.innerHTML = `${cfg.sb_url}<br>Bucket: ${cfg.sb_bucket}`;
      }

      if (typeof breadcrumbManager !== "undefined" && breadcrumbManager) {
        breadcrumbManager.reset();
      }

      if (typeof listFiles === "function") {
        listFiles();
      }

      this.close();
      showToast("Connected successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to initialize Supabase client", "error");
    }
  }
}

// ==========================================
// ---------- File Operations & Core --------
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

// ---------- Render ----------
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

// ---------- Create Folder ----------
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

// ---------- Upload ----------
function toggleActionsMenu() {
  const menu = document.getElementById("actionsMenu");
  if (menu) {
    menu.classList.toggle("hidden");
  }
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

  document.getElementById('uploadMenu')?.classList.add('hidden');
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

// ---------- Preview Wrappers ----------
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

// ---------- Backup ----------
async function createBackup() {
  const btn = document.getElementById('backupBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Backing up...</span>';

  await sbManager.runBackup();

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-box-archive"></i> <span>Backup</span>';
}

async function listAllFilesRecursive(prefix = '') {
  const results = [];
  const { data, error } = await sbManager.list(prefix, { limit: 1000, offset: 0 });

  if (error) throw error;

  for (const item of (data || [])) {
    if (item.name === '.emptyFolderPlaceholder') continue;

    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (!item.id) {
      const subFiles = await listAllFilesRecursive(fullPath);
      results.push(...subFiles);
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------- Delete ----------
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
