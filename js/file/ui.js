export class FileManagerUI {
  // --------------------------------------------------
  // Main Layout Templates
  // --------------------------------------------------
  static getMainLayoutHTML() {
    return `
      <!-- Action Bar -->
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 justify-between items-center shrink-0 mb-4">
        <div class="flex items-center gap-2"></div>
        <div class="flex items-center gap-2">
          <button id="openFolderModalBtn" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-folder-plus text-amber-500"></i> New Folder
          </button>
          <button id="openTextModalBtn" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-file-pen text-blue-500"></i> New Text File
          </button>
          <button id="openCreateModalBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer">
            <i class="fa-solid fa-cloud-arrow-up"></i> Upload File
          </button>
          <button id="backupDataBtn" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-file-arrow-down"></i> Backup All Files
          </button>
        </div>
      </div>

      <!-- File Manager View -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <!-- Breadcrumb & Control Bar -->
        <div class="bg-white border-b border-slate-200 px-5 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
          <div class="flex items-center gap-2">
            <button type="button" id="backBtn"
              class="widget-back-btn bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div id="pathText" class="text-slate-500 font-medium pl-2 border-l border-slate-200 truncate font-mono text-[11px]">
              /
            </div>
          </div>
          <div id="fileCountBadge" class="text-slate-400 font-medium text-[11px]">
            0 items
          </div>
        </div>

        <!-- File Grid -->
        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div id="fileGridContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          </div>
        </div>
      </div>
    `;
  }

  static getOverlaysHTML() {
    return `
      <!-- CONTEXT MENU -->
      <div id="contextMenu" class="hidden fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-40 text-xs font-medium text-slate-700">
        <button id="ctxEditBtn" class="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hidden cursor-pointer">
          <i class="fa-solid fa-pen-to-square text-blue-600"></i> Edit
        </button>
        <button id="ctxDownloadBtn" class="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hidden cursor-pointer">
          <i class="fa-solid fa-download text-emerald-600"></i> Download
        </button>
        <button id="ctxDeleteBtn" class="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-slate-700 cursor-pointer">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>

      <!-- MODAL: NEW FOLDER -->
      <div id="createFolderModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4">
          <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
            <i class="fa-solid fa-folder-plus text-amber-500"></i> Create Folder
          </h3>
          <input type="text" id="folderNameInput" placeholder="Folder name..."
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div class="flex gap-2 justify-end pt-2">
            <button type="button" id="cancelFolderBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
            <button type="button" id="submitFolderBtn" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">Create</button>
          </div>
        </div>
      </div>

      <!-- MODAL: TEXT FILE EDITOR (EXPANDED SIZE) -->
      <div id="textEditorModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 hidden">
        <div class="bg-white rounded-2xl max-w-5xl w-full h-[85vh] shadow-2xl p-6 space-y-4 flex flex-col">
          <div class="flex justify-between items-center pb-2 border-b border-slate-100 shrink-0">
            <h3 id="textEditorTitle" class="font-bold text-base text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-file-pen text-blue-500"></i> Create Text File
            </h3>
            <button id="closeTextModalBtn" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <div class="space-y-3 flex-1 flex flex-col min-h-0">
            <div class="shrink-0">
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">File Name</label>
              <input type="text" id="textFileNameInput" placeholder="document.txt"
                class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono">
            </div>
            <div class="flex-1 flex flex-col min-h-0">
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Content</label>
              <textarea id="textContentInput" placeholder="Type your file content here..."
                class="w-full flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none leading-relaxed custom-scrollbar"></textarea>
            </div>
          </div>
          <div class="flex gap-2 justify-end pt-2 shrink-0 border-t border-slate-100">
            <button type="button" id="cancelTextBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
            <button type="button" id="submitTextBtn" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">Save File</button>
          </div>
        </div>
      </div>

      <!-- MODAL: UPLOAD FILE -->
      <div id="createFileModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-cloud-arrow-up text-blue-500"></i> Upload File
            </h3>
            <button id="closeFileModalBtn" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <form id="createFileForm" class="space-y-4">
            <div class="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 transition rounded-xl p-5 text-center cursor-pointer">
              <label class="cursor-pointer block">
                <i class="fa-solid fa-file-arrow-up text-blue-500 text-2xl mb-1"></i>
                <p class="text-xs font-semibold text-slate-700">Select Image, Video, Text or PDF</p>
                <input type="file" id="chunkFileInput" multiple required
                  class="mt-2 block w-full text-xs text-slate-500 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700">
              </label>
            </div>
            <div class="pt-2 flex gap-3 justify-end">
              <button type="button" id="cancelFileBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
              <button type="submit" id="submitFileBtn" class="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">Upload File</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------
  // Grid Item Renderers
  // --------------------------------------------------
  static getLoadingHTML() {
    return `
      <div class="col-span-full py-16 text-center text-slate-400 text-xs">
        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-blue-500 block"></i>
        Loading folder...
      </div>`;
  }

  static getEmptyFolderHTML() {
    return `
      <div class="col-span-full py-16 text-center text-slate-400 text-xs italic">
        This folder is empty.
      </div>`;
  }

  static renderFolderItem(id, name, folderSubtext) {
    return `
      <div data-action="navigate" data-id="${id}"
           data-context="folder" data-context-id="${id}"
           class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden">
        <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-folder text-5xl"></i>
        </div>
        <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
          <span class="w-full text-xs font-bold text-slate-700 truncate" title="${name}">${name}</span>
          <span class="text-[9px] text-slate-400 font-mono mt-0.5">${folderSubtext}</span>
        </div>
      </div>`;
  }

  static renderFileItem(id, fileId, name, previewHTML, sizeLabel) {
    return `
      <div data-action="view" data-id="${id}" data-file-id="${fileId}"
           data-context="file" data-context-id="${id}" data-file-id="${fileId}" data-file-name="${name}"
           class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden">
        <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
          ${previewHTML}
        </div>
        <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
          <span class="w-full text-xs font-semibold text-slate-700 truncate text-[11px]" title="${name}">${name}</span>
          <span class="text-[9px] text-slate-400 font-mono mt-0.5">${sizeLabel}</span>
        </div>
      </div>`;
  }

  static getFilePreviewHTML(file, ext, name) {
    let previewHTML = `<i class="fa-regular fa-file-lines text-slate-400 text-3xl"></i>`;

    if (file.previewType === 'image' && file.thumbnail) {
      previewHTML = `<img src="${file.thumbnail}" alt="${name}" class="w-full h-full object-cover rounded-lg" />`;
    } else if (file.previewType === 'video' && file.thumbnail) {
      previewHTML = `
        <video src="${file.thumbnail}" class="widget-video-preview w-full h-full object-cover rounded-lg pointer-events-none" muted playsinline preload="metadata"></video>
        <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">VIDEO</div>
      `;
    } else if (file.previewType === 'audio') {
      previewHTML = `
        <div class="flex flex-col items-center justify-center text-blue-500">
          <i class="fa-solid fa-file-audio text-3xl mb-1"></i>
          <span class="text-[9px] font-mono text-slate-500 uppercase">${ext}</span>
        </div>`;
    } else if (file.previewType === 'text' && file.thumbnail) {
      const escapedText = String(file.thumbnail).replace(/[&<>"']/g, (m) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
      );
      previewHTML = `<pre class="text-[8px] leading-tight text-slate-500 font-mono text-left p-1.5 overflow-hidden w-full h-full select-none opacity-80">${escapedText}</pre>`;
    } else if (["js", "ts", "jsx", "tsx"].includes(ext)) {
      previewHTML = `<i class="fa-brands fa-js text-amber-400 text-3xl"></i>`;
    } else if (["html", "htm"].includes(ext)) {
      previewHTML = `<i class="fa-brands fa-html5 text-orange-400 text-3xl"></i>`;
    } else if (["css", "scss"].includes(ext)) {
      previewHTML = `<i class="fa-brands fa-css3-alt text-blue-500 text-3xl"></i>`;
    } else if (ext === "json") {
      previewHTML = `<i class="fa-solid fa-brackets-curly text-yellow-500 text-3xl"></i>`;
    }

    return previewHTML;
  }

  // --------------------------------------------------
  // DOM / Modal Helpers
  // --------------------------------------------------
  static hideContextMenu() {
    document.getElementById("contextMenu")?.classList.add("hidden");
  }

  static showContextMenu(clientY, clientX, isFile, isEditable) {
    const menu = document.getElementById("contextMenu");
    const downloadBtn = document.getElementById("ctxDownloadBtn");
    const editBtn = document.getElementById("ctxEditBtn");

    if (!menu) return;

    if (isFile) {
      downloadBtn?.classList.remove("hidden");
      if (isEditable) {
        editBtn?.classList.remove("hidden");
      } else {
        editBtn?.classList.add("hidden");
      }
    } else {
      downloadBtn?.classList.add("hidden");
      editBtn?.classList.add("hidden");
    }

    menu.style.top = `${Math.min(clientY, window.innerHeight - 120)}px`;
    menu.style.left = `${Math.min(clientX, window.innerWidth - 160)}px`;
    menu.classList.remove("hidden");
  }

  static setEditorTitle(html) {
    const el = document.getElementById("textEditorTitle");
    if (el) el.innerHTML = `<i class="fa-solid fa-file-pen text-blue-500"></i> ${html}`;
  }

  static setEditorInputs(fileName, content, isDisabled) {
    const nameInput = document.getElementById("textFileNameInput");
    const contentInput = document.getElementById("textContentInput");
    if (nameInput) {
      nameInput.value = fileName;
      nameInput.disabled = isDisabled;
    }
    if (contentInput) {
      contentInput.value = content;
    }
  }

  static showTextEditorModal() {
    document.getElementById("textEditorModal")?.classList.remove("hidden");
  }

  static hideTextEditorModal() {
    document.getElementById("textEditorModal")?.classList.add("hidden");
  }

  static getFileNameInputValue() {
    return document.getElementById("textFileNameInput")?.value.trim() || "";
  }

  static getFileContentInputValue() {
    return document.getElementById("textContentInput")?.value || "";
  }

  static showFolderModal() {
    document.getElementById("createFolderModal")?.classList.remove("hidden");
  }

  static hideFolderModal() {
    document.getElementById("createFolderModal")?.classList.add("hidden");
  }

  static setFolderNameInputValue(val) {
    const input = document.getElementById("folderNameInput");
    if (input) input.value = val;
  }

  static getFolderNameInputValue() {
    return document.getElementById("folderNameInput")?.value.trim() || "";
  }

  static showFileModal() {
    document.getElementById("createFileModal")?.classList.remove("hidden");
  }

  static hideFileModal() {
    document.getElementById("createFileModal")?.classList.add("hidden");
  }

  static resetFileForm() {
    document.getElementById("createFileForm")?.reset();
  }

  static getFileInputFiles() {
    return document.getElementById("chunkFileInput")?.files;
  }
}
