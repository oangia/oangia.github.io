class Theme {
  /* ---------- Connection Status ---------- */
  static getStatusDotClasses(status) {
    if (status === true) return "w-2 h-2 rounded-full bg-emerald-500";
    if (status === false) return "w-2 h-2 rounded-full bg-rose-500";
    return "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
  }

  static getHashesResultHTML({ contentHash, combinedHash, rawCombinedString, byteLength }) {
    return `
      <div class="space-y-4">
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">2. Content Hash</span>
            <button onclick="navigator.clipboard.writeText('${contentHash}'); showToast('Content hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
          </div>
          <div>
            <span class="text-[10px] wire-subtext block mb-0.5">Hashed input: <code class="bg-black/40 text-indigo-200 px-1 py-0.5 rounded wire-border">ArrayBuffer (${byteLength} bytes)</code></span>
            <div class="font-mono text-[10px] bg-slate-950/90 text-slate-200 p-2 rounded wire-border break-all select-all">${contentHash}</div>
          </div>
        </div>
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">3. Combined Hash</span>
            <button onclick="navigator.clipboard.writeText('${combinedHash}'); showToast('Combined hash copied', 'success', 1500);" class="text-[11px] wire-subtext hover:wire-text"><i class="fa-regular fa-copy"></i> Copy Hash</button>
          </div>
          <div>
            <span class="text-[10px] wire-subtext block mb-0.5">Exact concatenated string hashed:</span>
            <div class="font-mono text-[9px] bg-black/40 wire-subtext p-1.5 rounded wire-border break-all select-all max-h-14 overflow-y-auto mb-1">${escapeHtml(rawCombinedString)}</div>
            <div class="font-mono text-[10px] bg-slate-950/90 text-emerald-400 p-2 rounded wire-border break-all select-all">${combinedHash}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  static getHashesErrorHTML(message) {
    return `<div class="text-xs text-rose-400 p-2 bg-rose-950/60 wire-border rounded">Failed to compute hashes: ${escapeHtml(message)}</div>`;
  }
}
