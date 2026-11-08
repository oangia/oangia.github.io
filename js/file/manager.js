import { FileManager } from "./file.js";
import { FileManagerFirebase } from "./service.js";

export class FileManagerWrapper {
  constructor(config = {}) {
    this.fbService = config.fbService;
    this.collections = {
      items: config.filesCollection || "files",
      fileChunks: config.fileChunksCollection || "file_chunks"
    };
    // 1. Firebase service
    this.service = new FileManagerFirebase(this.fbService, this.collections);
    // 2. FileManager (owns everything: UI, actions, backup, load…)
    this.fileManager = new FileManager({
      containerId: config.containerId,
      service: this.service
    });
  }

  /** Only public method you need */
  init() {
    this.fileManager.init();
  }

  switch(collections) {
    this.fileManager.switch(collections);
  }
}
