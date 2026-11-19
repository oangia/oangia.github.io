const escapeHtml=e=>String(e||"").replace(/[&<>'"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[e]||e));function showToast(e,t="info",o=4e3){let r=document.getElementById("toastContainer");r||(r=document.createElement("div"),r.id="toastContainer",r.className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full",document.body.appendChild(r));const a=document.createElement("div"),n={success:{border:"border-emerald-800",text:"text-emerald-100",icon:"fa-circle-check text-emerald-400",bar:"border-l-emerald-500"},error:{border:"border-rose-800",text:"text-rose-100",icon:"fa-circle-exclamation text-rose-400",bar:"border-l-rose-500"},warning:{border:"border-amber-800",text:"text-amber-100",icon:"fa-triangle-exclamation text-amber-400",bar:"border-l-amber-500"},info:{border:"border-slate-700",text:"text-slate-100",icon:"fa-circle-info text-sky-400",bar:"border-l-sky-500"}}[t]||{border:"border-slate-700",text:"text-slate-100",icon:"fa-circle-info text-sky-400",bar:"border-l-sky-500"};a.className=`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${n.border} ${n.text} ${n.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`,a.innerHTML=`\n        <div class="flex items-center"><i class="fa-solid ${n.icon} text-base mr-3"></i><span>${escapeHtml(e)}</span></div>\n        <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>\n    `,r.appendChild(a),requestAnimationFrame(()=>a.classList.remove("translate-x-12","opacity-0")),o>0&&setTimeout(()=>{a.classList.add("translate-x-12","opacity-0"),setTimeout(()=>a.remove(),300)},o)}function set_bg(){window.self===window.top&&(document.body.style.backgroundImage="linear-gradient(rgba(5, 8, 17, 0.45), rgba(5, 8, 17, 0.7)), url('https://images.unsplash.com/photo-1772511988871-a010197b94ae?auto=format&fit=crop&w=1920&q=80')",document.body.style.backgroundSize="cover",document.body.style.backgroundPosition="center",document.body.style.backgroundRepeat="no-repeat",document.body.style.backgroundAttachment="fixed",document.body.style.backgroundColor="#050811")}
class Config{static get _TEMPLATES(){return{overlayClass:"hidden fixed inset-0 z-[60] bg-black/40",panelClass:"hidden fixed inset-0 z-[70] flex items-center justify-center p-6 overflow-y-auto",modalBox:e=>`\n        <div class="max-w-3xl w-full bg-zinc-900/0 border border-white/15 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-2xl relative">\n          <button id="configCloseBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition">\n            <i class="fa-solid fa-xmark text-lg"></i>\n          </button>\n\n          <div class="border-b border-white/10 pb-4">\n            <h2 class="text-lg font-bold text-white mb-1">Configuration</h2>\n            <p class="text-xs text-slate-400">Enter your Google Drive and Supabase credentials.</p>\n          </div>\n\n          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">\n            <h3 class="font-semibold text-sm text-white flex items-center gap-2">\n              <i class="fa-solid fa-shield-halved text-indigo-400"></i> Google Drive & Encryption\n            </h3>\n            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Google Client ID</label>\n                <input id="clientIdInput" name="gdrive_oauth_client_id" type="text" placeholder="123456789-abc.apps.googleusercontent.com"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n                <p class="text-[10px] text-slate-400 mt-1">\n                  Current origin: <code id="originLabel" class="text-indigo-300">${e}</code>\n                </p>\n              </div>\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Private Encryption Key / Password</label>\n                <input id="secretKeyInput" name="gdrive_encryption_password" type="password" placeholder="Enter a secure encryption passphrase"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n                <p class="text-[10px] text-slate-400 mt-1">Required to encrypt/decrypt secure uploads.</p>\n              </div>\n            </div>\n          </div>\n      \n          <div class="bg-black/20 border border-white/10 p-4 rounded-xl space-y-4">\n            <h3 class="font-semibold text-sm text-white flex items-center gap-2">\n              <i class="fa-solid fa-bolt text-emerald-400"></i> Supabase Credentials\n            </h3>\n            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Project URL</label>\n                <input type="text" name="sb_url" placeholder="https://xxxxx.supabase.co" \n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n              <div>\n                <label class="block text-xs font-medium text-slate-300 mb-1">Anon Public Key</label>\n                <input type="text" name="sb_key" placeholder="eyJhbGciOiJIUzI1NiIsIn..." \n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n              <div class="lg:col-span-2">\n                <label class="block text-xs font-medium text-slate-300 mb-1">Storage Bucket Name</label>\n                <input type="text" name="sb_bucket" placeholder="files" value="files" data-default="files"\n                       class="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400">\n              </div>\n            </div>\n          </div>\n      \n          <div class="pt-2 flex justify-end gap-3">\n            <button id="configCancelBtn" class="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button>\n            <button id="configSaveBtn" class="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-white text-xs font-semibold rounded-lg transition">Save & Connect</button>\n          </div>\n        </div>`}}constructor(e){this.btnId=e,this.panelId="configPanel",this.overlayId="configOverlay",this.#e(),this.#t(),this.#n(),localStorage.getItem("sb_url")&&localStorage.getItem("sb_key")||this.open()}open(){document.getElementById(this.overlayId)?.classList.remove("hidden"),document.getElementById(this.panelId)?.classList.remove("hidden")}close(){document.getElementById(this.overlayId)?.classList.add("hidden"),document.getElementById(this.panelId)?.classList.add("hidden")}#e(){document.getElementById(this.overlayId)?.remove(),document.getElementById(this.panelId)?.remove();const e=document.createElement("div");e.id=this.overlayId,e.className=Config._TEMPLATES.overlayClass;const t=document.createElement("div");t.id=this.panelId,t.className=Config._TEMPLATES.panelClass,t.innerHTML=Config._TEMPLATES.modalBox(window.location.origin),document.body.appendChild(e),document.body.appendChild(t),document.getElementById("configCloseBtn").onclick=()=>this.close(),document.getElementById("configCancelBtn").onclick=()=>this.close(),e.onclick=()=>this.close(),t.querySelector("div").onclick=e=>e.stopPropagation(),document.getElementById("configSaveBtn").onclick=()=>this.#o()}#t(){const e=document.getElementById(this.btnId);e&&(e.onclick=e=>{e.preventDefault(),e.stopPropagation(),this.open()})}#n(){const e=document.getElementById(this.panelId);e&&e.querySelectorAll("input[name]").forEach(e=>{const t=localStorage.getItem(e.name);null!==t&&""!==t?e.value=t:e.dataset.default&&(e.value=e.dataset.default)})}#o(){const e=document.getElementById(this.panelId).querySelectorAll("input[name]"),t=Object.fromEntries([...e].map(e=>[e.name,e.value.trim()||e.dataset.default||""]));t.sb_url&&t.sb_key?(Object.entries(t).forEach(([e,t])=>localStorage.setItem(e,t)),this.close(),location.reload()):showToast("URL and Anon Key are required","warning")}}
new Config("navSettingsTab");

class ItemsGridRenderer {
  // --- UI & HTML Templates ---
  static get _TEMPLATES() {
    return {
      containerClass: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 p-4",
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
      card: (file, mediaHTML) => `<button class="delete-btn absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-red-500 text-white transition" title="Delete"><i class="fa-solid fa-xmark text-[10px]"></i></button>${mediaHTML}<div class="w-full pt-2 border-t border-white/20 flex flex-col"><span class="w-full text-xs font-semibold text-slate-200 truncate" title="${escapeHtml(file.getDisplayName())}">${escapeHtml(file.getDisplayName())}</span><span class="text-[9px] text-slate-300 font-mono mt-0.5">${file.getSubtext()}</span></div>`,
    };
  }

  constructor(containerId, fileManagerInstance) {
    this.container = document.getElementById(containerId);
    this.fileManager = fileManagerInstance;
  }
  
  async render(items) {
    if (!this.container) return;
    
    this.container.className = ItemsGridRenderer._TEMPLATES.containerClass;
    this.container.innerHTML = "";
    
    if (!items || items.length === 0) {
      this.container.innerHTML = ItemsGridRenderer._TEMPLATES.emptyState;
      return;
    }

    for (const file of items) {
      const card = document.createElement("div");
      card.className = ItemsGridRenderer._TEMPLATES.cardClass;
      card.onclick = () => {
        if (file.isFolderNode()) {
          this.fileManager.navigate(file);
          //this.fileManager.breadcrumb.navigateToFolder(file.getFullPath(), file.getName());
        } else {
          this.fileManager.openPreview(file);
        }
      };
      
      const mediaHTML = file.isFolderNode()
        ? ItemsGridRenderer._TEMPLATES.folderIcon 
        : ItemsGridRenderer._TEMPLATES.fileMedia(file);

      card.innerHTML = ItemsGridRenderer._TEMPLATES.card(file, mediaHTML);

      const deleteBtn = card.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.deleteItem(file);
        };
      }

      this.container.appendChild(card);

      const previewEl = card.querySelector(".widget-preview-area");
      if ((file.isImage() && previewEl instanceof HTMLImageElement)
        || (file.isVideo() && previewEl instanceof HTMLVideoElement)) {
        file.loadPreviewMedia(previewEl).catch(error => {
          if (error.name === "AbortError") return;
          console.error("Failed to load file preview:", error);
        });
      }
    }
  }

  async deleteItem(file) {
    const path = file.getFullPath();
    const isFolder = file.isFolderNode();
    
    const message = isFolder 
      ? `Delete folder "${path}" and all its contents recursively?` 
      : `Delete file "${path}"?`;

    if (!confirm(message)) return;

    try {
      // Delegate deletion directly to the model with recursive option enabled
      const result = await file.delete({ recursive: true });
      if (result && result.error) throw result.error;

      showToast("Deleted successfully", "success");
      this.fileManager.listFiles();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Delete failed", "error");
    }
  }
}

class FilePreviewManager {
  static get _TEMPLATES() {
    return {
      modalHtml: `<div id="modalPreview" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-0 m-0"><div class="w-screen h-screen flex flex-col overflow-hidden m-0 p-0 text-slate-100"><div class="flex items-center justify-between px-6 py-3.5 border-b border-white/15 bg-black/40 shrink-0"><h3 id="previewTitle" class="font-bold text-sm text-white truncate"></h3><button id="closePreviewModalBtn" class="text-slate-400 hover:text-white p-1 text-lg transition"><i class="fa-solid fa-xmark"></i></button></div><div class="flex-1 flex overflow-hidden bg-transparent"><div id="previewBody" class="flex-1 overflow-auto flex items-center justify-center"></div><div class="w-80 border-l border-white/15 bg-zinc-950/60 flex flex-col overflow-y-auto p-4 shrink-0"><div class="flex items-center gap-2 pb-3 mb-3 border-b border-white/15"><i class="fa-solid fa-fingerprint text-indigo-400 text-sm"></i><h4 class="font-bold text-xs uppercase tracking-wider text-slate-200">File Details & Hashes</h4></div><div id="previewSidebarDetails" class="space-y-4 text-xs text-slate-300"></div></div></div><div class="px-6 py-3.5 border-t border-white/15 bg-black/40 flex justify-end gap-2 flex-wrap shrink-0"><button id="previewSaveBtn" class="hidden px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400 text-emerald-200 hover:text-white text-xs font-semibold rounded-lg transition"><i class="fa-solid fa-floppy-disk mr-1 text-emerald-400"></i> Save</button><button id="previewCancelEditBtn" class="hidden px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Cancel</button><a id="previewDownloadBtn" href="#" download class="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400 text-indigo-200 hover:text-white text-xs font-semibold rounded-lg transition"><i class="fa-solid fa-download mr-1 text-indigo-400"></i> Download</a><button id="closePreviewModalBtnAlt" class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition">Close</button></div></div></div>`,
      loadingSpinner: `<div class="wire-subtext py-12 flex justify-center"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>`,
      sidebarLoading: `<div class="text-center py-10 space-y-2 wire-subtext"><i class="fa-solid fa-spinner fa-spin text-xl text-indigo-400"></i><p class="text-xs">Loading info...</p></div>`,
      sidebarContent: ({ displayName, url, pathHash, fullPath, sizeDisplay }) => `<div class="space-y-4 text-xs wire-subtext"><div><span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Name</span><p class="wire-text font-medium break-all">${displayName}</p></div><div><span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">File Size</span><p class="wire-text font-mono text-xs">${sizeDisplay}</p></div><div><div class="flex justify-between items-center mb-1"><span class="text-[10px] font-bold wire-subtext uppercase tracking-wider block">Signed URL</span><div class="space-x-2"><button onclick="navigator.clipboard.writeText('${url}'); showToast('URL copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy</button><a href="${url}" download="${displayName}" class="text-[11px] text-indigo-300 hover:text-indigo-200"><i class="fa-solid fa-download"></i> Download</a></div></div><div class="font-mono text-[9px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all max-h-16 overflow-y-auto">${url}</div></div><hr class="border-white/20"><div class="space-y-1.5"><div class="flex justify-between items-center"><span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">1. Path Hash</span><button onclick="navigator.clipboard.writeText('${pathHash}'); showToast('Path hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button></div><div><span class="text-[10px] wire-subtext block mb-0.5">Exact string hashed: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">${fullPath}</code></span><div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${pathHash}</div></div></div><div class="space-y-3" id="hashesComputeContainer"><div><span class="text-[10px] wire-subtext block mb-1">Content & Combined Hashes are uncalculated</span><button class="content-hash w-full py-2.5 bg-transparent hover:border-indigo-300 wire-border text-indigo-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5"><i class="fa-solid fa-fingerprint"></i> Calculate Content & Combined Hashes</button></div></div></div>`,
      hashesResult: ({ contentHash, combinedHash, rawCombinedString, byteLength }) => `<div class="space-y-4"><div class="space-y-1.5"><div class="flex justify-between items-center"><span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">2. Content Hash</span><button onclick="navigator.clipboard.writeText('${contentHash}'); showToast('Content hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button></div><div><span class="text-[10px] wire-subtext block mb-0.5">Hashed input: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">ArrayBuffer (${byteLength} bytes)</code></span><div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${contentHash}</div></div></div><div class="space-y-1.5"><div class="flex justify-between items-center"><span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">3. Combined Hash</span><button onclick="navigator.clipboard.writeText('${combinedHash}'); showToast('Combined hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button></div><div><span class="text-[10px] wire-subtext block mb-0.5">Exact concatenated string hashed:</span><div class="font-mono text-[9px] bg-black/40 wire-subtext p-1.5 rounded wire-border break-all select-all max-h-14 overflow-y-auto mb-1">${rawCombinedString}</div><div class="font-mono text-[10px] bg-slate-950/90 text-emerald-400 p-2 rounded wire-border break-all select-all">${combinedHash}</div></div></div></div>`,
      hashesError: (message) => `<div class="text-xs text-rose-400 p-2 bg-rose-950/60 wire-border rounded">Failed to compute hashes: ${message}</div>`,
      imageBody: (url, altText) => `<img src="${url}" alt="${altText}" class="max-w-full h-full shadow-md object-contain">`,
      videoBody: (url) => `<video controls class="max-w-full max-h-[70vh] rounded-lg shadow-md wire-border" src="${url}"></video>`,
      audioBody: (url, displayName) => `<div class="w-full max-w-lg text-center"><audio controls class="w-full mb-3" src="${url}"></audio><p class="text-xs wire-text">${displayName}</p></div>`,
      htmlBody: (text) => `<div class="flex flex-col h-full w-full"><div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1"><div class="flex items-center gap-1 bg-black/40 p-1 rounded wire-border text-xs"><button type="button" id="htmlPreviewTab" class="px-3 py-1 rounded bg-indigo-600 text-white font-medium transition">Preview</button><button type="button" id="htmlEditorTab" class="px-3 py-1 rounded wire-subtext hover:text-white transition">Code Editor</button></div><span class="text-[11px] wire-subtext italic">HTML Interactive File</span></div><div id="htmlPreviewContainer" class="w-full h-[70vh] bg-white rounded-lg overflow-hidden wire-border"><iframe sandbox="allow-scripts" id="htmlPreviewFrame" class="w-full h-full border-0" sandbox="allow-scripts allow-modals"></iframe></div><div id="htmlEditorContainer" class="w-full h-[70vh] hidden"><textarea id="editTextarea" class="w-full h-full font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${text}</textarea></div></div>`,
      textBody: (text) => `<textarea id="editTextarea" class="w-full h-[75vh] font-mono text-xs p-4 bg-black/40 wire-text rounded-lg wire-border outline-none">${text}</textarea>`,
      errorBody: `<div class="text-center space-y-4 py-12 wire-subtext"><i class="fa-solid fa-file text-5xl"></i><p class="text-sm">Preview not available for this file type.</p></div>`,
      sidebarError: `<p class="text-xs text-rose-400 p-2">Failed to load file details.</p>`,
      activeTabClass: "px-3 py-1 rounded bg-indigo-600 text-white font-medium transition",
      inactiveTabClass: "px-3 py-1 rounded wire-subtext hover:text-white transition"
    };
  }

  constructor(fileManagerInstance) {
    this.fileManager = fileManagerInstance;
    this.currentFileRecord = null;
    this._currentBlobUrl = null;
    
    this._ensureModalInDOM();
    this._initModalListeners();
  }

  _ensureModalInDOM() {
    if (!document.getElementById("modalPreview")) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = FilePreviewManager._TEMPLATES.modalHtml.trim();
      document.body.appendChild(tempDiv.firstChild);
    }
  }

  _initModalListeners() {
    const closeModal = () => {
      const modal = document.getElementById("modalPreview");
      if (modal) modal.classList.add("hidden");
    };

    document.getElementById("closePreviewModalBtn")?.addEventListener("click", closeModal);
    document.getElementById("closePreviewModalBtnAlt")?.addEventListener("click", closeModal);
    document.getElementById("previewCancelEditBtn")?.addEventListener("click", () => this.cancelEditText());
    document.getElementById("previewSaveBtn")?.addEventListener("click", () => this.saveEditedText());
  }

  async openPreview(fileRecord) {
    this.currentFileRecord = fileRecord;

    if (this._currentBlobUrl) {
      URL.revokeObjectURL(this._currentBlobUrl);
      this._currentBlobUrl = null;
    }

    const title = document.getElementById("previewTitle");
    const body = document.getElementById("previewBody");
    const sidebar = document.getElementById("previewSidebarDetails");
    const saveBtn = document.getElementById("previewSaveBtn");
    const cancelBtn = document.getElementById("previewCancelEditBtn");

    if (title) title.textContent = fileRecord.getDisplayName() + (fileRecord.isEncryptedFile() ? " (Decrypted securely)" : "");
    if (body) body.innerHTML = FilePreviewManager._TEMPLATES.loadingSpinner;
    if (sidebar) sidebar.innerHTML = FilePreviewManager._TEMPLATES.sidebarLoading;
    document.getElementById("modalPreview")?.classList.remove("hidden");

    saveBtn?.classList.add("hidden");
    cancelBtn?.classList.add("hidden");

    try {
      const response = await fileRecord.fetchContent(60);
      const blob = await response.blob();
      
      fileRecord._byteLength = blob.size;
      this._currentBlobUrl = URL.createObjectURL(blob);

      const displayName = escapeHtml(fileRecord.getDisplayName());
      const escapedUrl = escapeHtml(this._currentBlobUrl);

      if (sidebar) {
        sidebar.innerHTML = FilePreviewManager._TEMPLATES.sidebarContent({
          displayName,
          url: escapedUrl,
          pathHash: fileRecord.hash_filename || "",
          fullPath: escapeHtml(fileRecord.getFullPath()),
          sizeDisplay: fileRecord.getFormattedSize()
        });

        sidebar.querySelector(".content-hash")?.addEventListener("click", () => this.computeContentAndCombinedHashes(escapedUrl));
      }

      if (fileRecord.isImage()) {
        body.innerHTML = FilePreviewManager._TEMPLATES.imageBody(escapedUrl, displayName);
      } else if (fileRecord.isVideo()) {
        body.innerHTML = FilePreviewManager._TEMPLATES.videoBody(escapedUrl);
      } else if (fileRecord.isAudio()) {
        body.innerHTML = FilePreviewManager._TEMPLATES.audioBody(escapedUrl, displayName);
      } else {
        const text = await blob.text();
        const escapedText = escapeHtml(text);

        if (fileRecord.isHtml()) {
          body.innerHTML = FilePreviewManager._TEMPLATES.htmlBody(escapedText);
          document.getElementById("htmlPreviewTab")?.addEventListener("click", () => this.switchHtmlView("preview"));
          document.getElementById("htmlEditorTab")?.addEventListener("click", () => this.switchHtmlView("editor"));
          setTimeout(() => {
            const iframe = document.getElementById("htmlPreviewFrame");
            if (iframe) iframe.srcdoc = text;
          }, 50);
        } else {
          body.innerHTML = FilePreviewManager._TEMPLATES.textBody(escapedText);
          saveBtn?.classList.remove("hidden");
          cancelBtn?.classList.remove("hidden");
        }
      }

      const downloadBtn = document.getElementById("previewDownloadBtn");
      if (downloadBtn) {
        downloadBtn.href = escapedUrl;
        downloadBtn.setAttribute("download", fileRecord.getDisplayName());
      }
    } catch (err) {
      console.error("Preview failed:", err);
      if (body) body.innerHTML = FilePreviewManager._TEMPLATES.errorBody;
      if (sidebar) sidebar.innerHTML = FilePreviewManager._TEMPLATES.sidebarError;
    }
  }

  async computeContentAndCombinedHashes(url) {
    const container = document.getElementById("hashesComputeContainer");
    if (!container || !this.currentFileRecord) return;

    container.innerHTML = `
      <div class="text-center py-4 space-y-2 wire-subtext">
        <i class="fa-solid fa-spinner fa-spin text-indigo-400"></i>
        <p class="text-[10px]">Computing cryptographic hashes...</p>
      </div>
    `;

    try {
      await this.currentFileRecord.hashContent(url);

      const contentHash = this.currentFileRecord.hash_content;
      const combinedHash = this.currentFileRecord.hash_file;
      const pathHash = this.currentFileRecord.hash_filename;

      if (!contentHash || !combinedHash) {
        throw new Error("Hash computation returned empty results.");
      }

      const rawCombinedString = escapeHtml(pathHash + contentHash);
      const byteLength = this.currentFileRecord._byteLength || "Unknown";

      container.innerHTML = FilePreviewManager._TEMPLATES.hashesResult({
        contentHash,
        combinedHash,
        rawCombinedString,
        byteLength
      });

    } catch (err) {
      console.error(err);
      container.innerHTML = FilePreviewManager._TEMPLATES.hashesError(escapeHtml(err.message || "Unknown error"));
    }
  }

  switchHtmlView(view) {
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
      if (previewTab) previewTab.className = FilePreviewManager._TEMPLATES.activeTabClass;
      if (editorTab) editorTab.className = FilePreviewManager._TEMPLATES.inactiveTabClass;
    } else {
      previewContainer?.classList.add("hidden");
      editorContainer?.classList.remove("hidden");
      if (editorTab) editorTab.className = FilePreviewManager._TEMPLATES.activeTabClass;
      if (previewTab) previewTab.className = FilePreviewManager._TEMPLATES.inactiveTabClass;
    }
  }

  cancelEditText() {
    if (this.currentFileRecord) {
      this.openPreview(this.currentFileRecord);
    }
  }

  async saveEditedText() {
    const textarea = document.getElementById("editTextarea");
    if (!textarea || !this.currentFileRecord) return;

    try {
      const updatedContent = textarea.value;
      const blob = new Blob([updatedContent], { type: 'text/plain;charset=utf-8' });
      
      await this.currentFileRecord.save(blob);

      if (typeof showToast === "function") {
        showToast("Changes saved successfully", "success", 2000);
      }
      this.fileManager.listFiles();
    } catch (err) {
      console.error(err);
      if (typeof showToast === "function") {
        showToast(err.message || "Failed to save changes", "error", 2500);
      }
    }
  }
}

class BreadcrumbManager {
  static get _TEMPLATES() {
    return {
      crumb: (name, isRoot) => isRoot
        ? `<i class="fa-solid fa-house mr-1 text-xs"></i><span>${escapeHtml(name)}</span>`
        : `<span>${escapeHtml(name)}</span>`,
      separatorClass: "opacity-50 mx-1",
      crumbClass: (isLast) => (isLast ? "font-bold text-indigo-300 wire-text" : "wire-subtext hover:wire-text") + " inline-flex items-center"
    };
  }

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
    this.fileManager.listFiles();
  }

  jumpToBreadcrumb(index) {
    this.history = this.history.slice(0, index + 1);
    this.path = this.history[this.history.length - 1].path;
    this.render();
    this.fileManager.listFiles();
  }

  reset() {
    this.path = "";
    this.history = [{ path: "", name: "root" }];
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";
    this.history.forEach((crumb, idx) => {
      const isLast = idx === this.history.length - 1;
      const btn = document.createElement("button");
      btn.className = BreadcrumbManager._TEMPLATES.crumbClass(isLast);
      
      const isRoot = crumb.name.toLowerCase() === "root";
      btn.innerHTML = BreadcrumbManager._TEMPLATES.crumb(crumb.name, isRoot);
      btn.onclick = () => this.jumpToBreadcrumb(idx);
      this.container.appendChild(btn);

      if (!isLast) {
        const sep = document.createElement("span");
        sep.className = BreadcrumbManager._TEMPLATES.separatorClass;
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
    wrapper.innerHTML = `
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
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  initListeners() {
    const openModalBtn = document.getElementById("openCreateFolderModalBtn");
    const closeModalBtn = document.getElementById("closeCreateFolderModalBtn");
    const submitModalBtn = document.getElementById("submitCreateFolderBtn");
    const folderNameInput = document.getElementById("folderNameInput");

    if (openModalBtn) openModalBtn.addEventListener("click", () => this.open());
    if (closeModalBtn) closeModalBtn.addEventListener("click", () => this.close());
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

    const currentPath = this.fileManager.breadcrumb.path;
    const folderPath = currentPath
      ? `${currentPath}/${name}/.emptyFolderPlaceholder`
      : `${name}/.emptyFolderPlaceholder`;

    try {
      const { error } = await FileRecord.create(folderPath, new Blob([""]), { upsert: false });
      if (error) throw error;

      this.close();
      if (typeof showToast === "function") showToast(`Folder "${name}" created`, "success");
      this.fileManager.listFiles();
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message || "Failed to create folder", "error");
    }
  }
}

class FileManager {
  constructor(config = {}) {
    this.allItems = [];
    this.filteredItems = [];
    
    this.breadcrumb = new BreadcrumbManager("breadcrumbNav", this);
    this.gridRenderer = new ItemsGridRenderer("itemsGrid", this);
    this.filePreview = new FilePreviewManager(this);
    this.createFolderModal = new CreateFolderModal(this);

    this.listFiles();
  }

  async listFiles() {
    try {
      const { data, error } = await FileRecord.all(this.breadcrumb.path);
      console.log(data);
      if (error) throw error;
      this.allItems = data;
      this.renderView();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to list files", "error");
    }
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

    this.gridRenderer?.render(this.filteredItems);
  }

  toggleActionsMenu() {
    document.getElementById("actionsMenuToggleBtn")?.classList.toggle("hidden");
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

    await this.listFiles();
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
    await this.filePreview.openPreview(file);
  }

  async downloadFile(path, name) {
    try {
      await FileRecord.download(path, name);
    } catch (err) {
      showToast(err.message || "Download failed", "error");
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
}

document.addEventListener("DOMContentLoaded", () => {
  const actionsMenuBtn = document.getElementById("actionsMenu");
  const actionsMenuDropdown = document.getElementById("actionsMenuToggleBtn");

  if (actionsMenuBtn && actionsMenuDropdown) {
    actionsMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      actionsMenuDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!actionsMenuBtn.contains(e.target) && !actionsMenuDropdown.contains(e.target)) {
        actionsMenuDropdown.classList.add("hidden");
      }
    });
  }
  const fileInput = document.getElementById("fileUpload");
  const encryptedInput = document.getElementById("encryptedFileUpload");
  const folderInput = document.getElementById("folderUpload");

  // 1. Normal File Upload
  fileInput.addEventListener("change", (e) => fileManager.handleFileUpload(e, false, false));

  // 2. Encrypted File Upload
  if (encryptedInput && typeof fileManager !== "undefined") {
    encryptedInput.addEventListener("change", (e) => {
      fileManager.handleFileUpload(e, false, true);
    });
  }

  // 3. Folder Upload
  if (folderInput && typeof fileManager !== "undefined") {
    folderInput.addEventListener("change", (e) => fileManager.handleFileUpload(e, true, false));
  }
  set_bg();
});
const fileManager = new FileManager();
