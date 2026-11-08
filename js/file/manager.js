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
    document.addEventListener("click", async (e) => {
      const targetBtn = e.target.closest(`#${"backupDataBtn"}`);
      if (!targetBtn) return;
      Toast.show("Preparing ZIP backup...", "info");
      try {
        await this.fileManager.service.downloadBackup();
        Toast.show("ZIP backup downloaded successfully!", "success");
      } catch (err) {
        Toast.show(`Failed to generate ZIP: ${err.message}`, "error");
      }
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
