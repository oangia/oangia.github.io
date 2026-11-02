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
    // 1. Create floating trigger button using parent helper
    this.createFloatButton(
      `<i class="fa-solid fa-folder-tree text-xl"></i>`,
      'bg-emerald-600 hover:bg-emerald-700'
    );
    this.floatBtn.ariaLabel = 'Open Folder Info Reader';

    // 2. Create Modal Container
    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center z-50 p-4 font-sans';

    this.modal.innerHTML = `
      <div class="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-folder-open"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Folder Information Reader</h3>
              <p class="text-[11px] text-slate-500">Extracts path, size, and file structure from a local folder</p>
            </div>
          </div>
          <button type="button" class="widget-close-btn text-slate-400 hover:text-slate-700 text-xl px-2 py-1 transition cursor-pointer">&times;</button>
        </div>

        <!-- Body Content -->
        <div class="flex-1 p-5 overflow-hidden flex flex-col gap-4 bg-slate-50/50 min-h-0">
          
          <!-- Dropzone / Selection Box -->
          <div class="widget-dropzone border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white transition-all rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer relative group shrink-0">
            <!-- webkitdirectory enables full folder selection -->
            <input type="file" class="widget-folder-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" webkitdirectory directory multiple>
            <div class="pointer-events-none flex flex-col items-center justify-center">
              <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl group-hover:scale-105 transition-transform mb-2 shadow-inner">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <p class="text-xs font-bold text-slate-800">
                Click to select a folder or <span class="text-emerald-600 underline">browse</span>
              </p>
              <p class="text-[10px] text-slate-400 mt-1">Reads all nested files and sub-directories instantly</p>
            </div>
          </div>

          <!-- Summary Bar -->
          <div class="widget-summary-bar hidden bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-600 shrink-0">
            <span class="widget-total-files">0 files found</span>
            <span class="widget-total-size text-slate-400">Total size: 0 KB</span>
          </div>

          <!-- File List Table -->
          <div class="widget-table-container hidden flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
            <div class="grid grid-cols-12 bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shrink-0">
              <div class="col-span-8">Relative Path</div>
              <div class="col-span-2">Type</div>
              <div class="col-span-2 text-right">Size</div>
            </div>
            <div class="widget-file-list flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar"></div>
          </div>

          <!-- Empty State -->
          <div class="widget-empty-state flex-1 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <i class="fa-regular fa-folder-open text-3xl text-slate-300 mb-2"></i>
            <p class="text-xs font-bold text-slate-600">No folder loaded yet</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Select a folder using the box above to analyze its contents.</p>
          </div>

        </div>

        <!-- Toast Container -->
        <div class="widget-toast-container absolute bottom-4 right-4 pointer-events-none flex flex-col gap-2 z-50"></div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // 3. Bind toggle behavior using parent helper
    this.bindToggle(this.modal, '.widget-close-btn');
  }

  cacheDomReferences() {
    const m = this.modal;
    this.dom = {
      folderInput: m.querySelector('.widget-folder-input'),
      dropzone: m.querySelector('.widget-dropzone'),
      summaryBar: m.querySelector('.widget-summary-bar'),
      totalFiles: m.querySelector('.widget-total-files'),
      totalSize: m.querySelector('.widget-total-size'),
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
    let totalBytes = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      totalBytes += file.size;

      this.folderData.push({
        name: file.name,
        path: file.webkitRelativePath || file.name, // Keeps full sub-folder nesting path
        size: file.size,
        type: file.type || 'Unknown'
      });
    }

    // Sort files by relative path alphabetically
    this.folderData.sort((a, b) => a.path.localeCompare(b.path));

    this.renderFolderInfo(totalBytes);
    this.showToast(`Loaded folder with ${files.length} files successfully!`, 'success');
  }

  renderFolderInfo(totalBytes) {
    this.dom.emptyState.classList.add('hidden');
    this.dom.summaryBar.classList.remove('hidden');
    this.dom.tableContainer.classList.remove('hidden');

    this.dom.totalFiles.textContent = `${this.folderData.length} files parsed`;
    this.dom.totalSize.textContent = `Total size: ${this.formatBytes(totalBytes)}`;
    
    this.dom.fileList.innerHTML = '';

    for (const item of this.folderData) {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-12 px-4 py-2 items-center text-xs hover:bg-slate-50 transition';

      row.innerHTML = `
        <div class="col-span-8 font-mono text-slate-700 truncate pr-2" title="${item.path}">
          <i class="fa-regular fa-file-lines text-emerald-500 mr-1.5"></i>${item.path}
        </div>
        <div class="col-span-2 text-slate-400 truncate text-[11px]">${item.type.split('/')[1] || item.type}</div>
        <div class="col-span-2 text-right font-mono text-slate-500 text-[11px]">${this.formatBytes(item.size)}</div>
      `;
      this.dom.fileList.appendChild(row);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
