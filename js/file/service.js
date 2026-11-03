export class FileManagerFirebase {
  constructor(fbService, collections = {}) {
    this.fbService = fbService;
    this.collections = {
      items: collections.items || "files",
      fileChunks: collections.fileChunks || "file_chunks"
    };
  }

  switch(collections) {
    this.collections = {
      items: collections.items || this.collections.items,
      fileChunks: collections.fileChunks || this.collections.fileChunks
    };
  }

  // ---------- READ ----------
  async getFolderContents(folderId = "root") {
    const items = await this.fbService.getByField(
      this.collections.items,
      "parentId",
      folderId
    );

    const folders = items.filter(item => item.isFolder === true);
    const files = items.filter(item => !item.isFolder);

    let currentFolderName = "Home";
    if (folderId !== "root") {
      const folder = await this.fbService.getById(this.collections.items, folderId);
      if (folder) currentFolderName = folder.title || folder.name || "Untitled";
    }

    return { folders, files, currentFolderName };
  }

  async getFileRecord(id) {
    return this.fbService.getById(this.collections.items, id);
  }

  async getFileChunks(fileId) {
    const chunks = await this.fbService.getByField(
      this.collections.fileChunks,
      "fileId",
      fileId
    );
    return chunks.sort((a, b) => a.partIndex - b.partIndex);
  }

  async getFullBase64(fileId) {
    const chunks = await this.getFileChunks(fileId);
    return chunks.map(c => c.chunkData).join("");
  }

  // ---------- WRITE ----------
  async createFolder(name, parentId = "root") {
    return this.fbService.create(this.collections.items, {
      title: name,
      isFolder: true,
      parentId
    });
  }

  async uploadFile(file, parentId = "root", onProgress) {
    return this.fbService.uploadFile(
      this.collections,
      parentId,
      file,
      onProgress
    );
  }

  async deleteFolder(id) {
    return this.fbService.delete(this.collections.items, id);
  }

  async deleteFile(id, fileId) {
    await this.fbService.delete(this.collections.items, id);

    const chunks = await this.getFileChunks(fileId);
    for (const chunk of chunks) {
      await this.fbService.delete(this.collections.fileChunks, chunk.id);
    }
  }
}
