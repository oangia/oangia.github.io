export class FileManagerUI {
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
}
