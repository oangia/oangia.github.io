export class PhotoshopWidget {
  constructor(options = {}) {
    this.cropperCssUrl = options.cropperCssUrl || 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
    this.cropperJsUrl = options.cropperJsUrl || 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
    this.initialImageUrl = options.initialImageUrl || 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?auto=format&fit=crop&w=800&q=80';

    this.canvas = null;
    this.ctx = null;
    this.toolbar = null;
    this.propertiesPanel = null;
    this.canvasContainer = null;
    this.scrollViewport = null;
    this.cursor = null;
    this.dimensionsLabel = null;

    this.plugins = new Map();
    this.activePlugin = null;
    this.loadedImage = new Image();
    this.zoomLevel = 1;

    this.init();
  }

  init() {
    this.loadDependencies();
    this.createUI();
    this.cacheDomReferences();
    this.initEditor();
  }

  loadDependencies() {
    // Inject Cropper CSS if missing
    if (!document.getElementById('cropper-css')) {
      const link = document.createElement('link');
      link.id = 'cropper-css';
      link.rel = 'stylesheet';
      link.href = this.cropperCssUrl;
      document.head.appendChild(link);
    }

    // Inject Cropper JS if missing
    if (typeof Cropper === 'undefined' && !document.getElementById('cropper-js')) {
      const script = document.createElement('script');
      script.id = 'cropper-js';
      script.src = this.cropperJsUrl;
      document.head.appendChild(script);
    }
  }

  createUI() {
    // Floating Trigger Button
    this.floatBtn = document.createElement('button');
    this.floatBtn.type = 'button';
    this.floatBtn.ariaLabel = 'Open Photoshop Web';
    this.floatBtn.className =
      'fixed bottom-6 right-24 w-14 h-14 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer z-50 transition-all duration-200 hover:scale-105';
    this.floatBtn.innerHTML = `<span class="font-bold text-lg">Ps</span>`;

    // Modal Drawer / Panel Container
    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 bg-slate-900/60 backdrop-blur-sm hidden items-center justify-center z-50 p-4 font-sans';

    this.modal.innerHTML = `
      <style>
        .widget-custom-checkered {
            background-image: linear-gradient(45deg, #181818 25%, transparent 25%), 
                              linear-gradient(-45deg, #181818 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #181818 75%), 
                              linear-gradient(-45deg, transparent 75%, #181818 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      </style>
      <div class="bg-[#1e1e1e] text-[#cccccc] rounded-2xl shadow-2xl border border-[#3f3f46] w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden text-[13px] select-none">
        
        <!-- Top Menu Bar -->
        <div class="bg-[#18181b] h-[42px] flex items-center px-4 border-b border-[#27272a] justify-between shrink-0">
            <div class="flex items-center gap-3">
                <div class="bg-cyan-600 text-white p-1.5 rounded-lg shadow-sm text-xs font-bold flex items-center justify-center">
                    <span>Ps</span>
                </div>
                <div>
                    <span class="font-bold text-white text-xs">Photoshop Web</span>
                    <span class="text-[10px] text-slate-400 border-l border-slate-700 pl-2">Tailwind Plugin Studio</span>
                </div>
            </div>

            <div class="flex gap-2 items-center">
                <label class="widget-upload-label bg-[#27272a] hover:bg-[#3f3f46] text-white border border-[#3f3f46] px-3 py-1.5 rounded-xl cursor-pointer transition text-xs font-semibold">Open Image</label>
                <input type="file" class="widget-upload-input hidden" accept="image/*">
                <button type="button" class="widget-save-btn bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-xl cursor-pointer transition text-xs font-bold shadow-sm">Export JPG</button>
                <button type="button" class="widget-close-btn text-slate-400 hover:text-white text-xl px-2 py-1 transition ml-2">&times;</button>
            </div>
        </div>

        <!-- Main Workspace -->
        <div class="flex flex-1 h-[calc(92vh-42px)] relative overflow-hidden">
            
            <!-- Left Toolbar -->
            <div class="widget-toolbar w-[50px] bg-[#252526] border-r border-[#3f3f46] flex flex-col items-center pt-2.5 gap-1.5 shrink-0"></div>

            <!-- Center Canvas Container -->
            <div class="widget-scroll-viewport flex-1 widget-custom-checkered flex justify-center items-center relative overflow-auto">
                <div class="relative inline-block shadow-2xl transition-transform duration-100 ease-out origin-center" class="widget-canvas-container">
                    <div class="widget-tool-cursor absolute border border-white shadow-[0_0_2px_#000] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 hidden z-10"></div>
                    <canvas class="widget-image-canvas block max-w-none"></canvas>
                    <img class="widget-cropper-img max-w-full hidden" alt="Crop Area">
                </div>
            </div>

            <!-- Right Properties Panel -->
            <div class="widget-properties-panel w-[270px] bg-[#252526] border-l border-[#3f3f46] flex flex-col p-3 gap-3 overflow-y-auto shrink-0 custom-scrollbar"></div>

        </div>

        <!-- Toast Container -->
        <div class="widget-toast-container absolute bottom-4 right-4 pointer-events-none flex flex-col gap-2 z-50"></div>
      </div>
    `;

    document.body.appendChild(this.floatBtn);
    document.body.appendChild(this.modal);
  }

  cacheDomReferences() {
    const m = this.modal;
    this.canvas = m.querySelector('.widget-image-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.toolbar = m.querySelector('.widget-toolbar');
    this.propertiesPanel = m.querySelector('.widget-properties-panel');
    this.canvasContainer = m.querySelector('.widget-image-canvas').parentElement;
    this.scrollViewport = m.querySelector('.widget-scroll-viewport');
    this.cursor = m.querySelector('.widget-tool-cursor');
    this.dimensionsLabel = document.createElement('span');

    this.dom = {
      closeBtn: m.querySelector('.widget-close-btn'),
      uploadInput: m.querySelector('.widget-upload-input'),
      uploadLabel: m.querySelector('.widget-upload-label'),
      saveBtn: m.querySelector('.widget-save-btn'),
      toastContainer: m.querySelector('.widget-toast-container'),
      cropperImg: m.querySelector('.widget-cropper-img')
    };
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

  initEditor() {
    // Bind modal toggles
    this.floatBtn.addEventListener('click', () => {
      this.modal.classList.remove('hidden');
      this.modal.classList.add('flex');
    });

    this.dom.closeBtn.addEventListener('click', () => {
      this.modal.classList.remove('flex');
      this.modal.classList.add('hidden');
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.modal.classList.remove('flex');
        this.modal.classList.add('hidden');
      }
    });

    this.dom.uploadLabel.addEventListener('click', () => this.dom.uploadInput.click());

    this.loadedImage.crossOrigin = 'anonymous';
    this.loadedImage.src = this.initialImageUrl;
    this.loadedImage.onload = () => this.resetCanvasToImage(this.loadedImage);

    this.bindGlobalEvents();
    this.initGlobalPanels();

    // Register Plugins
    const self = this;

    // --- BASE PLUGIN SCHEMA ---
    class EditorPlugin {
      constructor(name, icon) {
        this.name = name;
        this.icon = icon;
        this.editor = self;
        this.toolbarBtn = null;
      }
      createToolSection(title) {
        const section = document.createElement('div');
        section.className = 'bg-[#333333] rounded-md p-2.5 flex flex-col gap-2 tool-section';
        section.innerHTML = `<div class="font-bold text-white text-[11px] uppercase tracking-wider border-b border-[#3f3f46] pb-1">${title}</div>`;
        this.editor.propertiesPanel.insertBefore(section, this.editor.propertiesPanel.firstChild);
        return section;
      }
    }

    // --- 1. BRUSH TOOL PLUGIN ---
    class BrushPlugin extends EditorPlugin {
      constructor() {
        super('Brush Tool', '🖌️');
        this.size = 5;
        this.color = '#000000';
        this.isDrawing = false;
      }
      onActivate() {
        const section = this.createToolSection('Brush Properties');
        section.innerHTML += `
            <div class="flex items-center justify-between gap-2"><label class="text-xs">Size</label><input type="range" id="w-b-size" min="1" max="50" value="${this.size}" class="flex-1 accent-[#007acc] cursor-pointer"><span id="w-b-sz-val" class="w-[30px] text-right text-xs">${this.size}px</span></div>
            <div class="flex items-center justify-between gap-2"><label class="text-xs">Color</label><input type="color" id="w-b-color" value="${this.color}" class="border-none w-7 h-7 rounded cursor-pointer bg-transparent"></div>
        `;
        
        section.querySelector('#w-b-size').oninput = (e) => { this.size = e.target.value; section.querySelector('#w-b-sz-val').textContent = this.size + 'px'; this.updateCursor(); };
        section.querySelector('#w-b-color').oninput = (e) => { this.color = e.target.value; this.updateCursor(); };
        
        const canvas = this.editor.canvas;
        canvas.onmouseenter = () => this.editor.cursor.style.display = 'block';
        canvas.onmouseleave = () => { this.isDrawing = false; this.editor.cursor.style.display = 'none'; };
        
        canvas.onmousemove = (e) => {
            this.moveCursor(e);
            if (!this.isDrawing) return;
            const pos = this.getPos(e);
            this.editor.ctx.lineTo(pos.x, pos.y);
            this.editor.ctx.strokeStyle = this.color;
            this.editor.ctx.lineWidth = this.size;
            this.editor.ctx.lineCap = 'round';
            this.editor.ctx.stroke();
        };

        canvas.onmousedown = (e) => {
            this.isDrawing = true;
            const pos = this.getPos(e);
            this.editor.ctx.beginPath();
            this.editor.ctx.moveTo(pos.x, pos.y);
        };

        window.onmouseup = () => { if(this.isDrawing) { this.isDrawing = false; this.editor.updateSnapshot(); } };
        this.updateCursor();
      }
      moveCursor(e) {
        const rect = this.editor.canvas.getBoundingClientRect();
        this.editor.cursor.style.left = (e.clientX - rect.left) + 'px';
        this.editor.cursor.style.top = (e.clientY - rect.top) + 'px';
      }
      updateCursor() {
        const rect = this.editor.canvas.getBoundingClientRect();
        if (rect.width > 0) {
            const scale = rect.width / this.editor.canvas.width;
            const displaySize = this.size * scale * this.editor.zoomLevel;
            this.editor.cursor.style.width = displaySize + 'px';
            this.editor.cursor.style.height = displaySize + 'px';
            this.editor.cursor.style.backgroundColor = this.color + '44';
            this.editor.cursor.style.borderColor = '#fff';
        }
      }
      getPos(evt) {
        const rect = this.editor.canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (this.editor.canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (this.editor.canvas.height / rect.height)
        };
      }
      onDeactivate() {
        this.editor.canvas.onmousedown = null;
        this.editor.canvas.onmousemove = null;
        this.editor.cursor.style.display = 'none';
      }
    }

    // --- 2. ERASER TOOL PLUGIN ---
    class EraserPlugin extends EditorPlugin {
      constructor() {
        super('Eraser Tool', '🧹');
        this.size = 15;
        this.isDrawing = false;
      }
      onActivate() {
        const section = this.createToolSection('Eraser Properties');
        section.innerHTML += `
            <div class="flex items-center justify-between gap-2"><label class="text-xs">Size</label><input type="range" id="w-e-size" min="2" max="100" value="${this.size}" class="flex-1 accent-[#007acc] cursor-pointer"><span id="w-e-sz-val" class="w-[30px] text-right text-xs">${this.size}px</span></div>
        `;
        section.querySelector('#w-e-size').oninput = (e) => { this.size = e.target.value; section.querySelector('#w-e-sz-val').textContent = this.size + 'px'; this.updateCursor(); };

        const canvas = this.editor.canvas;
        canvas.onmouseenter = () => this.editor.cursor.style.display = 'block';
        canvas.onmouseleave = () => { this.isDrawing = false; this.editor.cursor.style.display = 'none'; };

        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            this.editor.cursor.style.left = (e.clientX - rect.left) + 'px';
            this.editor.cursor.style.top = (e.clientY - rect.top) + 'px';

            if (!this.isDrawing) return;
            const pos = this.getPos(e);
            this.editor.ctx.save();
            this.editor.ctx.beginPath();
            this.editor.ctx.arc(pos.x, pos.y, this.size / 2, 0, Math.PI * 2);
            this.editor.ctx.clip();
            this.editor.ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.editor.ctx.drawImage(this.editor.loadedImage, 0, 0);
            this.editor.ctx.restore();
        };

        canvas.onmousedown = () => { this.isDrawing = true; };
        window.onmouseup = () => { if(this.isDrawing) { this.isDrawing = false; this.editor.updateSnapshot(); } };
        this.updateCursor();
      }
      updateCursor() {
        const rect = this.editor.canvas.getBoundingClientRect();
        if (rect.width > 0) {
            const scale = rect.width / this.editor.canvas.width;
            const displaySize = this.size * scale * this.editor.zoomLevel;
            this.editor.cursor.style.width = displaySize + 'px';
            this.editor.cursor.style.height = displaySize + 'px';
            this.editor.cursor.style.backgroundColor = 'rgba(255,255,255,0.3)';
            this.editor.cursor.style.borderColor = '#000';
        }
      }
      getPos(evt) {
        const rect = this.editor.canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (this.editor.canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (this.editor.canvas.height / rect.height)
        };
      }
      onDeactivate() {
        this.editor.canvas.onmousedown = null;
        this.editor.canvas.onmousemove = null;
        this.editor.cursor.style.display = 'none';
      }
    }

    // --- 3. EYEDROPPER TOOL PLUGIN ---
    class EyedropperPlugin extends EditorPlugin {
      constructor() {
        super('Eyedropper Tool', '💧');
      }
      onActivate() {
        const section = this.createToolSection('Eyedropper');
        section.innerHTML += `<div class="text-[11px] text-[#aaa]">Click canvas to sample color.</div>`;
        this.editor.canvas.style.cursor = 'crosshair';
        
        this.editor.canvas.onclick = (e) => {
            const pos = this.getPos(e);
            const pixel = this.editor.ctx.getImageData(pos.x, pos.y, 1, 1).data;
            const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('');
            
            const brushPlugin = this.editor.plugins.get('brush');
            if(brushPlugin) brushPlugin.color = hex;
            this.editor.switchPlugin('brush');
            this.editor.showToast(`Sampled color: ${hex}`, 'success');
        };
      }
      getPos(evt) {
        const rect = this.editor.canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (this.editor.canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (this.editor.canvas.height / rect.height)
        };
      }
      onDeactivate() {
        this.editor.canvas.onclick = null;
        this.editor.canvas.style.cursor = 'default';
      }
    }

    // --- 4. CROP TOOL PLUGIN ---
    class CropPlugin extends EditorPlugin {
      constructor() {
        super('Crop Tool', '📐');
        this.cropper = null;
      }
      onActivate() {
        const section = this.createToolSection('Crop Options');
        section.innerHTML += `
            <div class="grid grid-cols-2 gap-1.5">
                <button type="button" class="preset-btn bg-[#1e1e1e] border border-[#007acc] text-white bg-[#007acc]/20 p-1 text-[11px] rounded cursor-pointer" data-ratio="NaN">Freeform</button>
                <button type="button" class="preset-btn bg-[#1e1e1e] border border-[#3f3f46] text-[#cccccc] p-1 text-[11px] rounded cursor-pointer" data-ratio="1">1:1 Square</button>
            </div>
            <button type="button" id="w-apply-crop" class="bg-[#007acc] hover:bg-[#0062a3] text-white border border-[#007acc] py-1 px-3 rounded text-xs transition text-center mt-1 font-medium">Apply Crop</button>
        `;
        
        const imgEl = this.editor.dom.cropperImg;
        imgEl.src = this.editor.canvas.toDataURL();
        this.editor.canvas.style.display = 'none';
        imgEl.style.display = 'block';

        this.cropper = new Cropper(imgEl, { viewMode: 1 });
        
        section.querySelectorAll('.preset-btn').forEach(btn => {
            btn.onclick = (e) => {
                section.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('border-[#007acc]', 'text-white', 'bg-[#007acc]/20'));
                e.target.classList.add('border-[#007acc]', 'text-white', 'bg-[#007acc]/20');
                this.cropper.setAspectRatio(parseFloat(e.target.getAttribute('data-ratio')));
            };
        });

        section.querySelector('#w-apply-crop').onclick = () => {
            const croppedCanvas = this.cropper.getCroppedCanvas();
            this.editor.canvas.width = croppedCanvas.width;
            this.editor.canvas.height = croppedCanvas.height;
            this.editor.ctx.drawImage(croppedCanvas, 0, 0);
            this.editor.dimensionsLabel.textContent = `${this.editor.canvas.width} x ${this.editor.canvas.height}px`;
            this.editor.updateSnapshot();
            this.editor.switchPlugin('brush');
        };
      }
      onDeactivate() {
        if (this.cropper) { this.cropper.destroy(); this.cropper = null; }
        this.editor.dom.cropperImg.style.display = 'none';
        this.editor.canvas.style.display = 'block';
      }
    }

    // --- 5. RECTANGLE TOOL PLUGIN ---
    class RectanglePlugin extends EditorPlugin {
      constructor() {
        super('Rectangle Tool', '⏹️');
        this.color = '#ff0000';
        this.lineWidth = 3;
        this.startX = 0;
        this.startY = 0;
        this.isDrawing = false;
      }
      onActivate() {
        const section = this.createToolSection('Shape Properties');
        section.innerHTML += `
            <div class="flex items-center justify-between gap-2"><label class="text-xs">Border</label><input type="range" id="w-r-width" min="1" max="20" value="${this.lineWidth}" class="flex-1 accent-[#007acc] cursor-pointer"><span id="w-r-w-val" class="w-[30px] text-right text-xs">${this.lineWidth}px</span></div>
            <div class="flex items-center justify-between gap-2"><label class="text-xs">Color</label><input type="color" id="w-r-color" value="${this.color}" class="border-none w-7 h-7 rounded cursor-pointer bg-transparent"></div>
        `;
        section.querySelector('#w-r-width').oninput = (e) => { this.lineWidth = e.target.value; section.querySelector('#w-r-w-val').textContent = this.lineWidth + 'px'; };
        section.querySelector('#w-r-color').oninput = (e) => { this.color = e.target.value; };

        const canvas = this.editor.canvas;
        canvas.style.cursor = 'crosshair';

        canvas.onmousedown = (e) => {
            this.isDrawing = true;
            const pos = this.getPos(e);
            this.startX = pos.x;
            this.startY = pos.y;
        };

        canvas.onmousemove = (e) => {
            if (!this.isDrawing) return;
            const pos = this.getPos(e);
            this.editor.ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.editor.ctx.drawImage(this.editor.loadedImage, 0, 0);
            
            this.editor.ctx.strokeStyle = this.color;
            this.editor.ctx.lineWidth = this.lineWidth;
            this.editor.ctx.strokeRect(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
        };

        window.onmouseup = (e) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            const pos = this.getPos(e);
            this.editor.ctx.strokeStyle = this.color;
            this.editor.ctx.lineWidth = this.lineWidth;
            this.editor.ctx.strokeRect(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
            this.editor.updateSnapshot();
        };
      }
      getPos(evt) {
        const rect = this.editor.canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (this.editor.canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (this.editor.canvas.height / rect.height)
        };
      }
      onDeactivate() {
        this.editor.canvas.onmousedown = null;
        this.editor.canvas.onmousemove = null;
        this.editor.canvas.style.cursor = 'default';
      }
    }

    // --- 6. TEXT TOOL PLUGIN ---
    class TextPlugin extends EditorPlugin {
      constructor() {
        super('Text Tool', '✍️');
        this.text = 'Photoshop Web';
        this.fontSize = 32;
        this.color = '#ffffff';
      }
      onActivate() {
        const section = this.createToolSection('Text Properties');
        section.innerHTML += `
            <div class="flex flex-col gap-1"><label class="text-xs">Content</label><input type="text" id="w-t-content" value="${this.text}" class="bg-[#1e1e1e] border border-[#3f3f46] text-white p-1 rounded text-xs"></div>
            <div class="flex items-center justify-between gap-2 mt-1"><label class="text-xs">Size</label><input type="range" id="w-t-size" min="10" max="100" value="${this.fontSize}" class="flex-1 accent-[#007acc] cursor-pointer"><span id="w-t-sz-val" class="w-[30px] text-right text-xs">${this.fontSize}px</span></div>
            <div class="flex items-center justify-between gap-2"><label class="text-xs">Color</label><input type="color" id="w-t-color" value="${this.color}" class="border-none w-7 h-7 rounded cursor-pointer bg-transparent"></div>
            <button type="button" id="w-commit-text" class="bg-[#007acc] hover:bg-[#0062a3] text-white border border-[#007acc] py-1 rounded text-xs transition text-center mt-1 font-medium">Stamp Text on Center</button>
        `;
        section.querySelector('#w-t-content').oninput = (e) => { this.text = e.target.value; };
        section.querySelector('#w-t-size').oninput = (e) => { this.fontSize = e.target.value; section.querySelector('#w-t-sz-val').textContent = this.fontSize + 'px'; };
        section.querySelector('#w-t-color').oninput = (e) => { this.color = e.target.value; };

        section.querySelector('#w-commit-text').onclick = () => {
            const ctx = this.editor.ctx;
            ctx.font = `${this.fontSize}px sans-serif`;
            ctx.fillStyle = this.color;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(this.text, this.editor.canvas.width / 2 - 50, this.editor.canvas.height / 2);
            ctx.shadowBlur = 0;
            this.editor.updateSnapshot();
        };
      }
    }

    // --- 7. BLUR EFFECT PLUGIN ---
    class BlurPlugin extends EditorPlugin {
      constructor() {
        super('Blur Filter', '💧');
      }
      onActivate() {
        const section = this.createToolSection('Blur Filter');
        section.innerHTML += `
            <div class="text-[11px] text-[#aaa]">Softens image focus matrix pixels.</div>
            <button type="button" id="w-apply-blur" class="bg-[#007acc] hover:bg-[#0062a3] text-white border border-[#007acc] py-1 rounded text-xs transition text-center font-medium mt-1">Apply Box Blur</button>
        `;
        section.querySelector('#w-apply-blur').onclick = () => {
            const ctx = this.editor.ctx;
            const w = this.editor.canvas.width;
            const h = this.editor.canvas.height;
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            const temp = new Uint8ClampedArray(data);

            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    for (let c = 0; c < 3; c++) {
                        let sum = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                let idx = ((y + dy) * w + (x + dx)) * 4 + c;
                                sum += temp[idx];
                            }
                        }
                        data[(y * w + x) * 4 + c] = sum / 9;
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);
            this.editor.updateSnapshot();
            this.editor.showToast('Applied box blur successfully!', 'success');
        };
      }
    }

    this.registerPlugin('brush', new BrushPlugin(), true);
    this.registerPlugin('eraser', new EraserPlugin());
    this.registerPlugin('eyedropper', new EyedropperPlugin());
    this.registerPlugin('rectangle', new RectanglePlugin());
    this.registerPlugin('text', new TextPlugin());
    this.registerPlugin('blur', new BlurPlugin());
    this.registerPlugin('crop', new CropPlugin());
  }

  resetCanvasToImage(img) {
    this.canvas.width = img.naturalWidth || img.width;
    this.canvas.height = img.naturalHeight || img.height;
    this.ctx.drawImage(img, 0, 0);
    this.dimensionsLabel.textContent = `${this.canvas.width} x ${this.canvas.height}px`;
  }

  updateSnapshot() {
    this.loadedImage = new Image();
    this.loadedImage.src = this.canvas.toDataURL();
  }

  registerPlugin(id, pluginInstance, isDefault = false) {
    pluginInstance.editor = this;
    this.plugins.set(id, pluginInstance);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-9 h-9 bg-transparent border-none text-[#cccccc] hover:bg-[#3a3d41] hover:text-white rounded cursor-pointer flex items-center justify-center text-base transition relative';
    btn.innerHTML = pluginInstance.icon;
    btn.title = pluginInstance.name;
    btn.onclick = () => this.switchPlugin(id);
    this.toolbar.appendChild(btn);
    pluginInstance.toolbarBtn = btn;

    if (isDefault || !this.activePlugin) {
      this.switchPlugin(id);
    }
  }

  switchPlugin(id) {
    if (this.activePlugin && this.activePlugin.onDeactivate) {
      this.activePlugin.onDeactivate();
      if (this.activePlugin.toolbarBtn) this.activePlugin.toolbarBtn.classList.remove('bg-[#007acc]', 'text-white');
    }

    this.activePlugin = this.plugins.get(id);
    if (this.activePlugin.toolbarBtn) this.activePlugin.toolbarBtn.classList.add('bg-[#007acc]', 'text-white');
    
    const dynamicSections = this.propertiesPanel.querySelectorAll('.tool-section');
    dynamicSections.forEach(sec => sec.remove());

    if (this.activePlugin.onActivate) this.activePlugin.onActivate();
  }

  initGlobalPanels() {
    // Filters & Tones Panel
    const filterSection = document.createElement('div');
    filterSection.className = 'bg-[#333333] rounded-md p-2.5 flex flex-col gap-2';
    filterSection.innerHTML = `
        <div class="font-bold text-white text-[11px] uppercase tracking-wider border-b border-[#3f3f46] pb-1">Filters & Tones</div>
        <div class="flex gap-1.5">
            <button type="button" id="w-filter-grayscale" class="flex-1 bg-[#333333] hover:bg-[#3a3d41] text-white border border-[#3f3f46] py-1 rounded text-xs transition text-center">Grayscale</button>
            <button type="button" id="w-filter-invert" class="flex-1 bg-[#333333] hover:bg-[#3a3d41] text-white border border-[#3f3f46] py-1 rounded text-xs transition text-center">Invert</button>
        </div>
        <div class="flex items-center justify-between gap-2 mt-1"><label class="text-xs">Brightness</label><input type="range" id="w-b-range" min="-100" max="100" value="0" class="flex-1 accent-[#007acc] cursor-pointer"></div>
        <div class="flex items-center justify-between gap-2"><label class="text-xs">Contrast</label><input type="range" id="w-c-range" min="-100" max="100" value="0" class="flex-1 accent-[#007acc] cursor-pointer"></div>
        <button type="button" id="w-apply-tone" class="bg-[#333333] hover:bg-[#3a3d41] text-white border border-[#3f3f46] py-1 rounded text-xs transition text-center mt-1">Commit Tones</button>
    `;
    this.propertiesPanel.appendChild(filterSection);

    // Zoom Navigator Panel
    const zoomSection = document.createElement('div');
    zoomSection.className = 'bg-[#333333] rounded-md p-2.5 flex flex-col gap-2';
    zoomSection.innerHTML = `
        <div class="font-bold text-white text-[11px] uppercase tracking-wider border-b border-[#3f3f46] pb-1">Zoom Navigator</div>
        <div class="flex items-center justify-between gap-2">
            <button type="button" id="w-zoom-out" class="flex-1 bg-[#333333] hover:bg-[#3a3d41] text-white border border-[#3f3f46] py-1 rounded text-xs transition">-</button>
            <span id="w-zoom-val" class="w-[50px] text-center text-xs">100%</span>
            <button type="button" id="w-zoom-in" class="flex-1 bg-[#333333] hover:bg-[#3a3d41] text-white border border-[#3f3f46] py-1 rounded text-xs transition">+</button>
        </div>
    `;
    this.propertiesPanel.appendChild(zoomSection);

    // Canvas Info Panel
    const infoSection = document.createElement('div');
    infoSection.className = 'bg-[#333333] rounded-md p-2.5 flex flex-col gap-2';
    infoSection.innerHTML = `
        <div class="font-bold text-white text-[11px] uppercase tracking-wider border-b border-[#3f3f46] pb-1">Canvas Info</div>
        <div class="flex items-center justify-between text-[11px] text-[#888]">
            <span>Resolution:</span>
        </div>
    `;
    infoSection.querySelector('.flex').appendChild(this.dimensionsLabel);
    this.propertiesPanel.appendChild(infoSection);

    // Bind Global Actions
    filterSection.querySelector('#w-filter-grayscale').onclick = () => {
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
            data[i] = avg; data[i + 1] = avg; data[i + 2] = avg;
        }
        this.ctx.putImageData(imgData, 0, 0);
        this.updateSnapshot();
        this.showToast('Applied Grayscale filter', 'success');
    };

    filterSection.querySelector('#w-filter-invert').onclick = () => {
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        this.ctx.putImageData(imgData, 0, 0);
        this.updateSnapshot();
        this.showToast('Inverted image colors', 'success');
    };

    filterSection.querySelector('#w-apply-tone').onclick = () => {
        const b = parseInt(filterSection.querySelector('#w-b-range').value);
        const c = parseInt(filterSection.querySelector('#w-c-range').value);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.loadedImage, 0, 0);

        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imgData.data;
        const factor = (259 * (c + 255)) / (255 * (259 - c));

        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                let val = data[i + j] + b;
                val = factor * (val - 128) + 128;
                data[i + j] = Math.min(255, Math.max(0, val));
            }
        }
        this.ctx.putImageData(imgData, 0, 0);
        this.updateSnapshot();
        this.showToast('Applied brightness & contrast tones', 'success');
    };

    zoomSection.querySelector('#w-zoom-in').onclick = () => {
        if (this.zoomLevel < 3) { this.zoomLevel += 0.25; this.applyZoom(zoomSection); }
    };
    zoomSection.querySelector('#w-zoom-out').onclick = () => {
        if (this.zoomLevel > 0.5) { this.zoomLevel -= 0.25; this.applyZoom(zoomSection); }
    };
  }

  applyZoom(zoomSection) {
    this.canvasContainer.style.transform = `scale(${this.zoomLevel})`;
    zoomSection.querySelector('#w-zoom-val').textContent = Math.round(this.zoomLevel * 100) + '%';
    if (this.activePlugin && this.activePlugin.updateCursor) this.activePlugin.updateCursor();
  }

  bindGlobalEvents() {
    this.dom.uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    this.loadedImage = img;
                    this.resetCanvasToImage(img);
                    this.showToast(`Loaded ${file.name}`, 'success');
                };
            };
            reader.readAsDataURL(file);
        }
    });

    this.dom.saveBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'edited-image.jpg';
        link.href = this.canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        this.showToast('Exported image as JPG!', 'success');
    });
  }
}
