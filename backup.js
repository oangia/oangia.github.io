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
