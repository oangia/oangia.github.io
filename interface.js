// ==========================================
// ---------- Global State & Init -----------
// ==========================================

let allItems = [];
let filteredItems = [];
let filePreviewManager = null;
let gridRenderer = null;
let breadcrumbManager = null;
const sbManager = new SupabaseManager();

window.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  const savedUrl = localStorage.getItem('sb_url');
  const savedKey = localStorage.getItem('sb_key');
  const savedBucket = localStorage.getItem('sb_bucket') || 'files';

  filePreviewManager = new FilePreviewManager({
    service: sbManager,
    onToast: (msg, type, duration) => showToast(msg, type, duration),
    onSaveSuccess: () => listFiles()
  });

  gridRenderer = new ItemsGridRenderer('itemsGrid', {
    onItemClick: (item, fullPath, isFolder) => {
      if (isFolder) {
        breadcrumbManager.navigateToFolder(fullPath, item.name);
      } else {
        openPreview(fullPath, item.name);
      }
    },
    onDeleteClick: (fullPath, isFolder) => {
      deleteItem(fullPath, isFolder);
    }
  });

  breadcrumbManager = new BreadcrumbManager('breadcrumbNav', {
    onNavigate: (path) => {
      listFiles();
    }
  });

  if (savedUrl && savedKey) {
    initSupabase(savedUrl, savedKey, savedBucket);
  } else {
    updateConnectionStatus(false, 'Please configure credentials in Settings');
    switchTab('settings');
  }
});

// ==========================================
// ---------- Configuration Logic -----------
// ==========================================

function saveSettings() {
  const inputs = document.querySelectorAll('#viewSettings input[name]');
  const cfg = Object.fromEntries(
    [...inputs].map(el => [el.name, el.value.trim() || el.dataset.default || ''])
  );

  if (!cfg.sb_url || !cfg.sb_key) {
    showToast('URL and Anon Key are required', 'warning');
    return;
  }

  Object.entries(cfg).forEach(([k, v]) => localStorage.setItem(k, v));

  initSupabase(cfg.sb_url, cfg.sb_key, cfg.sb_bucket);
  switchTab('explorer');
}

function loadSettings() {
  document.querySelectorAll('#viewSettings input[name]').forEach(el => {
    const savedValue = localStorage.getItem(el.name);
    
    if (savedValue !== null && savedValue !== '') {
      el.value = savedValue;
    } else if (el.dataset.default) {
      el.value = el.dataset.default;
    }
  });
}

function initSupabase(url, key, bucket) {
  try {
    sbManager.init({url: url, key: key, bucket: bucket});
    if (filePreviewManager) {
      filePreviewManager.setService(sbManager);
    }

    document.getElementById('headerUrl').textContent = url + '  •  bucket: ' + bucket;
    if (breadcrumbManager) {
      breadcrumbManager.reset();
    }
    listFiles();
  } catch (err) {
    console.error(err);
    showToast('Failed to initialize Supabase client', 'error');
  }
}

// ==========================================
// ---------- File Operations & Core --------
// ==========================================

async function listFiles() {
  updateConnectionStatus(null, 'Loading...');
  try {
    const activePath = breadcrumbManager ? breadcrumbManager.path : '';
    const { data, error } = await sbManager.list(activePath, {
      limit: 500,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) throw error;

    allItems = (data || []).filter(item => item.name !== '.emptyFolderPlaceholder');

    await Promise.all(allItems.map(async (item) => {
      const isFolder = !item.id;
      if (isFolder) return;

      const activePath = breadcrumbManager ? breadcrumbManager.path : '';
      const fullPath = activePath ? `${activePath}/${item.name}` : item.name;
      item.fullPath = fullPath;

      if (isImage(item.name) || isVideo(item.name)) {
        try {
          const { data: signed, error: signErr } = await sbManager.createSignedUrl(fullPath, 60);

          if (!signErr && signed?.signedUrl) {
            item.thumbUrl = signed.signedUrl;
          }
        } catch (e) {}
      }
    }));

    updateConnectionStatus(true, `Connected • Bucket: ${sbManager.bucket}`);
    renderView();
  } catch (err) {
    console.error(err);
    updateConnectionStatus(false, err.message || 'Failed to list files');
    showToast(err.message || 'Failed to list files', 'error');
  }
}

// ---------- Render ----------
function renderView() {
  if (breadcrumbManager) {
    breadcrumbManager.render();
  }

  const searchVal = document.getElementById('searchInput').value.toLowerCase();
  filteredItems = searchVal
    ? allItems.filter(i => i.name.toLowerCase().includes(searchVal))
    : [...allItems];

  filteredItems.sort((a, b) => {
    const aFolder = !a.id;
    const bFolder = !b.id;
    if (aFolder !== bFolder) return aFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  document.getElementById('itemCountLabel').textContent = `${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`;

  if (gridRenderer) {
    const activePath = breadcrumbManager ? breadcrumbManager.path : '';
    gridRenderer.render(filteredItems, activePath);
  }
}

function handleSearch() {
  renderView();
}

// ---------- Create Folder ----------
function openCreateFolderModal() {
  document.getElementById('folderNameInput').value = '';
  document.getElementById('modalCreateFolder').classList.remove('hidden');
}

async function submitCreateFolder() {
  const name = document.getElementById('folderNameInput').value.trim();
  if (!name) return;

  const activePath = breadcrumbManager ? breadcrumbManager.path : '';
  const folderPath = activePath ? `${activePath}/${name}/.emptyFolderPlaceholder` : `${name}/.emptyFolderPlaceholder`;

  try {
    const { error } = await sbManager.upload(folderPath, new Blob(['']), { upsert: false });

    if (error) throw error;

    closeModals();
    showToast(`Folder "${name}" created`, 'success');
    listFiles();
  } catch (err) {
    showToast(err.message || 'Failed to create folder', 'error');
  }
}

// ---------- Upload ----------
function toggleUploadMenu() {
  document.getElementById('uploadMenu').classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('uploadMenu');
  if (!menu) return;
  if (!menu.contains(e.target) && !e.target.closest('button')?.getAttribute('onclick')?.includes('toggleUploadMenu')) {
    menu.classList.add('hidden');
  }
});

async function handleFileUpload(event, isFolderUpload = false) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  document.getElementById('uploadMenu')?.classList.add('hidden');
  showToast(`Uploading ${files.length} item(s) sequentially...`, 'info', 2500);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const activePath = breadcrumbManager ? breadcrumbManager.path : '';
      let targetPath = activePath ? `${activePath}/` : '';

      if (isFolderUpload && file.webkitRelativePath) {
        targetPath += file.webkitRelativePath;
      } else {
        targetPath += file.name;
      }

      const { error } = await sbManager.upload(targetPath, file, {
        cacheControl: '3600',
        upsert: true
      });

      if (error) throw error;
      success++;

      if ((i + 1) % 5 === 0 || i === files.length - 1) {
        showToast(`Uploaded ${i + 1} / ${files.length}`, 'info', 1200);
      }
    } catch (err) {
      console.error(err);
      failed++;
      showToast(`Failed: ${file.name}`, 'error', 2500);
    }
  }

  await listFiles();

  if (failed === 0) {
    showToast(`Successfully uploaded ${success} item(s)`, 'success');
  } else {
    showToast(`Uploaded ${success}, failed ${failed}`, 'warning');
  }

  event.target.value = '';
}

// ---------- Preview Wrappers ----------
async function openPreview(path, name) {
  if (filePreviewManager) {
    await filePreviewManager.openPreview(path, name);
  }
}

function cancelEditText() {
  if (filePreviewManager) {
    filePreviewManager.cancelEditText();
  }
}

async function saveEditedText() {
  if (filePreviewManager) {
    await filePreviewManager.saveEditedText();
  }
}

async function downloadFile(path, name) {
  try {
    const { data, error } = await sbManager.createSignedUrl(path, 60);

    if (error) throw error;

    const res = await fetch(data.signedUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    showToast(err.message || 'Download failed', 'error');
  }
}

// ---------- Backup ----------
async function createBackup() {
  const btn = document.getElementById('backupBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Backing up...</span>';

  await sbManager.runBackup();

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-box-archive"></i> <span>Backup</span>';
}

async function listAllFilesRecursive(prefix = '') {
  const results = [];
  const { data, error } = await sbManager.list(prefix, { limit: 1000, offset: 0 });

  if (error) throw error;

  for (const item of (data || [])) {
    if (item.name === '.emptyFolderPlaceholder') continue;

    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (!item.id) {
      const subFiles = await listAllFilesRecursive(fullPath);
      results.push(...subFiles);
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------- Delete ----------
async function deleteItem(path, isFolder) {
  if (!confirm(isFolder
    ? `Delete folder "${path}" and all its contents?`
    : `Delete file "${path}"?`)) return;

  try {
    if (isFolder) {
      const { data: files, error: listError } = await sbManager.list(path, { limit: 1000 });

      if (listError) throw listError;

      const pathsToDelete = [];
      if (files && files.length > 0) {
        for (const f of files) {
          pathsToDelete.push(`${path}/${f.name}`);
        }
      }
      pathsToDelete.push(`${path}/.emptyFolderPlaceholder`);

      if (pathsToDelete.length > 0) {
        const { error } = await sbManager.remove(pathsToDelete);
        if (error) throw error;
      }
    } else {
      const { error } = await sbManager.remove([path]);
      if (error) throw error;
    }

    showToast('Deleted successfully', 'success');
    listFiles();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Delete failed', 'error');
  }
}
