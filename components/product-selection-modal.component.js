import { ProductService } from '../services/product.service.js';

const MODAL_STYLES = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .modal-overlay.open {
        opacity: 1;
        visibility: visible;
    }
    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 90%;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 15px;
    }
    .modal-header h3 {
        margin: 0;
        font-size: 1.5em;
        color: #333;
    }
    .close-button {
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        color: #666;
    }
    .close-button:hover {
        color: #333;
    }
    .filters {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
        flex-wrap: wrap;
    }
    .filters select {
        padding: 8px;
        border-radius: 5px;
        border: 1px solid #ccc;
    }
    .product-table-container {
        flex-grow: 1;
        overflow-y: auto;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
    .product-table {
        width: 100%;
        border-collapse: collapse;
    }
    .product-table th, .product-table td {
        border: 1px solid #eee;
        padding: 10px;
        text-align: left;
        font-size: 0.9em;
    }
    .product-table th {
        background-color: #f8f8f8;
        cursor: pointer;
        white-space: nowrap;
    }
    .product-table th:hover {
        background-color: #f0f0f0;
    }
    .product-table tbody tr:hover {
        background-color: #f5f5f5;
    }
    .product-table tbody tr.selected {
        background-color: #e0f7fa;
    }
    .add-to-cart-button {
        background-color: #28a745;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        align-self: flex-end;
        font-size: 1em;
    }
    .add-to-cart-button:hover {
        background-color: #218838;
    }
    .no-products-message {
        text-align: center;
        padding: 20px;
        color: #777;
    }
    .pagination {
        display: flex;
        justify-content: center;
        padding: 10px 0;
        gap: 5px;
    }
    .pagination button {
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
    }
    .pagination button.active {
        background-color: #007bff;
        color: white;
        border-color: #007bff;
    }
`;

export default class ProductSelectionModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.products = [];
        this.filteredProducts = [];
        this.selectedProduct = null;

        // Filter states
        this.brandFilter = 'All';
        this.lensTypeFilter = 'All';
        this.wearTypeFilter = 'All';

        // Sorting states
        this.sortColumn = null;
        this.sortDirection = 'asc'; // 'asc' or 'desc'

        // Pagination states
        this.currentPage = 1;
        this.productsPerPage = 10;

        // Bind event handlers
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);

        this._handleFilterChange = this._handleFilterChange.bind(this);
        this._handleSortClick = this._handleSortClick.bind(this);
        this._handleProductSelect = this._handleProductSelect.bind(this);
        this._handleAddToCart = this._handleAddToCart.bind(this);
        this._handlePageChange = this._handlePageChange.bind(this);
    }

    connectedCallback() {
        this._render();
        // Fetch products when component connects
        this.products = ProductService.getProducts();
        this._applyFiltersAndSort();
    }

    disconnectedCallback() {
        // No external event listeners to remove
    }

    // Public method to open the modal
    openModal() {
        this.isOpen = true;
        this._applyFiltersAndSort(); // Re-apply filters and sort in case products changed
        this.shadowRoot.querySelector('.modal-overlay').classList.add('open'); // Explicitly add class
    }

    // Public method to close the modal
    closeModal() {
        this.isOpen = false;
        this.selectedProduct = null; // Clear selection on close
        this.shadowRoot.querySelector('.modal-overlay').classList.remove('open'); // Explicitly remove class
        document.dispatchEvent(new CustomEvent('closeProductSelectionModal'));
    }

    _handleFilterChange(event) {
        const { name, value } = event.target;
        if (name === 'brandFilter') this.brandFilter = value;
        if (name === 'lensTypeFilter') this.lensTypeFilter = value;
        if (name === 'wearTypeFilter') this.wearTypeFilter = value;
        this.currentPage = 1; // Reset to first page on filter change
        this._applyFiltersAndSort();
    }

    _handleSortClick(event) {
        const newSortColumn = event.target.dataset.sortColumn;
        if (this.sortColumn === newSortColumn) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = newSortColumn;
            this.sortDirection = 'asc';
        }
        this._applyFiltersAndSort();
    }

    _handleProductSelect(event) {
        const productId = parseInt(event.currentTarget.dataset.productId, 10);
        this.selectedProduct = this.products.find(p => p.id === productId);
        this._renderProductTable(); // Re-render to highlight selection
    }

    _handleAddToCart() {
        if (this.selectedProduct) {
            document.dispatchEvent(new CustomEvent('productSelectedForSale', {
                detail: {
                    product: this.selectedProduct,
                    quantity: 1 // Default quantity, can be made interactive later
                }
            }));
            this.closeModal(); // Call public close method
        } else {
            alert('제품을 선택해주세요.');
        }
    }

    _handlePageChange(event) {
        this.currentPage = parseInt(event.target.dataset.page, 10);
        this._renderProductTable();
        this._renderPagination();
    }

    _applyFiltersAndSort() {
        let tempProducts = [...this.products];

        // Apply filters
        if (this.brandFilter !== 'All') {
            tempProducts = tempProducts.filter(p => p.brand === this.brandFilter);
        }
        if (this.lensTypeFilter !== 'All') {
            tempProducts = tempProducts.filter(p => p.lensType === this.lensTypeFilter);
        }
        if (this.wearTypeFilter !== 'All') {
            tempProducts = tempProducts.filter(p => p.wearType === this.wearTypeFilter);
        }

        // Apply sorting
        if (this.sortColumn) {
            tempProducts.sort((a, b) => {
                const valA = a[this.sortColumn];
                const valB = b[this.sortColumn];

                if (valA === null || valA === undefined) return this.sortDirection === 'asc' ? 1 : -1;
                if (valB === null || valB === undefined) return this.sortDirection === 'asc' ? -1 : 1;

                if (typeof valA === 'string' && typeof valB === 'string') {
                    return this.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return this.sortDirection === 'asc' ? valA - valB : valB - valA;
            });
        }
        this.filteredProducts = tempProducts;
        this._renderProductTable();
        this._renderPagination();
    }

    _getUniqueFilterValues(key) {
        const values = new Set(this.products.map(p => p[key]).filter(Boolean));
        return ['All', ...Array.from(values).sort()];
    }

    _renderFilterOptions() {
        const brands = this._getUniqueFilterValues('brand');
        const lensTypes = this._getUniqueFilterValues('lensType');
        const wearTypes = this._getUniqueFilterValues('wearType');

        return `
            <select name="brandFilter">
                ${brands.map(brand => `<option value="${brand}" ${this.brandFilter === brand ? 'selected' : ''}>${brand}</option>`).join('')}
            </select>
            <select name="lensTypeFilter">
                ${lensTypes.map(type => `<option value="${type}" ${this.lensTypeFilter === type ? 'selected' : ''}>${type}</option>`).join('')}
            </select>
            <select name="wearTypeFilter">
                ${wearTypes.map(type => `<option value="${type}" ${this.wearTypeFilter === type ? 'selected' : ''}>${type}</option>`).join('')}
            </select>
        `;
    }

    _renderProductTable() {
        const tableBody = this.shadowRoot.querySelector('.product-table tbody');
        const noProductsMessage = this.shadowRoot.querySelector('.no-products-message');
        
        if (!tableBody) return; // Guard clause

        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToDisplay = this.filteredProducts.slice(startIndex, endIndex);

        if (productsToDisplay.length === 0) {
            tableBody.innerHTML = '';
            if (noProductsMessage) noProductsMessage.style.display = 'block';
            return;
        }

        if (noProductsMessage) noProductsMessage.style.display = 'none';

        tableBody.innerHTML = productsToDisplay.map(product => `
            <tr data-product-id="${product.id}" class="${this.selectedProduct && this.selectedProduct.id === product.id ? 'selected' : ''}">
                <td>${product.brand}</td>
                <td>${product.model}</td>
                <td>${product.lensType || 'N/A'}</td>
                <td>${product.wearType || 'N/A'}</td>
                <td>${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}</td>
                <td>${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}</td>
                <td>${product.powerAX !== null ? product.powerAX : 'N/A'}</td>
                <td>${product.quantity}</td>
                <td>${product.expirationDate || 'N/A'}</td>
            </tr>
        `).join('');

        this.shadowRoot.querySelectorAll('.product-table tbody tr').forEach(row => {
            row.addEventListener('click', this._handleProductSelect);
        });
    }

    _renderPagination() {
        const paginationContainer = this.shadowRoot.querySelector('.pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `<button data-page="${i}" class="${this.currentPage === i ? 'active' : ''}">${i}</button>`;
        }
        paginationContainer.innerHTML = paginationHtml;

        this.shadowRoot.querySelectorAll('.pagination button').forEach(button => {
            button.addEventListener('click', this._handlePageChange);
        });
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>${MODAL_STYLES}</style>
            <div class="modal-overlay ${this.isOpen ? 'open' : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>제품 선택</h3>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="filters">
                        ${this._renderFilterOptions()}
                    </div>
                    <div class="product-table-container">
                        <table class="product-table">
                            <thead>
                                <tr>
                                    <th data-sort-column="brand">브랜드</th>
                                    <th data-sort-column="model">모델</th>
                                    <th data-sort-column="lensType">유형</th>
                                    <th data-sort-column="wearType">착용 방식</th>
                                    <th data-sort-column="powerS">S</th>
                                    <th data-sort-column="powerC">C</th>
                                    <th data-sort-column="powerAX">AX</th>
                                    <th data-sort-column="quantity">수량</th>
                                    <th data-sort-column="expirationDate">유통기한</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Product rows will be rendered here -->
                            </tbody>
                        </table>
                        <p class="no-products-message" style="display: none;">표시할 제품이 없습니다.</p>
                    </div>
                    <div class="pagination">
                        <!-- Pagination buttons will be rendered here -->
                    </div>
                    <button class="add-to-cart-button">선택한 제품 카트에 추가</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector('.close-button').addEventListener('click', this.closeModal); // Call public close method
        this.shadowRoot.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal(); // Call public close method
            }
        });
        this.shadowRoot.querySelectorAll('.filters select').forEach(select => {
            select.addEventListener('change', this._handleFilterChange);
        });
        this.shadowRoot.querySelectorAll('.product-table th[data-sort-column]').forEach(header => {
            header.addEventListener('click', this._handleSortClick);
        });
        this.shadowRoot.querySelector('.add-to-cart-button').addEventListener('click', this._handleAddToCart);
        
        // Initial render of products and pagination
        this._renderProductTable();
        this._renderPagination();
    }
}

customElements.define('product-selection-modal', ProductSelectionModal);