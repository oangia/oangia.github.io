export class FileBackup {
  constructor(fbService, collections, btnId) {
    this.fbService = fbService;
    this.collections = collections;
    document.addEventListener("click", async (e) => {
      const targetBtn = e.target.closest(`#${btnId}`);
      if (!targetBtn) return;

      Toast.show("Preparing ZIP backup...", "info");
      try {
        await this.downloadBackup();
        Toast.show("ZIP backup downloaded successfully!", "success");
      } catch (err) {
        Toast.show(`Failed to generate ZIP: ${err.message}`, "error");
      }
    });
  }

  async generateZipBlob() {
    let items = [], file_chunks = [];
    items = await this.fbService.getAll(this.collections.items);
    file_chunks = await this.fbService.getAll(this.collections.fileChunks);
    if (typeof JSZip === 'undefined') {
      throw new Error("JSZip is not loaded or defined in the global scope.");
    }
    const zip = new JSZip();
    const folders = items.filter(i => i.isFolder);
    const files = items.filter(i => !i.isFolder);

    const getFolderPath = (parentId) => {
      let pathParts = [];
      let currentId = parentId;
      while (currentId && currentId !== "root") {
        const folder = folders.find(f => f.id === currentId);
        if (folder) {
          pathParts.unshift(folder.title || folder.name);
          currentId = folder.parentId;
        } else {
          break;
        }
      }
      return pathParts.join("/");
    };

    for (const fileRecord of files) {
      const chunks = file_chunks
        .filter(c => c.fileId === fileRecord.fileId)
        .sort((a, b) => a.partIndex - b.partIndex);

      const fullBase64 = chunks.map(c => c.chunkData).join("");
      const base64Data = fullBase64.split(',')[1];
      if (!base64Data) continue;

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const folderPath = getFolderPath(fileRecord.parentId);
      const filePath = folderPath ? `${folderPath}/${fileRecord.title}` : fileRecord.title;
      console.log(bytes);
      zip.file(filePath, bytes);
    }
    console.log("Generating ZIP as uint8array...");
    // Generate as uint8array instead of blob to avoid frame/sandbox blob builder issues
    const uint8ArrayData = await zip.generateAsync({ type: "uint8array" });
    
    // Manually create the Blob from the raw array
    const content = new Blob([uint8ArrayData], { type: "application/zip" });
    console.log("ZIP blob successfully created manually:", content);
    return content;
  }

  async downloadBackup() {
    console.log("before");
    const content = await this.generateZipBlob();
    console.log("content");
    console.log(content);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(content);
    downloadAnchor.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
