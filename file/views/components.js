const escapeHtml=e=>String(e||"").replace(/[&<>'"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[e]||e));function showToast(e,t="info",o=4e3){let r=document.getElementById("toastContainer");r||(r=document.createElement("div"),r.id="toastContainer",r.className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full",document.body.appendChild(r));const a=document.createElement("div"),n={success:{border:"border-emerald-800",text:"text-emerald-100",icon:"fa-circle-check text-emerald-400",bar:"border-l-emerald-500"},error:{border:"border-rose-800",text:"text-rose-100",icon:"fa-circle-exclamation text-rose-400",bar:"border-l-rose-500"},warning:{border:"border-amber-800",text:"text-amber-100",icon:"fa-triangle-exclamation text-amber-400",bar:"border-l-amber-500"},info:{border:"border-slate-700",text:"text-slate-100",icon:"fa-circle-info text-sky-400",bar:"border-l-sky-500"}}[t]||{border:"border-slate-700",text:"text-slate-100",icon:"fa-circle-info text-sky-400",bar:"border-l-sky-500"};a.className=`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${n.border} ${n.text} ${n.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`,a.innerHTML=`\n        <div class="flex items-center"><i class="fa-solid ${n.icon} text-base mr-3"></i><span>${escapeHtml(e)}</span></div>\n        <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>\n    `,r.appendChild(a),requestAnimationFrame(()=>a.classList.remove("translate-x-12","opacity-0")),o>0&&setTimeout(()=>{a.classList.add("translate-x-12","opacity-0"),setTimeout(()=>a.remove(),300)},o)}function set_bg(){window.self===window.top&&(document.body.style.backgroundImage="linear-gradient(rgba(5, 8, 17, 0.45), rgba(5, 8, 17, 0.7)), url('https://images.unsplash.com/photo-1772511988871-a010197b94ae?auto=format&fit=crop&w=1920&q=80')",document.body.style.backgroundSize="cover",document.body.style.backgroundPosition="center",document.body.style.backgroundRepeat="no-repeat",document.body.style.backgroundAttachment="fixed",document.body.style.backgroundColor="#050811")}
class Config{static get _TEMPLATES(){return{overlayClass:"hidden fixed inset-0 z-[60] bg-black/40",panelClass:"hidden fixed inset-0 z-[70] flex items-center justify-center p-6 overflow-y-auto",modalBox:e=>`\n        <div class="max-w-3xl w-full bg-zinc-900/0 border border-white/15 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-2xl relative">\n          <button id="configCloseBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition">\n            <i class="fa-solid fa-xmark text-lg"></i>\n          </button>\n\n          <div class="border-b border-white/10 pb-4">\n            <h2 class="text-lg font-bold text-white mb-1">Configuration</h2>\n            <p class="text-xs text-slate-400">Enter your Google Drive and Supabase credentials.</p>\n          </div>\n\n          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">\n            <h3 class="font-semibold text-sm text-white flex items-center gap-2">\n              <i class="fa-solid fa-shield-halved text-indigo-400"></i> Google Drive & Encryption\n            </h3>\n            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Google Client ID</label>\n                <input id="clientIdInput" name="gdrive_oauth_client_id" type="text" placeholder="123456789-abc.apps.googleusercontent.com"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n                <p class="text-[10px] text-slate-400 mt-1">\n                  Current origin: <code id="originLabel" class="text-indigo-300">${e}</code>\n                </p>\n              </div>\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Private Encryption Key / Password</label>\n                <input id="secretKeyInput" name="gdrive_encryption_password" type="password" placeholder="Enter a secure encryption passphrase"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n                <p class="text-[10px] text-slate-400 mt-1">Required to encrypt/decrypt secure uploads.</p>\n              </div>\n            </div>\n          </div>\n      \n          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">\n            <h3 class="font-semibold text-sm text-white flex items-center gap-2">\n              <i class="fa-solid fa-bolt text-emerald-400"></i> Supabase Credentials\n            </h3>\n            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Project URL</label>\n                <input type="text" name="sb_url" placeholder="https://xxxxx.supabase.co" \n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Anon Public Key</label>\n                <input type="text" name="sb_key" placeholder="eyJhbGciOiJIUzI1NiIsIn..." \n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n              <div class="lg:col-span-2">\n                <label class="block text-xs font-medium text-slate-300 mb-1">Storage Bucket Name</label>\n                <input type="text" name="sb_bucket" placeholder="files" value="files" data-default="files"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n            </div>\n          </div>\n      \n          <div class="pt-2 flex justify-end gap-3">\n            <button id="configCancelBtn" class="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button>\n            <button id="configSaveBtn" class="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">Save & Connect</button>\n          </div>\n        </div>`}}constructor(e){this.btnId=e,this.panelId="configPanel",this.overlayId="configOverlay",this.#e(),this.#t(),this.#n(),localStorage.getItem("sb_url")&&localStorage.getItem("sb_key")||this.open()}open(){document.getElementById(this.overlayId)?.classList.remove("hidden"),document.getElementById(this.panelId)?.classList.remove("hidden")}close(){document.getElementById(this.overlayId)?.classList.add("hidden"),document.getElementById(this.panelId)?.classList.add("hidden")}#e(){document.getElementById(this.overlayId)?.remove(),document.getElementById(this.panelId)?.remove();const e=document.createElement("div");e.id=this.overlayId,e.className=Config._TEMPLATES.overlayClass;const t=document.createElement("div");t.id=this.panelId,t.className=Config._TEMPLATES.panelClass,t.innerHTML=Config._TEMPLATES.modalBox(window.location.origin),document.body.appendChild(e),document.body.appendChild(t),document.getElementById("configCloseBtn").onclick=()=>this.close(),document.getElementById("configCancelBtn").onclick=()=>this.close(),e.onclick=()=>this.close(),t.querySelector("div").onclick=e=>e.stopPropagation(),document.getElementById("configSaveBtn").onclick=()=>this.#o()}#t(){const e=document.getElementById(this.btnId);e&&(e.onclick=e=>{e.preventDefault(),e.stopPropagation(),this.open()})}#n(){const e=document.getElementById(this.panelId);e&&e.querySelectorAll("input[name]").forEach(e=>{const t=localStorage.getItem(e.name);null!==t&&""!==t?e.value=t:e.dataset.default&&(e.value=e.dataset.default)})}#o(){const e=document.getElementById(this.panelId).querySelectorAll("input[name]"),t=Object.fromEntries([...e].map(e=>[e.name,e.value.trim()||e.dataset.default||""]));t.sb_url&&t.sb_key?(Object.entries(t).forEach(([e,t])=>localStorage.setItem(e,t)),this.close(),location.reload()):showToast("URL and Anon Key are required","warning")}}
new Config("navSettingsTab");

class ViewInterface {
  initHTML() {}
  bindEvents() {}
  render(params) {}
}

class UITemplates {
  static getComparisonStatusClass(status) {
    if (status === "Synced") return "text-emerald-300";
    if (status === "Different content" || status === "Different size" || status === "Different files") return "text-amber-300";
    if (status === "Could not compare") return "text-rose-300";
    return "text-slate-300";
  }

  // --- Grid Templates ---
  static get grid() {
    return {
      containerClass: "grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4",
      cardClass: "group relative bg-transparent border border-white/20 hover:border-indigo-400 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden",
      emptyState: `<div class="col-span-full py-16 text-center text-slate-400 text-sm"><i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-90 hover:opacity-100"></i>No items found</div>`,
      folderIcon: `<div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><i class="fa-solid fa-folder text-5xl"></i></div>`,
      fileMedia: (file) => {
        const mediaClass = "widget-preview-area flex-1 w-full h-full object-cover overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors";
        if (file.isVideo()) {
          return `<video class="${mediaClass}" muted preload="metadata" aria-label="${escapeHtml(file.getDisplayName())}"></video>`;
        }
        if (file.getThumbnail() || file.isImage()) {
          return `<img class="${mediaClass}">`;
        }
        return `<div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg relative group-hover:scale-110 transition-colors"><i class="${file.getFileIconClass()} text-3xl"></i></div>`;
      },
      card: (group, mediaHTML) => {
        const services = group.files.map(file =>
          `<span class="rounded bg-white/10 px-1.5 py-0.5">${escapeHtml(file.getStorageName())}</span>`
        ).join("");
        return `${mediaHTML}<div class="w-full pt-2 border-t border-white/20 flex flex-col"><span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(group.getDisplayName())}">${escapeHtml(group.getDisplayName())}</span><span class="text-[9px] text-slate-300 font-mono mt-0.5">${group.getSubtext()}</span><div class="mt-1 flex flex-wrap gap-1 text-[8px] text-slate-200">${services}</div><span class="comparison-status mt-1 text-[9px] font-semibold ${UITemplates.getComparisonStatusClass(group.comparisonStatus)}">${escapeHtml(group.comparisonStatus || "")}</span></div>`;
      },
    };
  }

  // --- Preview Modal Templates ---
  static get preview() {
    return {
      modalHtml: `<div id="modalPreview" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-0 m-0"><div class="w-screen h-screen flex flex-col overflow-hidden m-0 p-0 text-slate-100"><div class="flex items-center justify-between px-6 py-3.5 border-b border-white/15 bg-black/40 shrink-0"><h3 id="previewTitle" class="font-bold text-sm text-white truncate"></h3><button id="closePreviewModalBtn" class="text-slate-400 hover:text-white p-1 text-lg transition"><i class="fa-solid fa-xmark"></i></button></div><div class="flex-1 flex overflow-hidden bg-transparent"><div id="previewBody" class="flex-1 overflow-auto flex items-center justify-center"></div><div class="w-80 border-l border-white/15 bg-zinc-950/60 flex flex-col overflow-y-auto p-4 shrink-0"><div class="flex items-center gap-2 pb-3 mb-3 border-b border-white/15"><i class="fa-solid fa-fingerprint text-indigo-400 text-sm"></i><h4 class="font-bold text-xs uppercase tracking-wider text-slate-200">File Details & Hashes</h4></div><div id="previewSidebarDetails" class="space-y-4 text-xs text-slate-300"></div></div></div><div class="px-6 py-3.5 border-t border-white/15 bg-black/40 flex justify-end gap-2 flex-wrap shrink-0"><button id="previewSaveBtn" class="hidden px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400 text-emerald-200 hover:text-white text-xs font-semibold rounded-lg transition"><i class="fa-solid fa-floppy-disk mr-1 text-emerald-400"></i> Save</button><button id="previewCancelEditBtn" class="hidden px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button><button id="previewDownloadBtn" type="button" class="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400 text-indigo-200 hover:text-white text-xs font-semibold rounded-lg transition"><i class="fa-solid fa-download mr-1 text-indigo-400"></i> Download</button><button id="closePreviewModalBtnAlt" class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Close</button></div></div></div>`,
      loadingSpinner: `<div class="wire-subtext py-12 flex justify-center"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>`,
      sidebarLoading: `<div class="text-center py-10 space-y-2 wire-subtext"><i class="fa-solid fa-spinner fa-spin text-xl text-indigo-400"></i><p class="text-xs">Loading info...</p></div>`,
      hashesLoading: `<div class="text-center py-4 space-y-2 wire-subtext"><i class="fa-solid fa-spinner fa-spin text-indigo-400"></i><p class="text-[10px]">Computing cryptographic hashes...</p></div>`,
      sidebarContent: ({ displayName, url, pathHash, fullPath, sizeDisplay }) => `<div class="space-y-4 text-xs wire-subtext"><div><span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Name</span><p class="wire-text font-medium break-all">${displayName}</p></div><div><span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Size</span><p class="wire-text font-mono text-xs">${sizeDisplay}</p></div><div><div class="flex justify-between items-center mb-1"><span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">Signed URL</span><div class="space-x-2"><button onclick="navigator.clipboard.writeText('${url}'); showToast('URL copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy</button><a href="${url}" download="${displayName}" class="text-[11px] text-indigo-300 hover:text-indigo-200"><i class="fa-solid fa-download"></i> Download</a></div></div><div class="font-mono text-[9px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all max-h-16 overflow-y-auto">${url}</div></div><hr class="border-white/20"><div class="space-y-1.5"><div class="flex justify-between items-center"><span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">1. Path Hash</span><button onclick="navigator.clipboard.writeText('${pathHash}'); showToast('Path hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button></div><div><span class="text-[10px] wire-subtext block mb-0.5">Exact string hashed: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">${fullPath}</code></span><div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${pathHash}</div></div></div><div class="space-y-3" id="hashesComputeContainer"><div><span class="text-[10px] wire-subtext block mb-1">Content & Combined Hashes are uncalculated</span><button class="content-hash w-full py-2.5 bg-transparent hover:border-indigo-300 wire-border text-indigo-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5"><i class="fa-solid fa-fingerprint"></i> Calculate Content & Combined Hashes</button></div></div></div>`,
      hashesResult: ({ contentHash, combinedHash, rawCombinedString, byteLength }) => `<div class="space-y-4"><div class="space-y-1.5"><div class="flex justify-between items-center"><span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">2. Content Hash</span><button onclick="navigator.clipboard.writeText('${contentHash}'); showToast('Content hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button></div><div><span class="text-[10px] wire-subtext block mb-0.5">Hashed input: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">ArrayBuffer (${byteLength} bytes)</code></span><div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${contentHash}</div></div></div><div class="space-y-1.5"><div class="flex justify-between items-center"><span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">3. Combined Hash</span><button onclick="navigator.clipboard.writeText('${combinedHash}'); showToast('Combined hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button></div><div><span class="text-[10px] wire-subtext block mb-0.5">Exact concatenated string hashed:</span><div class="font-mono text-[9px] bg-black/40 wire-subtext p-1.5 rounded wire-border break-all select-all max-h-14 overflow-y-auto mb-1">${rawCombinedString}</div><div class="font-mono text-[10px] bg-slate-950/90 text-emerald-400 p-2 rounded wire-border break-all select-all">${combinedHash}</div></div></div></div>`,
      hashesError: (message) => `<div class="text-xs text-rose-400 p-2 bg-rose-950/60 wire-border rounded">Failed to compute hashes: ${message}</div>`,
      imageBody: (url, altText) => `<img src="${url}" alt="${altText}" class="max-w-full h-full shadow-md object-contain">`,
      videoBody: (url) => `<video controls class="max-w-full max-h-[100vh] rounded-lg shadow-md wire-border" src="${url}"></video>`,
      audioBody: (url, displayName) => `<div class="w-full max-w-lg text-center"><audio controls class="w-full mb-3" src="${url}"></audio><p class="text-xs wire-text">${displayName}</p></div>`,
      htmlBody: (text) => `<div class="flex flex-col h-full w-full"><div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1"><div class="flex items-center gap-1 bg-black/40 p-1 rounded wire-border text-xs"><button type="button" id="htmlPreviewTab" class="px-3 py-1 rounded bg-indigo-600 text-white font-medium transition">Preview</button><button type="button" id="htmlEditorTab" class="px-3 py-1 rounded wire-subtext hover:text-white transition">Code Editor</button></div><span class="text-[11px] wire-subtext italic">HTML Interactive File</span></div><div id="htmlPreviewContainer" class="w-full h-[70vh] bg-white rounded-lg overflow-hidden wire-border"><iframe sandbox="allow-scripts" id="htmlPreviewFrame" class="w-full h-full border-0" sandbox="allow-scripts allow-modals"></iframe></div><div id="htmlEditorContainer" class="w-full h-[70vh] hidden"><textarea id="editTextarea" class="w-full h-full font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${text}</textarea></div></div>`,
      textBody: (text) => `<textarea id="editTextarea" class="w-full h-[75vh] font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${text}</textarea>`,
      errorBody: `<div class="text-center space-y-4 py-12 wire-subtext"><i class="fa-solid fa-file text-5xl"></i><p class="text-sm">Preview not available for this file type.</p></div>`,
      sidebarError: `<p class="text-xs text-rose-400 p-2">Failed to load file details.</p>`,
      activeTabClass: "px-3 py-1 rounded bg-indigo-600 text-white font-medium transition",
      inactiveTabClass: "px-3 py-1 rounded wire-subtext hover:text-white transition"
    };
  }

  // --- Breadcrumb Templates ---
  static get breadcrumb() {
    return {
      crumb: (name, isRoot) => isRoot
        ? `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(name)}</span>`
        : `<span>${escapeHtml(name)}</span>`,
      separatorClass: "opacity-50 mx-1",
      crumbClass: (isLast) => (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center"
    };
  }

  // --- Create Folder Modal Templates ---
  static get createFolderModal() {
    return {
      modalHtml: `
        <div id="modalCreateFolder" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
          <div class="bg-zinc-900/80 border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 class="font-bold text-base text-white">Create New Folder</h3>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Folder Name</label>
              <input type="text" id="folderNameInput" placeholder="e.g. documents" 
                     class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs focus:outline-none focus:border-indigo-400">
            </div>
            <div class="flex justify-end space-x-2 pt-2">
              <button id="closeCreateFolderModalBtn" class="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button>
              <button id="submitCreateFolderBtn" class="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">Create Folder</button>
            </div>
          </div>
        </div>
      `
    };
  }
}
class ItemsGridRenderer extends ViewInterface {
  constructor(containerId, fileManagerInstance) {
    super();
    this.containerId = containerId;
    this.fileManager = fileManagerInstance;

    this.initHTML();
    this.bindEvents();
    this.render();
  }

  initHTML() {
    this.container = document.getElementById(this.containerId);
    this.contextMenuActions = document.getElementById("contextMenuActions");
    this.contextMenuActionsParking = document.getElementById("contextMenuActionsParking");
    this.statusElements = new Map();
    this.items = [];
    this.contextMenuGroup = null;

    this.contextMenu = document.createElement("div");
    this.contextMenu.className =
      "hidden fixed z-[110] max-h-[80vh] min-w-56 border border-white/20 bg-zinc-900 py-1 text-slate-200 shadow-lg";
    document.body.appendChild(this.contextMenu);
  }

  bindEvents() {
    this.container?.addEventListener("contextmenu", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest("[data-group-index]");
      const group = card ? this.items[Number(card.dataset.groupIndex)] : null;
      this.showContextMenu(event, group);
    });

    this.container?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest("[data-group-index]");
      if (!card) return;
      const file = this.items[Number(card.dataset.groupIndex)]?.selectedFile;
      if (!file) return;
      this.fileManager.action(file.isFolderNode() ? "navigate" : "openPreview", file);
    });

    this.contextMenu.addEventListener("pointerdown", (e) => e.stopPropagation());

    this.contextMenu.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button");
      if (!button) return;

      if (button.matches("[data-menu-toggle]")) {
        const menuItem = button.closest("[data-menu-item]");
        if (menuItem) this.showSubmenu(menuItem);
        return;
      }

      if (!button.dataset.action) return;
      const file = this.contextMenuGroup?.files[Number(button.dataset.fileIndex)];
      if (!file) return;

      this.hideContextMenu();
      this.fileManager.action(button.dataset.action, file);
    });

    this.contextMenu.addEventListener("pointerover", (event) => {
      const menuItem = event.target.closest?.("[data-menu-item]");
      if (menuItem && !menuItem.contains(event.relatedTarget)) {
        this.showSubmenu(menuItem);
      }
    });

    this.contextMenu.addEventListener("pointerout", (event) => {
      const menuItem = event.target.closest?.("[data-menu-item]");
      if (menuItem && !menuItem.contains(event.relatedTarget)) {
        menuItem.querySelector(".menu-submenu")?.classList.add("hidden");
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (!this.contextMenu.contains(event.target)) this.hideContextMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.hideContextMenu();
    });
  }

  render(items = []) {
    this.items = items;
    if (!this.container) return [];

    const tpl = UITemplates.grid;
    const previewMedia = [];
    this.statusElements.clear();

    this.container.className = tpl.containerClass;
    this.container.innerHTML = "";

    if (!items.length) {
      this.container.innerHTML = tpl.emptyState;
      return previewMedia;
    }

    items.forEach((group, index) => {
      const file = group.selectedFile;
      const card = document.createElement("div");
      card.className = tpl.cardClass;
      card.title = "Right-click for service actions";
      card.dataset.groupIndex = String(index);

      const mediaHTML = file.isFolderNode() ? tpl.folderIcon : tpl.fileMedia(file);
      card.innerHTML = tpl.card(group, mediaHTML);
      this.container.appendChild(card);

      this.statusElements.set(group, card.querySelector(".comparison-status"));

      const previewEl = card.querySelector(".widget-preview-area");
      if (
        ((file.getThumbnail() || file.isImage()) && previewEl instanceof HTMLImageElement) ||
        (file.isVideo() && previewEl instanceof HTMLVideoElement)
      ) {
        previewMedia.push({ file, element: previewEl });
      }
    });

    return previewMedia;
  }

  updateComparisonStatuses() {
    for (const [group, el] of this.statusElements) {
      if (!el) continue;
      el.textContent = group.comparisonStatus || "";
      el.classList.remove("text-emerald-300", "text-amber-300", "text-rose-300", "text-slate-300");
      el.classList.add(UITemplates.getComparisonStatusClass(group.comparisonStatus));
    }
  }

  showContextMenu(event, group) {
    event.preventDefault();
    event.stopPropagation();

    this.#resetContextMenuState(group);
    this.contextMenu.innerHTML = this.#buildMenuContent(group);
    this.#attachParkedActions(group);
    this.contextMenu.classList.remove("hidden");
    this.#positionContextMenu(event);
  }

  #resetContextMenuState(group) {
    this.contextMenuActions?.classList.add("hidden");
    this.contextMenuGroup = group;

    if (this.contextMenuActions && this.contextMenuActionsParking) {
      this.contextMenuActionsParking.appendChild(this.contextMenuActions);
    }
  }

  #buildMenuContent(group) {
    if (!group) return "";

    const actionRows = [
      {
        action: (f) => (f.isFolderNode() ? "navigate" : "openPreview"),
        label: (f) => (f.isFolderNode() ? "Open" : "View"),
      },
      {
        action: () => "downloadRecord",
        label: () => "Download",
      },
      {
        action: () => "syncFileToSupabase",
        label: () => "Sync to Supabase",
        filter: (f) => !f.isFolderNode() && f.getStorageName() === "Google Drive",
      },
      {
        action: () => "deleteRecord",
        label: () => "Delete",
        style: "text-rose-300 hover:text-rose-200",
      },
    ];

    return actionRows
      .map((row) => {
        const choices = group.files
          .map((file, index) => ({
            file,
            index,
            action: row.action(file),
            label: row.label(file),
          }))
          .filter((c) => !(c.action === "downloadRecord" && c.file.isFolderNode()))
          .filter((c) => !row.filter || row.filter(c.file))
          .sort((a, b) => {
            if (a.file.getStorageName() === "Google Drive") return -1;
            if (b.file.getStorageName() === "Google Drive") return 1;
            return 0;
          });

        if (choices.length === 0) return "";

        if (choices.length === 1) {
          const c = choices[0];
          return `<button type="button" data-action="${c.action}" data-file-index="${c.index}"
            class="w-full text-left px-3 py-2 text-xs transition hover:bg-white/10 ${row.style || ""}">
            ${escapeHtml(c.label)} (${escapeHtml(c.file.getStorageName())})
          </button>`;
        }

        const services = choices
          .map(
            (c) =>
              `<button type="button" data-action="${c.action}" data-file-index="${c.index}"
              class="w-full text-left px-3 py-2 text-xs whitespace-nowrap hover:bg-white/10 ${row.style || ""}">
              ${escapeHtml(c.file.getStorageName())}
            </button>`
          )
          .join("");

        return `<div class="relative menu-item" data-menu-item>
          <button type="button" data-menu-toggle aria-label="Choose service for ${escapeHtml(choices[0].label)}"
            class="w-full text-left px-3 py-2 text-xs transition hover:bg-white/10 ${row.style || ""} flex items-center justify-between">
            <span>${escapeHtml(choices[0].label)}</span>
            <span class="px-1 text-slate-400"><i class="fa-solid fa-chevron-right text-[9px]"></i></span>
          </button>
          <div class="menu-submenu hidden fixed z-[111] min-w-44 border border-white/20 bg-zinc-900 py-1 text-slate-200 shadow-lg">
            ${services}
          </div>
        </div>`;
      })
      .join("");
  }

  #attachParkedActions(group) {
    if (group || !this.contextMenuActions) return;

    this.contextMenu.insertAdjacentHTML(
      "beforeend",
      '<div class="border-t border-white/10 my-1"></div>'
    );
    this.contextMenuActions.classList.remove("hidden");
    this.contextMenu.appendChild(this.contextMenuActions);
  }

  #positionContextMenu(event) {
    const left = event.clientX || 8;
    const top = event.clientY || 8;
    const rect = this.contextMenu.getBoundingClientRect();

    this.contextMenu.style.left = `${Math.max(8, Math.min(left, window.innerWidth - rect.width - 8))}px`;
    this.contextMenu.style.top = `${Math.max(8, Math.min(top, window.innerHeight - rect.height - 8))}px`;
  }

  showSubmenu(menuItem) {
    const submenu = menuItem.querySelector(".menu-submenu");
    const toggleButton = menuItem.querySelector("[data-menu-toggle]");
    if (!submenu || !toggleButton) return;

    this.contextMenu.querySelectorAll(".menu-submenu").forEach((m) => {
      if (m !== submenu) m.classList.add("hidden");
    });

    submenu.classList.remove("hidden");

    const parentRect = toggleButton.getBoundingClientRect();
    const submenuRect = submenu.getBoundingClientRect();
    const showLeft = parentRect.right + submenuRect.width > window.innerWidth - 8;

    submenu.style.left = `${showLeft ? parentRect.left - submenuRect.width : parentRect.right}px`;
    submenu.style.top = `${Math.max(8, Math.min(parentRect.top, window.innerHeight - submenuRect.height - 8))}px`;
  }

  hideContextMenu() {
    this.contextMenu.classList.add("hidden");
    this.contextMenuActions?.classList.add("hidden");

    if (this.contextMenuActions && this.contextMenuActionsParking) {
      this.contextMenuActionsParking.appendChild(this.contextMenuActions);
    }

    this.contextMenu.querySelectorAll(".menu-submenu").forEach((m) => m.classList.add("hidden"));
  }
}

class FileGroup {
  constructor(files) {
    this.files = files;
    this.comparisonStatus = "";
  }

  get selectedFile() {
    return this.files[0];
  }
  isFolderNode() {
    return this.selectedFile.isFolderNode();
  }
  getName() {
    return this.selectedFile.getName();
  }
  getDisplayName() {
    return this.selectedFile.getDisplayName();
  }
  getFullPath() {
    return this.selectedFile.getFullPath();
  }
  getSubtext() {
    return this.selectedFile.getSubtext();
  }
  getSize() {
    return this.selectedFile.getSize();
  }
}

class FilePreviewManager extends ViewInterface {
  constructor(fileManagerInstance) {
    super();
    this.fileManager = fileManagerInstance;
    this._currentBlobUrl = null;

    this.initHTML();
    this.bindEvents();
  }

  initHTML() {
    if (document.getElementById("modalPreview")) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = UITemplates.preview.modalHtml.trim();
    document.body.appendChild(tempDiv.firstChild);
  }

  bindEvents() {
    const modal = document.getElementById("modalPreview");
    modal?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button");
      if (!button) return;

      if (button.id === "closePreviewModalBtn" || button.id === "closePreviewModalBtnAlt") {
        this.close();
      } else if (button.id === "previewCancelEditBtn") {
        this.fileManager.action("cancelEdit");
      } else if (button.id === "previewDownloadBtn" && this.fileManager.currentFileRecord) {
        this.fileManager.action("downloadRecord", this.fileManager.currentFileRecord);
      } else if (button.id === "previewSaveBtn") {
        const textarea = modal.querySelector("#editTextarea");
        if (textarea) this.fileManager.action("saveEditedText", textarea.value);
      } else if (button.matches(".content-hash")) {
        this.fileManager.action("computeHashes", this._currentBlobUrl);
      } else if (button.id === "htmlPreviewTab") {
        this.switchHtmlView("preview");
      } else if (button.id === "htmlEditorTab") {
        this.switchHtmlView("editor");
      }
    });
  }

  showLoading(fileRecord) {
    if (this._currentBlobUrl) {
      URL.revokeObjectURL(this._currentBlobUrl);
      this._currentBlobUrl = null;
    }

    const tpl = UITemplates.preview;
    const title = document.getElementById("previewTitle");
    const body = document.getElementById("previewBody");
    const sidebar = document.getElementById("previewSidebarDetails");
    const saveBtn = document.getElementById("previewSaveBtn");
    const cancelBtn = document.getElementById("previewCancelEditBtn");

    if (title) {
      title.textContent = `${fileRecord.getDisplayName()} — ${fileRecord.getStorageName()}${
        fileRecord.isEncryptedFile() ? " (Decrypted securely)" : ""
      }`;
    }
    if (body) body.innerHTML = tpl.loadingSpinner;
    if (sidebar) sidebar.innerHTML = tpl.sidebarLoading;

    document.getElementById("modalPreview")?.classList.remove("hidden");
    saveBtn?.classList.add("hidden");
    cancelBtn?.classList.add("hidden");
  }

  async render(fileRecord, blob) {
    const tpl = UITemplates.preview;
    const body = document.getElementById("previewBody");
    const sidebar = document.getElementById("previewSidebarDetails");
    const saveBtn = document.getElementById("previewSaveBtn");
    const cancelBtn = document.getElementById("previewCancelEditBtn");

    this._currentBlobUrl = URL.createObjectURL(blob);
    const displayName = escapeHtml(fileRecord.getDisplayName());
    const escapedUrl = escapeHtml(this._currentBlobUrl);

    if (sidebar) {
      sidebar.innerHTML = tpl.sidebarContent({
        displayName,
        url: escapedUrl,
        pathHash: fileRecord.hash_filename || "",
        fullPath: escapeHtml(fileRecord.getFullPath()),
        sizeDisplay: fileRecord.getFormattedSize(),
      });
    }

    if (fileRecord.isImage()) {
      body.innerHTML = tpl.imageBody(escapedUrl, displayName);
    } else if (fileRecord.isVideo()) {
      body.innerHTML = tpl.videoBody(escapedUrl);
    } else if (fileRecord.isAudio()) {
      body.innerHTML = tpl.audioBody(escapedUrl, displayName);
    } else {
      const text = await blob.text();
      const escapedText = escapeHtml(text);

      if (fileRecord.isHtml()) {
        body.innerHTML = tpl.htmlBody(escapedText);
        const iframe = document.getElementById("htmlPreviewFrame");
        if (iframe) iframe.srcdoc = text;
      } else {
        body.innerHTML = tpl.textBody(escapedText);
        saveBtn?.classList.remove("hidden");
        cancelBtn?.classList.remove("hidden");
      }
    }
  }

  showPreviewError() {
    const tpl = UITemplates.preview;
    const body = document.getElementById("previewBody");
    const sidebar = document.getElementById("previewSidebarDetails");
    if (body) body.innerHTML = tpl.errorBody;
    if (sidebar) sidebar.innerHTML = tpl.sidebarError;
  }

  showHashesLoading() {
    const container = document.getElementById("hashesComputeContainer");
    if (container) container.innerHTML = UITemplates.preview.hashesLoading;
  }

  renderHashesResult(result) {
    const container = document.getElementById("hashesComputeContainer");
    if (container) container.innerHTML = UITemplates.preview.hashesResult(result);
  }

  renderHashesError(message) {
    const container = document.getElementById("hashesComputeContainer");
    if (container) container.innerHTML = UITemplates.preview.hashesError(escapeHtml(message));
  }

  close() {
    document.getElementById("modalPreview")?.classList.add("hidden");
  }

  switchHtmlView(view) {
    const tpl = UITemplates.preview;
    const previewTab = document.getElementById("htmlPreviewTab");
    const editorTab = document.getElementById("htmlEditorTab");
    const previewContainer = document.getElementById("htmlPreviewContainer");
    const editorContainer = document.getElementById("htmlEditorContainer");
    const iframe = document.getElementById("htmlPreviewFrame");
    const textarea = document.getElementById("editTextarea");

    if (view === "preview") {
      if (iframe && textarea) iframe.srcdoc = textarea.value;
      previewContainer?.classList.remove("hidden");
      editorContainer?.classList.add("hidden");
      if (previewTab) previewTab.className = tpl.activeTabClass;
      if (editorTab) editorTab.className = tpl.inactiveTabClass;
    } else {
      previewContainer?.classList.add("hidden");
      editorContainer?.classList.remove("hidden");
      if (editorTab) editorTab.className = tpl.activeTabClass;
      if (previewTab) previewTab.className = tpl.inactiveTabClass;
    }
  }
}

class BreadcrumbManager extends ViewInterface {
  constructor(containerId, fileManagerInstance) {
    super();
    this.containerId = containerId;
    this.fileManager = fileManagerInstance;

    this.initHTML();
    this.bindEvents();
    this.render();
  }

  initHTML() {
    this.container = document.getElementById(this.containerId);
    this.history = [{ path: "", name: "root" }];
    this.path = "";
  }

  bindEvents() {
    this.container?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const crumb = event.target.closest("[data-breadcrumb-index]");
      if (crumb) this.jumpToBreadcrumb(Number(crumb.dataset.breadcrumbIndex));
    });
  }

  navigateToFolder(path, name, breadcrumbIndex = null) {
    if (breadcrumbIndex === null && this.path === path) return;
    if (breadcrumbIndex === null) {
      this.history.push({ path, name });
    } else {
      this.history = this.history.slice(0, breadcrumbIndex + 1);
    }
    this.path = path;
    this.render();
    this.fileManager.action("listFiles");
  }

  jumpToBreadcrumb(index) {
    this.navigateToFolder(this.history[index].path, null, index);
  }

  reset() {
    this.path = "";
    this.history = [{ path: "", name: "root" }];
    this.render();
  }

  render() {
    if (!this.container) return;
    const tpl = UITemplates.breadcrumb;
    this.container.innerHTML = "";

    this.history.forEach((crumb, idx) => {
      const isLast = idx === this.history.length - 1;
      const btn = document.createElement("button");
      btn.className = tpl.crumbClass(isLast);
      btn.dataset.breadcrumbIndex = String(idx);
      btn.innerHTML = tpl.crumb(crumb.name, crumb.name.toLowerCase() === "root");
      this.container.appendChild(btn);

      if (!isLast) {
        const sep = document.createElement("span");
        sep.className = tpl.separatorClass;
        sep.textContent = "/";
        this.container.appendChild(sep);
      }
    });
  }
}

class CreateFolderModal extends ViewInterface {
  constructor(fileManagerInstance) {
    super();
    this.fileManager = fileManagerInstance;

    this.initHTML();
    this.bindEvents();
  }

  initHTML() {
    if (document.getElementById("modalCreateFolder")) return;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = UITemplates.createFolderModal.modalHtml.trim();
    document.body.appendChild(wrapper.firstElementChild);
  }

  bindEvents() {
    document.getElementById("openCreateFolderModalBtn")?.addEventListener("click", () => this.open());
    document.getElementById("closeCreateFolderModalBtn")?.addEventListener("click", () => this.close());
    document.getElementById("submitCreateFolderBtn")?.addEventListener("click", () => this.submit());

    document.getElementById("folderNameInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.submit();
      }
    });
  }

  open() {
    const input = document.getElementById("folderNameInput");
    const modal = document.getElementById("modalCreateFolder");

    if (input) input.value = "";
    if (modal) modal.classList.remove("hidden");

    document.getElementById("actionsMenuToggleBtn")?.classList.add("hidden");
    if (input) setTimeout(() => input.focus(), 50);
  }

  close() {
    document.getElementById("modalCreateFolder")?.classList.add("hidden");
  }

  async submit() {
    const name = document.getElementById("folderNameInput")?.value.trim();
    if (!name) return;
    this.fileManager.action("createFolder", name);
  }
}

class SyncProgressPanel extends ViewInterface {
  constructor() {
    super();
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById("syncProgressCloseBtn")?.addEventListener("click", () => this.hide());
  }

  update(status, current, completed, total, summary, done = false) {
    const panel = document.getElementById("syncProgressPanel");
    const statusEl = document.getElementById("syncProgressStatus");
    const currentEl = document.getElementById("syncProgressCurrent");
    const countEl = document.getElementById("syncProgressCount");
    const summaryEl = document.getElementById("syncProgressSummary");
    const progressBar = document.getElementById("syncProgressBar");

    if (!panel || !statusEl || !currentEl || !countEl || !summaryEl || !progressBar) return;

    panel.classList.remove("hidden");
    statusEl.textContent = status;
    currentEl.textContent = current;
    currentEl.title = current;
    countEl.textContent = `${completed} / ${total}`;
    summaryEl.textContent = summary;

    const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : done ? 100 : 0;
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", String(percent));
  }

  hide() {
    document.getElementById("syncProgressPanel")?.classList.add("hidden");
  }
}

class FileActionsMenu extends ViewInterface {
  constructor(fileManager) {
    super();
    this.fileManager = fileManager;

    this.initHTML();
    this.bindEvents();
  }

  initHTML() {
    this.menuButton = document.getElementById("actionsMenu");
    this.dropdown = document.getElementById("actionsMenuToggleBtn");
    this.storageBackupButton = document.getElementById("backupBtn");
    this.backupGitHubButton = document.getElementById("backupGitHubBtn");
    this.syncButton = document.getElementById("syncToSupabaseBtn");
  }

  bindEvents() {
    this.menuButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggle();
    });

    document.addEventListener("click", (event) => {
      if (!this.menuButton?.contains(event.target) && !this.dropdown?.contains(event.target)) {
        this.close();
      }
    });

    this.storageBackupButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.close();
      this.fileManager.action("backup");
    });

    this.backupGitHubButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.close();
      this.fileManager.action("backupGitHubRepo");
    });

    this.syncButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.close();
      this.fileManager.action("syncDriveToSupabase");
    });
  }

  toggle() {
    this.dropdown?.classList.toggle("hidden");
  }

  close() {
    this.dropdown?.classList.add("hidden");
  }

  beginStorageBackup() {
    const originalContent = this.storageBackupButton?.innerHTML;
    if (this.storageBackupButton) {
      this.storageBackupButton.disabled = true;
      this.storageBackupButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin mr-2.5 text-emerald-400 w-4"></i><span>Backing up...</span>';
    }
    return originalContent;
  }

  endStorageBackup(originalContent) {
    if (!this.storageBackupButton) return;
    this.storageBackupButton.disabled = false;
    this.storageBackupButton.innerHTML = originalContent;
  }

  beginGitHubBackup() {
    this.gitHubBackupProgress = { uploadedFiles: 0, totalFiles: 0 };
    const originalContent = this.backupGitHubButton?.innerHTML;
    if (this.backupGitHubButton) {
      this.backupGitHubButton.disabled = true;
      this.backupGitHubButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin mr-2.5"></i><span>Backing up repo...</span>';
    }
    return originalContent;
  }

  updateGitHubBackup(progress) {
    this.gitHubBackupProgress = progress;
    if (this.backupGitHubButton && progress.totalFiles) {
      this.backupGitHubButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2.5"></i><span>Backing up ${progress.uploadedFiles} / ${progress.totalFiles}...</span>`;
    }
  }

  endGitHubBackup(originalContent) {
    if (!this.backupGitHubButton) return;
    this.backupGitHubButton.disabled = false;
    this.backupGitHubButton.innerHTML = originalContent;
  }

  beginDriveSync() {
    const originalContent = this.syncButton?.innerHTML;
    if (this.syncButton) {
      this.syncButton.disabled = true;
      this.syncButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin mr-2.5 w-4"></i><span>Syncing...</span>';
    }
    return originalContent;
  }

  endDriveSync(originalContent) {
    if (!this.syncButton) return;
    this.syncButton.disabled = false;
    this.syncButton.innerHTML = originalContent;
  }
}