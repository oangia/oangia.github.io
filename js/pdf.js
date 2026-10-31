export class PdfExtractorWidget {
  constructor(options = {}) {
    this.workerSrc = options.workerSrc || 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    this.currentFile = null;

    this.init();
  }

  init() {
    this.setupPdfWorker();
    this.createUI();
    this.cacheDomReferences();
    this.attachEvents();
  }

  setupPdfWorker() {
    if (typeof pdfjsLib !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = this.workerSrc;
    }
  }

  createUI() {
    // Floating Trigger Button
    this.floatBtn = document.createElement('button');
    this.floatBtn.type = 'button';
    this.floatBtn.ariaLabel = 'Open PDF Extractor';
    this.floatBtn.className =
      'fixed bottom-6 right-24 w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer z-50 transition-all duration-200 hover:scale-105';
    this.floatBtn.innerHTML = `<i class="fa-solid fa-file-pdf text-xl"></i>`;

    // Modal Drawer / Panel Container
    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden items-center justify-center z-50 p-4 font-sans';

    this.modal.innerHTML = `
      <div class="bg-slate-100 text-slate-800 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        <!-- Header / Toolbar -->
        <div class="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-file-pdf"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">PDF Header & Markdown Extractor</h3>
              <p class="text-[11px] text-slate-500">Client-Side PDF Text & Structure Parser</p>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center flex-wrap gap-3">
            <!-- Mode Selector -->
            <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
              <label data-mode-label="headers" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition bg-white text-rose-600 shadow-sm">
                <input type="radio" name="widgetExtractMode" value="headers" checked class="hidden">
                <i class="fa-solid fa-heading text-xs"></i>
                <span>Headers Only</span>
              </label>
              <label data-mode-label="markdown" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition text-slate-600 hover:text-slate-900">
                <input type="radio" name="widgetExtractMode" value="markdown" class="hidden">
                <i class="fa-solid fa-file-lines text-xs"></i>
                <span>Full .MD File</span>
              </label>
            </div>

            <!-- Upload PDF Button -->
            <label class="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>Upload PDF</span>
              <input type="file" class="widget-pdf-upload hidden" accept=".pdf">
            </label>

            <!-- Close Modal -->
            <button type="button" class="widget-close-btn text-slate-400 hover:text-slate-700 text-xl px-2 py-1 transition">&times;</button>
          </div>
        </div>

        <!-- Meta Bar -->
        <div class="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center flex-wrap gap-2.5">
            <span class="widget-output-label font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <i class="fa-solid fa-heading text-rose-500 text-sm"></i>
              <span>Headers Extraction Output</span>
            </span>
            <span class="widget-file-badge hidden font-medium px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 items-center gap-1.5">
              <i class="fa-solid fa-file-pdf text-rose-500"></i>
              <span class="widget-filename"></span>
            </span>
            <span class="widget-pages-badge hidden font-medium px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 items-center gap-1">
              <span class="widget-pagecount"></span>
            </span>
            <span class="widget-status-badge hidden items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
              <span class="widget-status-dot w-2 h-2 rounded-full"></span>
              <span class="widget-status-text"></span>
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" class="widget-copy-btn hidden bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-200 shadow-sm">
              <i class="fa-solid fa-copy text-slate-500"></i>
              <span class="widget-copy-text">Copy</span>
            </button>
            <button type="button" class="widget-download-btn hidden bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-download"></i>
              <span>Download .md</span>
            </button>
          </div>
        </div>

        <!-- Content Body -->
        <div class="relative flex-1 flex flex-col overflow-hidden bg-slate-900">
          <!-- Drop Zone -->
          <div class="widget-dropzone absolute inset-4 flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-rose-50/20 hover:border-rose-300 transition-all z-10">
            <div class="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
              <i class="fa-solid fa-file-pdf"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800 mb-1">Select a PDF file to begin extraction</h3>
            <p class="text-xs text-slate-500 max-w-sm mb-4">Extract clean Markdown headings, structured lists, and formatted document content right in your browser.</p>
            <button type="button" class="widget-browse-btn bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-sm">
              <i class="fa-solid fa-folder-open"></i> Browse PDF
            </button>
          </div>

          <!-- Preformatted Output -->
          <pre class="widget-output hidden flex-1 w-full bg-slate-900 text-slate-200 p-5 text-xs font-mono overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar selection:bg-rose-500/30"></pre>
        </div>

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
      fileInput: m.querySelector('.widget-pdf-upload'),
      dropZone: m.querySelector('.widget-dropzone'),
      browseBtn: m.querySelector('.widget-browse-btn'),
      output: m.querySelector('.widget-output'),
      outputLabel: m.querySelector('.widget-output-label'),
      fileBadge: m.querySelector('.widget-file-badge'),
      fileNameDisplay: m.querySelector('.widget-filename'),
      pagesBadge: m.querySelector('.widget-pages-badge'),
      pageCountDisplay: m.querySelector('.widget-pagecount'),
      statusBadge: m.querySelector('.widget-status-badge'),
      statusDot: m.querySelector('.widget-status-dot'),
      statusText: m.querySelector('.widget-status-text'),
      copyBtn: m.querySelector('.widget-copy-btn'),
      copyBtnText: m.querySelector('.widget-copy-text'),
      downloadBtn: m.querySelector('.widget-download-btn'),
      toastContainer: m.querySelector('.widget-toast-container'),
      modeHeadersLabel: m.querySelector('[data-mode-label="headers"]'),
      modeMarkdownLabel: m.querySelector('[data-mode-label="markdown"]'),
      modeRadios: m.querySelectorAll('input[name="widgetExtractMode"]')
    };
  }

  attachEvents() {
    // Toggle Modal
    this.floatBtn.addEventListener('click', () => this.openModal());
    this.dom.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    // File Input & Browse
    this.dom.browseBtn.addEventListener('click', () => this.dom.fileInput.click());
    this.dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.currentFile = e.target.files[0];
        this.processPdf(this.currentFile);
      }
    });

    // Mode Selection Change
    this.dom.modeRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        const mode = this.getSelectedMode();
        this.updateModeUI(mode);
        if (this.currentFile) this.processPdf(this.currentFile);
      });
    });

    // Drag and Drop
    ['dragenter', 'dragover'].forEach((eventName) => {
      this.dom.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dom.dropZone.classList.add('border-rose-400', 'bg-rose-50/40');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      this.dom.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dom.dropZone.classList.remove('border-rose-400', 'bg-rose-50/40');
      });
    });

    this.dom.dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer?.files?.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          this.currentFile = file;
          this.processPdf(file);
        } else {
          this.showToast('Please select a valid PDF file.', 'error');
        }
      }
    });

    // Actions
    this.dom.copyBtn.addEventListener('click', () => this.copyOutput());
    this.dom.downloadBtn.addEventListener('click', () => this.downloadMd());
  }

  openModal() {
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
  }

  closeModal() {
    this.modal.classList.remove('flex');
    this.modal.classList.add('hidden');
  }

  getSelectedMode() {
    return this.modal.querySelector('input[name="widgetExtractMode"]:checked').value;
  }

  updateModeUI(mode) {
    if (mode === 'markdown') {
      this.dom.modeMarkdownLabel.className =
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition bg-white text-rose-600 shadow-sm';
      this.dom.modeHeadersLabel.className =
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition text-slate-600 hover:text-slate-900';
      this.dom.outputLabel.innerHTML =
        '<i class="fa-solid fa-file-code text-rose-500 text-sm"></i> <span>Markdown (.md) Content</span>';
    } else {
      this.dom.modeHeadersLabel.className =
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition bg-white text-rose-600 shadow-sm';
      this.dom.modeMarkdownLabel.className =
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition text-slate-600 hover:text-slate-900';
      this.dom.outputLabel.innerHTML =
        '<i class="fa-solid fa-heading text-rose-500 text-sm"></i> <span>Headers Extraction Output</span>';
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

  async processPdf(file) {
    this.dom.dropZone.classList.add('hidden');
    this.dom.output.classList.remove('hidden');

    this.dom.output.textContent = 'Reading file...';
    this.dom.copyBtn.classList.add('hidden');
    this.dom.downloadBtn.classList.add('hidden');

    this.setStatus('loading', 'Parsing...');

    this.dom.fileBadge.classList.remove('hidden');
    this.dom.fileBadge.classList.add('flex');
    this.dom.fileNameDisplay.textContent = file.name;

    const mode = this.getSelectedMode();

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          this.dom.output.textContent = 'Parsing PDF document structure...';
          const typedarray = new Uint8Array(reader.result);

          if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js library is not loaded.');
          }

          const pdfDoc = await pdfjsLib.getDocument({ data: typedarray }).promise;

          this.dom.pagesBadge.classList.remove('hidden');
          this.dom.pagesBadge.classList.add('flex');
          this.dom.pageCountDisplay.textContent = `${pdfDoc.numPages} ${
            pdfDoc.numPages === 1 ? 'Page' : 'Pages'
          }`;

          if (mode === 'headers') {
            await this.extractHeadersOnly(pdfDoc);
          } else {
            await this.extractAsMarkdown(pdfDoc, file.name);
          }

          this.dom.copyBtn.classList.remove('hidden');
          if (mode === 'markdown') this.dom.downloadBtn.classList.remove('hidden');

          this.setStatus('success', 'Completed');
          this.showToast(`Extracted ${file.name} successfully!`, 'success');
        } catch (err) {
          this.dom.output.textContent = 'PDF Processing Error: ' + err.message;
          this.setStatus('error', 'Error');
          this.showToast('Failed to process PDF: ' + err.message, 'error');
        }
      };

      reader.onerror = () => {
        this.dom.output.textContent = 'Failed to read local file.';
        this.setStatus('error', 'Error');
        this.showToast('Failed to read local file.', 'error');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      this.dom.output.textContent = 'Error: ' + error.message;
      this.setStatus('error', 'Error');
      this.showToast('Error: ' + error.message, 'error');
    }
  }

  async extractAsMarkdown(pdfDoc, fileName) {
    let mdLines = [];
    const documentTitle = fileName.replace(/\.pdf$/i, '');
    mdLines.push(`# ${documentTitle}\n`);

    const outline = await pdfDoc.getOutline().catch(() => null);
    if (outline && outline.length > 0) {
      mdLines.push(`## Table of Contents\n`);
      const processOutline = (items, indent = '') => {
        for (let item of items) {
          if (item.title) {
            mdLines.push(`${indent}- ${item.title.trim()}`);
          }
          if (item.items && item.items.length > 0) {
            processOutline(item.items, indent + '  ');
          }
        }
      };
      processOutline(outline);
      mdLines.push('\n---\n');
    }

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      this.dom.output.textContent = `Processing Page ${i} of ${pdfDoc.numPages}...`;
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items;
      const styles = textContent.styles || {};

      if (items.length === 0) continue;

      mdLines.push(`\n## Page ${i}\n`);

      let heights = items.map((item) => item.height || Math.abs(item.transform[3]));
      let avgHeight = heights.reduce((a, b) => a + b, 0) / (heights.length || 1);

      let linesMap = {};
      items.forEach((item) => {
        if (!item.str || !item.str.trim()) return;
        let y = Math.round(item.transform[5] / 4) * 4;
        if (!linesMap[y]) linesMap[y] = [];

        let fontName = item.fontName;
        let fontStyle = styles[fontName] || {};
        let isBold =
          (fontStyle.name && /bold|black|heavy/i.test(fontStyle.name)) ||
          (fontName && /bold|black|heavy/i.test(fontName));

        linesMap[y].push({
          str: item.str,
          height: item.height || Math.abs(item.transform[3]),
          isBold: isBold,
          x: item.transform[4]
        });
      });

      let sortedYs = Object.keys(linesMap)
        .map(Number)
        .sort((a, b) => b - a);

      for (let y of sortedYs) {
        let lineItems = linesMap[y].sort((a, b) => a.x - b.x);
        let lineText = lineItems.map((it) => it.str).join(' ').trim();
        let maxHeight = Math.max(...lineItems.map((it) => it.height));
        let hasBold = lineItems.some((it) => it.isBold);

        if (!lineText) continue;

        if (maxHeight > avgHeight * 1.4) {
          mdLines.push(`\n### ${lineText}\n`);
        } else if (
          maxHeight > avgHeight * 1.15 ||
          (hasBold && maxHeight >= avgHeight * 0.95 && lineText.length < 100)
        ) {
          mdLines.push(`\n#### ${lineText}\n`);
        } else if (hasBold) {
          if (/^[\bullet\-\*]/.test(lineText)) {
            mdLines.push(`- **${lineText.replace(/^[\bullet\-\*]\s*/, '')}**`);
          } else {
            mdLines.push(`**${lineText}**`);
          }
        } else {
          mdLines.push(lineText);
        }
      }
    }

    this.dom.output.textContent = mdLines.length > 0 ? mdLines.join('\n') : 'No content extracted.';
  }

  async extractHeadersOnly(pdfDoc) {
    let results = [];

    const outline = await pdfDoc.getOutline().catch(() => null);
    if (outline && outline.length > 0) {
      const extractOutlineTitles = (items) => {
        let titles = [];
        for (let item of items) {
          if (item.title) titles.push(item.title.trim());
          if (item.items && item.items.length > 0) {
            titles.push(...extractOutlineTitles(item.items));
          }
        }
        return titles;
      };
      results.push('--- OUTLINE TITLES ---');
      results.push(...extractOutlineTitles(outline));
    }

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      this.dom.output.textContent = `Checking headers on Page ${i} of ${pdfDoc.numPages}...`;
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items;
      const styles = textContent.styles || {};

      if (items.length === 0) continue;

      let heights = items.map((item) => item.height || Math.abs(item.transform[3]));
      let avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

      let linesMap = {};
      items.forEach((item) => {
        if (!item.str || !item.str.trim()) return;
        let y = Math.round(item.transform[5] / 4) * 4;
        if (!linesMap[y]) linesMap[y] = [];

        let fontName = item.fontName;
        let fontStyle = styles[fontName] || {};
        let isBold =
          (fontStyle.name && /bold|black|heavy/i.test(fontStyle.name)) ||
          (fontName && /bold|black|heavy/i.test(fontName));

        linesMap[y].push({
          str: item.str,
          height: item.height || Math.abs(item.transform[3]),
          isBold: isBold,
          x: item.transform[4]
        });
      });

      let sortedYs = Object.keys(linesMap)
        .map(Number)
        .sort((a, b) => b - a);
      let pageHeaders = [];

      for (let y of sortedYs) {
        let lineItems = linesMap[y].sort((a, b) => a.x - b.x);
        let lineText = lineItems.map((it) => it.str).join(' ').trim();
        let maxHeight = Math.max(...lineItems.map((it) => it.height));
        let hasBold = lineItems.some((it) => it.isBold);

        if (maxHeight > avgHeight * 1.1 || (hasBold && maxHeight >= avgHeight * 0.95 && lineText.length < 120)) {
          pageHeaders.push(lineText);
        }
      }

      let uniqueHeaders = [...new Set(pageHeaders)];
      if (uniqueHeaders.length > 0) {
        results.push(`--- Page ${i} ---`);
        results.push(...uniqueHeaders);
      }
    }

    this.dom.output.textContent = results.length > 0 ? results.join('\n') : 'No headers found.';
  }

  copyOutput() {
    const text = this.dom.output.textContent;
    navigator.clipboard.writeText(text).then(() => {
      this.dom.copyBtnText.textContent = 'Copied!';
      this.showToast('Copied content to clipboard!', 'success');
      setTimeout(() => {
        this.dom.copyBtnText.textContent = 'Copy';
      }, 2000);
    });
  }

  downloadMd() {
    const text = this.dom.output.textContent;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.currentFile
      ? `${this.currentFile.name.replace(/\.pdf$/i, '')}.md`
      : 'document.md';
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Downloaded .md document', 'success');
  }
}
