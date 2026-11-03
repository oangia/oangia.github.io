import { FileManager } from "./file.js";
import { FileManagerFirebase } from "./service.js";

export class FileManagerWrapper {
  constructor(config = {}) {
    this.fbService = config.fbService;
    this.containerId = config.containerId || "fileManagerApp";

    this.collections = {
      items: config.filesCollection || "files",
      fileChunks: config.fileChunksCollection || "file_chunks"
    };

    // 1. Firebase service
    this.firebase = new FileManagerFirebase(this.fbService, this.collections);

    // 2. FileManager (owns everything: UI, actions, backup, load…)
    this.fileManager = new FileManager({
      containerId: this.containerId,
      firebaseService: this.firebase
    });
    this.backupManager = new FileBackup(
      this.fbService,
      this.collections,
      "backupDataBtn"
    );
  }

  /** Only public method you need */
  init() {
    this.fileManager.init();
  }

  switch(collections) {
    this.collections = {
      items: collections.items || this.collections.items,
      fileChunks: collections.fileChunks || this.collections.fileChunks
    };
    this.fileManager.switch(this.collections);
    this.backupManager.switch(this.collections);
  }
}
