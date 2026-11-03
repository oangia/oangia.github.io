import { Widget } from './base.js';

class FileManager {
  constructor(containerElementOrId) {
    this.container = typeof containerElementOrId === 'string' 
      ? document.getElementById(containerElementOrId) 
      : containerElementOrId;
      
    this.folderStructure = {};
    this.currentPath = '';

    if (this.container) {
      this.attachManagerEvents();
    }
  }

  async loadFiles(fileList) {
    this.folderStructure = {};
    this.currentPath = '';

    const files = Array.from(fileList);
    if (!files.length) return;

    for (const file of files) {
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split('/');

      let currentLevel = this.folderStructure;
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        if (j === parts.length - 1) {
          currentLevel[part] = {
            __isFile: true,
            size: file.size,
            type: file.type,
            fileUrl: URL.createObjectURL(file),
            ...await this.processFilePreview(file, part)
          };
        } else {
          if (!currentLevel[part]) {
            currentLevel[part] = { __isFile: false, __children: {} };
          }
          if (!currentLevel[part].__children) {
            const oldObj = currentLevel[part];
            currentLevel[part] = { __isFile: false, __children: oldObj };
          }
          currentLevel = currentLevel[part].__children;
        }
      }
    }

    this.render();
  }

  async processFilePreview(file, filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isText = file.type.startsWith('text/') || ['json', 'js', 'html', 'css', 'md', 'txt', 'xml', 'svg', 'csv'].includes(ext);

    let previewType = 'generic';
    let previewData = null;

    if (isImage) {
      previewType = 'image';
      previewData = URL.createObjectURL(file);
    } else if (isVideo) {
      previewType = 'video';
      previewData = URL.createObjectURL(file);
    } else if (isAudio) {
      previewType = 'audio';
    } else if (isText) {
      previewType = 'text';
      previewData = await this.readTextSnippet(file);
    }

    return { extension: ext, previewType, previewData };
  }

  readTextSnippet(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.substring(0, 180));
      reader.onerror = () => resolve('');
      reader.readAsText(file.slice(0, 300));
    });
  }

  getRootFolderName() {
    return Object.keys(this.folderStructure)[0] || 'Folder';
  }

  navigateTo(path) {
    this.currentPath = path;
    this.render();
  }

  navigateUp() {
    const parts = this.currentPath.split('/').filter(Boolean);
    parts.pop();
    this.currentPath = parts.join('/');
    this.render();
  }

  getFolderSize(node) {
    let totalSize = 0;
    const children = node.__children || node;
    for (const key in children) {
      if (key.startsWith('__')) continue;
      const child = children[key];
      if (child.__isFile) {
        totalSize += child.size || 0;
      } else {
        totalSize += this.getFolderSize(child);
      }
    }
    return totalSize;
  }

  formatBytes(bytes) {
    if (bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  attachManagerEvents() {
    // FileManager handles all its own internal click interactions entirely
    this.container.addEventListener('click', (e) => {
      const backBtn = e.target.closest('.widget-back-btn');
      if (backBtn && !backBtn.disabled) {
        this.navigateUp();
        return;
      }

      const card = e.target.closest('[data-type]');
      if (!card) return;

      const type = card.getAttribute('data-type');
      if (type === 'folder') {
        const folderName = card.getAttribute('data-name');
        const nextPath = this.currentPath
          ? `${this.currentPath}/${folderName}`
          : folderName;
        this.navigateTo(nextPath);
      } else if (type === 'file') {
        const fileUrl = card.getAttribute('data-url');
        if (fileUrl) window.open(fileUrl, '_blank');
      }
    });
  }

  render() {
    if (!this.container) return;

    let currentObj = this.folderStructure;
    if (this.currentPath !== '') {
      const parts = this.currentPath.split('/');
      for (const p of parts) {
        if (currentObj[p]) {
          currentObj = currentObj[p].__children || currentObj[p];
        }
      }
    }

    const keys = Object.keys(currentObj)
      .filter((k) => !k.startsWith('__'))
      .sort((a, b) => {
        const aIsDir = !currentObj[a].__isFile;
        const bIsDir = !currentObj[b].__isFile;
        if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
        return a.localeCompare(b);
      });

    const isRoot = this.currentPath === '';
    const pathText = '/' + this.currentPath;
    const itemCountText = `${keys.length} items`;

    let gridHTML = '';

    if (keys.length === 0) {
      gridHTML = `<div class="col-span-full py-16 text-center text-slate-400 text-xs italic">This folder is empty.</div>`;
    } else {
      for (const key of keys) {
        const item = currentObj[key];
        const isDir = !item.__isFile;

        if (isDir) {
          const folderSize = this.getFolderSize(item);
          gridHTML += `
            <div class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden" data-type="folder" data-name="${key}">
              <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-folder text-5xl"></i>
              </div>
              <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
                <span class="w-full text-xs font-bold text-slate-700 truncate" title="${key}">${key}</span>
                <span class="text-[9px] text-slate-400 font-mono mt-0.5">${this.formatBytes(folderSize)}</span>
              </div>
            </div>
          `;
        } else {
          let previewHTML = `<i class="fa-regular fa-file-lines text-slate-400 text-3xl"></i>`;

          if (item.previewType === 'image') {
            previewHTML = `<img src="${item.previewData}" alt="${key}" class="w-full h-full object-cover rounded-lg" />`;
          } else if (item.previewType === 'video') {
            previewHTML = `
              <video src="${item.previewData}" class="widget-video-preview w-full h-full object-cover rounded-lg pointer-events-none" muted playsinline preload="metadata"></video>
              <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">VIDEO</div>
            `;
          } else if (item.previewType === 'audio') {
            previewHTML = `
              <div class="flex flex-col items-center justify-center text-blue-500">
                <i class="fa-solid fa-file-audio text-3xl mb-1"></i>
                <span class="text-[9px] font-mono text-slate-500 uppercase">${item.extension}</span>
              </div>`;
          } else if (item.previewType === 'text' && item.previewData) {
            const escapedText = item.previewData.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
            previewHTML = `<pre class="text-[8px] leading-tight text-slate-500 font-mono text-left p-1.5 overflow-hidden w-full h-full select-none opacity-80">${escapedText}</pre>`;
          }

          gridHTML += `
            <div class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden" data-type="file" data-url="${item.fileUrl}">
              <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
                ${previewHTML}
              </div>
              <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
                <span class="w-full text-xs font-semibold text-slate-700 truncate text-[11px]" title="${key}">${key}</span>
                <span class="text-[9px] text-slate-400 font-mono mt-0.5">${this.formatBytes(item.size)}</span>
              </div>
            </div>
          `;
        }
      }
    }

    this.container.innerHTML = `
      <!-- Breadcrumb & Control Bar -->
      <div class="bg-white border-b border-slate-200 px-5 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
        <div class="flex items-center gap-2">
          <button type="button" class="widget-back-btn bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${isRoot ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}" ${isRoot ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-left"></i> Back
          </button>
          <div class="text-slate-500 font-medium pl-2 border-l border-slate-200 truncate font-mono text-[11px]">
            ${pathText}
          </div>
        </div>
        <div class="text-slate-400 font-medium text-[11px]">
          ${itemCountText}
        </div>
      </div>

      <!-- File Grid Manager View -->
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          ${gridHTML}
        </div>
      </div>
    `;

    // Bind video duration hooks
    this.container.querySelectorAll('.widget-video-preview').forEach((videoEl) => {
      videoEl.addEventListener('loadedmetadata', () => {
        videoEl.currentTime = Math.min(1, videoEl.duration / 4);
      });
    });
  }
}

export class FileManagerWidget extends Widget {
  constructor(options = {}) {
    super(options);
    this.init();
  }

  init() {
    this.createUI();
    this.cacheDomReferences();
    
    // Instantiate FileManager and pass it the container element ID or reference
    this.fileManager = new FileManager('widget-browser-wrapper');
    
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

        <!-- Main Content Container assigned to FileManager -->
        <div id="widget-browser-wrapper" class="flex-1 bg-slate-50 overflow-hidden flex flex-col min-h-0 relative">
          
          <!-- Full-Screen Dropzone -->
          <div class="widget-select-screen flex-1 bg-white hover:bg-blue-50/20 transition-all p-8 flex flex-col items-center justify-center text-center relative cursor-pointer group border-2 border-dashed border-slate-200 hover:border-blue-500">
            <input type="file" class="widget-folder-input-main absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" webkitdirectory directory multiple>
            <div class="pointer-events-none flex flex-col items-center justify-center">
              <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform mb-4 shadow-inner">
                <i class="fa-solid fa-folder-open"></i>
              </div>
              <h4 class="text-sm font-bold text-slate-800 mb-1">Click anywhere to select a folder</h4>
              <p class="text-xs text-slate-400 max-w-sm">Loads directory layout with instant previews and computed folder sizes.</p>
            </div>
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
      folderInputMain: m.querySelector('.widget-folder-input-main'),
      folderInputHeader: m.querySelector('.widget-folder-input-header'),
      subtitle: m.querySelector('.widget-path-subtitle')
    };
  }

  attachEvents() {
    // Widget only handles file selection and feeds the data to FileManager
    const handleSelect = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      await this.fileManager.loadFiles(files);
      this.dom.subtitle.textContent = this.fileManager.getRootFolderName();
      Toast.success(`Loaded ${files.length} items successfully!`);
    };

    this.dom.folderInputMain.addEventListener('change', handleSelect);
    this.dom.folderInputHeader.addEventListener('change', handleSelect);
  }
}
