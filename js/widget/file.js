import { Widget } from './base.js';

export class FileManagerWidget extends Widget {
  constructor(options = {}) {
    super(options);
    this.folderData = [];
    this.currentPath = '';
    this.folderStructure = {};

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
        
        <!-- Header (Hidden initially, appears when folder is loaded) -->
        <div class="widget-header-bar bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 hidden">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-folder-tree"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">System Folder Manager</h3>
              <p class="widget-path-subtitle text-[11px] text-slate-500">Root folder</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
              <i class="fa-solid fa-folder-plus"></i> Change Folder
              <input type="file" class="widget-folder-input hidden" webkitdirectory directory multiple>
            </label>
            <button type="button" class="widget-close-btn text-slate-400 hover:text-slate-700 text-xl px-2 py-1 transition ml-2 cursor-pointer">&times;</button>
          </div>
        </div>

        <!-- Breadcrumb Bar (Hidden initially) -->
        <div class="widget-breadcrumb-bar bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0 hidden">
          <div class="flex items-center gap-2">
            <button type="button" class="widget-back-btn bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" disabled>
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="widget-breadcrumb-text text-slate-500 font-medium pl-2 border-l border-slate-200 truncate">
              /
            </div>
          </div>
          <div class="widget-item-count text-slate-400 font-medium text-[11px]">
            0 items
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 bg-slate-50/50 p-5 overflow-hidden flex flex-col min-h-0 relative">
          
          <!-- Initial Full-Content Select Section -->
          <div class="widget-select-screen flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white transition-all rounded-2xl p-8 flex flex-col items-center justify-center text-center relative cursor-pointer group">
            <input type="file" class="widget-folder-input-main absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" webkitdirectory directory multiple>
            <div class="pointer-events-none flex flex-col items-center justify-center">
              <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform mb-4 shadow-inner">
                <i class="fa-solid fa-folder-open"></i>
              </div>
              <h4 class="text-sm font-bold text-slate-800 mb-1">Click anywhere to select a folder</h4>
              <p class="text-xs text-slate-400 max-w-sm">Loads your local directory structure instantly into a file manager interface.</p>
            </div>
          </div>

          <!-- File Manager Table View (Hidden initially) -->
          <div class="widget-browser-container hidden flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
            <div class="grid grid-cols-12 bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shrink-0">
              <div class="col-span-8">Name</div>
              <div class="col-span-4 text-right">Type</div>
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
      headerBar: m.querySelector('.widget-header-bar'),
      breadcrumbBar: m.querySelector('.widget-breadcrumb-bar'),
      selectScreen: m.querySelector('.widget-select-screen'),
      folderInputMain: m.querySelector('.widget-folder-input-main'),
      folderInputHeader: m.querySelector('.widget-folder-input'),
      closeBtn: m.querySelector('.widget-close-btn'),
      backBtn: m.querySelector('.widget-back-btn'),
      subtitle: m.querySelector('.widget-path-subtitle'),
      breadcrumbText: m.querySelector('.widget-breadcrumb-text'),
      itemCount: m.querySelector('.widget-item-count'),
      browserContainer: m.querySelector('.widget-browser-container'),
      filesList: m.querySelector('.widget-files-list'),
      toastContainer: m.querySelector('.widget-toast-container')
    };
  }

  attachEvents() {
    const handleSelect = (e) => this.handleFolderSelect(e);
    this.dom.folderInputMain.addEventListener('change', handleSelect);
    this.dom.folderInputHeader.addEventListener('change', handleSelect);

    this.dom.backBtn.addEventListener('click', () => {
      const parts = this.currentPath.split('/').filter(Boolean);
      parts.pop();
      this.currentPath = parts.join('/');
      this.renderCurrentDirectory();
    });
  }

  handleFolderSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    this.folderStructure = {};
    this.currentPath = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split('/');

      let currentLevel = this.folderStructure;
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        if (j === parts.length - 1) {
          currentLevel[part] = { __is들File: true, size: file.size };
        } else {
          if (!currentLevel[part]) {
            currentLevel[part] = {};
          }
          currentLevel = currentLevel[part];
        }
      }
    }

    // Switch view from select screen to file manager view
    this.dom.selectScreen.classList.add('hidden');
    this.dom.headerBar.classList.remove('hidden');
    this.dom.breadcrumbBar.classList.remove('hidden');
    this.dom.browserContainer.classList.remove('hidden');

    const rootFolderName = Object.keys(this.folderStructure)[0] || 'Folder';
    this.dom.subtitle.textContent = rootFolderName;

    this.renderCurrentDirectory();
    this.showToast(`Loaded folder structure successfully!`, 'success');
  }

  renderCurrentDirectory() {
    this.dom.filesList.innerHTML = '';

    let currentObj = this.folderStructure;
    if (this.currentPath !== '') {
      const parts = this.currentPath.split('/');
      for (const p of parts) {
        if (currentObj[p]) currentObj = currentObj[p];
      }
    }

    const keys = Object.keys(currentObj).sort((a, b) => {
      const aIsDir = !currentObj[a].__is들File;
      const bIsDir = !currentObj[b].__is들File;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.localeCompare(b);
    });

    this.dom.breadcrumbText.textContent = '/' + this.currentPath;
    this.dom.backBtn.disabled = this.currentPath === '';
    this.dom.itemCount.textContent = `${keys.length} items`;

    if (keys.length === 0) {
      this.dom.filesList.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs italic">This folder is empty.</div>`;
      return;
    }

    for (const key of keys) {
      const item = currentObj[key];
      const isDir = !item.__is들File;

      const row = document.createElement('div');
      row.className = 'grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-50 transition text-xs cursor-pointer group';

      const iconClass = isDir ? 'fa-folder text-amber-500' : 'fa-file-lines text-blue-500';

      row.innerHTML = `
        <div class="col-span-8 flex items-center gap-2.5 truncate font-medium text-slate-700 group-hover:text-blue-600">
          <i class="fa-solid ${iconClass} text-sm shrink-0"></i>
          <span class="truncate">${key}</span>
        </div>
        <div class="col-span-4 text-right text-slate-400 text-[11px]">
          ${isDir ? 'Folder' : 'File'}
        </div>
      `;

      row.addEventListener('click', () => {
        if (isDir) {
          this.currentPath = this.currentPath ? `${this.currentPath}/${key}` : key;
          this.renderCurrentDirectory();
        }
      });

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
