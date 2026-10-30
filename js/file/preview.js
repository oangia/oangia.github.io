export class FilePreviewComponent {
  constructor() {
    this.ensureDOM();
  }

  ensureDOM() {
    if (document.getElementById("viewModal")) return;
    const modalHTML = `
      <div id="viewModal" class="fixed inset-0 bg-slate-950 z-50 flex flex-col hidden">
        <div class="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center border-b border-slate-800 shrink-0">
          <h3 id="viewModalTitle" class="font-bold text-xs truncate">File Preview</h3>
          <button id="closeViewModalBtn" class="text-slate-400 hover:text-white text-sm px-2 py-1"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex-1 flex flex-col w-full h-full overflow-hidden p-2">
          <div id="viewContentContainer" class="bg-black border border-slate-900 rounded-lg flex-1 flex items-center justify-center overflow-auto relative">
            <i class="fa-solid fa-spinner fa-spin text-xl text-blue-500"></i>
          </div>
        </div>
        <div class="bg-slate-900 text-white px-4 py-2 flex justify-between items-center border-t border-slate-800 shrink-0">
          <span id="viewDate" class="text-[11px] text-slate-400"></span>
          <a id="downloadFileBtn" href="#" download="" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition">
            <i class="fa-solid fa-download"></i> Download
          </a>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  get elements() {
    return {
      modal: document.getElementById("viewModal"),
      title: document.getElementById("viewModalTitle"),
      content: document.getElementById("viewContentContainer"),
      downloadBtn: document.getElementById("downloadFileBtn"),
      date: document.getElementById("viewDate"),
      closeBtn: document.getElementById("closeViewModalBtn")
    };
  }

  initEvents() {
    this.elements.closeBtn?.addEventListener("click", () => this.hide());
  }

  showLoading(fileName) {
    const el = this.elements;
    if (el.title) el.title.textContent = fileName;
    if (el.date) el.date.innerHTML = `<i class="fa-regular fa-clock"></i> Recent`;
    if (el.content) {
      el.content.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i><p class="text-xs text-slate-500">Reassembling file chunks...</p>`;
    }
    el.modal?.classList.remove("hidden");
  }

  render(fileRecord, fullBase64) {
    const el = this.elements;
    if (!el.content) return;
    const fileNameLower = fileRecord.title.toLowerCase();

    if (fullBase64.startsWith("data:image/")) {
      el.content.innerHTML = `<img src="${fullBase64}" class="w-full h-full object-contain">`;
    } else if (fullBase64.startsWith("data:video/")) {
      el.content.innerHTML = `<video controls class="w-full h-full object-contain bg-black"><source src="${fullBase64}"></video>`;
    } else if (fileNameLower.endsWith(".mp3") || fileNameLower.endsWith(".wav") || fileNameLower.endsWith(".ogg") || fullBase64.startsWith("data:audio/")) {
      el.content.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full gap-4 p-6">
          <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl shadow-inner">
            <i class="fa-solid fa-music"></i>
          </div>
          <p class="text-sm font-medium text-slate-700 text-center truncate w-full">${fileRecord.title}</p>
          <audio controls class="w-full max-w-md">
            <source src="${fullBase64}">
            Your browser does not support the audio element.
          </audio>
        </div>
      `;
    } else if (fileNameLower.endsWith(".txt") || fullBase64.startsWith("data:text/plain")) {
      try {
        const base64Content = fullBase64.split(',')[1];
        const textContent = atob(base64Content);
        el.content.innerHTML = `<pre class="w-full h-full overflow-auto p-4 bg-slate-950 text-slate-100 text-xs font-mono whitespace-pre-wrap">${escapeHtml(textContent)}</pre>`;
      } catch (err) {
        el.content.innerHTML = `<p class="text-xs text-red-400">Failed to load text preview.</p>`;
      }
    } else if (fileNameLower.endsWith(".pdf") || fullBase64.startsWith("data:application/pdf")) {
      el.content.innerHTML = `<iframe src="${fullBase64}" class="w-full h-full border-0 bg-white"></iframe>`;
    } else {
      el.content.innerHTML = `<div class="text-center"><i class="fa-solid fa-file-arrow-down text-4xl text-blue-500 mb-2"></i><p class="text-xs font-semibold text-slate-300">${escapeHtml(fileRecord.title)}</p></div>`;
    }

    if (el.downloadBtn) {
      el.downloadBtn.href = fullBase64;
      el.downloadBtn.download = fileRecord.title;
    }
  }

  hide() {
    const el = this.elements;
    if (el.content) el.content.innerHTML = "";
    el.modal?.classList.add("hidden");
  }
}
