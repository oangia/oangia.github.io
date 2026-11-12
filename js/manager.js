import { FileManager } from "./file.js";
import { FileManagerFirebase } from "./service.js";

export class FileManagerWrapper {
  constructor(config = {}) {
    this.fileManager = new FileManager({
      containerId: config.containerId,
      service: new FileManagerFirebase(config.fbService, {
        items: config.filesCollection || "files",
        fileChunks: config.fileChunksCollection || "file_chunks"
      })
    });
  }

  /** Only public method you need */
  init() {
    this.fileManager.init();
  }
}
