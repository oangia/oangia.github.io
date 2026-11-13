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
