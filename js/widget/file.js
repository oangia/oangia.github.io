import { Widget } from './base.js';

export class FileManagerWidget extends Widget {
  constructor(options = {}) {
    super(options);
    this.currentHandle = null;
    this.currentPathStack = []; // Stores directory handles for back-navigation
    this.currentEntries = new Map(); // Name -> Handle mapping for current view

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
      `<i class="fa-solid fa-folder-open text-xl"></i>`,
      'bg-blue-600 hover:bg-blue-700'
    );
    this.floatBtn.ariaLabel = 'Open System File Manager';

    // 2. Create Modal Container
    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center z-50 p-4 font-sans';

    this.modal.innerHTML = `
      <div class="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        
        <!-- Top Toolbar Header -->
        <div class="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-folder-tree"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">System Folder Manager</h3>
              <p class="widget-path-subtitle text-[11px] text-slate-500 truncate max-w-md">No folder selected</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" class="widget-select-folder-btn bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
              <i class="fa-solid fa-folder-plus"></i> Select Folder
            </button>
            <button type="button" class="widget-close-btn text-slate-400 hover:text-slate-700 text-xl px-2 py-1 transition ml-2 cursor-pointer">&times;</button>
          </div>
        </div>

        <!-- Navigation Bar / Breadcrumbs -->
        <div class="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0">
          <div class="flex items-center gap-2">
            <button type="button" class="widget-back-btn bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" disabled>
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="widget-breadcrumb-text text-slate-500 font-medium pl-2 border-l border-slate-200 truncate">
              Root view
            </div>
          </div>
          <div class="widget-item-count text-slate-400 font-medium text-[11px]">
            0 items
          </div>
        </div>

        <!-- Main Content Area / File Grid -->
        <div class="flex-1 bg-slate-50/50 p-5 overflow-hidden flex flex-col min-h-0">
          
          <!-- Empty State (Shown before folder selection) -->
          <div class="widget-empty-state flex-1 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white">
            <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner">
              <i class="fa-solid fa-folder-open"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-700 mb-1">No System Folder Connected</h4>
            <p class="text-xs text-slate-400 max-w-sm mb-4">Click the 'Select Folder' button above to grant browser access and browse your local directory structure.</p>
            <button type="button" class="widget-empty-select-btn bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-4 py-2 rounded-xl text-xs transition border border-blue-200 cursor-pointer">
              Choose Local Directory
            </button>
          </div>

          <!-- File List Table / Grid Wrapper -->
          <div class="widget-browser-container hidden flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
            <div class="grid grid-cols-12 bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shrink-0">
              <div class="col-span-7">Name</div>
              <div class="col-span-3">Type</div>
              <div class="col-span-2 text-right">Action</div>
            </div>
            <div class="widget-files-list flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar"></div>
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
      selectBtn: m.querySelector('.widget-select-folder-btn'),
      emptySelectBtn: m.querySelector('.widget-empty-select-btn'),
      backBtn: m.querySelector('.widget-back-btn'),
      subtitle: m.querySelector('.widget-path-subtitle'),
      breadcrumb: m.querySelector('.widget-breadcrumb-text'),
      itemCount: m.querySelector('.widget-item-count'),
      emptyState: m.querySelector('.widget-empty-state'),
      browserContainer: m.querySelector('.widget-browser-container'),
      filesList: m.querySelector('.widget-files-list'),
      toastContainer: m.querySelector('.widget-toast-container')
    };
  }

  attachEvents() {
    const handleSelectClick = () => this.pickSystemFolder();
    this.dom.selectBtn.addEventListener('click', handleSelectClick);
    this.dom.emptySelectBtn.addEventListener('click', handleSelectClick);

    this.dom.backBtn.addEventListener('click', () => {
      if (this.currentPathStack.length > 0) {
        this.currentHandle = this.currentPathStack.pop();
        this.loadDirectory(this.currentHandle, false);
      }
    });
  }

  async pickSystemFolder() {
    try {
      if (!window.showDirectoryPicker) {
        this.showToast('File System Access API is not supported in this browser.', 'error');
        return;
      }

      // Prompt user to select a real system folder
      const handle = await window.showDirectoryPicker();
      this.currentHandle = handle;
      this.currentPathStack = []; // Reset back stack on new root selection
      
      this.loadDirectory(handle, true);
      this.showToast(`Connected to folder: ${handle.name}`, 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        this.showToast('Failed to access directory.', 'error');
      }
    }
  }

  async loadDirectory(dirHandle, isRoot = false) {
    this.dom.emptyState.classList.add('hidden');
    this.dom.browserContainer.classList.remove('hidden');
    this.dom.filesList.innerHTML = '';
    this.currentEntries.clear();

    this.dom.subtitle.textContent = dirHandle.name;
    this.dom.breadcrumb.textContent = dirHandle.name;
    this.dom.backBtn.disabled = this.currentPathStack.length === 0;

    const entriesArray = [];
    for await (const entry of dirHandle.values()) {
      entriesArray.push(entry);
    }

    // Sort: Folders first, then files alphabetically
    entriesArray.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });

    this.dom.itemCount.textContent = `${entriesArray.length} items`;

    if (entriesArray.length === 0) {
      this.dom.filesList.innerHTML = `
        <div class="p-8 text-center text-slate-400 text-xs italic">This folder is empty.</div>
      `;
      return;
    }

    for (const entry of entriesArray) {
      this.currentEntries.set(entry.name, entry);
      const row = document.createElement('div');
      row.className = 'grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-50 transition text-xs cursor-pointer group';
      
      const isDir = entry.kind === 'directory';
      const iconClass = isDir ? 'fa-folder text-amber-500' : 'fa-file-lines text-blue-500';

      row.innerHTML = `
        <div class="col-span-7 flex items-center gap-2.5 truncate font-medium text-slate-700 group-hover:text-blue-600">
          <i class="fa-solid ${iconClass} text-sm shrink-0"></i>
          <span class="truncate">${entry.name}</span>
        </div>
        <div class="col-span-3 text-slate-400 text-[11px] capitalize">
          ${isDir ? 'Folder' : 'File'}
        </div>
        <div class="col-span-2 text-right flex items-center justify-end gap-1">
          ${isDir ? `
            <button type="button" class="w-7 h-7 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-center transition text-slate-600">
              <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          ` : `
            <button type="button" class="widget-read-file w-7 h-7 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-center transition text-slate-600" title="Quick Read">
              <i class="fa-solid fa-eye text-[10px]"></i>
            </button>
          `}
        </div>
      `;

      // Click behavior: open folder or preview file
      row.addEventListener('click', async () => {
        if (isDir) {
          this.currentPathStack.push(this.currentHandle);
          this.currentHandle = entry;
          this.loadDirectory(entry, false);
        } else {
          await this.previewFile(entry);
        }
      });

      this.dom.filesList.appendChild(row);
    }
  }

  async previewFile(fileHandle) {
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      // Simple lightweight alert preview for text files (or handle blobs/images)
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
      } else {
        // Show first 1000 characters as a quick preview notification or console/modal readout
        this.showToast(`Opened file: ${file.name} (${(file.size/1024).toFixed(1)} KB)`, 'success');
        console.log(`--- File Content (${file.name}) --- \n`, text.substring(0, 2000));
      }
    } catch (err) {
      console.error(err);
      this.showToast('Unable to read file content.', 'error');
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
