import { BaseWidget } from './BaseWidget.js';

export class GithubWidget extends BaseWidget {
  constructor(options = {}) {
    super(options);
    this.jszipUrl = options.jszipUrl || 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    this.fontAwesomeUrl = options.fontAwesomeUrl || 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    this.interFontUrl = options.interFontUrl || 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';

    this.currentRepoData = { owner: '', repo: '', branch: '', token: '', files: [] };
    this.selectedFile = null;

    this.init();
  }

  init() {
    this.loadDependencies();
    this.createUI();
    this.cacheDomReferences();
    this.bindEvents();
    this.checkSavedToken();
  }

  loadDependencies() {
    if (!document.getElementById('github-widget-font')) {
      const link = document.createElement('link');
      link.id = 'github-widget-font';
      link.rel = 'stylesheet';
      link.href = this.interFontUrl;
      document.head.appendChild(link);
    }

    if (!document.getElementById('github-widget-fa')) {
      const link = document.createElement('link');
      link.id = 'github-widget-fa';
      link.rel = 'stylesheet';
      link.href = this.fontAwesomeUrl;
      document.head.appendChild(link);
    }

    if (typeof JSZip === 'undefined' && !document.getElementById('github-widget-jszip')) {
      const script = document.createElement('script');
      script.id = 'github-widget-jszip';
      script.src = this.jszipUrl;
      document.head.appendChild(script);
    }
  }

  createUI() {
    // 1. Floating Trigger Button (managed inside the BaseWidget vertical stack wrapper)
    this.floatBtn = document.createElement('button');
    this.floatBtn.type = 'button';
    this.floatBtn.ariaLabel = 'Open GitHub File Manager';
    this.floatBtn.className =
      'w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-all duration-200 hover:scale-105';
    this.floatBtn.innerHTML = `<i class="fa-brands fa-github text-2xl"></i>`;

    // 2. Modal Container
    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center z-50 p-4 md:p-6 font-sans';

    this.modal.innerHTML = `
      <div class="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden">
        <!-- Main Workspace Area -->
        <div class="flex-1 overflow-hidden p-4 md:p-6 flex flex-col gap-5 max-w-7xl mx-auto w-full">
            
            <!-- Input Form Card -->
            <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl shrink-0">
                <form id="gw-repo-form" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div class="md:col-span-2">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">GitHub Repository Link</label>
                        <input type="url" id="gw-repo-url" required value="https://github.com/oangia/oangia.github.io" placeholder="https://github.com/owner/repository" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1.5">
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">GitHub Token</label>
                            <span id="gw-token-status" class="text-[10px] text-emerald-400 font-mono hidden"><i class="fa-solid fa-cookie-bite mr-1"></i>Saved Cookie</span>
                        </div>
                        <input type="password" id="gw-token" placeholder="ghp_..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                    </div>
                    <div>
                        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <span>Fetch Files</span>
                        </button>
                    </div>
                </form>
            </div>

            <!-- Status & Messages Box -->
            <div id="gw-status-box" class="hidden bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between shrink-0">
                <div class="flex items-center space-x-3">
                    <div id="gw-status-spinner" class="animate-spin text-indigo-400 text-lg">
                        <i class="fa-solid fa-circle-notch"></i>
                    </div>
                    <div>
                        <p id="gw-status-text" class="text-sm font-medium text-slate-200">Connecting to GitHub repository...</p>
                        <p id="gw-status-subtext" class="text-xs text-slate-400">Fetching git tree structure</p>
                    </div>
                </div>
                <div id="gw-progress-container" class="hidden w-48 bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div id="gw-progress-bar" class="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>

            <!-- Active Repository Workspace Grid -->
            <div id="gw-workspace" class="hidden flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-hidden">
                
                <!-- File Explorer Pane -->
                <div class="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-xl">
                    <div class="p-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 shrink-0 gap-2">
                        <div class="relative flex-1">
                            <i class="fa-solid fa-filter absolute left-3 top-3 text-slate-500 text-xs"></i>
                            <input type="text" id="gw-file-filter" placeholder="Filter files..." class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        </div>
                        <button type="button" id="gw-open-create-modal-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow transition flex items-center space-x-1 shrink-0">
                            <i class="fa-solid fa-plus"></i>
                            <span>New</span>
                        </button>
                        <button type="button" id="gw-download-zip-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow transition flex items-center space-x-1.5 shrink-0">
                            <i class="fa-solid fa-file-zipper"></i>
                            <span>ZIP</span>
                        </button>
                    </div>

                    <div class="px-4 py-2 bg-slate-900/50 border-b border-slate-700/60 text-xs text-slate-400 flex justify-between items-center shrink-0">
                        <span id="gw-file-count-label">0 files found</span>
                        <span id="gw-repo-branch-label" class="font-mono text-slate-300"></span>
                    </div>

                    <div id="gw-file-list" class="flex-1 overflow-y-auto divide-y divide-slate-700/40 p-2 space-y-1"></div>
                </div>

                <!-- File Preview & Editor Pane -->
                <div class="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-xl">
                    <div class="p-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 shrink-0">
                        <div class="flex items-center space-x-2 truncate">
                            <i class="fa-regular fa-file-code text-indigo-400"></i>
                            <span id="gw-preview-filename" class="text-sm font-medium text-slate-200 truncate">Select a file to preview or edit</span>
                        </div>
                        <div class="flex items-center space-x-2 shrink-0">
                            <button type="button" id="gw-save-edit-btn" disabled class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white px-3 py-1.5 rounded-lg transition flex items-center space-x-1">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                <span>Save Changes</span>
                            </button>
                            <button type="button" id="gw-download-single-btn" disabled class="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white px-3 py-1.5 rounded-lg transition flex items-center space-x-1">
                                <i class="fa-solid fa-download"></i>
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                    <div class="flex-1 bg-slate-950 overflow-hidden relative flex flex-col">
                        <div id="gw-preview-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-center p-6 z-10">
                            <i class="fa-regular fa-folder-open text-4xl mb-3 text-slate-600"></i>
                            <p class="text-sm">Click on any file from the left panel to edit its content directly, or create a new file.</p>
                        </div>
                        <textarea id="gw-editor-textarea" class="hidden w-full h-full bg-slate-950 p-4 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed border-none"></textarea>
                    </div>
                </div>

            </div>

        </div>
      </div>

      <!-- Modal: Create & Push New File -->
      <div id="gw-create-file-modal" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
              <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                  <h3 class="text-base font-semibold text-slate-100 flex items-center gap-2">
                      <i class="fa-solid fa-cloud-arrow-up text-indigo-400"></i>
                      <span>Create & Push New File</span>
                  </h3>
                  <button type="button" id="gw-close-create-modal-btn" class="text-slate-400 hover:text-white text-sm p-1">
                      <i class="fa-solid fa-xmark"></i>
                  </button>
              </div>
              <div class="p-5 space-y-4">
                  <div>
                      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">File Path in Repo</label>
                      <input type="text" id="gw-new-file-path" placeholder="e.g. js/app.js or hello.txt" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  </div>
                  <div>
                      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Commit Message</label>
                      <input type="text" id="gw-new-file-message" placeholder="e.g. Add hello.txt via web UI" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  </div>
                  <div>
                      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">File Content</label>
                      <textarea id="gw-new-file-content" rows="6" placeholder="Type your text or code here..." class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  </div>
              </div>
              <div class="p-4 border-t border-slate-700 bg-slate-800/80 flex justify-end gap-3">
                  <button type="button" id="gw-cancel-create-modal-btn" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 rounded-xl transition">Cancel</button>
                  <button type="button" id="gw-push-file-btn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-xl shadow-lg transition flex items-center gap-1.5">
                      <i class="fa-solid fa-paper-plane"></i>
                      <span>Push File</span>
                  </button>
              </div>
          </div>
      </div>

      <!-- Toast Notification Container -->
      <div id="gw-notification" class="fixed bottom-6 right-6 z-[60] transform translate-y-20 opacity-0 transition-all duration-300 bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3">
          <i id="gw-notification-icon" class="fa-solid fa-circle-check text-emerald-400 text-lg"></i>
          <span id="gw-notification-message" class="text-sm font-medium">Notification message</span>
      </div>
    `;

    // Append to wrapper stack managed by BaseWidget
    this.wrapper.appendChild(this.floatBtn);
    document.body.appendChild(this.modal);
  }

  cacheDomReferences() {
    const m = this.modal;
    this.dom = {
      closeBtn: m.querySelector('.gw-close-modal-btn'),
      repoForm: m.querySelector('#gw-repo-form'),
      repoUrlInput: m.querySelector('#gw-repo-url'),
      tokenInput: m.querySelector('#gw-token'),
      tokenStatus: m.querySelector('#gw-token-status'),
      statusBox: m.querySelector('#gw-status-box'),
      statusSpinner: m.querySelector('#gw-status-spinner'),
      statusText: m.querySelector('#gw-status-text'),
      statusSubtext: m.querySelector('#gw-status-subtext'),
      progressContainer: m.querySelector('#gw-progress-container'),
      progressBar: m.querySelector('#gw-progress-bar'),
      workspace: m.querySelector('#gw-workspace'),
      fileFilter: m.querySelector('#gw-file-filter'),
      openCreateModalBtn: m.querySelector('#gw-open-create-modal-btn'),
      downloadZipBtn: m.querySelector('#gw-download-zip-btn'),
      fileCountLabel: m.querySelector('#gw-file-count-label'),
      repoBranchLabel: m.querySelector('#gw-repo-branch-label'),
      fileList: m.querySelector('#gw-file-list'),
      previewFilename: m.querySelector('#gw-preview-filename'),
      saveEditBtn: m.querySelector('#gw-save-edit-btn'),
      downloadSingleBtn: m.querySelector('#gw-download-single-btn'),
      previewPlaceholder: m.querySelector('#gw-preview-placeholder'),
      editorTextarea: m.querySelector('#gw-editor-textarea'),
      
      // Create Modal elements
      createModal: m.querySelector('#gw-create-file-modal'),
      closeCreateModalBtn: m.querySelector('#gw-close-create-modal-btn'),
      cancelCreateModalBtn: m.querySelector('#gw-cancel-create-modal-btn'),
      pushFileBtn: m.querySelector('#gw-push-file-btn'),
      newFilePath: m.querySelector('#gw-new-file-path'),
      newFileMessage: m.querySelector('#gw-new-file-message'),
      newFileContent: m.querySelector('#gw-new-file-content'),

      // Notification
      notification: m.querySelector('#gw-notification'),
      notificationIcon: m.querySelector('#gw-notification-icon'),
      notificationMessage: m.querySelector('#gw-notification-message')
    };
  }

  bindEvents() {
    // Open/Close Main Modal
    this.floatBtn.addEventListener('click', () => {
      this.modal.classList.remove('hidden');
      this.modal.classList.add('flex');
    });

    const closeModal = () => {
      this.modal.classList.remove('flex');
      this.modal.classList.add('hidden');
    };

    this.dom.closeBtn.addEventListener('click', closeModal);
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) closeModal();
    });

    // Token persistent cookies handling
    this.dom.tokenInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        this.setCookie('github_token', val, 30);
        this.dom.tokenStatus.classList.remove('hidden');
      } else {
        this.setCookie('github_token', '', -1);
        this.dom.tokenStatus.classList.add('hidden');
      }
    });

    // Repo Form Submission
    this.dom.repoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.fetchRepositoryTree();
    });

    // File filtering
    this.dom.fileFilter.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = this.currentRepoData.files.filter(f => f.path.toLowerCase().includes(query));
      this.renderFileList(filtered);
    });

    // Save edited file
    this.dom.saveEditBtn.addEventListener('click', () => this.saveEditedFile());

    // Download single file
    this.dom.downloadSingleBtn.addEventListener('click', () => this.downloadSingleFile());

    // Download ZIP archive
    this.dom.downloadZipBtn.addEventListener('click', () => this.downloadZipArchive());

    // Create Modal Toggles
    const toggleCreateModal = (show) => {
      if (show) this.dom.createModal.classList.remove('hidden');
      else this.dom.createModal.classList.add('hidden');
    };

    this.dom.openCreateModalBtn.addEventListener('click', () => toggleCreateModal(true));
    this.dom.closeCreateModalBtn.addEventListener('click', () => toggleCreateModal(false));
    this.dom.cancelCreateModalBtn.addEventListener('click', () => toggleCreateModal(false));
    this.dom.createModal.addEventListener('click', (e) => {
      if (e.target === this.dom.createModal) toggleCreateModal(false);
    });

    // Push New File Action
    this.dom.pushFileBtn.addEventListener('click', () => this.pushNewFile());
  }

  // --- COOKIE HELPERS ---
  setCookie(name, value, days = 30) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  }

  checkSavedToken() {
    const saved = this.getCookie('github_token');
    if (saved) {
      this.dom.tokenInput.value = saved;
      this.dom.tokenStatus.classList.remove('hidden');
    }
  }

  showNotification(message, type = 'success') {
    const notif = this.dom.notification;
    const icon = this.dom.notificationIcon;
    const msg = this.dom.notificationMessage;

    msg.textContent = message;
    icon.className = type === 'success' 
      ? 'fa-solid fa-circle-check text-emerald-400 text-lg' 
      : 'fa-solid fa-triangle-exclamation text-amber-400 text-lg';

    notif.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => notif.classList.add('translate-y-20', 'opacity-0'), 3500);
  }

  setStatus(visible, text = '', subtext = '', showSpinner = true, showProgress = false) {
    if (!visible) {
      this.dom.statusBox.classList.add('hidden');
      return;
    }

    this.dom.statusBox.classList.remove('hidden');
    this.dom.statusText.textContent = text;
    this.dom.statusSubtext.textContent = subtext;
    this.dom.statusSpinner.style.display = showSpinner ? 'block' : 'none';
    this.dom.progressContainer.style.display = showProgress ? 'block' : 'none';
  }

  updateProgress(percent) {
    this.dom.progressBar.style.width = `${percent}%`;
  }

  // --- FETCH REPO FILE TREE ---
  async fetchRepositoryTree() {
    const repoUrl = this.dom.repoUrlInput.value.trim();
    const token = this.dom.tokenInput.value.trim();

    if (token) {
      this.setCookie('github_token', token, 30);
      this.dom.tokenStatus.classList.remove('hidden');
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      this.showNotification('Invalid GitHub URL format', 'error');
      return;
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    this.setStatus(true, 'Connecting to GitHub...', `Resolving repo info for ${owner}/${repo}`);
    this.dom.workspace.classList.add('hidden');

    const headers = { 'Accept': 'application/vnd.github+json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!repoRes.ok) {
        if (repoRes.status === 404) throw new Error('Repository not found or is private.');
        if (repoRes.status === 403) throw new Error('API rate limit reached. Provide a token.');
        throw new Error(`Failed to fetch repo: ${repoRes.statusText}`);
      }
      const repoInfo = await repoRes.json();
      const branch = repoInfo.default_branch || 'main';

      this.currentRepoData = { owner, repo, branch, token, files: [] };

      this.setStatus(true, 'Fetching file tree...', `Loading tree structure for ${owner}/${repo}@${branch}`);
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      if (!treeRes.ok) throw new Error(`Failed to fetch tree: ${treeRes.statusText}`);

      const data = await treeRes.json();
      const files = data.tree.filter(item => item.type === 'blob');
      this.currentRepoData.files = files;

      if (files.length === 0) throw new Error('No files found in this repo branch.');

      this.renderFileList(files);
      this.dom.fileCountLabel.textContent = `${files.length} files extracted`;
      this.dom.repoBranchLabel.textContent = `${owner}/${repo}:${branch}`;
      
      this.setStatus(false);
      this.dom.workspace.classList.remove('hidden');
      this.dom.workspace.classList.add('grid');
      this.showNotification(`Fetched ${files.length} files successfully!`);

    } catch (err) {
      this.setStatus(false);
      this.showNotification(err.message, 'error');
    }
  }

  renderFileList(files) {
    const listContainer = this.dom.fileList;
    listContainer.innerHTML = '';

    files.forEach((file) => {
      const item = document.createElement('div');
      item.className = 'file-item group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-700/50 cursor-pointer transition';
      
      let iconClass = 'fa-regular fa-file text-slate-400';
      const ext = file.path.split('.').pop().toLowerCase();
      if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) iconClass = 'fa-brands fa-js text-amber-400';
      else if (['html', 'htm'].includes(ext)) iconClass = 'fa-brands fa-html5 text-orange-400';
      else if (['css', 'scss'].includes(ext)) iconClass = 'fa-brands fa-css3-alt text-blue-400';
      else if (['json'].includes(ext)) iconClass = 'fa-solid fa-brackets-curly text-yellow-300';
      else if (['md', 'txt'].includes(ext)) iconClass = 'fa-regular fa-file-lines text-slate-300';

      item.innerHTML = `
          <div class="flex items-center space-x-2.5 truncate mr-2">
              <i class="${iconClass} text-base shrink-0"></i>
              <span class="text-xs font-medium text-slate-300 group-hover:text-white truncate">${file.path}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-500 shrink-0">${this.formatBytes(file.size || 0)}</span>
      `;

      item.addEventListener('click', () => this.selectFile(file));
      listContainer.appendChild(item);
    });
  }

  async selectFile(file) {
    this.selectedFile = file;
    this.dom.previewFilename.textContent = file.path;
    const placeholder = this.dom.previewPlaceholder;
    const editorTextarea = this.dom.editorTextarea;
    const downloadBtn = this.dom.downloadSingleBtn;
    const saveEditBtn = this.dom.saveEditBtn;

    placeholder.classList.remove('hidden');
    editorTextarea.classList.add('hidden');
    placeholder.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin text-2xl text-indigo-400 mb-2"></i><p class="text-xs text-slate-400">Loading file for editing...</p>`;
    downloadBtn.disabled = true;
    saveEditBtn.disabled = true;

    try {
      const rawUrl = `https://raw.githubusercontent.com/${this.currentRepoData.owner}/${this.currentRepoData.repo}/${this.currentRepoData.branch}/${file.path}`;
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error('Failed to fetch file content.');
      
      const text = await res.text();
      editorTextarea.value = text;
      this.selectedFile.originalContent = text;
      
      placeholder.classList.add('hidden');
      editorTextarea.classList.remove('hidden');
      downloadBtn.disabled = false;
      saveEditBtn.disabled = false;
    } catch (err) {
      placeholder.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-2xl text-amber-400 mb-2"></i><p class="text-xs text-amber-300">${err.message}</p>`;
    }
  }

  async saveEditedFile() {
    if (!this.selectedFile) return;

    const token = this.currentRepoData.token || this.getCookie('github_token');
    if (!token) {
      this.showNotification('GitHub Token required to save edits', 'error');
      return;
    }

    const updatedContent = this.dom.editorTextarea.value;
    const path = this.selectedFile.path;

    this.setStatus(true, 'Saving changes...', `Pushing updated ${path} to GitHub`);

    try {
      const checkUrl = `https://api.github.com/repos/${this.currentRepoData.owner}/${this.currentRepoData.repo}/contents/${path}`;
      const checkRes = await fetch(checkUrl, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
      });

      if (!checkRes.ok) throw new Error('Could not verify file SHA on remote');
      const fileData = await checkRes.json();

      const base64Content = btoa(unescape(encodeURIComponent(updatedContent)));

      const saveRes = await fetch(checkUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json'
        },
        body: JSON.stringify({
          message: `Update ${path} via browser editor`,
          content: base64Content,
          sha: fileData.sha,
          branch: this.currentRepoData.branch
        })
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.message || 'Failed to update file');
      }

      this.setStatus(false);
      this.showNotification(`Successfully saved changes to ${path}!`);

    } catch (err) {
      this.setStatus(false);
      this.showNotification(err.message, 'error');
    }
  }

  downloadSingleFile() {
    if (!this.selectedFile) return;
    const content = this.dom.editorTextarea.value;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.selectedFile.path.split('/').pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.showNotification(`Downloaded ${this.selectedFile.path}`);
  }

  async downloadZipArchive() {
    if (this.currentRepoData.files.length === 0) return;

    this.setStatus(true, 'Preparing ZIP archive...', 'Fetching repository files in bulk', false, true);
    this.updateProgress(0);

    const zip = new JSZip();
    const total = this.currentRepoData.files.length;
    let completed = 0;

    const token = this.currentRepoData.token || this.getCookie('github_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    for (const file of this.currentRepoData.files) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${this.currentRepoData.owner}/${this.currentRepoData.repo}/${this.currentRepoData.branch}/${file.path}`;
        const res = await fetch(rawUrl, { headers });
        if (res.ok) {
          const blob = await res.blob();
          zip.file(file.path, blob);
        }
      } catch (e) {}

      completed++;
      this.updateProgress(Math.round((completed / total) * 100));
    }

    this.setStatus(true, 'Compressing into ZIP...', 'Generating ZIP file', false, false);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentRepoData.repo}-${this.currentRepoData.branch}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    this.setStatus(false);
    this.showNotification('Repository downloaded as ZIP!');
  }

  async pushNewFile() {
    const path = this.dom.newFilePath.value.trim();
    const message = this.dom.newFileMessage.value.trim() || `Add ${path} via Browser JS`;
    const content = this.dom.newFileContent.value;
    const token = this.currentRepoData.token || this.getCookie('github_token');

    if (!path) {
      this.showNotification('Please specify a file path', 'error');
      return;
    }
    if (!token) {
      this.showNotification('GitHub Token required to push files', 'error');
      return;
    }

    this.dom.createModal.classList.add('hidden');
    this.setStatus(true, 'Pushing file to GitHub...', `Creating ${path} on ${this.currentRepoData.owner}/${this.currentRepoData.repo}`);

    try {
      let sha = null;
      const checkUrl = `https://api.github.com/repos/${this.currentRepoData.owner}/${this.currentRepoData.repo}/contents/${path}`;
      const checkRes = await fetch(checkUrl, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
      });

      if (checkRes.ok) {
        const existingData = await checkRes.json();
        sha = existingData.sha;
      }

      const base64Content = btoa(unescape(encodeURIComponent(content)));

      const pushRes = await fetch(checkUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json'
        },
        body: JSON.stringify({
          message: message,
          content: base64Content,
          branch: this.currentRepoData.branch,
          ...(sha ? { sha } : {})
        })
      });

      if (!pushRes.ok) {
        const errData = await pushRes.json();
        throw new Error(errData.message || 'Failed to push file');
      }

      this.setStatus(false);
      this.showNotification(`Pushed ${path} successfully!`);

      this.dom.newFilePath.value = '';
      this.dom.newFileContent.value = '';
      this.fetchRepositoryTree();

    } catch (err) {
      this.setStatus(false);
      this.showNotification(err.message, 'error');
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}
