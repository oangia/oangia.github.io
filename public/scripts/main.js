// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB0TxR5HpNJ8Ph7rnrHqXNMAmBWo1dw5Nw",
  authDomain: "agent52.firebaseapp.com",
  projectId: "agent52",
  storageBucket: "agent52.firebasestorage.app",
  messagingSenderId: "534394830199",
  appId: "1:534394830199:web:521b810d19dbcfe9edb572",
  measurementId: "G-J9RZWL9DZ5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const COLLECTION_NAME = 'posts';

// Firebase CRUD Operations
const firebaseAPI = {
  async getAllPosts() {
    try {
      const snapshot = await db.collection(COLLECTION_NAME).orderBy('publishDate', 'desc').get();
      const posts = [];
      snapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return posts;
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  },

  async getPost(id) {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      } else {
        throw new Error('Post not found');
      }
    } catch (error) {
      console.error('Error getting post:', error);
      throw error;
    }
  },

  async createPost(data) {
    try {
      const docRef = await db.collection(COLLECTION_NAME).add({
        title: data.title,
        content: data.content,
        featuredImage: data.featuredImage || '',
        publishDate: data.publishDate,
        createdAt: Date.now()
      });
      return {
        id: docRef.id,
        ...data
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async updatePost(id, data) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update({
        title: data.title,
        content: data.content,
        featuredImage: data.featuredImage || '',
        publishDate: data.publishDate,
        updatedAt: Date.now()
      });
      return {
        id,
        ...data
      };
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  async deletePost(id) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
};

let currentEditId = null;
let currentPage = 1;
let pageSize = 10;
let totalPosts = 0;
let allPosts = [];

const elements = {
  loading: document.getElementById('loading'),
  emptyState: document.getElementById('emptyState'),
  tableContainer: document.getElementById('tableContainer'),
  tableBody: document.getElementById('tableBody'),
  modalOverlay: document.getElementById('modalOverlay'),
  deleteModal: document.getElementById('deleteModal'),
  postForm: document.getElementById('postForm'),
  modalTitle: document.getElementById('modalTitle'),
  submitText: document.getElementById('submitText'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  titleInput: document.getElementById('title'),
  contentInput: document.getElementById('content'),
  featuredImageInput: document.getElementById('featuredImage'),
  publishDateInput: document.getElementById('publishDate'),
  btnSubmit: document.getElementById('btnSubmit'),
  paginationInfo: document.getElementById('paginationInfo'),
  pageNumbers: document.getElementById('pageNumbers'),
  btnFirst: document.getElementById('btnFirst'),
  btnPrev: document.getElementById('btnPrev'),
  btnNext: document.getElementById('btnNext'),
  btnLast: document.getElementById('btnLast'),
  pageSize: document.getElementById('pageSize')
};

async function fetchPosts() {
  try {
    elements.loading.style.display = 'block';
    elements.emptyState.classList.remove('show');
    elements.tableContainer.classList.remove('show');

    const posts = await firebaseAPI.getAllPosts();

    allPosts = posts;
    totalPosts = posts.length;

    elements.loading.style.display = 'none';

    if (posts.length === 0) {
      elements.emptyState.classList.add('show');
    } else {
      elements.tableContainer.classList.add('show');
      renderCurrentPage();
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    elements.loading.style.display = 'none';
    showToast('Error loading posts: ' + error.message);
  }
}

function renderCurrentPage() {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagePosts = allPosts.slice(startIndex, endIndex);

  renderTable(pagePosts);
  updatePaginationControls();
}

function renderTable(posts) {
  elements.tableBody.innerHTML = posts.map(post => {
    const preview = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');
    const hasImage = post.featuredImage && post.featuredImage.trim() !== '';
    
    return `
    <tr>
      <td class="td-title">
        <strong>${escapeHtml(post.title)}</strong>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
          ${new Date(post.publishDate).toLocaleDateString()}
        </div>
      </td>
      <td class="td-description">${escapeHtml(preview)}</td>
      <td style="text-align: center;">
        ${hasImage ? `<img src="${escapeHtml(post.featuredImage)}" alt="Featured" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">` : '<span style="color: #9ca3af; font-size: 13px;">No image</span>'}
      </td>
      <td class="td-actions">
        <div class="action-buttons">
          <button class="btn btn-secondary btn-icon" onclick="openEditModal('${post.id}')" title="Edit">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn btn-destructive btn-icon" onclick="openDeleteModal('${post.id}')" title="Delete">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `}).join('');
}

function updatePaginationControls() {
  const totalPages = Math.ceil(totalPosts / pageSize);
  const startPost = totalPosts === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endPost = Math.min(currentPage * pageSize, totalPosts);

  elements.paginationInfo.textContent = `Showing ${startPost}-${endPost} of ${totalPosts}`;

  elements.btnFirst.disabled = currentPage === 1;
  elements.btnPrev.disabled = currentPage === 1;
  elements.btnNext.disabled = currentPage === totalPages || totalPages === 0;
  elements.btnLast.disabled = currentPage === totalPages || totalPages === 0;

  renderPageNumbers(totalPages);
}

function renderPageNumbers(totalPages) {
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pageButtons = [];
  
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    pageButtons.push(`
      <button 
        class="btn-page ${isActive ? 'active' : ''}" 
        onclick="goToPage(${i})"
      >
        ${i}
      </button>
    `);
  }

  elements.pageNumbers.innerHTML = pageButtons.join('');
}

function goToPage(page) {
  const totalPages = Math.ceil(totalPosts / pageSize);
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderCurrentPage();
}

function goToFirstPage() {
  goToPage(1);
}

function goToPrevPage() {
  goToPage(currentPage - 1);
}

function goToNextPage() {
  goToPage(currentPage + 1);
}

function goToLastPage() {
  const totalPages = Math.ceil(totalPosts / pageSize);
  goToPage(totalPages);
}

function changePageSize() {
  pageSize = parseInt(elements.pageSize.value);
  currentPage = 1;
  renderCurrentPage();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openCreateModal() {
  currentEditId = null;
  elements.modalTitle.textContent = 'Create Post';
  elements.submitText.textContent = 'Create Post';
  elements.postForm.reset();
  
  // Set default publish date to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  elements.publishDateInput.value = now.toISOString().slice(0, 16);
  
  elements.modalOverlay.classList.add('show');
  elements.titleInput.focus();
}

async function openEditModal(id) {
  try {
    const post = await firebaseAPI.getPost(id);

    currentEditId = id;
    elements.modalTitle.textContent = 'Edit Post';
    elements.submitText.textContent = 'Update Post';
    elements.titleInput.value = post.title;
    elements.contentInput.value = post.content;
    elements.featuredImageInput.value = post.featuredImage || '';
    
    // Convert timestamp to datetime-local format
    const date = new Date(post.publishDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    elements.publishDateInput.value = date.toISOString().slice(0, 16);
    
    elements.modalOverlay.classList.add('show');
    elements.titleInput.focus();
  } catch (error) {
    console.error('Error fetching post:', error);
    showToast('Error loading post');
  }
}

function closeModal() {
  elements.modalOverlay.classList.remove('show');
  elements.postForm.reset();
  currentEditId = null;
}

let deletePostId = null;

function openDeleteModal(id) {
  deletePostId = id;
  elements.deleteModal.classList.add('show');
}

function closeDeleteModal() {
  elements.deleteModal.classList.remove('show');
  deletePostId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const title = elements.titleInput.value.trim();
  const content = elements.contentInput.value.trim();
  const featuredImage = elements.featuredImageInput.value.trim();
  const publishDate = new Date(elements.publishDateInput.value).getTime();

  if (!title || !content) {
    showToast('Please fill in all required fields');
    return;
  }

  const data = { title, content, featuredImage, publishDate };

  try {
    elements.btnSubmit.disabled = true;
    
    if (currentEditId) {
      await firebaseAPI.updatePost(currentEditId, data);
      showToast('Post updated successfully');
    } else {
      await firebaseAPI.createPost(data);
      showToast('Post created successfully');
    }

    closeModal();
    await fetchPosts();
  } catch (error) {
    console.error('Error saving post:', error);
    showToast('Error saving post: ' + error.message);
  } finally {
    elements.btnSubmit.disabled = false;
  }
}

async function confirmDelete() {
  if (!deletePostId) return;

  try {
    await firebaseAPI.deletePost(deletePostId);
    showToast('Post deleted successfully');
    closeDeleteModal();
    await fetchPosts();
  } catch (error) {
    console.error('Error deleting post:', error);
    showToast('Error deleting post: ' + error.message);
  }
}

function showToast(message) {
  elements.toastMessage.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// Event listeners
document.getElementById('btnCreate').addEventListener('click', openCreateModal);
document.getElementById('btnCreateEmpty').addEventListener('click', openCreateModal);
document.getElementById('btnCloseDelete').addEventListener('click', closeDeleteModal);
document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);
document.getElementById('btnConfirmDelete').addEventListener('click', confirmDelete);
elements.postForm.addEventListener('submit', handleFormSubmit);

elements.btnFirst.addEventListener('click', goToFirstPage);
elements.btnPrev.addEventListener('click', goToPrevPage);
elements.btnNext.addEventListener('click', goToNextPage);
elements.btnLast.addEventListener('click', goToLastPage);
elements.pageSize.addEventListener('change', changePageSize);

elements.modalOverlay.addEventListener('click', (e) => {
  if (e.target === elements.modalOverlay) {
    closeModal();
  }
});

elements.deleteModal.addEventListener('click', (e) => {
  if (e.target === elements.deleteModal) {
    closeDeleteModal();
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fetchPosts);
} else {
  fetchPosts();
}
