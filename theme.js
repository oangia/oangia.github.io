/**
 * ============================================================
 * Theme – Single source of truth for ALL HTML & visual styles
 * Change / extend this class to restyle the entire application.
 * ============================================================
 */
class Theme {
  /* ---------- Toast ---------- */
  static toastStyles = {
    success: {
      border: "border-emerald-800",
      text: "text-emerald-100",
      icon: "fa-circle-check text-emerald-400",
      bar: "border-l-emerald-500"
    },
    error: {
      border: "border-rose-800",
      text: "text-rose-100",
      icon: "fa-circle-exclamation text-rose-400",
      bar: "border-l-rose-500"
    },
    warning: {
      border: "border-amber-800",
      text: "text-amber-100",
      icon: "fa-triangle-exclamation text-amber-400",
      bar: "border-l-amber-500"
    },
    info: {
      border: "border-slate-700",
      text: "text-slate-100",
      icon: "fa-circle-info text-sky-400",
      bar: "border-l-sky-500"
    }
  };

  static getToastContainerClasses() {
    return "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full";
  }

  static getToastClasses(type = "info") {
    const s = this.toastStyles[type] || this.toastStyles.info;
    return `pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${s.border} ${s.text} ${s.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`;
  }

  static getToastHTML(message, type = "info") {
    const s = this.toastStyles[type] || this.toastStyles.info;
    return `
      <div class="flex items-center">
        <i class="fa-solid ${s.icon} text-base mr-3"></i>
        <span>${escapeHtml(message)}</span>
      </div>
      <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
  }

  /* ---------- File Icons ---------- */
  static getFileIcon(filename) {
    const ext = getExtension(filename).toLowerCase();
    if (["txt", "md", "log"].includes(ext)) return '<i class="fa-solid fa-file-lines opacity-90 hover:opacity-100"></i>';
    if (["json", "js", "ts", "html", "css", "py", "java", "sql", "yml", "yaml"].includes(ext)) return '<i class="fa-solid fa-file-code opacity-90 hover:opacity-100"></i>';
    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return '<i class="fa-solid fa-file-image opacity-90 hover:opacity-100"></i>';
    if (["mp3", "wav", "ogg"].includes(ext)) return '<i class="fa-solid fa-file-audio opacity-90 hover:opacity-100"></i>';
    if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return '<i class="fa-solid fa-file-video opacity-90 hover:opacity-100"></i>';
    if (["pdf"].includes(ext)) return '<i class="fa-solid fa-file-pdf opacity-90 hover:opacity-100"></i>';
    if (["zip", "rar", "7z"].includes(ext)) return '<i class="fa-solid fa-file-zipper opacity-90 hover:opacity-100"></i>';
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

  /* ---------- Folder Manager Panel ---------- */
  static getFolderManagerPanelHTML() {
    return `
      <div id="toastContainer" class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full"></div>

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
          <input id="searchInput" type="text" placeholder="Filter current folder..."
            class="hidden sm:block bg-white/5 border border-white/15 text-slate-200 placeholder-slate-500 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 w-48" />
          <label class="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
            <i class="fa-solid fa-folder-plus"></i> Select Folder
            <input type="file" class="widget-folder-input-header hidden" webkitdirectory directory multiple>
          </label>
          <button id="closeFolderPanelBtn" class="text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div id="breadcrumbBar" class="hidden bg-slate-900/70 border-b border-white/10 px-5 py-2 flex items-center justify-between text-xs shrink-0">
        <nav id="breadcrumbNav" class="flex items-center flex-wrap gap-1"></nav>
      </div>

      <div id="widget-browser-wrapper" class="flex-1 bg-slate-950 overflow-hidden flex flex-col min-h-0 relative">
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

        <div id="gridScrollArea" class="hidden flex-1 overflow-y-auto">
          <div id="itemsGrid"></div>
        </div>
      </div>

      <div id="modalPreview" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          <div class="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
            <h3 id="previewTitle" class="text-sm font-bold text-white truncate">Preview</h3>
            <div class="flex items-center gap-2">
              <button id="previewCancelEditBtn" onclick="cancelEditText()" class="hidden px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 transition">Discard</button>
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
          <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div id="previewBody" class="flex-1 p-4 flex items-center justify-center overflow-auto bg-black/40"></div>
            <aside class="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 p-4 overflow-y-auto bg-slate-900/90 shrink-0">
              <div id="previewSidebarDetails"></div>
            </aside>
          </div>
        </div>
      </div>
    `;
  }

  static getFolderManagerContainerClasses() {
    return "fixed inset-0 z-50 bg-slate-950 text-slate-100 font-sans flex flex-col h-screen w-screen overflow-hidden m-0 p-0 hidden";
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
          <p class="text-xs text-slate-400">Enter your Supabase and Firebase credentials.</p>
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
        <span class="text-[9px] font-mono text-slate-300 uppercase tracking-wide">${escapeHtml(ext)}</span>
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
