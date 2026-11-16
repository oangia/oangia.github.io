class Theme {
  /* ---------- File Icons ---------- */
  static getFileIcon(filename) {
    const ext = getExtension(filename).toLowerCase();
    if (["txt", "md", "log"].includes(ext)) return '<i class="fa-solid fa-file-lines text-5xl opacity-80 hover:opacity-100"></i>';
    if (["json", "js", "ts", "html", "css", "py", "java", "sql", "yml", "yaml"].includes(ext)) return '<i class="fa-solid fa-file-code text-5xl opacity-80 hover:opacity-100"></i>';
    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return '<i class="fa-solid fa-file-image text-5xl opacity-80 hover:opacity-100"></i>';
    if (["mp3", "wav", "ogg"].includes(ext)) return '<i class="fa-solid fa-file-audio text-5xl opacity-80 hover:opacity-100"></i>';
    if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return '<i class="fa-solid fa-file-video text-5xl opacity-80 hover:opacity-100"></i>';
    if (["pdf"].includes(ext)) return '<i class="fa-solid fa-file-pdf text-5xl opacity-80 hover:opacity-100"></i>';
    if (["zip", "rar", "7z"].includes(ext)) return '<i class="fa-solid fa-file-zipper text-5xl opacity-80 hover:opacity-100"></i>';
    return '<i class="fa-solid fa-file opacity-90 hover:opacity-100"></i>';
  }

  /* ---------- Connection Status ---------- */
  static getStatusDotClasses(status) {
    if (status === true) return "w-2 h-2 rounded-full bg-emerald-500";
    if (status === false) return "w-2 h-2 rounded-full bg-rose-500";
    return "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
  }

  /* ---------- Backup Button ---------- */
  static getBackupLoadingHTML() {
    return '<i class="fa-solid fa-spinner fa-spin"></i> <span>Backing up...</span>';
  }
  static getBackupIdleHTML() {
    return '<i class="fa-solid fa-box-archive"></i> <span>Backup</span>';
  }

  /* ---------- File Preview Manager ---------- */
  static getPreviewLoadingHTML() {
    return '<div class="wire-subtext py-12 flex justify-center"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>';
  }

  static getPreviewSidebarLoadingHTML() {
    return `
      <div class="text-center py-10 space-y-2 wire-subtext">
        <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-400"></i>
        <p class="text-xs">Loading info...</p>
      </div>
    `;
  }

  static getPreviewImageHTML(url, name) {
    return `<img src="${url}" alt="${escapeHtml(name)}" class="max-w-full h-full shadow-md object-contain">`;
  }

  static getPreviewAudioHTML(url, name) {
    return `
      <div class="w-full max-w-lg text-center">
        <audio controls class="w-full mb-3" src="${url}"></audio>
        <p class="text-xs wire-text">${escapeHtml(name)}</p>
      </div>`;
  }

  static getPreviewVideoHTML(url) {
    return `<video controls class="max-w-full max-h-[70vh] rounded-lg shadow-md wire-border" src="${url}"></video>`;
  }

  static getPreviewHtmlEditorHTML(text) {
    return `
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
  }

  static getPreviewTextEditorHTML(text) {
    return `<textarea id="editTextarea" class="w-full h-[75vh] font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${escapeHtml(text)}</textarea>`;
  }

  static getPreviewUnsupportedHTML() {
    return `
      <div class="text-center space-y-4 py-12 wire-subtext">
        <i class="fa-solid fa-file text-5xl"></i>
        <p class="text-sm">Preview not available for this file type.</p>
      </div>`;
  }

  /* ---------- Items Grid ---------- */
  static getGridEmptyHTML() {
    return `
      <div class="col-span-full py-16 text-center text-slate-400 text-sm">
        <i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-90 hover:opacity-100"></i>
        No items found
      </div>`;
  }

  static getGridCardClasses() {
    return `
      group relative bg-transparent border border-white/20 hover:border-indigo-400 
      rounded-xl p-3 flex flex-col items-center justify-between text-center 
      cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 
      aspect-square overflow-hidden
    `;
  }

  static getGridCardMediaHTML(previewContainerId, file) {
    return file.isFolder 
        ? `<div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><i class="fa-solid fa-folder text-5xl"></i></div>`
        : `<div id="${previewContainerId}" class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors">
             <i class="fa-solid ${file.isEncrypted ? 'fa-file-shield text-emerald-400 text-3xl' : 'fa-file-lines text-slate-400 text-3xl'}"></i>
           </div>`;
  }

  static getGridCardHTML(mediaHTML, name, sizeStr, isFolder) {
    return `
      <button 
        class="delete-btn absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 
               w-6 h-6 flex items-center justify-center rounded-full 
               bg-black/50 hover:bg-red-500 text-white transition"
        title="Delete">
        <i class="fa-solid fa-xmark text-[10px]"></i>
      </button>

      ${mediaHTML}

      <div class="w-full pt-2 border-t border-white/20 flex flex-col">
        <span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(name)}">
          ${escapeHtml(name)}
        </span>
        <span class="text-[9px] text-slate-300 font-mono mt-0.5">
          ${isFolder ? (sizeStr || 'Folder') : sizeStr}
        </span>
      </div>
    `;
  }

  static getFolderPreviewHTML() {
    return `
      <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
        <i class="fa-solid fa-folder text-5xl opacity-90 hover:opacity-100"></i>
      </div>`;
  }

  static getImagePreviewHTML(thumbUrl) {
    return `
      <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors opacity-90 hover:opacity-100">
        <img src="${thumbUrl}" alt="" class="w-full h-full object-cover rounded-lg" loading="lazy" onerror="this.style.display='none'">
      </div>`;
  }

  static getVideoPreviewHTML(thumbUrl) {
    return `
      <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors opacity-90 hover:opacity-100">
        <video src="${thumbUrl}#t=0.5" class="w-full h-full object-cover rounded-lg pointer-events-none" muted playsinline preload="metadata"></video>
        <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">VIDEO</div>
      </div>`;
  }

  static getGenericFilePreviewHTML(filename) {
    const ext = (getExtension(filename) || 'FILE').toUpperCase();
    return `
      <div class="widget-preview-area flex-1 w-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-transparent relative transition-colors gap-1">
        <div class="text-3xl text-slate-200">${this.getFileIcon(filename)}</div>
      </div>`;
  }

  /* ---------- Breadcrumb & Preview Sidebar ---------- */
  static getBreadcrumbRootHTML(name) {
    return `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(name)}</span>`;
  }

  static getPreviewSidebarHTML({ name, fileSize, url, path, pathHash }) {
    return `
      <div class="space-y-4 text-xs wire-subtext">
        <div>
          <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Name</span>
          <p class="wire-text font-medium break-all">${escapeHtml(name)}</p>
        </div>
        <div>
          <span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Size</span>
          <p class="wire-text font-mono text-xs">${fileSize ? formatBytes(fileSize) + ` (${fileSize} bytes)` : "Unknown"}</p>
        </div>
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
  
  static getHashesLoadingHTML() {
    return `
      <div class="flex items-center justify-center py-4 wire-subtext text-xs gap-2">
        <i class="fa-solid fa-spinner fa-spin text-indigo-400 text-base"></i> Fetching file & computing hashes...
      </div>
    `;
  }
  
  static getHashesResultHTML({ contentHash, combinedHash, rawCombinedString, byteLength }) {
    return `
      <div class="space-y-4">
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">2. Content Hash</span>
            <button onclick="navigator.clipboard.writeText('${contentHash}'); showToast('Content hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
          </div>
          <div>
            <span class="text-[10px] wire-subtext block mb-0.5">Hashed input: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">ArrayBuffer (${byteLength} bytes)</code></span>
            <div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${contentHash}</div>
          </div>
        </div>
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
  }
  
  static getHashesErrorHTML(message) {
    return `<div class="text-xs text-rose-400 p-2 bg-rose-950/60 wire-border rounded">Failed to compute hashes: ${escapeHtml(message)}</div>`;
  }
}
