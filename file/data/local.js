class LocalFileService extends BaseStorageService {
  constructor(config = {}) {
    super(config);
    this.files = null;
    const folderButtonId = config.folderButtonId || "selectFolderBtn";
    const button = document.getElementById(folderButtonId);
    if (!button || button.dataset.localDriveBound) return this;

    button.dataset.localDriveBound = "true";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.webkitdirectory = true;
    fileInput.multiple = true;
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.onchange = event => {
      this.files = event.target.files;
      this.onConnectionChange(this.files);
    };

    button.onclick = () => fileInput.click();
  }

  async load() {
    return { data: this.files, error: null };
  }

  async fetchContent({ id } = {}) {
    if (!(id instanceof Blob)) {
      return { data: null, error: new Error("A local File is required to fetch content") };
    }
    return { data: new Response(id), error: null };
  }
}
