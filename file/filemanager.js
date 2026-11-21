const escapeHtml=e=>String(e||"").replace(/[&<>'"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[e]||e));function showToast(e,t="info",o=4e3){let r=document.getElementById("toastContainer");r||(r=document.createElement("div"),r.id="toastContainer",r.className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full",document.body.appendChild(r));const a=document.createElement("div"),n={success:{border:"border-emerald-800",text:"text-emerald-100",icon:"fa-circle-check text-emerald-400",bar:"border-l-emerald-500"},error:{border:"border-rose-800",text:"text-rose-100",icon:"fa-circle-exclamation text-rose-400",bar:"border-l-rose-500"},warning:{border:"border-amber-800",text:"text-amber-100",icon:"fa-triangle-exclamation text-amber-400",bar:"border-l-amber-500"},info:{border:"border-slate-700",text:"text-slate-100",icon:"fa-circle-info text-sky-400",bar:"border-l-sky-500"}}[t]||{border:"border-slate-700",text:"text-slate-100",icon:"fa-circle-info text-sky-400",bar:"border-l-sky-500"};a.className=`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${n.border} ${n.text} ${n.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`,a.innerHTML=`\n        <div class="flex items-center"><i class="fa-solid ${n.icon} text-base mr-3"></i><span>${escapeHtml(e)}</span></div>\n        <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>\n    `,r.appendChild(a),requestAnimationFrame(()=>a.classList.remove("translate-x-12","opacity-0")),o>0&&setTimeout(()=>{a.classList.add("translate-x-12","opacity-0"),setTimeout(()=>a.remove(),300)},o)}function set_bg(){window.self===window.top&&(document.body.style.backgroundImage="linear-gradient(rgba(5, 8, 17, 0.45), rgba(5, 8, 17, 0.7)), url('https://images.unsplash.com/photo-1772511988871-a010197b94ae?auto=format&fit=crop&w=1920&q=80')",document.body.style.backgroundSize="cover",document.body.style.backgroundPosition="center",document.body.style.backgroundRepeat="no-repeat",document.body.style.backgroundAttachment="fixed",document.body.style.backgroundColor="#050811")}
class Config{static get _TEMPLATES(){return{overlayClass:"hidden fixed inset-0 z-[60] bg-black/40",panelClass:"hidden fixed inset-0 z-[70] flex items-center justify-center p-6 overflow-y-auto",modalBox:e=>`\n        <div class="max-w-3xl w-full bg-zinc-900/0 border border-white/15 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-2xl relative">\n          <button id="configCloseBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition">\n            <i class="fa-solid fa-xmark text-lg"></i>\n          </button>\n\n          <div class="border-b border-white/10 pb-4">\n            <h2 class="text-lg font-bold text-white mb-1">Configuration</h2>\n            <p class="text-xs text-slate-400">Enter your Google Drive and Supabase credentials.</p>\n          </div>\n\n          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">\n            <h3 class="font-semibold text-sm text-white flex items-center gap-2">\n              <i class="fa-solid fa-shield-halved text-indigo-400"></i> Google Drive & Encryption\n            </h3>\n            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Google Client ID</label>\n                <input id="clientIdInput" name="gdrive_oauth_client_id" type="text" placeholder="123456789-abc.apps.googleusercontent.com"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n                <p class="text-[10px] text-slate-400 mt-1">\n                  Current origin: <code id="originLabel" class="text-indigo-300">${e}</code>\n                </p>\n              </div>\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Private Encryption Key / Password</label>\n                <input id="secretKeyInput" name="gdrive_encryption_password" type="password" placeholder="Enter a secure encryption passphrase"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n                <p class="text-[10px] text-slate-400 mt-1">Required to encrypt/decrypt secure uploads.</p>\n              </div>\n            </div>\n          </div>\n      \n          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">\n            <h3 class="font-semibold text-sm text-white flex items-center gap-2">\n              <i class="fa-solid fa-bolt text-emerald-400"></i> Supabase Credentials\n            </h3>\n            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Project URL</label>\n                <input type="text" name="sb_url" placeholder="https://xxxxx.supabase.co" \n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Anon Public Key</label>\n                <input type="text" name="sb_key" placeholder="eyJhbGciOiJIUzI1NiIsIn..." \n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n              <div class="lg:col-span-2">\n                <label class="block text-xs font-medium text-slate-300 mb-1">Storage Bucket Name</label>\n                <input type="text" name="sb_bucket" placeholder="files" value="files" data-default="files"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n            </div>\n          </div>\n      \n          <div class="pt-2 flex justify-end gap-3">\n            <button id="configCancelBtn" class="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button>\n            <button id="configSaveBtn" class="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">Save & Connect</button>\n          </div>\n        </div>`}}constructor(e){this.btnId=e,this.panelId="configPanel",this.overlayId="configOverlay",this.#e(),this.#t(),this.#n(),localStorage.getItem("sb_url")&&localStorage.getItem("sb_key")||this.open()}open(){document.getElementById(this.overlayId)?.classList.remove("hidden"),document.getElementById(this.panelId)?.classList.remove("hidden")}close(){document.getElementById(this.overlayId)?.classList.add("hidden"),document.getElementById(this.panelId)?.classList.add("hidden")}#e(){document.getElementById(this.overlayId)?.remove(),document.getElementById(this.panelId)?.remove();const e=document.createElement("div");e.id=this.overlayId,e.className=Config._TEMPLATES.overlayClass;const t=document.createElement("div");t.id=this.panelId,t.className=Config._TEMPLATES.panelClass,t.innerHTML=Config._TEMPLATES.modalBox(window.location.origin),document.body.appendChild(e),document.body.appendChild(t),document.getElementById("configCloseBtn").onclick=()=>this.close(),document.getElementById("configCancelBtn").onclick=()=>this.close(),e.onclick=()=>this.close(),t.querySelector("div").onclick=e=>e.stopPropagation(),document.getElementById("configSaveBtn").onclick=()=>this.#o()}#t(){const e=document.getElementById(this.btnId);e&&(e.onclick=e=>{e.preventDefault(),e.stopPropagation(),this.open()})}#n(){const e=document.getElementById(this.panelId);e&&e.querySelectorAll("input[name]").forEach(e=>{const t=localStorage.getItem(e.name);null!==t&&""!==t?e.value=t:e.dataset.default&&(e.value=e.dataset.default)})}#o(){const e=document.getElementById(this.panelId).querySelectorAll("input[name]"),t=Object.fromEntries([...e].map(e=>[e.name,e.value.trim()||e.dataset.default||""]));t.sb_url&&t.sb_key?(Object.entries(t).forEach(([e,t])=>localStorage.setItem(e,t)),this.close(),location.reload()):showToast("URL and Anon Key are required","warning")}}
new Config("navSettingsTab");

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
        if (file.isImage()) {
          return `<img class="${mediaClass}">`;
        }
        if (file.isVideo()) {
          return `<video class="${mediaClass}" muted playsinline preload="metadata" aria-label="${escapeHtml(file.getDisplayName())}"></video>`;
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

class ItemsGridRenderer {
  constructor(containerId, fileManagerInstance) {
    this.container = document.getElementById(containerId);
    this.fileManager = fileManagerInstance;
    this.contextMenuActions = document.getElementById("contextMenuActions");
    this.contextMenuActionsParking = document.getElementById("contextMenuActionsParking");
    this.statusElements = new Map();
    this.contextMenu = document.createElement("div");
    this.contextMenu.className = "hidden fixed z-[110] max-h-[80vh] min-w-56 border border-white/20 bg-zinc-900 py-1 text-slate-200 shadow-lg";
    document.body.appendChild(this.contextMenu);
    this.container?.addEventListener("contextmenu", event => {
      if (event.target instanceof Element && event.target.closest(".group")) return;
      this.showContextMenu(event, null);
    });
    this.contextMenu.addEventListener("pointerdown", event => event.stopPropagation());
    document.addEventListener("pointerdown", event => {
      if (!this.contextMenu.contains(event.target)) this.hideContextMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") this.hideContextMenu();
    });
  }

  async render(items) {
    if (!this.container) return;

    const tpl = UITemplates.grid;
    this.statusElements.clear();
    this.container.className = tpl.containerClass;
    this.container.innerHTML = "";

    if (!items || items.length === 0) {
      this.container.innerHTML = tpl.emptyState;
      return;
    }

    for (const group of items) {
      const file = group.selectedFile;
      const card = document.createElement("div");
      card.className = tpl.cardClass;
      card.title = "Right-click for service actions";
      card.addEventListener("contextmenu", event => this.showContextMenu(event, group));
      card.onclick = () => {
        if (file.isFolderNode()) {
          this.fileManager.action("navigate", file);
        } else {
          this.fileManager.action("openPreview", file);
        }
      };

      const mediaHTML = file.isFolderNode()
        ? tpl.folderIcon
        : tpl.fileMedia(file);

      card.innerHTML = tpl.card(group, mediaHTML);

      this.container.appendChild(card);
      this.statusElements.set(group, card.querySelector(".comparison-status"));

      const previewEl = card.querySelector(".widget-preview-area");
      if ((file.isImage() && previewEl instanceof HTMLImageElement)
        || (file.isVideo() && previewEl instanceof HTMLVideoElement)) {
        this.fileManager.action("loadPreviewMedia", file, previewEl);
      }
    }
  }

  updateComparisonStatuses() {
    for (const [group, statusElement] of this.statusElements) {
      if (!statusElement) continue;
      statusElement.textContent = group.comparisonStatus || "";
      statusElement.classList.remove("text-emerald-300", "text-amber-300", "text-rose-300", "text-slate-300");
      statusElement.classList.add(UITemplates.getComparisonStatusClass(group.comparisonStatus));
    }
  }

  showContextMenu(event, group) {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuActions?.classList.add("hidden");
    if (this.contextMenuActions && this.contextMenuActionsParking) {
      this.contextMenuActionsParking.appendChild(this.contextMenuActions);
    }
    const actionRows = [
      {
        action: file => file.isFolderNode() ? "navigate" : "openPreview",
        label: file => file.isFolderNode() ? "Open" : "View",
      },
      {
        action: () => "downloadRecord",
        label: () => "Download",
      },
      {
        action: () => "syncFileToSupabase",
        label: () => "Sync to Supabase",
        filter: file => !file.isFolderNode() && file.getStorageName() === "Google Drive",
      },
      {
        action: () => "deleteRecord",
        label: () => "Delete",
        style: "text-rose-300 hover:text-rose-200",
      },
    ];

    this.contextMenu.innerHTML = group ? actionRows.map(row => {
      const choices = group.files
        .map((file, index) => ({ file, index, action: row.action(file), label: row.label(file) }))
        .filter(choice => !(choice.action === "downloadRecord" && choice.file.isFolderNode()))
        .filter(choice => !row.filter || row.filter(choice.file))
        .sort((a, b) => {
          if (a.file.getStorageName() === "Google Drive") return -1;
          if (b.file.getStorageName() === "Google Drive") return 1;
          return 0;
        });

      if (choices.length === 0) return "";

      if (choices.length === 1) {
        const choice = choices[0];
        return `<button type="button" data-action="${choice.action}" data-file-index="${choice.index}"
          class="w-full text-left px-3 py-2 text-xs transition hover:bg-white/10 ${row.style || ""}">
          ${escapeHtml(choice.label)} (${escapeHtml(choice.file.getStorageName())})
        </button>`;
      }

      const services = choices.map(choice =>
        `<button type="button" data-action="${choice.action}" data-file-index="${choice.index}"
          class="w-full text-left px-3 py-2 text-xs whitespace-nowrap hover:bg-white/10 ${row.style || ""}">
          ${escapeHtml(choice.file.getStorageName())}
        </button>`
      ).join("");

      return `<div class="relative menu-item" data-menu-item>
        <button type="button" data-menu-toggle aria-label="Choose service for ${escapeHtml(choices[0].label)}"
          class="w-full text-left px-3 py-2 text-xs transition hover:bg-white/10 ${row.style || ""} flex items-center justify-between">
          <span>${escapeHtml(choices[0].label)}</span>
          <span class="px-1 text-slate-400">
            <i class="fa-solid fa-chevron-right text-[9px]"></i>
          </span>
        </button>
        <div class="menu-submenu hidden fixed z-[111] min-w-44 border border-white/20 bg-zinc-900 py-1 text-slate-200 shadow-lg">
          ${services}
        </div>
      </div>`;
    }).join("") : "";
    if (!group && this.contextMenuActions) {
      this.contextMenu.insertAdjacentHTML("beforeend", '<div class="border-t border-white/10 my-1"></div>');
      this.contextMenuActions.classList.remove("hidden");
      this.contextMenu.appendChild(this.contextMenuActions);
    }
    this.contextMenu.classList.remove("hidden");

    const left = event.clientX || 8;
    const top = event.clientY || 8;
    const rect = this.contextMenu.getBoundingClientRect();
    this.contextMenu.style.left = `${Math.max(8, Math.min(left, window.innerWidth - rect.width - 8))}px`;
    this.contextMenu.style.top = `${Math.max(8, Math.min(top, window.innerHeight - rect.height - 8))}px`;

    this.contextMenu.querySelectorAll("[data-menu-item]").forEach(menuItem => {
      const submenu = menuItem.querySelector(".menu-submenu");
      const toggleButton = menuItem.querySelector("[data-menu-toggle]");
      if (!submenu || !toggleButton) return;

      const showSubmenu = () => {
        this.contextMenu.querySelectorAll(".menu-submenu").forEach(openMenu => {
          if (openMenu !== submenu) openMenu.classList.add("hidden");
        });

        submenu.classList.remove("hidden");
        const parentRect = toggleButton.getBoundingClientRect();
        const submenuRect = submenu.getBoundingClientRect();
        const showLeft = parentRect.right + submenuRect.width > window.innerWidth - 8;
        const submenuLeft = showLeft
          ? parentRect.left - submenuRect.width
          : parentRect.right;
        const submenuTop = Math.max(
          8,
          Math.min(parentRect.top, window.innerHeight - submenuRect.height - 8)
        );
        submenu.style.left = `${submenuLeft}px`;
        submenu.style.top = `${submenuTop}px`;
      };

      menuItem.addEventListener("mouseenter", showSubmenu);
      toggleButton.addEventListener("click", showSubmenu);
      menuItem.addEventListener("mouseleave", () => submenu.classList.add("hidden"));
    });

    this.contextMenu.querySelectorAll("[data-action]").forEach(button => {
      button.addEventListener("click", () => {
        const file = group.files[Number(button.dataset.fileIndex)];
        this.hideContextMenu();
        this.fileManager.action(button.dataset.action, file);
      });
    });
  }

  hideContextMenu() {
    this.contextMenu.classList.add("hidden");
    this.contextMenuActions?.classList.add("hidden");
    if (this.contextMenuActions && this.contextMenuActionsParking) {
      this.contextMenuActionsParking.appendChild(this.contextMenuActions);
    }
    this.contextMenu.querySelectorAll(".menu-submenu").forEach(submenu => submenu.classList.add("hidden"));
  }

}

class FileGroup {
  constructor(files) {
    this.files = files;
    this.comparisonStatus = "";
  }

  get selectedFile() { return this.files[0]; }
  isFolderNode() { return this.selectedFile.isFolderNode(); }
  getName() { return this.selectedFile.getName(); }
  getDisplayName() { return this.selectedFile.getDisplayName(); }
  getFullPath() { return this.selectedFile.getFullPath(); }
  getSubtext() { return this.selectedFile.getSubtext(); }
  getSize() { return this.selectedFile.getSize(); }
}

class FilePreviewManager {
  constructor(fileManagerInstance) {
    this.fileManager = fileManagerInstance;
    this._currentBlobUrl = null;

    this._ensureModalInDOM();
    this._initModalListeners();
  }

  _ensureModalInDOM() {
    if (!document.getElementById("modalPreview")) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = UITemplates.preview.modalHtml.trim();
      document.body.appendChild(tempDiv.firstChild);
    }
  }

  _initModalListeners() {
    const closePreview = () => this.fileManager.action("closePreview");

    document.getElementById("closePreviewModalBtn")?.addEventListener("click", closePreview);
    document.getElementById("closePreviewModalBtnAlt")?.addEventListener("click", closePreview);
    document.getElementById("previewCancelEditBtn")?.addEventListener("click", () => this.fileManager.action("cancelEdit"));
    document.getElementById("previewDownloadBtn")?.addEventListener("click", () => {
      if (this.fileManager.currentFileRecord) this.fileManager.action("downloadRecord", this.fileManager.currentFileRecord);
    });
    document.getElementById("previewSaveBtn")?.addEventListener("click", () => {
      const textarea = document.getElementById("editTextarea");
      if (textarea) this.fileManager.action("saveEditedText", textarea.value);
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

    if (title) title.textContent = `${fileRecord.getDisplayName()} — ${fileRecord.getStorageName()}${fileRecord.isEncryptedFile() ? " (Decrypted securely)" : ""}`;
    if (body) body.innerHTML = tpl.loadingSpinner;
    if (sidebar) sidebar.innerHTML = tpl.sidebarLoading;
    document.getElementById("modalPreview")?.classList.remove("hidden");

    saveBtn?.classList.add("hidden");
    cancelBtn?.classList.add("hidden");
  }

  async renderPreview(fileRecord, blob) {
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
        sizeDisplay: fileRecord.getFormattedSize()
      });

      sidebar.querySelector(".content-hash")?.addEventListener("click", () => this.fileManager.action("computeHashes", escapedUrl));
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
        document.getElementById("htmlPreviewTab")?.addEventListener("click", () => this.fileManager.action("switchHtmlView", "preview"));
        document.getElementById("htmlEditorTab")?.addEventListener("click", () => this.fileManager.action("switchHtmlView", "editor"));
        setTimeout(() => {
          const iframe = document.getElementById("htmlPreviewFrame");
          if (iframe) iframe.srcdoc = text;
        }, 50);
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

class BreadcrumbManager {
  constructor(containerId, fileManagerInstance) {
    this.container = document.getElementById(containerId);
    this.fileManager = fileManagerInstance;
    this.history = [{ path: "", name: "root" }];
    this.path = "";
  }

  navigateToFolder(path, name) {
    if (this.path === path) return;
    this.path = path;
    this.history.push({ path, name });
    this.render();
    this.fileManager.action("listFiles");
  }

  jumpToBreadcrumb(index) {
    this.history = this.history.slice(0, index + 1);
    this.path = this.history[this.history.length - 1].path;
    this.render();
    this.fileManager.action("listFiles");
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

      const isRoot = crumb.name.toLowerCase() === "root";
      btn.innerHTML = tpl.crumb(crumb.name, isRoot);
      btn.onclick = () => this.fileManager.action("jumpBreadcrumb", idx);
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

class CreateFolderModal {
  constructor(fileManagerInstance) {
    this.fileManager = fileManagerInstance;
    this.injectHTML();
    this.initListeners();
  }

  injectHTML() {
    if (document.getElementById("modalCreateFolder")) return;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = UITemplates.createFolderModal.modalHtml.trim();
    document.body.appendChild(wrapper.firstElementChild);
  }

  initListeners() {
    const openModalBtn = document.getElementById("openCreateFolderModalBtn");
    const closeModalBtn = document.getElementById("closeCreateFolderModalBtn");
    const submitModalBtn = document.getElementById("submitCreateFolderBtn");
    const folderNameInput = document.getElementById("folderNameInput");

    if (openModalBtn) openModalBtn.addEventListener("click", () => this.fileManager.action("openFolderModal"));
    if (closeModalBtn) closeModalBtn.addEventListener("click", () => this.fileManager.action("closeFolderModal"));
    if (submitModalBtn) submitModalBtn.addEventListener("click", () => this.submit());

    if (folderNameInput) {
      folderNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.submit();
        }
      });
    }
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
    const modal = document.getElementById("modalCreateFolder");
    if (modal) modal.classList.add("hidden");
  }

  async submit() {
    const name = document.getElementById("folderNameInput")?.value.trim();
    if (!name) return;
    this.fileManager.action("createFolder", name);
  }
}

class FileManager {
  constructor() {
    this.allItems = [];
    this.filteredItems = [];
    this.listRequestId = 0;
    this.currentFileRecord = null;
    
    this.breadcrumb = new BreadcrumbManager("breadcrumbNav", this);
    this.gridRenderer = new ItemsGridRenderer("itemsGrid", this);
    this.filePreview = new FilePreviewManager(this);
    this.createFolderModal = new CreateFolderModal(this);

    FileRecord.setServiceChangeHandler(() => this.action("refresh"));
    this.action("refresh");
  }

  action(actionName, ...args) {
    switch (actionName) {
      case "refresh": return this.listFiles();
      case "listFiles": return this.listFiles();
      case "navigate": return this.navigate(args[0]);
      case "jumpBreadcrumb": return this.breadcrumb.jumpToBreadcrumb(args[0]);
      case "openPreview": return this.openPreview(args[0]);
      case "closePreview": return this.filePreview.close();
      case "cancelEdit": return this.cancelEdit();
      case "saveEditedText": return this.saveEditedText(args[0]);
      case "computeHashes": return this.computeHashes(args[0]);
      case "switchHtmlView": return this.filePreview.switchHtmlView(args[0]);
      case "loadPreviewMedia": return this.loadPreviewMedia(args[0], args[1]);
      case "createFolder": return this.createFolder(args[0]);
      case "openFolderModal": return this.createFolderModal.open();
      case "closeFolderModal": return this.createFolderModal.close();
      case "toggleActionsMenu": return this.toggleActionsMenu();
      case "closeActionsMenu": return this.closeActionsMenu();
      case "upload": return this.handleFileUpload(args[0], args[1], args[2]);
      case "downloadRecord": return this.downloadRecord(args[0]);
      case "deleteRecord": return this.deleteRecord(args[0]);
      case "backup": return this.createBackup();
      case "syncDriveToSupabase": return this.syncDriveToSupabase();
      case "syncFileToSupabase": return this.syncFileToSupabase(args[0]);
      default: throw new Error(`Unknown file-manager action: ${actionName}`);
    }
  }

  async listFiles() {
    const requestId = ++this.listRequestId;
    try {
      const { data, errors } = await FileRecord.allFromServices(this.breadcrumb.path);
      if (requestId !== this.listRequestId) return;
      errors.forEach(({ service, error }) => {
        console.error(`Failed to list ${service}:`, error);
        showToast(`${service}: ${error.message || "Failed to list files"}`, "error");
      });
      const groupedFiles = new Map();
      data.forEach(file => {
        const path = file.getFullPath().replace(/^\/+|\/+$/g, "");
        const key = `${file.isFolderNode() ? "folder" : "file"}:${path}`;
        const copies = groupedFiles.get(key) || [];
        copies.push(file);
        groupedFiles.set(key, copies);
      });
      this.allItems = Array.from(groupedFiles.values(), files => new FileGroup(files));
      this.renderView();
      await this.compareFiles(this.allItems);
      if (requestId === this.listRequestId) this.gridRenderer.updateComparisonStatuses();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to list files", "error");
    }
  }

  async compareFiles(groups) {
    for (const group of groups) {
      if (group.files.length === 1) {
        group.comparisonStatus = `Only in ${group.files[0].getStorageName()}`;
        continue;
      }
      try {
        group.comparisonStatus = group.isFolderNode()
          ? await this.compareFolderCopies(group)
          : await FileRecord.compareCopies(group.files);
      } catch (error) {
        const type = group.isFolderNode() ? "folder" : "file";
        console.error(`Failed to compare matching ${type} "${group.getDisplayName()}":`, error);
        group.comparisonStatus = "Could not compare";
      }
    }
  }

  async compareFolderCopies(group) {
    const services = new Map(
      FileRecord.getStorageServices().map(service => [service.name, service])
    );
    const trees = await Promise.all(group.files.map(async folder => {
      const service = services.get(folder.getStorageName());
      if (!service) throw new Error(`Storage service not found: ${folder.getStorageName()}`);

      const rootPath = folder.getFullPath().replace(/^\/+|\/+$/g, "");
      const items = new Map();
      const visitedFolders = new Set();
      const collect = async path => {
        const cleanPath = path.replace(/^\/+|\/+$/g, "");
        if (visitedFolders.has(cleanPath)) return;
        visitedFolders.add(cleanPath);

        const { data, error } = await FileRecord.all(cleanPath, {}, service.storage, service.name);
        if (error) throw error;

        for (const item of data) {
          const itemPath = item.getFullPath().replace(/^\/+|\/+$/g, "");
          const relativePath = itemPath.slice(rootPath.length).replace(/^\/+/, "");
          items.set(relativePath, item);
          if (item.isFolderNode()) await collect(itemPath);
        }
      };

      await collect(rootPath);
      return items;
    }));

    const paths = new Set(trees.flatMap(tree => Array.from(tree.keys())));
    for (const path of paths) {
      const copies = trees.map(tree => tree.get(path));
      if (copies.some(copy => !copy)
        || new Set(copies.map(copy => copy.isFolderNode())).size > 1) {
        return "Different files";
      }

      if (!copies[0].isFolderNode()) {
        const status = await FileRecord.compareCopies(copies);
        if (status !== "Synced") return status;
      }
    }

    return "Synced";
  }

  renderView() {
    this.breadcrumb.render();

    const searchVal = document.getElementById("searchInput")?.value.toLowerCase() || "";
    this.filteredItems = searchVal
      ? this.allItems.filter(file => (file.getDisplayName() || file.getName()).toLowerCase().includes(searchVal))
      : [...this.allItems];

    this.filteredItems.sort((a, b) => {
      if (a.isFolderNode() !== b.isFolderNode()) {
        return a.isFolderNode() ? -1 : 1;
      }
      return a.getDisplayName().localeCompare(b.getDisplayName());
    });

    const label = document.getElementById("itemCountLabel");
    if (label) label.textContent = `${this.filteredItems.length} item${this.filteredItems.length !== 1 ? "s" : ""}`;

    const serviceLabel = document.getElementById("serviceStatusLabel");
    if (serviceLabel) {
      serviceLabel.textContent = FileRecord.getServiceStatuses().map(service =>
        `${service.name}: ${service.isAvailable ? "Connected" : "Not connected"}`
      ).join(" · ");
    }

    this.gridRenderer?.render(this.filteredItems);
  }

  toggleActionsMenu() {
    document.getElementById("actionsMenuToggleBtn")?.classList.toggle("hidden");
  }

  closeActionsMenu() {
    document.getElementById("actionsMenuToggleBtn")?.classList.add("hidden");
  }

  async handleFileUpload(event, isFolderUpload = false, isEncrypted = false) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    showToast(`Uploading ${files.length} item(s) (${isEncrypted ? 'Encrypted' : 'Normal'})...`, "info", 2500);
    let success = 0, failed = 0;
    const currentPath = this.breadcrumb.path;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let targetPath = currentPath ? `${currentPath}/` : "";
        if (isFolderUpload && file.webkitRelativePath) {
          targetPath += file.webkitRelativePath;
        } else {
          targetPath += file.name;
        }

        const { error } = await FileRecord.create(targetPath, file, { encrypt: isEncrypted });
        if (error) throw error;

        success++;
        if ((i + 1) % 5 === 0 || i === files.length - 1) {
          showToast(`Uploaded ${i + 1} / ${files.length}`, "info", 1200);
        }
      } catch (err) {
        console.error(err);
        failed++;
        showToast(`Failed: ${file.name}`, "error", 2500);
      }
    }

    await this.action("refresh");
    if (failed === 0) {
      showToast(`Successfully uploaded ${success} item(s)`, "success");
    } else {
      showToast(`Uploaded ${success}, failed ${failed}`, "warning");
    }
    event.target.value = "";
  }

  navigate(file) {
    this.breadcrumb.navigateToFolder(file.getFullPath(), file.getName());
  }

  async openPreview(file) {
    this.currentFileRecord = file;
    this.filePreview.showLoading(file);
    try {
      const response = await file.fetchContent(60);
      const blob = await response.blob();
      file._byteLength = blob.size;
      await this.filePreview.renderPreview(file, blob);
    } catch (error) {
      console.error("Preview failed:", error);
      this.filePreview.showPreviewError();
      showToast(error.message || "Preview failed", "error");
    }
  }

  closePreview() {
    this.filePreview.close();
  }

  cancelEdit() {
    if (this.currentFileRecord) this.action("openPreview", this.currentFileRecord);
  }

  async saveEditedText(updatedContent) {
    if (!this.currentFileRecord) return;
    try {
      await this.currentFileRecord.save(new Blob([updatedContent], { type: "text/plain;charset=utf-8" }));
      showToast("Changes saved successfully", "success", 2000);
      await this.action("refresh");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save changes", "error", 2500);
    }
  }

  async computeHashes(url) {
    const file = this.currentFileRecord;
    if (!file) return;
    this.filePreview.showHashesLoading();

    try {
      await file.hashContent(url);
      if (!file.hash_content || !file.hash_file) {
        throw new Error("Hash computation returned empty results.");
      }
      this.filePreview.renderHashesResult({
        contentHash: file.hash_content,
        combinedHash: file.hash_file,
        rawCombinedString: escapeHtml(file.hash_filename + file.hash_content),
        byteLength: file._byteLength || "Unknown"
      });
    } catch (error) {
      console.error(error);
      this.filePreview.renderHashesError(error.message || "Unknown error");
    }
  }

  async loadPreviewMedia(file, element) {
    try {
      await file.loadPreviewMedia(element);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Failed to load file preview:", error);
    }
  }

  async createFolder(name) {
    const currentPath = this.breadcrumb.path;
    const folderPath = currentPath
      ? `${currentPath}/${name}/.emptyFolderPlaceholder`
      : `${name}/.emptyFolderPlaceholder`;
    try {
      const { error } = await FileRecord.create(folderPath, new Blob([""]), { upsert: false });
      if (error) throw error;
      this.createFolderModal.close();
      showToast(`Folder "${name}" created`, "success");
      await this.action("refresh");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to create folder", "error");
    }
  }

  async downloadRecord(file) {
    try {
      const response = await file.fetchContent();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = file.getDisplayName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Download failed:", error);
      showToast(error.message || "Download failed", "error");
    }
  }

  async deleteRecord(file) {
    const path = file.getFullPath();
    const message = file.isFolderNode()
      ? `Delete folder "${path}" and all its contents from ${file.getStorageName()}?`
      : `Delete file "${path}" from ${file.getStorageName()}?`;
    if (!confirm(message)) return;

    try {
      await file.delete({ recursive: true });
      showToast("Deleted successfully", "success");
      await this.action("refresh");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Delete failed", "error");
    }
  }

  async createBackup() {
    const btn = document.getElementById("backupBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Backing up...</span>';
    }
    
    await FileRecord.backup();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-box-archive"></i> <span>Backup</span>';
    }
  }

  updateSyncProgress(status, current, completed, total, summary, done = false) {
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
    const percent = total > 0 ? Math.min(100, Math.round(completed / total * 100)) : done ? 100 : 0;
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", String(percent));
  }

  async compareSyncCopy({ id, size, isEditable, metadata = {} }, path, existing, drive, supabase) {
    if (!existing) return { matches: false };
    const normalizePath = value => String(value || "").replace(/^\/+|\/+$/g, "");
    if (normalizePath(path) !== normalizePath(existing.id || path)
      || Number(size) !== Number(existing.size)) {
      return { matches: false };
    }
    if (!isEditable) return { matches: true };

    try {
      if (!metadata.hash_content) {
        const { error } = await drive.fetchContent({ id, metadata, metadataKnown: true });
        if (error) throw error;
      }
      if (!existing.metadata?.hash_content) {
        existing.metadata ||= {};
        const { error } = await supabase.fetchContent({
          path,
          metadata: existing.metadata,
          metadataKnown: true
        });
        if (error) throw error;
      }
      return { matches: metadata.hash_content === existing.metadata?.hash_content };
    } catch (comparisonError) {
      return { matches: false, comparisonError };
    }
  }

  async syncFileToSupabase(file) {
    const services = FileRecord.getStorageServices();
    const drive = services.find(service => service.name === "Google Drive")?.storage;
    const supabase = services.find(service => service.name === "Supabase")?.storage;

    if (!drive?.token || !supabase?.client) {
      showToast("Connect Google Drive and configure Supabase before syncing", "warning");
      return;
    }
    if (!file || file.isFolderNode() || file.getStorageName() !== "Google Drive") {
      showToast("Select a Google Drive file to sync", "warning");
      return;
    }

    const path = file.getFullPath();
    try {
      this.updateSyncProgress("Checking Supabase copy", path, 0, 1, "Comparing path and size");
      const { data: existing, error: existingError } = await supabase.getByPath(path);
      if (existingError && existingError.message !== "File not found") throw existingError;

      const comparison = await this.compareSyncCopy(
        {
          id: file.getId(),
          size: file.getSize(),
          isEditable: file.isEditable(),
          metadata: file.getMetadata()
        },
        path,
        existing,
        drive,
        supabase
      );
      if (comparison.comparisonError) {
        console.warn(`Could not compare ${path}; replacing the Supabase copy:`, comparison.comparisonError);
      }

      if (comparison.matches) {
        this.updateSyncProgress("Sync complete", path, 1, 1, "Already up to date", true);
        showToast(`${file.getDisplayName()} is already up to date`, "info");
        return;
      }

      this.updateSyncProgress("Syncing file to Supabase", path, 0, 1, "Downloading from Google Drive");
      const { data: response, error } = await drive.fetchContent({
        id: file.getId(),
        metadata: file.getMetadata(),
        metadataKnown: true
      });
      if (error) throw error;
      const blob = await response.blob();

      this.updateSyncProgress("Syncing file to Supabase", path, 0, 1, "Uploading to Supabase");
      const uploadFile = new File([blob], file.getName(), {
        type: file.getMimeType() || blob.type || "application/octet-stream"
      });
      const { error: uploadError } = await supabase.upload(path, uploadFile, { upsert: true });
      if (uploadError) throw uploadError;

      this.updateSyncProgress("Sync complete", path, 1, 1, "File copied to Supabase", true);
      showToast(`${file.getDisplayName()} synced to Supabase`, "success");
    } catch (error) {
      console.error(`Failed to sync ${path} to Supabase:`, error);
      this.updateSyncProgress("Sync failed", path, 0, 1, error.message || "Failed to sync file", true);
      showToast(`Failed to sync ${file.getDisplayName()}: ${error.message || "Unknown error"}`, "error");
    }
  }

  async syncDriveToSupabase() {
    const services = FileRecord.getStorageServices();
    const drive = services.find(service => service.name === "Google Drive")?.storage;
    const supabase = services.find(service => service.name === "Supabase")?.storage;
    const button = document.getElementById("syncToSupabaseBtn");
    const originalButtonContent = button?.innerHTML;

    if (!drive?.token || !supabase?.client) {
      showToast("Connect Google Drive and configure Supabase before syncing", "warning");
      return;
    }
    if (!confirm("Sync Google Drive to Supabase? Files in Supabase that are not in Drive will be deleted.")) {
      return;
    }

    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2.5 w-4"></i><span>Syncing...</span>';
    }

    let completedWork = 0;
    let totalWork = 0;
    this.updateSyncProgress("Preparing sync", "Scanning Google Drive...", 0, 0, "In progress");

    try {
      const files = [];
      const emptyFolders = [];
      const collectFiles = async (path = "") => {
        this.updateSyncProgress("Scanning Google Drive", path || "/", 0, 0, "Building file list");
        const { data, error } = await drive.list(path, { limit: 1000 });
        if (error) throw error;

        const entries = data || [];
        if (path && entries.length === 0) emptyFolders.push(path);

        for (const entry of entries) {
          const entryPath = path ? `${path}/${entry.name}` : entry.name;
          if (entry.mimeType === "application/vnd.google-apps.folder") {
            await collectFiles(entryPath);
          } else {
            files.push({ entry, path: entryPath });
          }
        }
      };

      await collectFiles();
      const drivePaths = new Set(files.map(file => file.path));
      for (const folderPath of emptyFolders) {
        drivePaths.add(`${folderPath}/.emptyFolderPlaceholder`);
      }

      const supabaseFiles = new Map();
      const collectSupabaseFiles = async (path = "") => {
        this.updateSyncProgress("Scanning Supabase", path || "/", 0, 0, "Building file list");
        let offset = 0;
        while (true) {
          const { data, error } = await supabase.list(path, { limit: 1000, offset });
          if (error) throw error;

          const entries = data || [];
          for (const entry of entries) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;
            if (entry.mimeType === "application/vnd.google-apps.folder") {
              await collectSupabaseFiles(entryPath);
            } else {
              supabaseFiles.set(entryPath, entry);
            }
          }

          if (entries.length < 1000) break;
          offset += entries.length;
        }
      };
      await collectSupabaseFiles();

      const orphanedPaths = [...supabaseFiles.keys()].filter(path => !drivePaths.has(path));
      totalWork = files.length + emptyFolders.length + orphanedPaths.length;

      let synced = 0;
      let skipped = 0;
      let failed = 0;
      const uploadFile = async (path, name, mimeType, blob) => {
        const file = new File([blob], name, {
          type: mimeType || blob.type || "application/octet-stream"
        });
        const { error } = await supabase.upload(path, file, { upsert: true });
        if (error) throw error;
      };

      for (const { entry, path } of files) {
        const existing = supabaseFiles.get(path);
        this.updateSyncProgress(
          existing ? "Checking Supabase copy" : "Copying Drive file to Supabase",
          path,
          completedWork,
          totalWork,
          "In progress"
        );
        let itemFailed = false;
        let itemStatus = "Copied to Supabase";
        try {
          const editableFile = new FileEntity({
            name: entry.name,
            full_path: path,
            size: Number(entry.size || 0),
            mime_type: entry.mimeType
          });
          const comparison = await this.compareSyncCopy(
            {
              id: entry.id,
              size: entry.size,
              isEditable: editableFile.isEditable(),
              metadata: entry.appProperties || {}
            },
            path,
            existing,
            drive,
            supabase
          );
          if (comparison.comparisonError) {
            console.warn(`Could not compare ${path}; replacing the Supabase copy:`, comparison.comparisonError);
          }

          if (comparison.matches) {
            skipped++;
            itemStatus = "Already up to date";
          } else {
            const { data: response, error } = await drive.fetchContent({
              id: entry.id,
              metadata: entry.appProperties || {},
              metadataKnown: true
            });
            if (error) throw error;
            const blob = await response.blob();
            await uploadFile(path, entry.name, entry.mimeType, blob);
            synced++;
          }
        } catch (error) {
          console.error(`Failed to sync ${path} to Supabase:`, error);
          failed++;
          itemFailed = true;
        }
        completedWork++;
        this.updateSyncProgress(
          itemFailed ? "Failed to copy file" : itemStatus,
          path,
          completedWork,
          totalWork,
          `${synced} copied · ${skipped} unchanged · ${failed} failed`
        );
      }

      for (const folderPath of emptyFolders) {
        this.updateSyncProgress("Creating empty folder in Supabase", folderPath, completedWork, totalWork, "In progress");
        let itemFailed = false;
        try {
          const placeholderPath = `${folderPath}/.emptyFolderPlaceholder`;
          await uploadFile(
            placeholderPath,
            ".emptyFolderPlaceholder",
            "application/octet-stream",
            new Blob([])
          );
          synced++;
        } catch (error) {
          console.error(`Failed to sync empty folder ${folderPath} to Supabase:`, error);
          failed++;
          itemFailed = true;
        }
        completedWork++;
        this.updateSyncProgress(
          itemFailed ? "Failed to create folder" : "Folder created in Supabase",
          folderPath,
          completedWork,
          totalWork,
          `${synced} copied · ${skipped} unchanged · ${failed} failed`
        );
      }

      let deleted = 0;
      let deleteFailed = 0;
      for (let index = 0; index < orphanedPaths.length; index += 100) {
        const batch = orphanedPaths.slice(index, index + 100);
        const current = batch.length === 1
          ? batch[0]
          : `${batch[0]} (+${batch.length - 1} more)`;
        this.updateSyncProgress("Removing Supabase-only files", current, completedWork, totalWork, "In progress");
        let batchFailed = false;
        try {
          const { error } = await supabase.remove(batch);
          if (error) throw error;
          deleted += batch.length;
        } catch (error) {
          console.error("Failed to remove Supabase-only files:", error);
          deleteFailed += batch.length;
          batchFailed = true;
        }
        completedWork += batch.length;
        this.updateSyncProgress(
          batchFailed ? "Failed to remove files" : "Removed Supabase-only files",
          current,
          completedWork,
          totalWork,
          `${deleted} removed · ${deleteFailed} failed`
        );
      }

      await this.action("refresh");
      if (failed === 0 && deleteFailed === 0) {
        this.updateSyncProgress(
          "Sync complete",
          `Copied ${synced}; skipped ${skipped} unchanged; removed ${deleted} Supabase-only`,
          completedWork,
          totalWork,
          "Complete",
          true
        );
        showToast(
          `Copied ${synced}, skipped ${skipped} unchanged, removed ${deleted} Supabase-only item(s)`,
          "success"
        );
      } else {
        this.updateSyncProgress(
          "Sync finished with errors",
          `Copied ${synced}; skipped ${skipped} unchanged; ${failed} sync failures; removed ${deleted}; ${deleteFailed} removal failures`,
          completedWork,
          totalWork,
          "Finished with errors",
          true
        );
        showToast(
          `Copied ${synced}, skipped ${skipped} unchanged; ${failed} sync failures, ${deleted} removed, ${deleteFailed} removals failed`,
          "warning",
          5000
        );
      }
    } catch (error) {
      console.error("Drive to Supabase sync failed:", error);
      this.updateSyncProgress("Sync stopped", error.message || "Failed to build a complete file list", completedWork, totalWork, "Stopped");
      showToast(error.message || "Drive to Supabase sync failed", "error", 5000);
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = originalButtonContent;
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const actionsMenuBtn = document.getElementById("actionsMenu");
  const actionsMenuDropdown = document.getElementById("actionsMenuToggleBtn");

  if (actionsMenuBtn && actionsMenuDropdown) {
    actionsMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fileManager.action("toggleActionsMenu");
    });

    document.addEventListener("click", (e) => {
      if (!actionsMenuBtn.contains(e.target) && !actionsMenuDropdown.contains(e.target)) {
        fileManager.action("closeActionsMenu");
      }
    });
  }
  const fileInput = document.getElementById("fileUpload");
  const encryptedInput = document.getElementById("encryptedFileUpload");
  const folderInput = document.getElementById("folderUpload");
  const syncToSupabaseBtn = document.getElementById("syncToSupabaseBtn");

  document.getElementById("syncProgressCloseBtn")?.addEventListener("click", () => {
    document.getElementById("syncProgressPanel")?.classList.add("hidden");
  });

  syncToSupabaseBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    fileManager.action("closeActionsMenu");
    fileManager.action("syncDriveToSupabase");
  });

  // 1. Normal File Upload
  fileInput?.addEventListener("change", (e) => fileManager.action("upload", e, false, false));

  // 2. Encrypted File Upload
  if (encryptedInput && typeof fileManager !== "undefined") {
    encryptedInput.addEventListener("change", (e) => {
      fileManager.action("upload", e, false, true);
    });
  }

  // 3. Folder Upload
  if (folderInput && typeof fileManager !== "undefined") {
    folderInput.addEventListener("change", (e) => fileManager.action("upload", e, true, false));
  }
  set_bg();
});
const fileManager = new FileManager();
