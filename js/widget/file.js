import { Widget } from './base.js';

export class FileManagerWidget extends Widget {
  constructor(options = {}) {
    super(options);
    this.folderStructure = {};
    this.currentPath = '';

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
      <div class="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-folder-tree"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">System Folder Manager</h3>
              <p class="widget-path-subtitle text-[11px] text-slate-500">No folder loaded</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
              <i class="fa-solid fa-folder-plus"></i> Select Folder
              <input type="file" class="widget-folder-input-header hidden" webkitdirectory directory multiple>
            </label>
            <button type="button" class="widget-close-btn text-slate-400 hover:text-slate-700 text-xl px-2 py-1 transition ml-2 cursor-pointer">&times;</button>
          </div>
        </div>

        <!-- Breadcrumb & Control Bar -->
        <div class="widget-breadcrumb-bar bg-white border-b border-slate-200 px-5 py-2 flex items-center justify-between gap-3 text-xs shrink-0 hidden">
          <div class="flex items-center gap-2">
            <button type="button" class="widget-back-btn bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" disabled>
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="widget-breadcrumb-text text-slate-500 font-medium pl-2 border-l border-slate-200 truncate font-mono text-[11px]">
              /
            </div>
          </div>
          <div class="widget-item-count text-slate-400 font-medium text-[11px]">
            0 items
          </div>
        </div>

        <!-- Main Content Area (Zero Padding, Full Bleed) -->
        <div class="flex-1 bg-slate-50 overflow-hidden flex flex-col min-h-0 relative">
          
          <!-- Full-Screen Dropzone -->
          <div class="widget-select-screen flex-1 bg-white hover:bg-blue-50/20 transition-all p-8 flex flex-col items-center justify-center text-center relative cursor-pointer group border-2 border-dashed border-slate-200 hover:border-blue-500">
            <input type="file" class="widget-folder-input-main absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" webkitdirectory directory multiple>
            <div class="pointer-events-none flex flex-col items-center justify-center">
              <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform mb-4 shadow-inner">
                <i class="fa-solid fa-folder-open"></i>
              </div>
              <h4 class="text-sm font-bold text-slate-800 mb-1">Click anywhere to select a folder</h4>
              <p class="text-xs text-slate-400 max-w-sm">Loads directory layout with instant file previews.</p>
            </div>
          </div>

          <!-- File Grid Manager View -->
          <div class="widget-browser-container hidden flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div class="widget-files-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"></div>
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
      breadcrumbBar: m.querySelector('.widget-breadcrumb-bar'),
      selectScreen: m.querySelector('.widget-select-screen'),
      folderInputMain: m.querySelector('.widget-folder-input-main'),
      folderInputHeader: m.querySelector('.widget-folder-input-header'),
      closeBtn: m.querySelector('.widget-close-btn'),
      backBtn: m.querySelector('.widget-back-btn'),
      subtitle: m.querySelector('.widget-path-subtitle'),
      breadcrumbText: m.querySelector('.widget-breadcrumb-text'),
      itemCount: m.querySelector('.widget-item-count'),
      browserContainer: m.querySelector('.widget-browser-container'),
      filesGrid: m.querySelector('.widget-files-grid'),
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
          currentLevel[part] = { __isFile: true, fileRef: file };
        } else {
          if (!currentLevel[part]) {
            currentLevel[part] = {};
          }
          currentLevel = currentLevel[part];
        }
      }
    }

    this.dom.selectScreen.classList.add('hidden');
    this.dom.breadcrumbBar.classList.remove('hidden');
    this.dom.browserContainer.classList.remove('hidden');

    const rootFolderName = Object.keys(this.folderStructure)[0] || 'Folder';
    this.dom.subtitle.textContent = rootFolderName;

    this.renderCurrentDirectory();
    this.showToast(`Loaded ${files.length} items successfully!`, 'success');
  }

  renderCurrentDirectory() {
    this.dom.filesGrid.innerHTML = '';

    let currentObj = this.folderStructure;
    if (this.currentPath !== '') {
      const parts = this.currentPath.split('/');
      for (const p of parts) {
        if (currentObj[p]) currentObj = currentObj[p];
      }
    }

    const keys = Object.keys(currentObj).sort((a, b) => {
      const aIsDir = !currentObj[a].__isFile;
      const bIsDir = !currentObj[b].__isFile;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.localeCompare(b);
    });

    this.dom.breadcrumbText.textContent = '/' + this.currentPath;
    this.dom.backBtn.disabled = this.currentPath === '';
    this.dom.itemCount.textContent = `${keys.length} items`;

    if (keys.length === 0) {
      this.dom.filesGrid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400 text-xs italic">
          This folder is empty.
        </div>`;
      return;
    }

    for (const key of keys) {
      const item = currentObj[key];
      const isDir = !item.__isFile;

      const card = document.createElement('div');
      card.className =
        'group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden';

      if (isDir) {
        card.innerHTML = `
          <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <i class="fa-solid fa-folder text-5xl"></i>
          </div>
          <div class="w-full text-xs font-bold text-slate-700 truncate pt-2 border-t border-slate-100">
            ${key}
          </div>
        `;
        card.addEventListener('click', () => {
          this.currentPath = this.currentPath ? `${this.currentPath}/${key}` : key;
          this.renderCurrentDirectory();
        });
      } else {
        const file = item.fileRef;
        const isImage = file.type.startsWith('image/');
        const isText = file.type.startsWith('text/') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.html') || file.name.endsWith('.css') || file.name.endsWith('.md');

        card.innerHTML = `
          <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
            <i class="fa-regular fa-file-lines text-slate-400 text-3xl"></i>
          </div>
          <div class="w-full text-xs font-semibold text-slate-700 truncate pt-2 border-t border-slate-100 flex items-center justify-between">
            <span class="truncate text-[11px]" title="${key}">${key}</span>
            <span class="text-[9px] text-slate-400 font-mono shrink-0 ml-1">${this.formatBytes(file.size)}</span>
          </div>
        `;

        const previewContainer = card.querySelector('.widget-preview-area');

        if (isImage) {
          const imgUrl = URL.createObjectURL(file);
          previewContainer.innerHTML = `<img src="${imgUrl}" alt="${key}" class="w-full h-full object-cover rounded-lg" />`;
        } else if (isText) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const textSnippet = e.target.result.substring(0, 150);
            previewContainer.innerHTML = `<pre class="text-[8px] leading-tight text-slate-500 font-mono text-left p-1 overflow-hidden w-full h-full select-none opacity-80">${this.escapeHtml(textSnippet)}</pre>`;
          };
          reader.readAsText(file.slice(0, 200));
        }

        card.addEventListener('click', () => {
          if (isImage) {
            window.open(URL.createObjectURL(file), '_blank');
          } else {
            this.showToast(`Selected file: ${key}`, 'info');
          }
        });
      }

      this.dom.filesGrid.appendChild(card);
    }
  }

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + sizes[i];
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
