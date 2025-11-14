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
  const COLLECTION_NAME = 'items';
  
  // Firebase CRUD Operations
  const firebaseAPI = {
    async getAllItems() {
      try {
        const snapshot = await db.collection(COLLECTION_NAME).get();
        const items = [];
        snapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data()
          });
        });
        return items;
      } catch (error) {
        console.error('Error getting items:', error);
        throw error;
      }
    },
  
    async getItem(id) {
      try {
        const doc = await db.collection(COLLECTION_NAME).doc(id).get();
        if (doc.exists) {
          return {
            id: doc.id,
            ...doc.data()
          };
        } else {
          throw new Error('Item not found');
        }
      } catch (error) {
        console.error('Error getting item:', error);
        throw error;
      }
    },
  
    async createItem(data) {
      try {
        const docRef = await db.collection(COLLECTION_NAME).add({
          title: data.title,
          description: data.description,
          createdAt: Date.now()
        });
        return {
          id: docRef.id,
          ...data
        };
      } catch (error) {
        console.error('Error creating item:', error);
        throw error;
      }
    },
  
    async updateItem(id, data) {
      try {
        await db.collection(COLLECTION_NAME).doc(id).update({
          title: data.title,
          description: data.description,
          updatedAt: Date.now()
        });
        return {
          id,
          ...data
        };
      } catch (error) {
        console.error('Error updating item:', error);
        throw error;
      }
    },
  
    async deleteItem(id) {
      try {
        await db.collection(COLLECTION_NAME).doc(id).delete();
        return true;
      } catch (error) {
        console.error('Error deleting item:', error);
        throw error;
      }
    }
  };
  
  let currentEditId = null;
  let currentPage = 1;
  let pageSize = 10;
  let totalItems = 0;
  let allItems = [];
  
  const elements = {
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('emptyState'),
    tableContainer: document.getElementById('tableContainer'),
    tableBody: document.getElementById('tableBody'),
    modalOverlay: document.getElementById('modalOverlay'),
    deleteModal: document.getElementById('deleteModal'),
    itemForm: document.getElementById('itemForm'),
    modalTitle: document.getElementById('modalTitle'),
    submitText: document.getElementById('submitText'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    titleInput: document.getElementById('title'),
    descriptionInput: document.getElementById('description'),
    btnSubmit: document.getElementById('btnSubmit'),
    paginationInfo: document.getElementById('paginationInfo'),
    pageNumbers: document.getElementById('pageNumbers'),
    btnFirst: document.getElementById('btnFirst'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    btnLast: document.getElementById('btnLast'),
    pageSize: document.getElementById('pageSize')
  };
  
  async function fetchItems() {
    try {
      elements.loading.style.display = 'block';
      elements.emptyState.classList.remove('show');
      elements.tableContainer.classList.remove('show');
  
      const items = await firebaseAPI.getAllItems();
  
      allItems = items;
      totalItems = items.length;
  
      elements.loading.style.display = 'none';
  
      if (items.length === 0) {
        elements.emptyState.classList.add('show');
      } else {
        elements.tableContainer.classList.add('show');
        renderCurrentPage();
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      elements.loading.style.display = 'none';
      showToast('Error loading items: ' + error.message);
    }
  }
  
  function renderCurrentPage() {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageItems = allItems.slice(startIndex, endIndex);
  
    renderTable(pageItems);
    updatePaginationControls();
  }
  
  function renderTable(items) {
    elements.tableBody.innerHTML = items.map(item => `
      <tr data-testid="row-item-${item.id}">
        <td class="td-id" data-testid="text-id-${item.id}">${escapeHtml(item.id.substring(0, 8))}</td>
        <td class="td-title" data-testid="text-title-${item.id}">${escapeHtml(item.title)}</td>
        <td class="td-description" data-testid="text-description-${item.id}">${escapeHtml(item.description)}</td>
        <td class="td-actions">
          <div class="action-buttons">
            <button class="btn btn-secondary btn-icon" onclick="openEditModal('${item.id}')" data-testid="button-edit-${item.id}" title="Edit">
              <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn btn-destructive btn-icon" onclick="openDeleteModal('${item.id}')" data-testid="button-delete-${item.id}" title="Delete">
              <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  function updatePaginationControls() {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
  
    elements.paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems}`;
  
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
          data-testid="button-page-${i}"
        >
          ${i}
        </button>
      `);
    }
  
    elements.pageNumbers.innerHTML = pageButtons.join('');
  }
  
  function goToPage(page) {
    const totalPages = Math.ceil(totalItems / pageSize);
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
    const totalPages = Math.ceil(totalItems / pageSize);
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
    elements.modalTitle.textContent = 'Create Item';
    elements.submitText.textContent = 'Create';
    elements.itemForm.reset();
    elements.modalOverlay.classList.add('show');
    elements.titleInput.focus();
  }
  
  async function openEditModal(id) {
    try {
      const item = await firebaseAPI.getItem(id);
  
      currentEditId = id;
      elements.modalTitle.textContent = 'Edit Item';
      elements.submitText.textContent = 'Update';
      elements.titleInput.value = item.title;
      elements.descriptionInput.value = item.description;
      elements.modalOverlay.classList.add('show');
      elements.titleInput.focus();
    } catch (error) {
      console.error('Error fetching item:', error);
      showToast('Error loading item');
    }
  }
  
  function closeModal() {
    elements.modalOverlay.classList.remove('show');
    elements.itemForm.reset();
    currentEditId = null;
  }
  
  let deleteItemId = null;
  
  function openDeleteModal(id) {
    deleteItemId = id;
    elements.deleteModal.classList.add('show');
  }
  
  function closeDeleteModal() {
    elements.deleteModal.classList.remove('show');
    deleteItemId = null;
  }
  
  async function handleFormSubmit(e) {
    e.preventDefault();
  
    const title = elements.titleInput.value.trim();
    const description = elements.descriptionInput.value.trim();
  
    if (!title || !description) {
      showToast('Please fill in all fields');
      return;
    }
  
    const data = { title, description };
  
    try {
      elements.btnSubmit.disabled = true;
      
      if (currentEditId) {
        await firebaseAPI.updateItem(currentEditId, data);
        showToast('Item updated successfully');
      } else {
        await firebaseAPI.createItem(data);
        showToast('Item created successfully');
      }
  
      closeModal();
      await fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      showToast('Error saving item: ' + error.message);
    } finally {
      elements.btnSubmit.disabled = false;
    }
  }
  
  async function confirmDelete() {
    if (!deleteItemId) return;
  
    try {
      await firebaseAPI.deleteItem(deleteItemId);
      showToast('Item deleted successfully');
      closeDeleteModal();
      await fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Error deleting item: ' + error.message);
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
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  document.getElementById('btnCloseDelete').addEventListener('click', closeDeleteModal);
  document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);
  document.getElementById('btnConfirmDelete').addEventListener('click', confirmDelete);
  elements.itemForm.addEventListener('submit', handleFormSubmit);
  
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
    document.addEventListener('DOMContentLoaded', fetchItems);
  } else {
    fetchItems();
  }
  