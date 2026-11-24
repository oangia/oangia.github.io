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

    FileRecord.setServiceChangeHandler(() => this.action("refresh"));
    this.action("refresh");
  }

  action(actionName, ...args) {
    switch (actionName) {
      case "refresh": return this.listFiles();
      case "listFiles": return this.listFiles();
      case "navigate": return this.navigate(args[0]);
      case "jumpBreadcrumb": return this.breadcrumb.jumpToBreadcrumb(args[0]);
      case "openPreview": return this.openPreview(args[0]);
      case "closePreview": return this.filePreview.close();
      case "cancelEdit": return this.cancelEdit();
      case "saveEditedText": return this.saveEditedText(args[0]);
      case "computeHashes": return this.computeHashes(args[0]);
      case "switchHtmlView": return this.filePreview.switchHtmlView(args[0]);
      case "loadPreviewMedia": return this.loadPreviewMedia(args[0], args[1]);
      case "createFolder": return this.createFolder(args[0]);
      case "openFolderModal": return this.createFolderModal.open();
      case "closeFolderModal": return this.createFolderModal.close();
      case "toggleActionsMenu": return this.toggleActionsMenu();
      case "closeActionsMenu": return this.closeActionsMenu();
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
      const { data, errors } = await FileRecord.allFromServices(this.breadcrumb.path);
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
          ? await this.compareFolderCopies(group)
          : await FileRecord.compareCopies(group.files);
      } catch (error) {
        const type = group.isFolderNode() ? "folder" : "file";
        console.error(`Failed to compare matching ${type} "${group.getDisplayName()}":`, error);
        group.comparisonStatus = "Could not compare";
      }
    }
  }

  async compareFolderCopies(group) {
    const services = new Map(
      FileRecord.getStorageServices().map(service => [service.name, service])
    );
    const trees = await Promise.all(group.files.map(async folder => {
      const service = services.get(folder.getStorageName());
      if (!service) throw new Error(`Storage service not found: ${folder.getStorageName()}`);

      const rootPath = folder.getFullPath().replace(/^\/+|\/+$/g, "");
      const items = new Map();
      const visitedFolders = new Set();
      const collect = async path => {
        const cleanPath = path.replace(/^\/+|\/+$/g, "");
        if (visitedFolders.has(cleanPath)) return;
        visitedFolders.add(cleanPath);

        const { data, error } = await FileRecord.all(cleanPath, {}, service.storage, service.name);
        if (error) throw error;

        for (const item of data) {
          const itemPath = item.getFullPath().replace(/^\/+|\/+$/g, "");
          const relativePath = itemPath.slice(rootPath.length).replace(/^\/+/, "");
          items.set(relativePath, item);
          if (item.isFolderNode()) await collect(itemPath);
        }
      };

      await collect(rootPath);
      return items;
    }));

    const paths = new Set(trees.flatMap(tree => Array.from(tree.keys())));
    for (const path of paths) {
      const copies = trees.map(tree => tree.get(path));
      if (copies.some(copy => !copy)
        || new Set(copies.map(copy => copy.isFolderNode())).size > 1) {
        return "Different files";
      }

      if (!copies[0].isFolderNode()) {
        const status = await FileRecord.compareCopies(copies);
        if (status !== "Synced") return status;
      }
    }

    return "Synced";
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

  toggleActionsMenu() {
    document.getElementById("actionsMenuToggleBtn")?.classList.toggle("hidden");
  }

  closeActionsMenu() {
    document.getElementById("actionsMenuToggleBtn")?.classList.add("hidden");
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
      const response = await file.fetchContent(60);
      const blob = await response.blob();
      file._byteLength = blob.size;
      await this.filePreview.renderPreview(file, blob);
    } catch (error) {
      console.error("Preview failed:", error);
      this.filePreview.showPreviewError();
      showToast(error.message || "Preview failed", "error");
    }
  }

  closePreview() {
    this.filePreview.close();
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
      await file.hashContent(url);
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
      await file.loadPreviewMedia(element);
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
      const response = await file.fetchContent();
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
    const btn = document.getElementById("backupBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Backing up...</span>';
    }
    
    await FileRecord.backup();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-box-archive"></i> <span>Backup</span>';
    }
  }

  async backupGitHubRepo() {
    const btn = document.getElementById("backupGitHubBtn");
    const originalContent = btn?.innerHTML;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2.5"></i><span>Backing up repo...</span>';
    }

    try {
      const drive = FileRecord.getStorage();
      if (!drive.token) throw new Error("Connect Google Drive before backing up the repository.");

      const requestGitHubJson = async (url) => {
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

      const zip = new JSZip();
      for (let offset = 0; offset < files.length; offset += 5) {
        const batch = files.slice(offset, offset + 5);
        const blobs = await Promise.all(batch.map(entry => requestGitHubJson(`${apiBase}/git/blobs/${entry.sha}`)));

        blobs.forEach((blob, index) => {
          if (blob.encoding !== "base64" || typeof blob.content !== "string") {
            throw new Error(`GitHub returned unsupported content for "${batch[index].path}".`);
          }
          const binary = atob(blob.content.replace(/\s/g, ""));
          const content = new Uint8Array(binary.length);
          for (let byte = 0; byte < binary.length; byte++) {
            content[byte] = binary.charCodeAt(byte);
          }
          zip.file(`oangia.github.io-main/${batch[index].path}`, content);
        });

        if (btn) {
          btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2.5"></i><span>Backing up ${Math.min(offset + batch.length, files.length)} / ${files.length}...</span>`;
        }
      }

      const archive = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      const filename = "oangia.github.io-main.zip";
      const archiveFile = new File([archive], filename, { type: "application/zip" });
      const drivePath = `GitHub Backups/oangia.github.io/${filename}`;
      const { error } = await drive.upload(drivePath, archiveFile, { upsert: true });
      if (error) throw error;

      showToast(`Repository backup saved to Drive: ${filename}`, "success", 5000);
    } catch (error) {
      console.error("GitHub repository backup failed:", error);
      showToast(error.message || "GitHub repository backup failed", "error", 5000);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    }
  }

  updateSyncProgress(status, current, completed, total, summary, done = false) {
    const panel = document.getElementById("syncProgressPanel");
    const statusEl = document.getElementById("syncProgressStatus");
    const currentEl = document.getElementById("syncProgressCurrent");
    const countEl = document.getElementById("syncProgressCount");
    const summaryEl = document.getElementById("syncProgressSummary");
    const progressBar = document.getElementById("syncProgressBar");
    if (!panel || !statusEl || !currentEl || !countEl || !summaryEl || !progressBar) return;

    panel.classList.remove("hidden");
    statusEl.textContent = status;
    currentEl.textContent = current;
    currentEl.title = current;
    countEl.textContent = `${completed} / ${total}`;
    summaryEl.textContent = summary;
    const percent = total > 0 ? Math.min(100, Math.round(completed / total * 100)) : done ? 100 : 0;
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", String(percent));
  }

  async compareSyncCopy({ id, size, isEditable }, path, existing, drive, supabase) {
    if (!existing) return { matches: false };
    const normalizePath = value => String(value || "").replace(/^\/+|\/+$/g, "");
    if (normalizePath(path) !== normalizePath(existing.id || path)
      || Number(size) !== Number(existing.size)) {
      return { matches: false };
    }
    if (!isEditable) return { matches: true };

    try {
      const driveRecord = new FileRecord({
        id,
        full_path: path,
        storageService: drive,
        storageName: "Google Drive"
      });
      if (!driveRecord.getHashContent()) await driveRecord.fetchContent();

      const supabaseRecord = new FileRecord({
        id: existing.id,
        name: existing.name,
        full_path: path,
        size: existing.size,
        mime_type: existing.mimeType,
        storageService: supabase,
        storageName: "Supabase"
      });
      if (!supabaseRecord.getHashContent()) await supabaseRecord.fetchContent();

      return {
        matches: driveRecord.getHashContent() === supabaseRecord.getHashContent()
      };
    } catch (comparisonError) {
      return { matches: false, comparisonError };
    }
  }

  async syncFileToSupabase(file) {
    const services = FileRecord.getStorageServices();
    const drive = services.find(service => service.name === "Google Drive")?.storage;
    const supabase = services.find(service => service.name === "Supabase")?.storage;

    if (!drive?.token || !supabase?.client) {
      showToast("Connect Google Drive and configure Supabase before syncing", "warning");
      return;
    }
    if (!file || file.isFolderNode() || file.getStorageName() !== "Google Drive") {
      showToast("Select a Google Drive file to sync", "warning");
      return;
    }

    const path = file.getFullPath();
    try {
      this.updateSyncProgress("Checking Supabase copy", path, 0, 1, "Comparing path and size");
      const { data: existing, error: existingError } = await supabase.getByPath(path);
      if (existingError && existingError.message !== "File not found") throw existingError;

      const comparison = await this.compareSyncCopy(
        {
          id: file.getId(),
          size: file.getSize(),
          isEditable: file.isEditable()
        },
        path,
        existing,
        drive,
        supabase
      );
      if (comparison.comparisonError) {
        console.warn(`Could not compare ${path}; replacing the Supabase copy:`, comparison.comparisonError);
      }

      if (comparison.matches) {
        this.updateSyncProgress("Sync complete", path, 1, 1, "Already up to date", true);
        showToast(`${file.getDisplayName()} is already up to date`, "info");
        return;
      }

      this.updateSyncProgress("Syncing file to Supabase", path, 0, 1, "Downloading from Google Drive");
      const response = await file.fetchContent();
      const blob = await response.blob();

      this.updateSyncProgress("Syncing file to Supabase", path, 0, 1, "Uploading to Supabase");
      const uploadFile = new File([blob], file.getName(), {
        type: file.getMimeType() || blob.type || "application/octet-stream"
      });
      const supabaseRecord = new FileRecord({
        name: file.getName(),
        full_path: path,
        storageService: supabase,
        storageName: "Supabase"
      });
      await supabaseRecord.save(uploadFile);

      this.updateSyncProgress("Sync complete", path, 1, 1, "File copied to Supabase", true);
      showToast(`${file.getDisplayName()} synced to Supabase`, "success");
    } catch (error) {
      console.error(`Failed to sync ${path} to Supabase:`, error);
      this.updateSyncProgress("Sync failed", path, 0, 1, error.message || "Failed to sync file", true);
      showToast(`Failed to sync ${file.getDisplayName()}: ${error.message || "Unknown error"}`, "error");
    }
  }

  async syncDriveToSupabase() {
    const services = FileRecord.getStorageServices();
    const drive = services.find(service => service.name === "Google Drive")?.storage;
    const supabase = services.find(service => service.name === "Supabase")?.storage;
    const button = document.getElementById("syncToSupabaseBtn");
    const originalButtonContent = button?.innerHTML;

    if (!drive?.token || !supabase?.client) {
      showToast("Connect Google Drive and configure Supabase before syncing", "warning");
      return;
    }
    if (!confirm("Sync Google Drive to Supabase? Files in Supabase that are not in Drive will be deleted.")) {
      return;
    }

    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2.5 w-4"></i><span>Syncing...</span>';
    }

    let completedWork = 0;
    let totalWork = 0;
    this.updateSyncProgress("Preparing sync", "Scanning Google Drive...", 0, 0, "In progress");

    try {
      const files = [];
      const emptyFolders = [];
      const collectFiles = async (path = "") => {
        this.updateSyncProgress("Scanning Google Drive", path || "/", 0, 0, "Building file list");
        const { data, error } = await drive.list(path, { limit: 1000 });
        if (error) throw error;

        const entries = data || [];
        if (path && entries.length === 0) emptyFolders.push(path);

        for (const entry of entries) {
          const entryPath = path ? `${path}/${entry.name}` : entry.name;
          if (entry.mimeType === "application/vnd.google-apps.folder") {
            await collectFiles(entryPath);
          } else {
            files.push({ entry, path: entryPath });
          }
        }
      };

      await collectFiles();
      const drivePaths = new Set(files.map(file => file.path));
      for (const folderPath of emptyFolders) {
        drivePaths.add(`${folderPath}/.emptyFolderPlaceholder`);
      }

      const supabaseFiles = new Map();
      const collectSupabaseFiles = async (path = "") => {
        this.updateSyncProgress("Scanning Supabase", path || "/", 0, 0, "Building file list");
        let offset = 0;
        while (true) {
          const { data, error } = await supabase.list(path, { limit: 1000, offset });
          if (error) throw error;

          const entries = data || [];
          for (const entry of entries) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;
            if (entry.mimeType === "application/vnd.google-apps.folder") {
              await collectSupabaseFiles(entryPath);
            } else {
              supabaseFiles.set(entryPath, entry);
            }
          }

          if (entries.length < 1000) break;
          offset += entries.length;
        }
      };
      await collectSupabaseFiles();

      const orphanedPaths = [...supabaseFiles.keys()].filter(path => !drivePaths.has(path));
      totalWork = files.length + emptyFolders.length + orphanedPaths.length;

      let synced = 0;
      let skipped = 0;
      let failed = 0;
      const uploadFile = async (path, name, mimeType, blob) => {
        const file = new File([blob], name, {
          type: mimeType || blob.type || "application/octet-stream"
        });
        const record = new FileRecord({
          name,
          full_path: path,
          storageService: supabase,
          storageName: "Supabase"
        });
        await record.save(file);
      };

      for (const { entry, path } of files) {
        const existing = supabaseFiles.get(path);
        this.updateSyncProgress(
          existing ? "Checking Supabase copy" : "Copying Drive file to Supabase",
          path,
          completedWork,
          totalWork,
          "In progress"
        );
        let itemFailed = false;
        let itemStatus = "Copied to Supabase";
        try {
          const editableFile = new FileEntity({
            name: entry.name,
            full_path: path,
            size: Number(entry.size || 0),
            mime_type: entry.mimeType
          });
          const comparison = await this.compareSyncCopy(
            {
              id: entry.id,
              size: entry.size,
              isEditable: editableFile.isEditable()
            },
            path,
            existing,
            drive,
            supabase
          );
          if (comparison.comparisonError) {
            console.warn(`Could not compare ${path}; replacing the Supabase copy:`, comparison.comparisonError);
          }

          if (comparison.matches) {
            skipped++;
            itemStatus = "Already up to date";
          } else {
            const driveRecord = FileRecord._fromDriveMetadata(
              entry,
              path,
              drive,
              "Google Drive"
            );
            const response = await driveRecord.fetchContent();
            const blob = await response.blob();
            await uploadFile(path, entry.name, entry.mimeType, blob);
            synced++;
          }
        } catch (error) {
          console.error(`Failed to sync ${path} to Supabase:`, error);
          failed++;
          itemFailed = true;
        }
        completedWork++;
        this.updateSyncProgress(
          itemFailed ? "Failed to copy file" : itemStatus,
          path,
          completedWork,
          totalWork,
          `${synced} copied · ${skipped} unchanged · ${failed} failed`
        );
      }

      for (const folderPath of emptyFolders) {
        this.updateSyncProgress("Creating empty folder in Supabase", folderPath, completedWork, totalWork, "In progress");
        let itemFailed = false;
        try {
          const placeholderPath = `${folderPath}/.emptyFolderPlaceholder`;
          await uploadFile(
            placeholderPath,
            ".emptyFolderPlaceholder",
            "application/octet-stream",
            new Blob([])
          );
          synced++;
        } catch (error) {
          console.error(`Failed to sync empty folder ${folderPath} to Supabase:`, error);
          failed++;
          itemFailed = true;
        }
        completedWork++;
        this.updateSyncProgress(
          itemFailed ? "Failed to create folder" : "Folder created in Supabase",
          folderPath,
          completedWork,
          totalWork,
          `${synced} copied · ${skipped} unchanged · ${failed} failed`
        );
      }

      let deleted = 0;
      let deleteFailed = 0;
      for (let index = 0; index < orphanedPaths.length; index += 100) {
        const batch = orphanedPaths.slice(index, index + 100);
        const current = batch.length === 1
          ? batch[0]
          : `${batch[0]} (+${batch.length - 1} more)`;
        this.updateSyncProgress("Removing Supabase-only files", current, completedWork, totalWork, "In progress");
        let batchFailed = false;
        try {
          const { error } = await supabase.remove(batch);
          if (error) throw error;
          deleted += batch.length;
        } catch (error) {
          console.error("Failed to remove Supabase-only files:", error);
          deleteFailed += batch.length;
          batchFailed = true;
        }
        completedWork += batch.length;
        this.updateSyncProgress(
          batchFailed ? "Failed to remove files" : "Removed Supabase-only files",
          current,
          completedWork,
          totalWork,
          `${deleted} removed · ${deleteFailed} failed`
        );
      }

      await this.action("refresh");
      if (failed === 0 && deleteFailed === 0) {
        this.updateSyncProgress(
          "Sync complete",
          `Copied ${synced}; skipped ${skipped} unchanged; removed ${deleted} Supabase-only`,
          completedWork,
          totalWork,
          "Complete",
          true
        );
        showToast(
          `Copied ${synced}, skipped ${skipped} unchanged, removed ${deleted} Supabase-only item(s)`,
          "success"
        );
      } else {
        this.updateSyncProgress(
          "Sync finished with errors",
          `Copied ${synced}; skipped ${skipped} unchanged; ${failed} sync failures; removed ${deleted}; ${deleteFailed} removal failures`,
          completedWork,
          totalWork,
          "Finished with errors",
          true
        );
        showToast(
          `Copied ${synced}, skipped ${skipped} unchanged; ${failed} sync failures, ${deleted} removed, ${deleteFailed} removals failed`,
          "warning",
          5000
        );
      }
    } catch (error) {
      console.error("Drive to Supabase sync failed:", error);
      this.updateSyncProgress("Sync stopped", error.message || "Failed to build a complete file list", completedWork, totalWork, "Stopped");
      showToast(error.message || "Drive to Supabase sync failed", "error", 5000);
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = originalButtonContent;
      }
    }
  }
}
