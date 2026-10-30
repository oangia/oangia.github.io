// file-manager.js
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export { ToastManager } from "./file/toast.js";
export { FilePreviewComponent } from "./file/preview.js";
export { FileManager } from "./file/file-manager.js";
