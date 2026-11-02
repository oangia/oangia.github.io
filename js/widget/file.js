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
      <div class="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        
        <!-- Header with Select Folder Button -->
        <div class="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-folder-tree"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">System Folder Manager</h3>
              <p class="widget-path-subtitle text-[11px] text-slate-500">No folder selected</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
              <i class="fa-solid fa-folder-plus"></i> Select Folder
              <input type="file" class="widget-folder-input hidden" webkitdirectory directory multiple>
            </label>
            <button type="button" class="widget-close-btn text-slate-400 hover:text-slate-700 text-xl px-2 py-1 transition ml-2 cursor-pointer">&times;</button>
          </div>
        </div>

        <!-- Main Content Area / File Manager View -->
        <div class="flex-1 bg-slate-50/50 p-5 overflow-hidden flex flex-col min-h-0">
          
          <!-- Empty State -->
          <div class="widget-empty-state flex-1 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white">
            <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner">
              <i class="fa-solid fa-folder-open"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-700 mb-1">No Folder Loaded</h4>
            <p class="text-xs text-slate-400 max-w-sm">Click the 'Select Folder' button in the top right to load and display your directory structure.</p>
          </div>

          <!-- File Manager View (Hidden by default) -->
          <div class="widget-browser-container hidden flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
            <div class="grid grid-cols-12 bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shrink-0">
              <div class="col-span-9">Relative Path</div>
              <div class="col-span-3 text-right">Kind</div>
            </div>
            <div class="widget-files-list flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar"></div>
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
      subtitle: m.querySelector('.widget-path-subtitle'),
      emptyState: m.querySelector('.widget-empty-state'),
      browserContainer: m.querySelector('.widget-browser-container'),
      filesList: m.querySelector('.widget-files-list'),
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.folderData.push({
        path: file.webkitRelativePath || file.name
      });
    }

    this.folderData.sort((a, b) => a.path.localeCompare(b.path));

    const rootFolderName = this.folderData[0].path.split('/')[0] || 'Selected Folder';
    this.dom.subtitle.textContent = rootFolderName;

    this.renderFolderApp();
    this.showToast(`Loaded ${files.length} paths successfully!`, 'success');
  }

  renderFolderApp() {
    this.dom.emptyState.classList.add('hidden');
    this.dom.browserContainer.classList.remove('hidden');
    this.dom.filesList.innerHTML = '';

    for (const item of this.folderData) {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-12 px-4 py-2.5 items-center text-xs hover:bg-slate-50 transition';

      row.innerHTML = `
        <div class="col-span-9 font-mono text-slate-700 truncate pr-2 flex items-center gap-2" title="${item.path}">
          <i class="fa-regular fa-file-lines text-blue-500 text-sm shrink-0"></i>
          <span class="truncate">${item.path}</span>
        </div>
        <div class="col-span-3 text-right font-mono text-slate-400 text-[11px]">File</div>
      `;
      this.dom.filesList.appendChild(row);
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
