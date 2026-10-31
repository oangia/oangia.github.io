export class MediaFrameExtractorWidget {
  constructor(options = {}) {
    this.omggifWorkerSrc = options.omggifWorkerSrc || 'https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js';
    this.currentFile = null;
    this.currentThumbSize = 'md'; // sm, md, lg
    this.extractedBlobs = [];

    this.init();
  }

  init() {
    this.loadOmggifScript();
    this.createUI();
    this.cacheDomReferences();
    this.attachEvents();
  }

  loadOmggifScript() {
    if (typeof GifReader === 'undefined' && !document.getElementById('omggif-script')) {
      const script = document.createElement('script');
      script.id = 'omggif-script';
      script.src = this.omggifWorkerSrc;
      document.head.appendChild(script);
    }
  }

  createUI() {
    // Floating Trigger Button
    this.floatBtn = document.createElement('button');
    this.floatBtn.type = 'button';
    this.floatBtn.ariaLabel = 'Open Frame Extractor';
    this.floatBtn.className =
      'fixed bottom-6 right-24 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer z-50 transition-all duration-200 hover:scale-105';
    this.floatBtn.innerHTML = `<i class="fa-solid fa-film text-xl"></i>`;

    // Modal Drawer / Panel Container
    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden items-center justify-center z-50 p-4 font-sans';

    this.modal.innerHTML = `
      <div class="bg-slate-100 text-slate-800 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Header / Toolbar -->
        <div class="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-film"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Media Frame Extractor & Google Lens Search</h3>
              <p class="text-[11px] text-slate-500">GIF & Video Sampling for Google Lens</p>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center flex-wrap gap-4">
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500 font-medium">Grid Size:</span>
              <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
                <button type="button" data-size="sm" class="widget-size-btn px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition">Small</button>
                <button type="button" data-size="md" class="widget-size-btn px-2.5 py-1 rounded-lg bg-white text-purple-600 shadow-sm transition active-size">Medium</button>
                <button type="button" data-size="lg" class="widget-size-btn px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition">Large</button>
              </div>
            </div>

            <!-- Close Modal -->
            <button type="button" class="widget-close-btn text-slate-400 hover:text-slate-700 text-xl px-2 py-1 transition">&times;</button>
          </div>
        </div>

        <!-- Meta Status Bar -->
        <div class="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div class="flex items-center flex-wrap gap-2.5">
            <span class="widget-file-badge hidden font-medium px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 items-center gap-1.5">
              <i class="widget-file-icon fa-solid fa-file text-purple-600"></i>
              <span class="widget-filename">filename.mp4</span>
              <span class="widget-filesize text-slate-400 font-normal">0 MB</span>
            </span>
            <span class="widget-status-badge hidden items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
              <span class="widget-status-dot w-2 h-2 rounded-full"></span>
              <span class="widget-status-text">Ready</span>
            </span>
          </div>
          <div>
            <a href="https://lens.google.com" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:underline font-semibold flex items-center gap-1">
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Open Google Lens
            </a>
          </div>
        </div>

        <!-- Content Body -->
        <div class="flex-1 flex flex-col lg:flex-row gap-4 p-5 overflow-hidden min-h-0">
          
          <!-- Left Column: Upload & Settings -->
          <div class="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar">
            <!-- Dropzone Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-center">
              <div class="widget-dropzone border-2 border-dashed border-slate-300 hover:border-purple-500 bg-slate-50/70 hover:bg-purple-50/20 transition-all rounded-xl p-6 text-center flex flex-col items-center justify-center cursor-pointer min-h-[180px] relative group overflow-hidden">
                <input type="file" class="widget-media-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/gif,video/mp4,video/webm,video/ogg,video/quicktime">
                
                <div class="pointer-events-none flex flex-col items-center justify-center">
                  <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-xl group-hover:scale-105 transition-transform mb-2 shadow-inner">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  
                  <p class="text-xs font-bold text-slate-800">
                    Drop GIF/Video or <span class="text-purple-600 underline">browse</span>
                  </p>
                  <p class="text-[10px] text-slate-500 mt-1">
                    Supports MP4, WebM, MOV, OGG, GIF
                  </p>
                </div>
              </div>
            </div>

            <!-- Extraction Settings Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
              <div>
                <h4 class="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <i class="fa-solid fa-sliders text-purple-600"></i> Extraction Settings
                </h4>

                <div class="mb-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <div class="flex justify-between items-center mb-2">
                    <label class="text-[11px] font-semibold text-slate-700">Target Frame Count</label>
                    <span class="widget-frame-count-val text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200">20 frames</span>
                  </div>
                  <input type="range" class="widget-frame-count-input w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600" min="2" max="100" value="20">
                </div>

                <div class="p-2.5 bg-purple-50/50 border border-purple-100 rounded-xl">
                  <div class="flex items-start gap-2">
                    <i class="fa-solid fa-lightbulb text-purple-500 text-xs mt-0.5"></i>
                    <p class="text-[10px] text-slate-600 leading-relaxed">
                      Clicking any frame copies it straight to your clipboard and opens Google Lens.
                    </p>
                  </div>
                </div>
              </div>

              <button type="button" class="widget-extract-btn mt-5 w-full py-2.5 px-4 bg-purple-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
                <i class="fa-solid fa-play"></i>
                <span>Extract Frames</span>
              </button>
            </div>
          </div>

          <!-- Right Column: Gallery & Progress -->
          <div class="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col space-y-4 overflow-hidden min-h-0">
            
            <!-- Progress Bar Card -->
            <div class="widget-progress-container hidden bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0">
              <div class="flex justify-between items-center mb-1.5 text-xs">
                <span class="widget-progress-text font-medium text-slate-700">Processing media...</span>
                <span class="widget-progress-percent font-bold text-purple-600">0%</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div class="widget-progress-bar bg-purple-600 h-1.5 rounded-full transition-all duration-150 w-0"></div>
              </div>
            </div>

            <!-- Gallery Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 shrink-0">
              <div class="flex items-center gap-3">
                <h4 class="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <i class="fa-solid fa-images text-purple-600"></i>
                  <span>Extracted Frames</span>
                </h4>
                <span class="widget-extracted-badge hidden text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-200 font-semibold">0 frames</span>
              </div>
              <p class="text-[11px] text-slate-500">
                <i class="fa-solid fa-circle-info text-purple-500 mr-1"></i> Click frame to copy &amp; launch Lens.
              </p>
            </div>

            <!-- Empty State -->
            <div class="widget-empty-state flex-1 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div class="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-sm border border-slate-200">
                <i class="fa-regular fa-images"></i>
              </div>
              <p class="text-slate-700 font-bold text-xs">No frames extracted yet</p>
              <p class="text-[11px] text-slate-500 mt-1 max-w-xs">Upload a video or GIF and click 'Extract Frames' to sample image thumbnails.</p>
            </div>

            <!-- Frames Grid Container (Scrollable) -->
            <div class="widget-frames-grid hidden flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"></div>
          </div>
        </div>

        <!-- Hidden Video Element -->
        <video class="widget-hidden-video hidden" preload="auto" muted playsinline></video>

        <!-- Toast Notification Container -->
        <div class="widget-toast-container absolute bottom-4 right-4 pointer-events-none flex flex-col gap-2 z-50"></div>
      </div>
    `;

    document.body.appendChild(this.floatBtn);
    document.body.appendChild(this.modal);
  }

  cacheDomReferences() {
    const m = this.modal;
    this.dom = {
      closeBtn: m.querySelector('.widget-close-btn'),
      mediaInput: m.querySelector('.widget-media-input'),
      dropzone: m.querySelector('.widget-dropzone'),
      fileInfo: m.querySelector('.widget-file-badge'),
      fileName: m.querySelector('.widget-filename'),
      fileSize: m.querySelector('.widget-filesize'),
      fileIcon: m.querySelector('.widget-file-icon'),
      frameCountInput: m.querySelector('.widget-frame-count-input'),
      frameCountVal: m.querySelector('.widget-frame-count-val'),
      extractBtn: m.querySelector('.widget-extract-btn'),
      progressContainer: m.querySelector('.widget-progress-container'),
      progressBar: m.querySelector('.widget-progress-bar'),
      progressText: m.querySelector('.widget-progress-text'),
      progressPercent: m.querySelector('.widget-progress-percent'),
      emptyState: m.querySelector('.widget-empty-state'),
      framesGrid: m.querySelector('.widget-frames-grid'),
      extractedBadge: m.querySelector('.widget-extracted-badge'),
      hiddenVideo: m.querySelector('.widget-hidden-video'),
      sizeBtns: m.querySelectorAll('.widget-size-btn'),
      statusBadge: m.querySelector('.widget-status-badge'),
      statusDot: m.querySelector('.widget-status-dot'),
      statusText: m.querySelector('.widget-status-text'),
      toastContainer: m.querySelector('.widget-toast-container')
    };
  }

  attachEvents() {
    // Modal Open / Close
    this.floatBtn.addEventListener('click', () => this.openModal());
    this.dom.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    // Slider
    this.dom.frameCountInput.addEventListener('input', (e) => {
      this.dom.frameCountVal.textContent = `${e.target.value} frames`;
    });

    // Grid Size toggles
    this.dom.sizeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dom.sizeBtns.forEach((b) => {
          b.className = 'widget-size-btn px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition';
        });
        btn.className = 'widget-size-btn px-2.5 py-1 rounded-lg bg-white text-purple-600 shadow-sm transition active-size';
        this.currentThumbSize = btn.dataset.size;
        this.updateGridSizeClass();
      });
    });

    // File input & Drag drop
    this.dom.mediaInput.addEventListener('change', () => this.handleFileSelect());

    ['dragenter', 'dragover'].forEach((eventName) => {
      this.dom.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        this.dom.dropzone.classList.add('border-purple-500', 'bg-purple-50/30');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      this.dom.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        this.dom.dropzone.classList.remove('border-purple-500', 'bg-purple-50/30');
      });
    });

    this.dom.dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files?.length) {
        this.dom.mediaInput.files = files;
        this.handleFileSelect();
      }
    });

    // Extract Button
    this.dom.extractBtn.addEventListener('click', () => this.startExtraction());
  }

  openModal() {
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
  }

  closeModal() {
    this.modal.classList.remove('flex');
    this.modal.classList.add('hidden');
  }

  updateGridSizeClass() {
    const gridClasses = {
      sm: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5',
      md: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3',
      lg: 'grid-cols-1 sm:grid-cols-2 gap-4'
    };
    this.dom.framesGrid.className = `widget-frames-grid flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 grid ${gridClasses[this.currentThumbSize]}`;
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

  setStatus(state, text) {
    this.dom.statusBadge.classList.remove('hidden', 'flex');
    this.dom.statusBadge.classList.add('inline-flex');

    if (state === 'loading') {
      this.dom.statusBadge.className =
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-600 border border-amber-500/30';
      this.dom.statusDot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-ping';
    } else if (state === 'success') {
      this.dom.statusBadge.className =
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30';
      this.dom.statusDot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    } else if (state === 'error') {
      this.dom.statusBadge.className =
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-600 border border-red-500/30';
      this.dom.statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
    }
    this.dom.statusText.textContent = text;
  }

  handleFileSelect() {
    const file = this.dom.mediaInput.files[0];
    if (!file) return;

    this.currentFile = file;
    this.dom.fileInfo.classList.remove('hidden');
    this.dom.fileInfo.classList.add('inline-flex');
    this.dom.fileName.textContent = file.name;
    this.dom.fileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    if (file.type.includes('gif')) {
      this.dom.fileIcon.className = 'fa-solid fa-file-image text-purple-600';
    } else {
      this.dom.fileIcon.className = 'fa-solid fa-file-video text-purple-600';
    }

    this.dom.extractBtn.disabled = false;
    this.showToast(`Selected: ${file.name}`, 'info');
  }

  async startExtraction() {
    if (!this.currentFile) return;

    const targetCount = parseInt(this.dom.frameCountInput.value, 10);

    this.dom.framesGrid.innerHTML = '';
    this.dom.emptyState.classList.add('hidden');
    this.dom.framesGrid.classList.remove('hidden');
    this.dom.progressContainer.classList.remove('hidden');
    this.dom.extractBtn.disabled = true;

    this.setStatus('loading', 'Extracting...');

    try {
      if (this.currentFile.type.includes('gif')) {
        await this.extractGifFrames(this.currentFile, targetCount);
      } else {
        await this.extractVideoFrames(this.currentFile, targetCount);
      }

      this.setStatus('success', 'Completed');
      this.showToast('Frames extracted successfully!', 'success');
    } catch (err) {
      console.error(err);
      this.setStatus('error', 'Error');
      this.showToast('Could not extract media frames: ' + err.message, 'error');
    } finally {
      this.dom.progressContainer.classList.add('hidden');
      this.dom.extractBtn.disabled = false;
    }
  }

  async extractVideoFrames(file, targetCount) {
    const videoUrl = URL.createObjectURL(file);
    this.dom.hiddenVideo.src = videoUrl;

    await new Promise((resolve, reject) => {
      this.dom.hiddenVideo.onloadedmetadata = () => resolve();
      this.dom.hiddenVideo.onerror = (e) => reject(e);
    });

    const duration = this.dom.hiddenVideo.duration;
    if (!duration || isNaN(duration)) {
      throw new Error('Invalid video duration');
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.dom.hiddenVideo.videoWidth || 640;
    canvas.height = this.dom.hiddenVideo.videoHeight || 360;
    const ctx = canvas.getContext('2d');

    const timestamps = [];
    const step = duration / (targetCount > 1 ? targetCount - 1 : 1);
    for (let i = 0; i < targetCount; i++) {
      timestamps.push(Math.min(i * step, duration - 0.05));
    }

    this.dom.extractedBadge.textContent = `${timestamps.length} frames`;
    this.dom.extractedBadge.classList.remove('hidden');

    for (let i = 0; i < timestamps.length; i++) {
      const time = timestamps[i];
      await this.seekVideoToTime(this.dom.hiddenVideo, time);

      ctx.drawImage(this.dom.hiddenVideo, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const timeLabel = this.formatTimestamp(time);

      this.renderFrameCard(blob, i + 1, timeLabel);

      const percent = Math.round(((i + 1) / timestamps.length) * 100);
      this.updateProgress(percent, `Extracted video frame ${i + 1} of ${timestamps.length}`);
    }

    URL.revokeObjectURL(videoUrl);
  }

  seekVideoToTime(video, time) {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = time;
    });
  }

  async extractGifFrames(file, targetCount) {
    if (typeof GifReader === 'undefined') {
      throw new Error('omggif library is not loaded.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const reader = new GifReader(uint8Array);
    const totalGifFrames = reader.numFrames();
    const width = reader.width;
    const height = reader.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const indices = [];
    if (targetCount >= totalGifFrames) {
      for (let i = 0; i < totalGifFrames; i++) indices.push(i);
    } else {
      const step = (totalGifFrames - 1) / (targetCount - 1);
      for (let i = 0; i < targetCount; i++) {
        indices.push(Math.round(i * step));
      }
    }

    this.dom.extractedBadge.textContent = `${indices.length} frames`;
    this.dom.extractedBadge.classList.remove('hidden');

    const frameBuf = new Uint8Array(width * height * 4);

    for (let idx = 0; idx < indices.length; idx++) {
      const frameIndex = indices[idx];
      reader.decodeAndBlitFrameRGBA(frameIndex, frameBuf);

      const imageData = new ImageData(
        new Uint8ClampedArray(frameBuf.buffer, frameBuf.byteOffset, frameBuf.byteLength),
        width,
        height
      );
      ctx.putImageData(imageData, 0, 0);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      this.renderFrameCard(blob, idx + 1, `Frame ${frameIndex + 1}/${totalGifFrames}`);

      const percent = Math.round(((idx + 1) / indices.length) * 100);
      this.updateProgress(percent, `Extracted GIF frame ${idx + 1} of ${indices.length}`);
    }
  }

  renderFrameCard(blob, frameIndex, labelText) {
    const blobUrl = URL.createObjectURL(blob);

    const card = document.createElement('div');
    card.className =
      'group relative bg-white border border-slate-200 hover:border-purple-500 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col cursor-pointer shrink-0';

    card.innerHTML = `
      <div class="relative aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        <img src="${blobUrl}" alt="Frame ${frameIndex}" class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
        <div class="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
          <span class="bg-purple-600 text-white p-2 rounded-full shadow-lg">
            <i class="fa-solid fa-copy text-sm"></i>
          </span>
        </div>
      </div>
      <div class="p-2 flex items-center justify-between border-t border-slate-100 bg-white">
        <span class="text-[11px] font-bold text-slate-700">#${frameIndex}</span>
        <span class="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">${labelText}</span>
      </div>
    `;

    card.addEventListener('click', () => this.copyFrameAndSearchLens(blob));
    this.dom.framesGrid.appendChild(card);
  }

  async copyFrameAndSearchLens(blob) {
    try {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      window.open('https://lens.google.com', '_blank');
      this.showToast('Frame copied! Paste (Ctrl+V) into Google Lens.', 'success');
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      this.showToast('Could not access clipboard. Check browser permissions.', 'error');
    }
  }

  updateProgress(percent, message) {
    this.dom.progressBar.style.width = `${percent}%`;
    this.dom.progressPercent.textContent = `${percent}%`;
    this.dom.progressText.textContent = message;
  }

  formatTimestamp(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  }
}
