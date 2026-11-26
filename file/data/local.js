class LocalFileService extends BaseStorageService {
  constructor(btnId) {
    //super();
    this.files = null;
    const button = document.getElementById(btnId);
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
      console.log(this.files);
      this.onConnectionChange(this.files);
    };

    button.onclick = () => fileInput.click();
  }

  async load() {
    return { data: this.files, error: null };
  }

  isAvailable() { return Boolean(this.files?.length); }

  async fetchContent({ id } = {}) {
    if (!(id instanceof Blob)) {
      return { data: null, error: new Error("A local File is required to fetch content") };
    }
    return { data: new Response(id), error: null };
  }
}
