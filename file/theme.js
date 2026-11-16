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

  /* ---------- Firebase Widget ---------- */
  static getFirebaseWidgetStyles() {
    return `
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
  }

  static getFirebaseWidgetHTML() {
    return `
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
  }

  /* ---------- Config Panel ---------- */
  static getConfigPanelHTML() {
    return `
      <div class="max-w-4xl w-full bg-zinc-900/0 border border-white/15 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-2xl relative">
        <button id="configCloseBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>

        <div class="border-b border-white/10 pb-4">
          <h2 class="text-lg font-bold text-white mb-1">Configuration</h2>
          <p class="text-xs text-slate-400">Enter your Google Drive, Supabase, and Firebase credentials.</p>
        </div>

        <!-- Google Drive & Encryption Credentials -->
        <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">
          <h3 class="font-semibold text-sm text-white flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-indigo-400"></i> Google Drive & Encryption
          </h3>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Google Client ID</label>
              <input id="clientIdInput" name="gdrive_oauth_client_id" type="text" placeholder="123456789-abc.apps.googleusercontent.com"
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              <p class="text-[10px] text-slate-400 mt-1">
                Current origin: <code id="originLabel" class="text-indigo-300">${window.location.origin}</code>
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Private Encryption Key / Password</label>
              <input id="secretKeyInput" name="gdrive_encryption_password" type="password" placeholder="Enter a secure encryption passphrase"
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">
              <p class="text-[10px] text-slate-400 mt-1">Required to encrypt/decrypt secure uploads.</p>
            </div>
          </div>
        </div>
    
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <button id="configCancelBtn" class="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button>
          <button id="configSaveBtn" class="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">Save & Connect</button>
        </div>
      </div>
    `;
  }

  /* ---------- Tracker ---------- */
  static getTrackerHeaderHTML(title, todayFormatted, sortOptionsHTML, id) {
    return `
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <i class="fa-solid fa-list-check text-xs"></i>
        </div>
        <div>
          <h1 class="text-xs font-bold tracking-tight">${escapeHtml(title)}</h1>
          <p class="text-[10px] text-slate-400">${todayFormatted}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <select id="sort-select-${id}" class="text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-slate-700 transition">
          ${sortOptionsHTML}
        </select>
        <div id="progress-badge-${id}" class="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          0 / 0 Completed
        </div>
        <button id="close-panel-${id}" type="button" class="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer" title="Close">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
    `;
  }

  static getTrackerTaskItemHTML(id, taskName, taskType, taskDesc, isDisabled, colors, sectionName, isAlwaysChecked) {
    return `
      <div class="flex items-start gap-2.5 w-full">
        <label for="${id}" class="relative flex items-start gap-2.5 w-full ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
          <input type="checkbox" id="${id}" data-task="${escapeHtml(taskName)}" data-type="${taskType}" ${
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
              <span class="break-words">${escapeHtml(taskName)}</span>
              <span class="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">${escapeHtml(sectionName)}</span>
              ${taskType === 'weekly' ? `<span class="text-[9px] px-1 py-0.2 rounded no-underline font-semibold ${colors.badge}">Weekly</span>` : ''}
              ${isDisabled ? '<span class="text-[9px] text-slate-500 bg-slate-200 px-1 py-0.2 rounded no-underline font-normal">Disabled</span>' : ''}
            </span>
            ${taskDesc ? `<span class="text-[10px] text-slate-400 mt-0.5 break-words leading-tight">${escapeHtml(taskDesc)}</span>` : ''}
          </div>
        </label>
      </div>
    `;
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

  /* ---------- Breadcrumb ---------- */
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
