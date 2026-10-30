import { ToastManager } from "./toast.js";

export class UI {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.ensureOverlays();
  }

  ensureOverlays() {
    ToastManager.ensureDOM();
    if (document.getElementById("contextMenu")) return;

    const overlaysHTML = `
      <!-- CONTEXT MENU -->
      <div id="contextMenu" class="hidden fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-40 text-xs font-medium text-slate-700">
        <button id="ctxDownloadBtn" class="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hidden"><i class="fa-solid fa-download text-emerald-600"></i> Download</button>
        <button id="ctxDeleteBtn" class="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-slate-700"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>

      <!-- MODAL: NEW FOLDER -->
      <div id="createFolderModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4">
          <h3 class="font-bold text-base text-slate-800 flex items-center gap-2"><i class="fa-solid fa-folder-plus text-amber-500"></i> Create Folder</h3>
          <input type="text" id="folderNameInput" placeholder="Folder name..." class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div class="flex gap-2 justify-end pt-2">
            <button type="button" id="cancelFolderBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
            <button type="button" id="submitFolderBtn" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Create</button>
          </div>
        </div>
      </div>

      <!-- MODAL: UPLOAD FILE -->
      <div id="createFileModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-800 flex items-center gap-2"><i class="fa-solid fa-cloud-arrow-up text-blue-500"></i> Upload File</h3>
            <button id="closeFileModalBtn" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>
          <form id="createFileForm" class="space-y-4">
            <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center">
              <label class="cursor-pointer block">
                <i class="fa-solid fa-file-arrow-up text-blue-500 text-2xl mb-1"></i>
                <p class="text-xs font-semibold text-slate-700">Select Image, Video, Text or PDF</p>
                <input type="file" id="chunkFileInput" multiple required class="mt-2 block w-full text-xs text-slate-500 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700">
              </label>
            </div>
            <div class="pt-2 flex gap-3 justify-end">
              <button type="button" id="cancelFileBtn" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" id="submitFileBtn" class="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Upload File</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlaysHTML);
  }

  mountMainLayout() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 justify-between items-center">
        <div class="flex items-center gap-2"></div>
        <div class="flex items-center gap-2">
          <button id="openFolderModalBtn" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition flex items-center gap-2">
            <i class="fa-solid fa-folder-plus text-amber-600"></i> New Folder
          </button>
          <button id="openCreateModalBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm">
            <i class="fa-solid fa-cloud-arrow-up"></i> Upload File
          </button>
          <button id="backupDataBtn" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold px-3 py-2 rounded-xl text-xs transition flex items-center gap-2">
            <i class="fa-solid fa-file-arrow-down"></i> Backup All Files
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col space-y-4">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div id="breadcrumbsBar" class="flex items-center gap-2 text-xs font-semibold text-slate-700"></div>
          <span id="fileCountBadge" class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">0 items</span>
        </div>
        <div id="fileGridContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"></div>
      </div>
    `;
  }

  showLoadingState() {
    const grid = this.container?.querySelector("#fileGridContainer");
    if (grid) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-blue-500 block"></i>Loading folder...</div>`;
    }
  }

  renderItems(subFolders, dirFiles, currentFolderId, currentFolderName) {
    const breadcrumbs = this.container.querySelector("#breadcrumbsBar");
    const grid = this.container.querySelector("#fileGridContainer");
    const badge = this.container.querySelector("#fileCountBadge");
    if (!grid) return;

    if (currentFolderId === "root") {
      breadcrumbs.innerHTML = `<span class="text-blue-600 font-bold"><i class="fa-solid fa-house"></i> Home</span>`;
    } else {
      breadcrumbs.innerHTML = `
        <button onclick="fileManager.navigateToFolder('root')" class="hover:text-blue-600"><i class="fa-solid fa-house"></i> Home</button>
        <i class="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
        <span class="text-blue-600 font-bold">${escapeHtml(currentFolderName)}</span>
      `;
    }

    badge.textContent = `${subFolders.length} folders, ${dirFiles.length} files`;

    let html = "";
    subFolders.forEach(folder => {
      html += `
        <div ondblclick="fileManager.navigateToFolder('${folder.id}')" onclick="fileManager.navigateToFolder('${folder.id}')" oncontextmenu="fileManager.openContextMenu(event, 'folder', '${folder.id}')" class="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition group shadow-sm select-none">
          <i class="fa-solid fa-folder text-amber-400 text-4xl group-hover:scale-110 transition"></i>
          <span class="text-xs font-bold text-slate-700 truncate w-full text-center">${escapeHtml(folder.title || folder.name)}</span>
        </div>
      `;
    });

    dirFiles.forEach(file => {
      let thumbHtml = `<i class="fa-solid fa-file-lines text-blue-400 text-4xl"></i>`;
      if (file.thumbnail) {
        thumbHtml = `<img src="${file.thumbnail}" class="w-full h-20 object-cover rounded-xl shadow-inner">`;
      } else if (file.category === 'Media') {
        thumbHtml = `<i class="fa-solid fa-file-video text-purple-400 text-4xl"></i>`;
      }

      html += `
        <div onclick="fileManager.viewFile('${file.id}', '${file.fileId}')" oncontextmenu="fileManager.openContextMenu(event, 'file', '${file.id}', '${file.fileId}')" class="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 flex flex-col items-center justify-between gap-2 cursor-pointer transition group shadow-sm select-none">
          <div class="w-full flex justify-center items-center h-20 bg-slate-100 rounded-xl overflow-hidden">
            ${thumbHtml}
          </div>
          <span class="text-xs font-semibold text-slate-800 truncate w-full text-center" title="${escapeHtml(file.title)}">${escapeHtml(file.title)}</span>
          <div class="w-full text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            <span>${file.totalParts || 1} chunks</span>
          </div>
        </div>
      `;
    });

    if (subFolders.length === 0 && dirFiles.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs"><i class="fa-regular fa-folder-open text-3xl mb-2 text-slate-300 block"></i>This folder is empty</div>`;
    } else {
      grid.innerHTML = html;
    }
  }

  showContextMenu(e, type) {
    e.preventDefault();
    const menu = document.getElementById("contextMenu");
    const downloadBtn = document.getElementById("ctxDownloadBtn");

    if (type === 'file') {
      downloadBtn.classList.remove("hidden");
    } else {
      downloadBtn.classList.add("hidden");
    }

    menu.style.top = `${Math.min(e.clientY, window.innerHeight - 120)}px`;
    menu.style.left = `${Math.min(e.clientX, window.innerWidth - 160)}px`;
    menu.classList.remove("hidden");
  }

  hideContextMenu() {
    document.getElementById("contextMenu")?.classList.add("hidden");
  }

  toggleFolderModal(show) {
    const modal = document.getElementById("createFolderModal");
    if (show) {
      document.getElementById("folderNameInput").value = "";
      modal.classList.remove("hidden");
    } else {
      modal.classList.add("hidden");
    }
  }

  getFolderNameInput() {
    return document.getElementById("folderNameInput").value.trim();
  }

  toggleFileModal(show) {
    const modal = document.getElementById("createFileModal");
    if (show) {
      document.getElementById("createFileForm").reset();
      modal.classList.remove("hidden");
    } else {
      modal.classList.add("hidden");
    }
  }

  setUploadButtonProgress(isUploading, text = "Upload File") {
    const submitBtn = document.getElementById("submitFileBtn");
    if (!submitBtn) return;
    submitBtn.disabled = isUploading;
    submitBtn.innerHTML = isUploading ? `<i class="fa-solid fa-spinner fa-spin"></i> ${text}` : text;
  }
}
