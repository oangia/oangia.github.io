class FileManager {
  constructor() {
    this.allItems = [];
    this.filteredItems = [];
    this.listRequestId = 0;
    this.currentFileRecord = null;
    
    this.breadcrumb = new BreadcrumbManager("breadcrumbNav", this);
    this.gridRenderer = new ItemsGridRenderer("itemsGrid", this);
    this.filePreview = new FilePreviewManager(this);
    this.createFolderModal = new CreateFolderModal(this);
    this.actionsMenu = new FileActionsMenu(this);
    this.syncProgress = new SyncProgressPanel();

    window.addEventListener("storage-services-changed", () => this.action("refresh"));
    this.action("refresh");
  }

  action(actionName, ...args) {
    switch (actionName) {
      case "refresh": return this.listFiles();
      case "listFiles": return this.listFiles();
      case "navigate": return this.navigate(args[0]);
      case "openPreview": return this.openPreview(args[0]);
      case "cancelEdit": return this.cancelEdit();
      case "saveEditedText": return this.saveEditedText(args[0]);
      case "computeHashes": return this.computeHashes(args[0]);
      case "loadPreviewMedia": return this.loadPreviewMedia(args[0], args[1]);
      case "createFolder": return this.createFolder(args[0]);
      case "upload": return this.handleFileUpload(args[0], args[1], args[2]);
      case "downloadRecord": return this.downloadRecord(args[0]);
      case "deleteRecord": return this.deleteRecord(args[0]);
      case "backup": return this.createBackup();
      case "backupGitHubRepo": return this.backupGitHubRepo();
      case "syncDriveToSupabase": return this.syncDriveToSupabase();
      case "syncFileToSupabase": return this.syncFileToSupabase(args[0]);
      default: throw new Error(`Unknown file-manager action: ${actionName}`);
    }
  }

  async listFiles() {
    const requestId = ++this.listRequestId;
    try {
      const { data, errors } = await FileRecord.getAllFromServices(this.breadcrumb.path);
      if (requestId !== this.listRequestId) return;
      errors.forEach(({ service, error }) => {
        console.error(`Failed to list ${service}:`, error);
        showToast(`${service}: ${error.message || "Failed to list files"}`, "error");
      });
      const groupedFiles = new Map();
      data.forEach(file => {
        const path = file.getFullPath().replace(/^\/+|\/+$/g, "");
        const key = `${file.isFolderNode() ? "folder" : "file"}:${path}`;
        const copies = groupedFiles.get(key) || [];
        copies.push(file);
        groupedFiles.set(key, copies);
      });
      this.allItems = Array.from(groupedFiles.values(), files => new FileGroup(files));
      this.renderView();
      await this.compareFiles(this.allItems);
      if (requestId === this.listRequestId) this.gridRenderer.updateComparisonStatuses();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to list files", "error");
    }
  }

  async compareFiles(groups) {
    for (const group of groups) {
      if (group.files.length === 1) {
        group.comparisonStatus = `Only in ${group.files[0].getStorageName()}`;
        continue;
      }
      try {
        group.comparisonStatus = group.isFolderNode()
          ? await FileRecord.getFolderCopyComparison(group.files)
          : await FileRecord.getCopyComparison(group.files);
      } catch (error) {
        const type = group.isFolderNode() ? "folder" : "file";
        console.error(`Failed to compare matching ${type} "${group.getDisplayName()}":`, error);
        group.comparisonStatus = "Could not compare";
      }
    }
  }

  renderView() {
    this.breadcrumb.render();

    const searchVal = document.getElementById("searchInput")?.value.toLowerCase() || "";
    this.filteredItems = searchVal
      ? this.allItems.filter(file => (file.getDisplayName() || file.getName()).toLowerCase().includes(searchVal))
      : [...this.allItems];

    this.filteredItems.sort((a, b) => {
      if (a.isFolderNode() !== b.isFolderNode()) {
        return a.isFolderNode() ? -1 : 1;
      }
      return a.getDisplayName().localeCompare(b.getDisplayName());
    });

    const label = document.getElementById("itemCountLabel");
    if (label) label.textContent = `${this.filteredItems.length} item${this.filteredItems.length !== 1 ? "s" : ""}`;

    const serviceLabel = document.getElementById("serviceStatusLabel");
    if (serviceLabel) {
      serviceLabel.textContent = FileRecord.getServiceStatuses().map(service =>
        `${service.name}: ${service.isAvailable ? "Connected" : "Not connected"}`
      ).join(" · ");
    }

    this.gridRenderer?.render(this.filteredItems);
  }

  async handleFileUpload(event, isFolderUpload = false, isEncrypted = false) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    showToast(`Uploading ${files.length} item(s) (${isEncrypted ? 'Encrypted' : 'Normal'})...`, "info", 2500);
    let success = 0, failed = 0;
    const currentPath = this.breadcrumb.path;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let targetPath = currentPath ? `${currentPath}/` : "";
        if (isFolderUpload && file.webkitRelativePath) {
          targetPath += file.webkitRelativePath;
        } else {
          targetPath += file.name;
        }

        const { error } = await FileRecord.create(targetPath, file, { encrypt: isEncrypted });
        if (error) throw error;

        success++;
        if ((i + 1) % 5 === 0 || i === files.length - 1) {
          showToast(`Uploaded ${i + 1} / ${files.length}`, "info", 1200);
        }
      } catch (err) {
        console.error(err);
        failed++;
        showToast(`Failed: ${file.name}`, "error", 2500);
      }
    }

    await this.action("refresh");
    if (failed === 0) {
      showToast(`Successfully uploaded ${success} item(s)`, "success");
    } else {
      showToast(`Uploaded ${success}, failed ${failed}`, "warning");
    }
    event.target.value = "";
  }

  navigate(file) {
    this.breadcrumb.navigateToFolder(file.getFullPath(), file.getName());
  }

  async openPreview(file) {
    this.currentFileRecord = file;
    this.filePreview.showLoading(file);
    try {
      const response = await file.getContent(60);
      const blob = await response.blob();
      file._byteLength = blob.size;
      await this.filePreview.renderPreview(file, blob);
    } catch (error) {
      console.error("Preview failed:", error);
      this.filePreview.showPreviewError();
      showToast(error.message || "Preview failed", "error");
    }
  }

  cancelEdit() {
    if (this.currentFileRecord) this.action("openPreview", this.currentFileRecord);
  }

  async saveEditedText(updatedContent) {
    if (!this.currentFileRecord) return;
    try {
      await this.currentFileRecord.save(new Blob([updatedContent], { type: "text/plain;charset=utf-8" }));
      showToast("Changes saved successfully", "success", 2000);
      await this.action("refresh");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save changes", "error", 2500);
    }
  }

  async computeHashes(url) {
    const file = this.currentFileRecord;
    if (!file) return;
    this.filePreview.showHashesLoading();

    try {
      await file.getHashContentFromUrl(url);
      if (!file.hash_content || !file.hash_file) {
        throw new Error("Hash computation returned empty results.");
      }
      this.filePreview.renderHashesResult({
        contentHash: file.hash_content,
        combinedHash: file.hash_file,
        rawCombinedString: escapeHtml(file.hash_filename + file.hash_content),
        byteLength: file._byteLength || "Unknown"
      });
    } catch (error) {
      console.error(error);
      this.filePreview.renderHashesError(error.message || "Unknown error");
    }
  }

  async loadPreviewMedia(file, element) {
    try {
      if (file.getUrl()?.startsWith("blob:")) {
        element.loading = "lazy";
        element.src = file.getUrl();
        return;
      }

      const content = await file.getContent();
      const blob = await content.blob();
      element.loading = "lazy";
      element.preload = "auto";
      element.src = URL.createObjectURL(blob);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Failed to load file preview:", error);
    }
  }

  async createFolder(name) {
    const currentPath = this.breadcrumb.path;
    const folderPath = currentPath
      ? `${currentPath}/${name}/.emptyFolderPlaceholder`
      : `${name}/.emptyFolderPlaceholder`;
    try {
      const { error } = await FileRecord.create(folderPath, new Blob([""]), { upsert: false });
      if (error) throw error;
      this.createFolderModal.close();
      showToast(`Folder "${name}" created`, "success");
      await this.action("refresh");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to create folder", "error");
    }
  }

  async downloadRecord(file) {
    try {
      const response = await file.getContent();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = file.getDisplayName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Download failed:", error);
      showToast(error.message || "Download failed", "error");
    }
  }

  async deleteRecord(file) {
    const path = file.getFullPath();
    const message = file.isFolderNode()
      ? `Delete folder "${path}" and all its contents from ${file.getStorageName()}?`
      : `Delete file "${path}" from ${file.getStorageName()}?`;
    if (!confirm(message)) return;

    try {
      await file.delete({ recursive: true });
      showToast("Deleted successfully", "success");
      await this.action("refresh");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Delete failed", "error");
    }
  }

  async createBackup() {
    const originalContent = this.actionsMenu.beginStorageBackup();
    try {
      await FileRecord.backup();
    } finally {
      this.actionsMenu.endStorageBackup(originalContent);
    }
  }

  async backupGitHubRepo() {
    const originalContent = this.actionsMenu.beginGitHubBackup();

    try {
      const drive = FileRecord.getServiceStatuses().find(service => service.name === "Google Drive");
      if (!drive?.isAvailable) throw new Error("Connect Google Drive before backing up the repository.");

      let uploadedFiles = 0;
      const requestGitHubJson = async url => {
        const response = await fetch(url, {
          headers: { Accept: "application/vnd.github+json" }
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `GitHub API request failed (${response.status}).`);
        }
        return response.json();
      };

      const apiBase = "https://api.github.com/repos/oangia/oangia.github.io";
      const tree = await requestGitHubJson(`${apiBase}/git/trees/main?recursive=1`);
      if (tree.truncated) {
        throw new Error("GitHub returned an incomplete repository file list.");
      }

      const files = tree.tree.filter(entry => entry.type === "blob");
      if (files.length === 0) throw new Error("The GitHub repository contains no files to back up.");
      const totalFiles = files.length;
      const onProgress = this.actionsMenu.updateGitHubBackup.bind(this.actionsMenu);
      onProgress({ uploadedFiles, totalFiles });

      for (let offset = 0; offset < files.length; offset += 5) {
        const batch = files.slice(offset, offset + 5);
        const blobs = await Promise.all(batch.map(entry =>
          requestGitHubJson(`${apiBase}/git/blobs/${entry.sha}`)
        ));

        for (let index = 0; index < blobs.length; index++) {
          const blob = blobs[index];
          if (blob.encoding !== "base64" || typeof blob.content !== "string") {
            throw new Error(`GitHub returned unsupported content for "${batch[index].path}".`);
          }

          const binary = atob(blob.content.replace(/\s/g, ""));
          const content = new Uint8Array(binary.length);
          for (let byte = 0; byte < binary.length; byte++) {
            content[byte] = binary.charCodeAt(byte);
          }

          const filename = batch[index].path.split("/").pop();
          const file = new File([content], filename, { type: "application/octet-stream" });
          const path = `GitHub Backups/${batch[index].path}`;
          const { error } = await FileRecord.create(path, file, { upsert: true });
          if (error) {
            throw new Error(`Could not upload "${batch[index].path}" to Google Drive: ${error.message}`);
          }
          uploadedFiles++;
          onProgress({ uploadedFiles, totalFiles });
        }
      }

      const progress = { uploadedFiles, totalFiles };
      showToast(`Repository backup saved to Drive: ${progress.uploadedFiles} file(s) in GitHub Backups`, "success", 5000);
    } catch (error) {
      console.error("GitHub repository backup failed:", error);
      const progress = this.actionsMenu.gitHubBackupProgress;
      const partialProgress = progress.totalFiles
        ? ` (${progress.uploadedFiles} of ${progress.totalFiles} files uploaded)`
        : "";
      showToast(`${error.message || "GitHub repository backup failed"}${partialProgress}`, "error", 5000);
    } finally {
      this.actionsMenu.endGitHubBackup(originalContent);
    }
  }

  async syncFileToSupabase(file) {
    try {
      const result = await FileRecord.syncFileToSupabase(
        file,
        this.syncProgress.update.bind(this.syncProgress)
      );
      if (result.status === "unavailable") {
        showToast("Connect Google Drive and configure Supabase before syncing", "warning");
      } else if (result.status === "invalid-selection") {
        showToast("Select a Google Drive file to sync", "warning");
      } else if (result.status === "up-to-date") {
        showToast(`${file.getDisplayName()} is already up to date`, "info");
      } else {
        showToast(`${file.getDisplayName()} synced to Supabase`, "success");
      }
    } catch (error) {
      const path = file?.getFullPath?.() || "";
      console.error(`Failed to sync ${path} to Supabase:`, error);
      this.syncProgress.update("Sync failed", path, 0, 1, error.message || "Failed to sync file", true);
      showToast(`Failed to sync ${file.getDisplayName()}: ${error.message || "Unknown error"}`, "error");
    }
  }

  async syncDriveToSupabase() {
    const statuses = new Map(FileRecord.getServiceStatuses().map(service => [service.name, service.isAvailable]));
    if (!statuses.get("Google Drive") || !statuses.get("Supabase")) {
      showToast("Connect Google Drive and configure Supabase before syncing", "warning");
      return;
    }
    if (!confirm("Sync Google Drive to Supabase? Files in Supabase that are not in Drive will be deleted.")) {
      return;
    }

    const originalButtonContent = this.actionsMenu.beginDriveSync();

    try {
      const result = await FileRecord.syncDriveToSupabase(
        this.syncProgress.update.bind(this.syncProgress)
      );
      await this.action("refresh");
      if (result.failed === 0 && result.deleteFailed === 0) {
        this.syncProgress.update(
          "Sync complete",
          `Copied ${result.synced}; skipped ${result.skipped} unchanged; removed ${result.deleted} Supabase-only`,
          result.completedWork,
          result.totalWork,
          "Complete",
          true
        );
        showToast(
          `Copied ${result.synced}, skipped ${result.skipped} unchanged, removed ${result.deleted} Supabase-only item(s)`,
          "success"
        );
      } else {
        this.syncProgress.update(
          "Sync finished with errors",
          `Copied ${result.synced}; skipped ${result.skipped} unchanged; ${result.failed} sync failures; removed ${result.deleted}; ${result.deleteFailed} removal failures`,
          result.completedWork,
          result.totalWork,
          "Finished with errors",
          true
        );
        showToast(
          `Copied ${result.synced}, skipped ${result.skipped} unchanged; ${result.failed} sync failures, ${result.deleted} removed, ${result.deleteFailed} removals failed`,
          "warning",
          5000
        );
      }
    } catch (error) {
      console.error("Drive to Supabase sync failed:", error);
      this.syncProgress.update("Sync stopped", error.message || "Failed to build a complete file list", 0, 0, "Stopped", true);
      showToast(error.message || "Drive to Supabase sync failed", "error", 5000);
    } finally {
      this.actionsMenu.endDriveSync(originalButtonContent);
    }
  }
}
