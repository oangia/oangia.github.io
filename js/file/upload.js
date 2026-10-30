import { Toast } from "./toast.js";

export class FileUploadComponent {
  constructor(config = {}) {
    this.fbService = config.fbService;
    this.collections = config.collections || {};
    this.modalId = config.modalId || "fileModal";
    this.formId = config.formId || "createFileForm";
    this.fileInputId = config.fileInputId || "chunkFileInput";
    this.submitBtnId = config.submitBtnId || "submitFileBtn";
    this.openModalBtnId = config.openModalBtnId || "openCreateModalBtn";
    this.closeModalBtnId = config.closeModalBtnId || "closeFileModalBtn";
    this.cancelBtnId = config.cancelBtnId || "cancelFileBtn";
    
    // Callback function so it can notify FileManager to reload the folder when upload finishes
    this.onUploadComplete = config.onUploadComplete || (() => {});
    this.getCurrentFolderId = config.getCurrentFolderId || (() => "root");
  }

  initEvents() {
    // Modal toggle listeners
    document.getElementById(this.openModalBtnId)?.addEventListener("click", () => this.toggleModal(true));
    document.getElementById(this.closeModalBtnId)?.addEventListener("click", () => this.toggleModal(false));
    document.getElementById(this.cancelBtnId)?.addEventListener("click", () => this.toggleModal(false));

    // Form submit listener
    document.getElementById(this.formId)?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleUpload();
    });
  }

  toggleModal(show) {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.classList.toggle("hidden", !show);
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  generateThumbnail(base64Str, maxSize = 150) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
        else { w = Math.round((w * maxSize) / h); h = maxSize; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = () => resolve("");
    });
  }

  setButtonProgress(isUploading, text) {
    const btn = document.getElementById(this.submitBtnId) || document.querySelector(`#${this.formId} button[type='submit']`);
    if (btn) {
      btn.disabled = isUploading;
      btn.textContent = text;
    }
  }

  async handleUpload() {
    const fileInput = document.getElementById(this.fileInputId);
    const files = fileInput?.files;
    if (!files || files.length === 0) return;

    const currentFolderId = this.getCurrentFolderId();
    this.setButtonProgress(true, `Uploading (1/${files.length})...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64Data = await this.readFileAsDataURL(file);
        let thumbnail = "";
        if (file.type.startsWith("image/")) {
          thumbnail = await this.generateThumbnail(base64Data, 150);
        }

        const CHUNK_SIZE = 700000;
        const totalParts = Math.ceil(base64Data.length / CHUNK_SIZE);
        const fileId = "file_" + Date.now() + "_" + i;

        await this.fbService.create(this.collections.items, {
          fileId,
          title: file.name,
          isFolder: false,
          category: file.type.startsWith("image/") ? "Image" : "Media",
          parentId: currentFolderId,
          totalParts,
          thumbnail
        });

        for (let c = 0; c < totalParts; c++) {
          const chunkData = base64Data.substring(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
          await this.fbService.create(this.collections.fileChunks, { fileId, partIndex: c, chunkData });
        }

        Toast.show(`Uploaded: ${file.name}`, "success");
      } catch (err) {
        Toast.show(`Failed to upload ${file.name}: ${err.message}`, "error");
      }
    }

    this.setButtonProgress(false, "Upload File");
    this.toggleModal(false);
    if (fileInput) fileInput.value = "";
    
    // Trigger folder reload callback
    this.onUploadComplete();
  }
}
