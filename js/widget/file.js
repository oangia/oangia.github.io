import { Widget } from './base.js';
import { FileManager } from "./../file/file.js";

class FileAdapterService {
  constructor() {
    this.folderStructure = {};
    this.nodeMap = new Map(); // Maps folder IDs to tree nodes
    this.fileMap = new Map();  // Maps file IDs to file objects
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
    console.log({
      folders,
      files,
      currentFolderName: node.name
    });
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
      console.log(files);
      await this.fileManager.switch(files);
      console.log(`Loaded ${files.length} items successfully via service switch!`);
    };

    this.dom.folderInputMain.addEventListener('change', handleSelect);
    this.dom.folderInputHeader.addEventListener('change', handleSelect);
  }
}
