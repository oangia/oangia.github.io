// ==========================================
// ---------- Utility & Helper Functions ----
// ==========================================

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
  if (['txt','md','log'].includes(e)) return '<i class="fa-solid fa-file-lines"></i>';
  if (['json','js','ts','html','css','py','java','sql'].includes(e)) return '<i class="fa-solid fa-file-code"></i>';
  if (['png','jpg','jpeg','gif','webp','svg'].includes(e)) return '<i class="fa-solid fa-file-image"></i>';
  if (['mp3','wav','ogg'].includes(e)) return '<i class="fa-solid fa-file-audio"></i>';
  if (['mp4','webm','mov'].includes(e)) return '<i class="fa-solid fa-file-video"></i>';
  if (['pdf'].includes(e)) return '<i class="fa-solid fa-file-pdf"></i>';
  if (['zip','rar','7z'].includes(e)) return '<i class="fa-solid fa-file-zipper"></i>';
  return '<i class="fa-solid fa-file"></i>';
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

class FilePreviewManager {
  constructor(options = {}) {
    this.bucket = options.bucket || 'files';
    this.supabaseClient = options.supabaseClient || null;
    
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

  setConfig(client, bucket) {
    if (client) this.supabaseClient = client;
    if (bucket) this.bucket = bucket;
  }

  async openPreview(path, name, fileSize = 0) {
    if (!this.supabaseClient) {
      this.onToast('Supabase client not initialized', 'error');
      return;
    }

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
      const { data, error } = await this.supabaseClient
        .storage
        .from(this.bucket)
        .createSignedUrl(path, 3600);

      if (error) throw error;

      const url = data.signedUrl;
      if (downloadBtn) {
        downloadBtn.href = url;
        downloadBtn.download = name;
      }

      // Render preview based on file type
      if (isImage(name)) {
        body.innerHTML = `<img src="${url}" alt="${escapeHtml(name)}" class="max-w-full max-h-[100vh] rounded-lg shadow-md object-contain wire-border">`;
      } else if (isAudio(name)) {
        body.innerHTML = `
          <div class="w-full max-w-lg text-center">
            <audio controls class="w-full mb-3" src="${url}"></audio>
            <p class="text-xs wire-text">${escapeHtml(name)}</p>
          </div>`;
      } else if (isVideo(name)) {
        body.innerHTML = `<video controls class="max-w-full max-h-[70vh] rounded-lg shadow-md wire-border" src="${url}"></video>`;
      } else if (isText(name)) {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch file content');
        this.currentArrayBuffer = await res.arrayBuffer();
        if (!this.fileSize) this.fileSize = this.currentArrayBuffer.byteLength;
        const text = new TextDecoder().decode(this.currentArrayBuffer);
        this.currentPreviewText = text;
        this.isTextEditor = true;

        // Updated background to semi-transparent dark tint matching the full screen panel
        body.innerHTML = `<textarea id="editTextarea" class="w-full h-[75vh] font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${escapeHtml(text)}</textarea>`;
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
        const { data, error } = await this.supabaseClient
          .storage
          .from(this.bucket)
          .createSignedUrl(this.currentPreviewPath, 60);

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
      const blob = new Blob([newContent], { type: 'text/plain;charset=utf-8' });
      const { error } = await this.supabaseClient
        .storage
        .from(this.bucket)
        .upload(this.currentPreviewPath, blob, {
          cacheControl: 'no-cache',
          upsert: true,
          contentType: 'text/plain'
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

// ==========================================
// ---------- Global Variables & State ------
// ==========================================

let supabaseClient = null;
let currentBucket = 'files';
let currentPath = '';
let folderHistory = [{ path: '', name: 'root' }];
let allItems = [];
let filteredItems = [];
let filePreviewManager = null;


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
    bucket: currentBucket,
    supabaseClient: supabaseClient,
    onToast: (msg, type, duration) => showToast(msg, type, duration),
    onSaveSuccess: () => listFiles()
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
    supabaseClient = window.supabase.createClient(url, key);
    currentBucket = bucket;

    if (filePreviewManager) {
      filePreviewManager.setConfig(supabaseClient, currentBucket);
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
  if (!supabaseClient) return;

  updateConnectionStatus(null, 'Loading...');
  try {
    const { data, error } = await supabaseClient
      .storage
      .from(currentBucket)
      .list(currentPath, {
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
          const { data: signed, error: signErr } = await supabaseClient
            .storage
            .from(currentBucket)
            .createSignedUrl(fullPath, 3600);

          if (!signErr && signed?.signedUrl) {
            item.thumbUrl = signed.signedUrl;
          }
        } catch (e) {}
      }
    }));

    updateConnectionStatus(true, `Connected • Bucket: ${currentBucket}`);
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

  const grid = document.getElementById('itemsGrid');
  grid.innerHTML = '';
  document.getElementById('itemCountLabel').textContent = `${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`;

  // Empty state
  if (filteredItems.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 text-sm">
        <i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-60"></i>
        No items
      </div>`;
    return;
  }

  filteredItems.forEach(item => {
    const isFolder = !item.id;
    const fullPath = item.fullPath || (currentPath ? `${currentPath}/${item.name}` : item.name);
    const sizeStr = isFolder ? '' : formatBytes(item.metadata?.size || 0);

    const card = document.createElement('div');

    // ===== Preferred card style (copied & adapted) =====
    card.className = `
      group relative bg-transparent border border-white/20 hover:border-blue-500 
      rounded-xl p-3 flex flex-col items-center justify-between text-center 
      cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 
      aspect-square overflow-hidden
    `;

    card.onclick = () => {
      if (isFolder) {
        navigateToFolder(fullPath, item.name);
      } else {
        openPreview(fullPath, item.name);
      }
    };

    // ========== MEDIA / PREVIEW AREA ==========
    let mediaHTML = '';

    if (isFolder) {
      // Folder style from preferred code
      mediaHTML = `
        <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-folder text-5xl"></i>
        </div>`;
    } 
    
    else if (item.thumbUrl && isImage(item.name)) {
      mediaHTML = `
        <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
          <img src="${item.thumbUrl}" alt="" class="w-full h-full object-cover rounded-lg" loading="lazy"
               onerror="this.style.display='none'">
        </div>`;
    } 
    
    else if (item.thumbUrl && isVideo(item.name)) {
      mediaHTML = `
        <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
          <video src="${item.thumbUrl}#t=0.5" class="w-full h-full object-cover rounded-lg pointer-events-none" muted playsinline preload="metadata"></video>
          <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">VIDEO</div>
        </div>`;
    } 
    
    else {
      // Generic / other files
      const ext = (getExtension(item.name) || 'FILE').toUpperCase();
      mediaHTML = `
        <div class="widget-preview-area flex-1 w-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-transparent relative transition-colors gap-1">
          <div class="text-3xl text-slate-200">${getFileIcon(item.name)}</div>
          <span class="text-[9px] font-mono text-slate-300 uppercase tracking-wide">${escapeHtml(ext)}</span>
        </div>`;
    }

    // ========== CARD CONTENT ==========
    card.innerHTML = `
      <!-- Delete button -->
      <button 
        onclick="event.stopPropagation(); deleteItem('${escapeHtml(fullPath)}', ${isFolder})"
        title="Delete"
        class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 
               w-6 h-6 flex items-center justify-center rounded-full 
               bg-black/50 hover:bg-red-500 text-white transition">
        <i class="fa-solid fa-xmark text-[10px]"></i>
      </button>

      ${mediaHTML}

      <!-- Name + Size (preferred bottom section) -->
      <div class="w-full pt-2 border-t border-white/20 flex flex-col">
        <span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(item.name)}">
          ${escapeHtml(item.name)}
        </span>
        <span class="text-[9px] text-slate-300 font-mono mt-0.5">
          ${isFolder ? (sizeStr || 'Folder') : sizeStr}
        </span>
      </div>
    `;

    grid.appendChild(card);
  });
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
    const { error } = await supabaseClient
      .storage
      .from(currentBucket)
      .upload(folderPath, new Blob(['']), { upsert: false });

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

      const { error } = await supabaseClient
        .storage
        .from(currentBucket)
        .upload(targetPath, file, {
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
    const { data, error } = await supabaseClient
      .storage
      .from(currentBucket)
      .createSignedUrl(path, 60);

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
  if (!supabaseClient) {
    showToast('Not connected', 'warning');
    return;
  }

  const btn = document.getElementById('backupBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Backing up...</span>';

  const backupManager = new SupabaseBackupManager(supabaseClient, currentBucket, (message, type) => {
    showToast(message, type, type === 'warning' ? 2500 : 3500);
  });

  await backupManager.runBackup();

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-box-archive"></i> <span>Backup</span>';
}

async function listAllFilesRecursive(prefix = '') {
  const results = [];
  const { data, error } = await supabaseClient
    .storage
    .from(currentBucket)
    .list(prefix, { limit: 1000, offset: 0 });

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
      const { data: files, error: listError } = await supabaseClient
        .storage
        .from(currentBucket)
        .list(path, { limit: 1000 });

      if (listError) throw listError;

      const pathsToDelete = [];
      if (files && files.length > 0) {
        for (const f of files) {
          pathsToDelete.push(`${path}/${f.name}`);
        }
      }
      pathsToDelete.push(`${path}/.emptyFolderPlaceholder`);

      if (pathsToDelete.length > 0) {
        const { error } = await supabaseClient
          .storage
          .from(currentBucket)
          .remove(pathsToDelete);
        if (error) throw error;
      }
    } else {
      const { error } = await supabaseClient
        .storage
        .from(currentBucket)
        .remove([path]);
      if (error) throw error;
    }

    showToast('Deleted successfully', 'success');
    listFiles();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Delete failed', 'error');
  }
}
