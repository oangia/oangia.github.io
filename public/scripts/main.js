// ============================================================================
// FIREBASE SERVICE - Handles all Firebase operations
// ============================================================================
import { FirebaseService } from './firebase.js';
// ============================================================================
// PAGINATION MANAGER - Handles pagination logic
// ============================================================================
class PaginationManager {
  constructor(options = {}) {
    this.currentPage = 1;
    this.pageSize = options.pageSize || 10;
    this.totalItems = 0;
    this.allItems = [];
  }

  setItems(items) {
    this.allItems = items;
    this.totalItems = items.length;
  }

  getCurrentPageItems() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.allItems.slice(startIndex, endIndex);
  }

  getTotalPages() {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  goToPage(page) {
    const totalPages = this.getTotalPages();
    if (page < 1 || page > totalPages) return false;
    this.currentPage = page;
    return true;
  }

  goToFirst() {
    return this.goToPage(1);
  }

  goToPrev() {
    return this.goToPage(this.currentPage - 1);
  }

  goToNext() {
    return this.goToPage(this.currentPage + 1);
  }

  goToLast() {
    return this.goToPage(this.getTotalPages());
  }

  setPageSize(size) {
    this.pageSize = parseInt(size);
    this.currentPage = 1;
  }

  getPaginationInfo() {
    const startItem = this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(this.currentPage * this.pageSize, this.totalItems);
    const totalPages = this.getTotalPages();

    return {
      startItem,
      endItem,
      totalItems: this.totalItems,
      currentPage: this.currentPage,
      totalPages,
      isFirstPage: this.currentPage === 1,
      isLastPage: this.currentPage === totalPages || totalPages === 0
    };
  }

  getVisiblePageNumbers(maxVisible = 5) {
    const totalPages = this.getTotalPages();
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push({
        number: i,
        isActive: i === this.currentPage
      });
    }

    return pages;
  }
}

// ============================================================================
// UI MANAGER - Handles UI rendering and interactions
// ============================================================================
class UIManager {
  constructor(elements) {
    this.elements = elements;
  }

  showLoading() {
    this.elements.loading.style.display = 'block';
    this.elements.emptyState?.classList.remove('show');
    this.elements.tableContainer?.classList.remove('show');
  }

  hideLoading() {
    this.elements.loading.style.display = 'none';
  }

  showEmptyState() {
    this.elements.emptyState?.classList.add('show');
  }

  showTable() {
    this.elements.tableContainer?.classList.add('show');
  }

  showToast(message, duration = 3000) {
    this.elements.toastMessage.textContent = message;
    this.elements.toast.classList.add('show');
    setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, duration);
  }

  openModal(title, submitText) {
    this.elements.modalTitle.textContent = title;
    this.elements.submitText.textContent = submitText;
    this.elements.modalOverlay.classList.add('show');
  }

  closeModal() {
    this.elements.modalOverlay.classList.remove('show');
    this.elements.form?.reset();
  }

  openDeleteModal() {
    this.elements.deleteModal.classList.add('show');
  }

  closeDeleteModal() {
    this.elements.deleteModal.classList.remove('show');
  }

  renderTable(items, columns, actions) {
    const rows = items.map(item => {
      const cells = columns.map(col => col.render(item)).join('');
      const actionButtons = actions.map(action => action.render(item)).join('');
      
      return `
        <tr>
          ${cells}
          <td class="td-actions">
            <div class="action-buttons">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.elements.tableBody.innerHTML = rows;
  }

  updatePaginationControls(paginationInfo, pageNumbers) {
    const { startItem, endItem, totalItems, isFirstPage, isLastPage } = paginationInfo;

    this.elements.paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems}`;
    this.elements.btnFirst.disabled = isFirstPage;
    this.elements.btnPrev.disabled = isFirstPage;
    this.elements.btnNext.disabled = isLastPage;
    this.elements.btnLast.disabled = isLastPage;

    const pageButtons = pageNumbers.map(page => `
      <button 
        class="btn-page ${page.isActive ? 'active' : ''}" 
        data-page="${page.number}"
      >
        ${page.number}
      </button>
    `).join('');

    this.elements.pageNumbers.innerHTML = pageButtons;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================================================
// COLLECTION MANAGER - Main controller for managing collections
// ============================================================================
export class CollectionManager {
  constructor(elements, config) {
    this.elements = elements;
    this.config = config;
    this.firebaseService = config.firebaseService;
    this.collectionName = config.collectionName;
    this.uiManager = new UIManager(elements);
    this.pagination = new PaginationManager({ pageSize: config.pageSize || 10 });
    this.currentEditId = null;
    this.deleteItemId = null;

    this.bindMethods();
    this.initEventListeners();
  }

  bindMethods() {
    this.openCreateModal = this.openCreateModal.bind(this);
    this.openEditModal = this.openEditModal.bind(this);
    this.openDeleteModal = this.openDeleteModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.closeDeleteModal = this.closeDeleteModal.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.goToPage = this.goToPage.bind(this);
    this.goToFirstPage = this.goToFirstPage.bind(this);
    this.goToPrevPage = this.goToPrevPage.bind(this);
    this.goToNextPage = this.goToNextPage.bind(this);
    this.goToLastPage = this.goToLastPage.bind(this);
    this.changePageSize = this.changePageSize.bind(this);
  }

  initEventListeners() {
    // Create buttons
    this.elements.btnCreate?.addEventListener('click', this.openCreateModal);
    this.elements.btnCreateEmpty?.addEventListener('click', this.openCreateModal);

    // Modal close buttons
    this.elements.btnCloseModal?.addEventListener('click', this.closeModal);
    this.elements.btnCancel?.addEventListener('click', this.closeModal);

    // Delete modal buttons
    this.elements.btnCloseDelete?.addEventListener('click', this.closeDeleteModal);
    this.elements.btnCancelDelete?.addEventListener('click', this.closeDeleteModal);
    this.elements.btnConfirmDelete?.addEventListener('click', this.confirmDelete);

    // Form submission
    this.elements.form?.addEventListener('submit', this.handleFormSubmit);

    // Pagination controls
    this.elements.btnFirst?.addEventListener('click', this.goToFirstPage);
    this.elements.btnPrev?.addEventListener('click', this.goToPrevPage);
    this.elements.btnNext?.addEventListener('click', this.goToNextPage);
    this.elements.btnLast?.addEventListener('click', this.goToLastPage);
    this.elements.pageSize?.addEventListener('change', this.changePageSize);

    // Page number clicks (using event delegation)
    this.elements.pageNumbers?.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-page')) {
        const page = parseInt(e.target.dataset.page);
        this.goToPage(page);
      }
    });

    // Modal overlay clicks
    this.elements.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.modalOverlay) {
        this.closeModal();
      }
    });

    this.elements.deleteModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.deleteModal) {
        this.closeDeleteModal();
      }
    });
  }

  async fetchItems() {
    try {
      this.uiManager.showLoading();

      const items = await this.firebaseService.getAll(
        this.collectionName,
        this.config.orderBy || 'createdAt',
        this.config.orderDirection || 'desc'
      );

      this.pagination.setItems(items);
      this.uiManager.hideLoading();

      if (items.length === 0) {
        this.uiManager.showEmptyState();
      } else {
        this.uiManager.showTable();
        this.renderCurrentPage();
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      this.uiManager.hideLoading();
      this.uiManager.showToast('Error loading items: ' + error.message);
    }
  }

  renderCurrentPage() {
    const items = this.pagination.getCurrentPageItems();
    const columns = this.config.columns;
    const actions = this.getActions();

    this.uiManager.renderTable(items, columns, actions);
    this.updatePaginationControls();
  }

  updatePaginationControls() {
    const paginationInfo = this.pagination.getPaginationInfo();
    const pageNumbers = this.pagination.getVisiblePageNumbers(5);
    this.uiManager.updatePaginationControls(paginationInfo, pageNumbers);
  }

  getActions() {
    const instanceId = this.config.instanceId || 'manager';
    return [
      {
        render: (item) => `
          <button class="btn btn-secondary btn-icon" onclick="${instanceId}.openEditModal('${item.id}')" title="Edit">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        `
      },
      {
        render: (item) => `
          <button class="btn btn-destructive btn-icon" onclick="${instanceId}.openDeleteModal('${item.id}')" title="Delete">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        `
      }
    ];
  }

  goToPage(page) {
    if (this.pagination.goToPage(page)) {
      this.renderCurrentPage();
    }
  }

  goToFirstPage() {
    if (this.pagination.goToFirst()) {
      this.renderCurrentPage();
    }
  }

  goToPrevPage() {
    if (this.pagination.goToPrev()) {
      this.renderCurrentPage();
    }
  }

  goToNextPage() {
    if (this.pagination.goToNext()) {
      this.renderCurrentPage();
    }
  }

  goToLastPage() {
    if (this.pagination.goToLast()) {
      this.renderCurrentPage();
    }
  }

  changePageSize() {
    const newSize = this.elements.pageSize.value;
    this.pagination.setPageSize(newSize);
    this.renderCurrentPage();
  }

  openCreateModal() {
    this.currentEditId = null;
    this.uiManager.openModal(
      this.config.modalTitles?.create || 'Create Item',
      this.config.buttonTexts?.create || 'Create'
    );
    
    this.elements.form?.reset();
    this.config.onOpenCreate?.(this.elements);
    
    // Focus first input if specified
    if (this.config.firstInputField && this.elements[this.config.firstInputField]) {
      this.elements[this.config.firstInputField].focus();
    }
  }

  async openEditModal(id) {
    try {
      const item = await this.firebaseService.getOne(this.collectionName, id);

      this.currentEditId = id;
      this.uiManager.openModal(
        this.config.modalTitles?.edit || 'Edit Item',
        this.config.buttonTexts?.edit || 'Update'
      );

      this.config.onOpenEdit?.(item, this.elements);
      
      // Focus first input if specified
      if (this.config.firstInputField && this.elements[this.config.firstInputField]) {
        this.elements[this.config.firstInputField].focus();
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      this.uiManager.showToast('Error loading item');
    }
  }

  closeModal() {
    this.uiManager.closeModal();
    this.currentEditId = null;
  }

  openDeleteModal(id) {
    this.deleteItemId = id;
    this.uiManager.openDeleteModal();
  }

  closeDeleteModal() {
    this.uiManager.closeDeleteModal();
    this.deleteItemId = null;
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    const data = this.config.getFormData(this.elements);

    if (!this.config.validateForm(data)) {
      this.uiManager.showToast(this.config.messages?.validationError || 'Please fill in all required fields');
      return;
    }

    try {
      this.elements.btnSubmit.disabled = true;

      if (this.currentEditId) {
        await this.firebaseService.update(this.collectionName, this.currentEditId, data);
        this.uiManager.showToast(this.config.messages?.updateSuccess || 'Item updated successfully');
      } else {
        await this.firebaseService.create(this.collectionName, data);
        this.uiManager.showToast(this.config.messages?.createSuccess || 'Item created successfully');
      }

      this.closeModal();
      await this.fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      this.uiManager.showToast((this.config.messages?.saveError || 'Error saving item') + ': ' + error.message);
    } finally {
      this.elements.btnSubmit.disabled = false;
    }
  }

  async confirmDelete() {
    if (!this.deleteItemId) return;

    try {
      await this.firebaseService.delete(this.collectionName, this.deleteItemId);
      this.uiManager.showToast(this.config.messages?.deleteSuccess || 'Item deleted successfully');
      this.closeDeleteModal();
      await this.fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      this.uiManager.showToast((this.config.messages?.deleteError || 'Error deleting item') + ': ' + error.message);
    }
  }

  async initialize() {
    await this.fetchItems();
  }

  refresh() {
    return this.fetchItems();
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// 1. Initialize Firebase Service
