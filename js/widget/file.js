import { Widget } from './base.js';

export class FileManagerWidget extends Widget {
  constructor(options = {}) {
    super(options);
    this.folderData = [];

    this.init();
  }

  init() {
    this.createUI();
    this.cacheDomReferences();
    this.attachEvents();
  }

  createUI() {
    this.createFloatButton(
      `<i class="fa-solid fa-folder-open text-xl"></i>`,
      'bg-blue-600 hover:bg-blue-700'
    );
    this.floatBtn.ariaLabel = 'Open Folder Manager';

    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center z-50 p-4 font-sans';

    this.modal.innerHTML = `
      <div class="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-folder-tree"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Folder Structure Reader</h3>
              <p class="text-[11px] text-slate-500">Lightweight metadata extraction without recursive file reading</p>
            </div>
          </div>
          <button type="button" class="widget-close-btn text-slate-400 hover:text-slate-700 text-xl px-2 py-1 transition cursor-pointer">&times;</button>
        </div>

        <!-- Body Content -->
        <div class="flex-1 p-5 overflow-hidden flex flex-col gap-4 bg-slate-50/50 min-h-0">
          
          <!-- Selection Box -->
          <div class="widget-dropzone border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white transition-all rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer relative group shrink-0">
            <input type="file" class="widget-folder-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" webkitdirectory directory multiple>
            <div class="pointer-events-none flex flex-col items-center justify-center">
              <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl group-hover:scale-105 transition-transform mb-2 shadow-inner">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <p class="text-xs font-bold text-slate-800">
                Click to select a folder or <span class="text-blue-600 underline">browse</span>
              </p>
              <p class="text-[10px] text-slate-400 mt-1">Extracts structural names and paths instantly</p>
            </div>
          </div>

          <!-- Summary Bar -->
          <div class="widget-summary-bar hidden bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-600 shrink-0">
            <span class="widget-total-files">0 items found</span>
            <span class="widget-total-size text-slate-400">Lightweight metadata index</span>
          </div>

          <!-- File List Table -->
          <div class="widget-table-container hidden flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
            <div class="grid grid-cols-12 bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shrink-0">
              <div class="col-span-9">Relative Path</div>
              <div class="col-span-3 text-right">Kind</div>
            </div>
            <div class="widget-file-list flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar"></div>
          </div>

          <!-- Empty State -->
          <div class="widget-empty-state flex-1 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <i class="fa-regular fa-folder-open text-3xl text-slate-300 mb-2"></i>
            <p class="text-xs font-bold text-slate-600">No folder loaded</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Select a directory to view its structure safely.</p>
          </div>

        </div>

        <div class="widget-toast-container absolute bottom-4 right-4 pointer-events-none flex flex-col gap-2 z-50"></div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.bindToggle(this.modal, '.widget-close-btn');
  }

  cacheDomReferences() {
    const m = this.modal;
    this.dom = {
      folderInput: m.querySelector('.widget-folder-input'),
      summaryBar: m.querySelector('.widget-summary-bar'),
      totalFiles: m.querySelector('.widget-total-files'),
      tableContainer: m.querySelector('.widget-table-container'),
      fileList: m.querySelector('.widget-file-list'),
      emptyState: m.querySelector('.widget-empty-state'),
      toastContainer: m.querySelector('.widget-toast-container')
    };
  }

  attachEvents() {
    this.dom.folderInput.addEventListener('change', (e) => this.handleFolderSelect(e));
  }

  handleFolderSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    this.folderData = [];

    // Lightweight indexing: only pull path strings and basic properties without streaming or reading data buffers
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.folderData.push({
        path: file.webkitRelativePath || file.name
      });
    }

    this.folderData.sort((a, b) => a.path.localeCompare(b.path));

    this.renderFolderInfo();
    this.showToast(`Indexed ${files.length} paths successfully!`, 'success');
  }

  renderFolderInfo() {
    this.dom.emptyState.classList.add('hidden');
    this.dom.summaryBar.classList.remove('hidden');
    this.dom.tableContainer.classList.remove('hidden');

    this.dom.totalFiles.textContent = `${this.folderData.length} entries indexed`;
    this.dom.fileList.innerHTML = '';

    for (const item of this.folderData) {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-12 px-4 py-2 items-center text-xs hover:bg-slate-50 transition';

      row.innerHTML = `
        <div class="col-span-9 font-mono text-slate-700 truncate pr-2" title="${item.path}">
          <i class="fa-regular fa-file-lines text-blue-500 mr-1.5"></i>${item.path}
        </div>
        <div class="col-span-3 text-right font-mono text-slate-400 text-[11px]">File</div>
      `;
      this.dom.fileList.appendChild(row);
    }
  }

  showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    const bgColors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-slate-900' };
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-medium text-white ${
      bgColors[type] || bgColors.info
    } transition-all transform translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-base"></i> <span>${msg}</span>`;

    this.dom.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
