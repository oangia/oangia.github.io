import { Widget } from './base.js';
import { FileManager } from "./../file/file.js";
/**
 * FilePreviewComponent placeholder to imitate the second architecture's preview handling.
 */
class FilePreviewComponent {
  initEvents() {
    // Event hooks for preview overlay/modal if needed
  }

  showLoading(title) {
    console.log(`Loading preview for: ${title}`);
  }

  render(fileRecord, fullBase64) {
    if (fileRecord.previewType === 'image' || fileRecord.previewType === 'video') {
      window.open(fullBase64, '_blank');
    } else {
      console.log('Rendering file preview:', fileRecord);
    }
  }
}

/**
 * Service Adapter acting as both the file parser and folder tree state service.
 */
class FileAdapterService {
  constructor() {
    this.folderStructure = {};
    this.nodeMap = new Map(); // Maps folder IDs to tree nodes
    this.fileMap = new Map();  // Maps file IDs to file objects
  }

  async switch(fileList) {
    const files = Array.from(fileList);
    this.folderStructure = {
      id: 'root',
      name: 'root',
      __children: {},
      __files: []
    };
    this.nodeMap.clear();
    this.fileMap.clear();
    this.nodeMap.set('root', this.folderStructure);

    if (!files.length) return;

    let folderIdCounter = 1;
    let fileIdCounter = 1;

    for (const file of files) {
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split('/');
      const fileName = parts.pop();
      
      let currentLevelNode = this.folderStructure;

      // Build folder hierarchy
      for (const part of parts) {
        if (!currentLevelNode.__children[part]) {
          const newFolderId = `folder_${folderIdCounter++}`;
          const newFolderNode = {
            id: newFolderId,
            name: part,
            __children: {},
            __files: []
          };
          currentLevelNode.__children[part] = newFolderNode;
          this.nodeMap.set(newFolderId, newFolderNode);
        }
        currentLevelNode = currentLevelNode.__children[part];
      }

      // Process file payload
      const ext = fileName.split('.').pop().toLowerCase();
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isText = file.type.startsWith('text/') || ['json', 'js', 'html', 'css', 'md', 'txt', 'xml', 'svg', 'csv'].includes(ext);

      let previewType = 'generic';
      let previewData = null;
      const fileUrl = URL.createObjectURL(file);

      if (isImage) {
        previewType = 'image';
        previewData = fileUrl;
      } else if (isVideo) {
        previewType = 'video';
        previewData = fileUrl;
      } else if (isAudio) {
        previewType = 'audio';
      } else if (isText) {
        previewType = 'text';
        previewData = await this.readTextSnippet(file);
      }

      const fileId = `file_${fileIdCounter++}`;
      const fileRecord = {
        id: fileId,
        fileId: fileId,
        title: fileName,
        path: relativePath,
        size: file.size,
        type: file.type,
        extension: ext,
        fileUrl,
        previewType,
        previewData,
        thumbnail: previewType === 'image' ? fileUrl : null
      };

      currentLevelNode.__files.push(fileRecord);
      this.fileMap.set(fileId, fileRecord);
    }
  }

  _calculateFolderSize(node) {
    let totalSize = 0;
    const children = node.__children || {};
    const files = node.__files || [];
    
    for (const file of files) {
      totalSize += file.size || 0;
    }
    for (const key in children) {
      totalSize += this._calculateFolderSize(children[key]);
    }
    return totalSize;
  }

  async getFolderContents(folderId) {
    const node = this.nodeMap.get(folderId) || this.folderStructure;
    
    const folders = Object.values(node.__children).map(child => ({
      id: child.id,
      title: child.name,
      name: child.name,
      size: this._calculateFolderSize(child) // Pre-calculate the total recursive size here!
    }));

    const files = node.__files || [];

    return {
      folders,
      files,
      currentFolderName: node.name
    };
  }

  async getFileRecord(id) {
    return this.fileMap.get(id);
  }

  async getFullBase64(fileId) {
    const file = this.fileMap.get(fileId);
    return file ? file.fileUrl : null;
  }

  readTextSnippet(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.substring(0, 180));
      reader.onerror = () => resolve('');
      reader.readAsText(file.slice(0, 300));
    });
  }
}

class FileManager2 {
  constructor(config = {}) {
    this.containerId = config.containerId;
    this.container = document.getElementById(this.containerId);

    this.service = config.service;
    
    this.currentFolderId = 'root';
    this.contextTarget = null;
    this.previewer = new FilePreviewComponent();
  }

  init() {
    this.attachManagerEvents();
  }

  async switch(fileList) {
    await this.service.switch(fileList);
    this.currentFolderId = 'root';
    this.loadCurrentFolder();
  }

  navigateToFolder(folderId) {
    this.currentFolderId = folderId;
    this.loadCurrentFolder();
  }

  navigateUp() {
    if (this.currentFolderId !== 'root') {
      this.navigateToFolder('root');
    }
  }

  getFolderSize(node) {
    let totalSize = 0;
    const children = node.__children || {};
    const files = node.__files || [];
    
    for (const file of files) {
      totalSize += file.size || 0;
    }
    for (const key in children) {
      totalSize += this.getFolderSize(children[key]);
    }
    return totalSize;
  }

  formatBytes(bytes) {
    if (bytes === 0 || isNaN(bytes) || bytes == null) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async loadCurrentFolder() {
    if (!this.container) return;

    try {
      const { folders, files, currentFolderName } = await this.service.getFolderContents(this.currentFolderId);
      this.render(folders, files, currentFolderName);
    } catch (err) {
      console.error('Error loading folder contents:', err);
    }
  }

  attachManagerEvents() {
    this.container.addEventListener('click', (e) => {
      const backBtn = e.target.closest('.widget-back-btn');
      if (backBtn && !backBtn.disabled) {
        this.navigateUp();
        return;
      }

      const card = e.target.closest('[data-action]');
      if (!card) return;

      const action = card.getAttribute('data-action');
      const id = card.getAttribute('data-id');

      if (action === 'navigate') {
        this.navigateToFolder(id);
      } else if (action === 'view') {
        const fileUrl = card.getAttribute('data-url');
        if (fileUrl) window.open(fileUrl, '_blank');
      }
    });
  }

  render(folders = [], files = [], currentFolderName = 'root') {
    if (!this.container) return;

    const isRoot = this.currentFolderId === 'root';
    const pathText = isRoot ? '/' : `/${currentFolderName}`;
    const totalItemsCount = folders.length + files.length;
    const itemCountText = `${totalItemsCount} items`;

    let gridHTML = '';

    if (totalItemsCount === 0) {
      gridHTML = `<div class="col-span-full py-16 text-center text-slate-400 text-xs italic">This folder is empty.</div>`;
    } else {
      // Render Folders
      for (const folder of folders) {
        const name = folder.title || folder.name;
        gridHTML += `
          <div class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden" data-action="navigate" data-id="${folder.id}">
            <div class="flex-1 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-folder text-5xl"></i>
            </div>
            <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
              <span class="w-full text-xs font-bold text-slate-700 truncate" title="${name}">${name}</span>
              <span class="text-[9px] text-slate-400 font-mono mt-0.5">Folder</span>
            </div>
          </div>
        `;
      }

      // Render Files
      for (const file of files) {
        const name = file.title || 'Untitled';
        let previewHTML = `<i class="fa-regular fa-file-lines text-slate-400 text-3xl"></i>`;

        if (file.previewType === 'image') {
          previewHTML = `<img src="${file.previewData}" alt="${name}" class="w-full h-full object-cover rounded-lg" />`;
        } else if (file.previewType === 'video') {
          previewHTML = `
            <video src="${file.previewData}" class="widget-video-preview w-full h-full object-cover rounded-lg pointer-events-none" muted playsinline preload="metadata"></video>
            <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">VIDEO</div>
          `;
        } else if (file.previewType === 'audio') {
          previewHTML = `
            <div class="flex flex-col items-center justify-center text-blue-500">
              <i class="fa-solid fa-file-audio text-3xl mb-1"></i>
              <span class="text-[9px] font-mono text-slate-500 uppercase">${file.extension}</span>
            </div>`;
        } else if (file.previewType === 'text' && file.previewData) {
          const escapedText = file.previewData.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
          previewHTML = `<pre class="text-[8px] leading-tight text-slate-500 font-mono text-left p-1.5 overflow-hidden w-full h-full select-none opacity-80">${escapedText}</pre>`;
        }

        gridHTML += `
          <div class="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 aspect-square overflow-hidden" data-action="view" data-url="${file.fileUrl}">
            <div class="widget-preview-area flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
              ${previewHTML}
            </div>
            <div class="w-full pt-2 border-t border-slate-100 flex flex-col">
              <span class="w-full text-xs font-semibold text-slate-700 truncate text-[11px]" title="${name}">${name}</span>
              <span class="text-[9px] text-slate-400 font-mono mt-0.5">${this.formatBytes(file.size)}</span>
            </div>
          </div>
        `;
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
    this.service = new FileAdapterService();
    this.fileManager = null;
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
      </div>
    `;

    document.body.appendChild(this.modal);
    this.bindToggle(this.modal, '.widget-close-btn');
  }

  cacheDomReferences() {
    const m = this.modal;
    this.dom = {
      folderInputMain: m.querySelector('.widget-folder-input-main'),
      folderInputHeader: m.querySelector('.widget-folder-input-header')
    };
  }

  attachEvents() {
    const handleSelect = async (e) => {
      if (this.fileManager == null) {
        this.fileManager = new FileManager({
          containerId: 'widget-browser-wrapper',
          service: this.service
        });
        this.fileManager.init();
      }
      const files = e.target.files;
      if (!files || files.length === 0) return;

      await this.fileManager.switch(files);
      console.log(`Loaded ${files.length} items successfully via service switch!`);
    };

    this.dom.folderInputMain.addEventListener('change', handleSelect);
    this.dom.folderInputHeader.addEventListener('change', handleSelect);
  }
}
