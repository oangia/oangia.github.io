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
    if (status === "Not synced" || status === "Different content" || status === "Different size" || status === "Different files") return "text-amber-300";
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
      this.fileManager.action(file.isFolderNode() ? "navigate" : "openFilePreview", file);
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
        action: (f) => (f.isFolderNode() ? "navigate" : "openFilePreview"),
        label: (f) => (f.isFolderNode() ? "Open" : "Open preview"),
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
class FileManager {
  constructor() {
    this.allItems = [];
    this.filteredItems = [];
    this.listRequestId = 0;

    this.breadcrumb = new BreadcrumbManager("breadcrumbNav", this);
    this.gridRenderer = new ItemsGridRenderer("itemsGrid", this);
    this.actionsMenu = new FileActionsMenu(this);
    this.syncProgress = new SyncProgressPanel();

    this._bindRefreshStorageButton();

    window.addEventListener("storage-services-changed", () => this.action("refresh"));
    this.action("refresh");
  }

  _bindRefreshStorageButton() {
    const btn = document.getElementById("refreshStorageCacheBtn");
    if (!btn || btn.dataset.refreshBound) return;
    btn.dataset.refreshBound = "true";
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      this.actionsMenu?.close?.();
      void this.action("reloadStorageData");
    });
  }

  action(actionName, ...args) {
    switch (actionName) {
      case "refresh": return this.listFiles();
      case "listFiles": return this.listFiles();
      case "reloadStorageData": return this.reloadStorageData();
      case "navigate": return this.navigate(args[0]);
      case "openFilePreview": return this.openFilePreview(args[0]);
      case "upload": return this.handleFileUpload(args[0], args[1], args[2]);
      case "downloadRecord": return this.downloadRecord(args[0]);
      case "backup": return this.createBackup();
      case "backupGitHubRepo": return this.backupGitHubRepo();
      case "syncDriveToSupabase": return this.syncDriveToSupabase();
      case "syncFileToSupabase": return this.syncFileToSupabase(args[0]);
      default: throw new Error(`Unknown file-manager action: ${actionName}`);
    }
  }

  async reloadStorageData() {
    try {
      if (typeof showToast === "function") {
        showToast("Refreshing storage data from servers...", "info", 2500);
      }
      await FileRecord.reloadStorageDataFromServer();
      await this.listFiles();
      if (typeof showToast === "function") {
        showToast("Storage data refreshed", "success");
      }
    } catch (error) {
      console.error("Failed to refresh storage data:", error);
      if (typeof showToast === "function") {
        showToast(error.message || "Failed to refresh storage data", "error");
      }
    }
  }

  async listFiles() {
    const requestId = ++this.listRequestId;
    try {
      const { data, comparisonData, errors } = await FileRecord.getAllFromServices(this.breadcrumb.path);
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
      await this.compareFiles(
        this.allItems,
        comparisonData,
        errors.find(({ service }) => service === "Supabase")?.error
      );
      if (requestId === this.listRequestId) this.gridRenderer.updateComparisonStatuses();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to list files", "error");
    }
  }

  async compareFiles(groups, comparisonData = [], supabaseError) {
    const supabaseAvailable = FileRecord.getServiceStatuses()
      .some(service => service.name === "Supabase" && service.isAvailable);
    const supabaseByPath = new Map(comparisonData.map(file => {
      const path = file.getFullPath().replace(/^\/+|\/+$/g, "");
      return [`${file.isFolderNode() ? "folder" : "file"}:${path}`, file];
    }));

    for (const group of groups) {
      const driveFile = group.files.find(file => file.getStorageName() === "Google Drive");
      if (driveFile) {
        if (!supabaseAvailable) {
          group.comparisonStatus = "Supabase not connected";
          continue;
        }
        if (supabaseError) {
          group.comparisonStatus = "Could not compare";
          continue;
        }

        const path = driveFile.getFullPath().replace(/^\/+|\/+$/g, "");
        const supabaseFile = supabaseByPath.get(
          `${driveFile.isFolderNode() ? "folder" : "file"}:${path}`
        );
        if (!supabaseFile) {
          group.comparisonStatus = "Not synced";
          continue;
        }

        try {
          group.comparisonStatus = driveFile.isFolderNode()
            ? await FileRecord.getFolderCopyComparison([driveFile, supabaseFile])
            : await FileRecord.getCopyComparison([driveFile, supabaseFile]);
        } catch (error) {
          const type = group.isFolderNode() ? "folder" : "file";
          console.error(`Failed to compare matching ${type} "${group.getDisplayName()}":`, error);
          group.comparisonStatus = "Could not compare";
        }
        continue;
      }

      if (group.files.length === 1) {
        group.comparisonStatus = `Only in ${group.files[0].getStorageName()}`;
        continue;
      }
      try {
        group.comparisonStatus = group.isFolderNode()
          ? await FileRecord.getFolderCopyComparison(group.files)
          : await FileRecord.getCopyComparison(group.files);
      } catch (error) {
        const type = group.isFolderNode() ? "folder" : "file";
        console.error(`Failed to compare matching ${type} "${group.getDisplayName()}":`, error);
        group.comparisonStatus = "Could not compare";
      }
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

    const serviceLabel = document.getElementById("serviceStatusLabel");
    if (serviceLabel) {
      serviceLabel.textContent = FileRecord.getServiceStatuses().map(service =>
        `${service.name}: ${service.isAvailable ? "Connected" : "Not connected"}`
      ).join(" · ");
    }

    const previewMedia = this.gridRenderer?.render(this.filteredItems) || [];
    previewMedia.forEach(({ file, element }) => this.loadPreviewMedia(file, element));
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

    await this.action("reloadStorageData");
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

  async openFilePreview(file) {
    this.activeFilePreview?.close();

    const panel = document.createElement("div");
    panel.className = "fixed inset-0 z-[120] flex items-center justify-center bg-black/60";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", `Preview: ${file.getDisplayName()}`);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className =
      "absolute right-4 top-4 z-[1] rounded-full border border-white/20 bg-zinc-900/80 px-3 py-2 text-sm text-white shadow-lg backdrop-blur";
    closeButton.setAttribute("aria-label", "Close preview");
    closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';

    let objectUrl;
    const close = () => {
      if (!panel.isConnected) return;
      document.removeEventListener("keydown", handleKeydown);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      panel.remove();
      if (this.activeFilePreview?.panel === panel) this.activeFilePreview = null;
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") close();
    };

    closeButton.addEventListener("click", close);
    document.addEventListener("keydown", handleKeydown);
    panel.appendChild(closeButton);
    document.body.appendChild(panel);
    this.activeFilePreview = { panel, close };

    try {
      const response = await file.getContent(60);
      const blob = await response.blob();
      if (!panel.isConnected) return;

      if (file.isHtml()) {
        const frame = document.createElement("iframe");
        frame.title = file.getDisplayName();
        frame.setAttribute("sandbox", "allow-scripts");
        frame.setAttribute("allowtransparency", "true");
        frame.className = "absolute inset-0 w-full h-full border-0 bg-transparent";
        frame.srcdoc = await blob.text();
        panel.appendChild(frame);
        return;
      }

      objectUrl = URL.createObjectURL(blob);

      if (file.isImage()) {
        const img = document.createElement("img");
        img.src = objectUrl;
        img.alt = file.getDisplayName();
        img.className = "max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl";
        panel.appendChild(img);
        return;
      }

      const frame = document.createElement("iframe");
      frame.title = file.getDisplayName();
      frame.setAttribute("allowtransparency", "true");
      frame.className =
        "w-[100vw] h-[100vh] max-w-5xl border-0 rounded-lg bg-transparent shadow-2xl";
      frame.src = objectUrl;
      panel.appendChild(frame);
    } catch (error) {
      console.error("Failed to open file:", error);
      if (!panel.isConnected) return;
      close();
      showToast(error.message || "Failed to open file", "error");
    }
  }

  async loadPreviewMedia(file, element, useThumbnail = true) {
    try {
      if (useThumbnail && element instanceof HTMLImageElement && file.getThumbnail()) {
        element.loading = "lazy";
        element.onerror = () => {
          element.onerror = null;
          if (!file.isImage()) {
            element.remove();
            return;
          }
          void this.loadPreviewMedia(file, element, false);
        };
        element.src = file.getThumbnail();
        return;
      }

      if (file.getUrl()?.startsWith("blob:")) {
        element.loading = "lazy";
        element.src = file.getUrl();
        return;
      }

      const content = await file.getContent();
      const blob = await content.blob();
      element.loading = "lazy";
      element.preload = "auto";
      element.src = URL.createObjectURL(blob);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Failed to load file preview:", error);
    }
  }

  async downloadRecord(file) {
    try {
      const response = await file.getContent();
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

  async createBackup() {
    const originalContent = this.actionsMenu.beginStorageBackup();
    try {
      await FileRecord.backup();
    } finally {
      this.actionsMenu.endStorageBackup(originalContent);
    }
  }

  async backupGitHubRepo() {
    const originalContent = this.actionsMenu.beginGitHubBackup();

    try {
      const drive = FileRecord.getServiceStatuses().find(service => service.name === "Google Drive");
      if (!drive?.isAvailable) throw new Error("Connect Google Drive before backing up the repository.");

      let uploadedFiles = 0;
      const requestGitHubJson = async url => {
        const response = await fetch(url, {
          headers: { Accept: "application/vnd.github+json" }
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `GitHub API request failed (${response.status}).`);
        }
        return response.json();
      };

      const apiBase = "https://api.github.com/repos/oangia/oangia.github.io";
      const tree = await requestGitHubJson(`${apiBase}/git/trees/main?recursive=1`);
      if (tree.truncated) {
        throw new Error("GitHub returned an incomplete repository file list.");
      }

      const files = tree.tree.filter(entry => entry.type === "blob");
      if (files.length === 0) throw new Error("The GitHub repository contains no files to back up.");
      const totalFiles = files.length;
      const onProgress = this.actionsMenu.updateGitHubBackup.bind(this.actionsMenu);
      onProgress({ uploadedFiles, totalFiles });

      for (let offset = 0; offset < files.length; offset += 5) {
        const batch = files.slice(offset, offset + 5);
        const blobs = await Promise.all(batch.map(entry =>
          requestGitHubJson(`${apiBase}/git/blobs/${entry.sha}`)
        ));

        for (let index = 0; index < blobs.length; index++) {
          const blob = blobs[index];
          if (blob.encoding !== "base64" || typeof blob.content !== "string") {
            throw new Error(`GitHub returned unsupported content for "${batch[index].path}".`);
          }

          const binary = atob(blob.content.replace(/\s/g, ""));
          const content = new Uint8Array(binary.length);
          for (let byte = 0; byte < binary.length; byte++) {
            content[byte] = binary.charCodeAt(byte);
          }

          const filename = batch[index].path.split("/").pop();
          const file = new File([content], filename, { type: "application/octet-stream" });
          const path = `GitHub Backups/${batch[index].path}`;
          const { error } = await FileRecord.create(path, file, { upsert: true });
          if (error) {
            throw new Error(`Could not upload "${batch[index].path}" to Google Drive: ${error.message}`);
          }
          uploadedFiles++;
          onProgress({ uploadedFiles, totalFiles });
        }
      }

      const progress = { uploadedFiles, totalFiles };
      showToast(`Repository backup saved to Drive: ${progress.uploadedFiles} file(s) in GitHub Backups`, "success", 5000);
    } catch (error) {
      console.error("GitHub repository backup failed:", error);
      const progress = this.actionsMenu.gitHubBackupProgress;
      const partialProgress = progress.totalFiles
        ? ` (${progress.uploadedFiles} of ${progress.totalFiles} files uploaded)`
        : "";
      showToast(`${error.message || "GitHub repository backup failed"}${partialProgress}`, "error", 5000);
    } finally {
      this.actionsMenu.endGitHubBackup(originalContent);
    }
  }

  async syncFileToSupabase(file) {
    try {
      const result = await FileRecord.syncFileToSupabase(
        file,
        this.syncProgress.update.bind(this.syncProgress)
      );
      if (result.status === "unavailable") {
        showToast("Connect Google Drive and configure Supabase before syncing", "warning");
      } else if (result.status === "invalid-selection") {
        showToast("Select a Google Drive file to sync", "warning");
      } else if (result.status === "up-to-date") {
        showToast(`${file.getDisplayName()} is already up to date`, "info");
      } else {
        showToast(`${file.getDisplayName()} synced to Supabase`, "success");
      }
    } catch (error) {
      const path = file?.getFullPath?.() || "";
      console.error(`Failed to sync ${path} to Supabase:`, error);
      this.syncProgress.update("Sync failed", path, 0, 1, error.message || "Failed to sync file", true);
      showToast(`Failed to sync ${file.getDisplayName()}: ${error.message || "Unknown error"}`, "error");
    }
  }

  async syncDriveToSupabase() {
    const statuses = new Map(FileRecord.getServiceStatuses().map(service => [service.name, service.isAvailable]));
    if (!statuses.get("Google Drive") || !statuses.get("Supabase")) {
      showToast("Connect Google Drive and configure Supabase before syncing", "warning");
      return;
    }
    if (!confirm("Sync Google Drive to Supabase? Files in Supabase that are not in Drive will be deleted.")) {
      return;
    }

    const originalButtonContent = this.actionsMenu.beginDriveSync();

    try {
      const result = await FileRecord.syncDriveToSupabase(
        this.syncProgress.update.bind(this.syncProgress)
      );
      await this.action("reloadStorageData");
      if (result.failed === 0 && result.deleteFailed === 0) {
        this.syncProgress.update(
          "Sync complete",
          `Copied ${result.synced}; skipped ${result.skipped} unchanged; removed ${result.deleted} Supabase-only`,
          result.completedWork,
          result.totalWork,
          "Complete",
          true
        );
        showToast(
          `Copied ${result.synced}, skipped ${result.skipped} unchanged, removed ${result.deleted} Supabase-only item(s)`,
          "success"
        );
      } else {
        this.syncProgress.update(
          "Sync finished with errors",
          `Copied ${result.synced}; skipped ${result.skipped} unchanged; ${result.failed} sync failures; removed ${result.deleted}; ${result.deleteFailed} removal failures`,
          result.completedWork,
          result.totalWork,
          "Finished with errors",
          true
        );
        showToast(
          `Copied ${result.synced}, skipped ${result.skipped} unchanged; ${result.failed} sync failures, ${result.deleted} removed, ${result.deleteFailed} removals failed`,
          "warning",
          5000
        );
      }
    } catch (error) {
      console.error("Drive to Supabase sync failed:", error);
      this.syncProgress.update("Sync stopped", error.message || "Failed to build a complete file list", 0, 0, "Stopped", true);
      showToast(error.message || "Drive to Supabase sync failed", "error", 5000);
    } finally {
      this.actionsMenu.endDriveSync(originalButtonContent);
    }
  }
}
