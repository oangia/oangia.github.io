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

      await this.renderSidebarLazy(path, name, this.fileSize);

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

  async renderSidebarLazy(path, name, fileSize) {
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
      
      await this.renderSidebarLazy(this.currentPreviewPath, this.currentPreviewName, this.fileSize);

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
          <i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-60"></i>
          No items found
        </div>`;
      return;
    }

    items.forEach(item => {
      const isFolder = !item.id;
      const fullPath = item.fullPath || (currentPath ? `${currentPath}/${item.name}` : item.name);
      const sizeStr = isFolder ? '' : this.formatBytes(item.metadata?.size || 0);

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
          <span class="w-full text-xs font-semibold text-slate-200 truncate" title="${this.escapeHtml(item.name)}">
            ${this.escapeHtml(item.name)}
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
          <i class="fa-solid fa-folder text-5xl"></i>
        </div>`;
    }

    if (item.thumbUrl && this.isImage(item.name)) {
      return `
        <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
          <img src="${item.thumbUrl}" alt="" class="w-full h-full object-cover rounded-lg" loading="lazy" onerror="this.style.display='none'">
        </div>`;
    }

    if (item.thumbUrl && this.isVideo(item.name)) {
      return `
        <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
          <video src="${item.thumbUrl}#t=0.5" class="w-full h-full object-cover rounded-lg pointer-events-none" muted playsinline preload="metadata"></video>
          <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">VIDEO</div>
        </div>`;
    }

    const ext = (this.getExtension(item.name) || 'FILE').toUpperCase();
    return `
      <div class="widget-preview-area flex-1 w-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-transparent relative transition-colors gap-1">
        <div class="text-3xl text-slate-200">${this.getFileIcon(item.name)}</div>
        <span class="text-[9px] font-mono text-slate-300 uppercase tracking-wide">${this.escapeHtml(ext)}</span>
      </div>`;
  }

  isImage(name) { return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name); }
  isVideo(name) { return /\.(mp4|webm|ogg|mov)$/i.test(name); }
  getExtension(name) {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop() : '';
  }

  getFileIcon(name) {
    const ext = this.getExtension(name).toLowerCase();
    if (['pdf'].includes(ext)) return '<i class="fa-solid fa-file-pdf text-red-400"></i>';
    if (['doc', 'docx'].includes(ext)) return '<i class="fa-solid fa-file-word text-blue-400"></i>';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '<i class="fa-solid fa-file-excel text-green-400"></i>';
    if (['zip', 'rar', 'tar', 'gz'].includes(ext)) return '<i class="fa-solid fa-file-zipper text-yellow-400"></i>';
    if (['mp3', 'wav', 'aac'].includes(ext)) return '<i class="fa-solid fa-file-audio text-purple-400"></i>';
    return '<i class="fa-solid fa-file-lines text-slate-300"></i>';
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

let currentPath = '';
let folderHistory = [{ path: '', name: 'root' }];
let allItems = [];
let filteredItems = [];
let filePreviewManager = null;
let gridRenderer = null;
const sbManager = new SupabaseManager();
// ==========================================
// ---------- Init & Core Logic -------------
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  const savedUrl = localStorage.getItem('sb_url');
  const savedKey = localStorage.getItem('sb_key');
  const savedBucket = localStorage.getItem('sb_bucket') || 'files';

  if (savedUrl) document.getElementById('settingUrlInput').value = savedUrl;
  if (savedKey) document.getElementById('settingApiKeyInput').value = savedKey;
  document.getElementById('settingBucketInput').value = savedBucket;

  const savedFbApiKey = localStorage.getItem('fb_apikey');
  const savedFbAppId = localStorage.getItem('fb_appid');
  const savedFbProjectId = localStorage.getItem('fb_projectid');
  const savedFbBucket = localStorage.getItem('fb_bucket');

  if (savedFbApiKey && document.getElementById('settingFirebaseApiKeyInput')) {
    document.getElementById('settingFirebaseApiKeyInput').value = savedFbApiKey;
  }
  if (savedFbAppId && document.getElementById('settingFirebaseAppIdInput')) {
    document.getElementById('settingFirebaseAppIdInput').value = savedFbAppId;
  }
  if (savedFbProjectId && document.getElementById('settingFirebaseProjectIdInput')) {
    document.getElementById('settingFirebaseProjectIdInput').value = savedFbProjectId;
  }
  if (savedFbBucket && document.getElementById('settingFirebaseBucketInput')) {
    document.getElementById('settingFirebaseBucketInput').value = savedFbBucket;
  }

  filePreviewManager = new FilePreviewManager({
    service: sbManager,
    onToast: (msg, type, duration) => showToast(msg, type, duration),
    onSaveSuccess: () => listFiles()
  });

  // Initialize the dedicated Grid Renderer for itemsGrid
  gridRenderer = new ItemsGridRenderer('itemsGrid', {
    onItemClick: (item, fullPath, isFolder) => {
      if (isFolder) {
        navigateToFolder(fullPath, item.name);
      } else {
        openPreview(fullPath, item.name);
      }
    },
    onDeleteClick: (fullPath, isFolder) => {
      deleteItem(fullPath, isFolder);
    }
  });

  if (savedUrl && savedKey) {
    initSupabase(savedUrl, savedKey, savedBucket);
  } else {
    updateConnectionStatus(false, 'Please configure credentials in Settings');
    switchTab('settings');
  }
});

function saveSettings() {
  const url = document.getElementById('settingUrlInput').value.trim();
  const key = document.getElementById('settingApiKeyInput').value.trim();
  const bucket = document.getElementById('settingBucketInput').value.trim() || 'files';

  const fbApiKey = document.getElementById('settingFirebaseApiKeyInput')?.value.trim() || '';
  const fbAppId = document.getElementById('settingFirebaseAppIdInput')?.value.trim() || '';
  const fbProjectId = document.getElementById('settingFirebaseProjectIdInput')?.value.trim() || '';
  const fbBucket = document.getElementById('settingFirebaseBucketInput')?.value.trim() || '';

  if (!url || !key) {
    showToast('URL and Anon Key are required', 'warning');
    return;
  }

  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);
  localStorage.setItem('sb_bucket', bucket);

  localStorage.setItem('fb_apikey', fbApiKey);
  localStorage.setItem('fb_appid', fbAppId);
  localStorage.setItem('fb_projectid', fbProjectId);
  localStorage.setItem('fb_bucket', fbBucket);

  initSupabase(url, key, bucket);
  switchTab('explorer');
}

function initSupabase(url, key, bucket) {
  try {
    sbManager.init({url: url, key: key, bucket: bucket});
    if (filePreviewManager) {
      filePreviewManager.setService(sbManager);
    }

    document.getElementById('headerUrl').textContent = url + '  •  bucket: ' + bucket;
    currentPath = '';
    folderHistory = [{ path: '', name: 'root' }];
    listFiles();
  } catch (err) {
    console.error(err);
    showToast('Failed to initialize Supabase client', 'error');
  }
}

// ---------- List files ----------
async function listFiles() {
  updateConnectionStatus(null, 'Loading...');
  try {
    const { data, error } = await sbManager.list(currentPath, {
      limit: 500,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) throw error;

    allItems = (data || []).filter(item => item.name !== '.emptyFolderPlaceholder');

    await Promise.all(allItems.map(async (item) => {
      const isFolder = !item.id;
      if (isFolder) return;

      const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
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
  renderBreadcrumbs();

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
    gridRenderer.render(filteredItems, currentPath);
  }
}

function renderBreadcrumbs() {
  const nav = document.getElementById('breadcrumbNav');
  if (!nav) return;
  nav.innerHTML = '';
  
  folderHistory.forEach((crumb, idx) => {
    const isLast = idx === folderHistory.length - 1;
    const btn = document.createElement('button');
    btn.className = (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center";
    
    if (crumb.name.toLowerCase() === 'root') {
      btn.innerHTML = `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(crumb.name)}</span>`;
    } else {
      btn.textContent = crumb.name;
    }

    btn.onclick = () => jumpToBreadcrumb(idx);
    nav.appendChild(btn);
    
    if (!isLast) {
      const sep = document.createElement('span');
      sep.className = "opacity-50 mx-1";
      sep.textContent = '/';
      nav.appendChild(sep);
    }
  });
}

function handleSearch() {
  renderView();
}

// ---------- Navigation ----------
function navigateToFolder(path, name) {
  if (currentPath === path) return;
  currentPath = path;
  folderHistory.push({ path, name });
  listFiles();
}

function jumpToBreadcrumb(index) {
  folderHistory = folderHistory.slice(0, index + 1);
  currentPath = folderHistory[folderHistory.length - 1].path;
  listFiles();
}

// ---------- Create Folder ----------
function openCreateFolderModal() {
  document.getElementById('folderNameInput').value = '';
  document.getElementById('modalCreateFolder').classList.remove('hidden');
}

async function submitCreateFolder() {
  const name = document.getElementById('folderNameInput').value.trim();
  if (!name) return;

  const folderPath = currentPath ? `${currentPath}/${name}/.emptyFolderPlaceholder` : `${name}/.emptyFolderPlaceholder`;

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
function toggleUploadMenu() {
  document.getElementById('uploadMenu').classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('uploadMenu');
  if (!menu) return;
  if (!menu.contains(e.target) && !e.target.closest('button')?.getAttribute('onclick')?.includes('toggleUploadMenu')) {
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
      let targetPath = currentPath ? `${currentPath}/` : '';

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
