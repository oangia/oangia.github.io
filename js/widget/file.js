import { FileManager } from "./../file/file.js";
import { FileAdapterService } from "./../file/service.js";

export class FileManagerWidget extends WidgetU {
  constructor(options = {}) {
    super({
      ...options,
      floatBtn: {
        icon: 'fa-solid fa-folder-open',
        bg: 'bg-blue-600 hover:bg-blue-700'
      }
    });
    this.init();
  }

  init() {
    this.createUI();
    this.dom = {
      folderInputMain: this.modal.querySelector('.widget-folder-input-main'),
      folderInputHeader: this.modal.querySelector('.widget-folder-input-header')
    };
    this.service = new FileAdapterService();
    this.fileManager = null;
    this.attachEvents();
  }

  createUI() {
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
  }

  cacheDomReferences() {
    
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
