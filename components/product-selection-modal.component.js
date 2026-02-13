import { ProductService } from '../services/product.service.js';

// Utility to augment products with powerOptions structure
function augmentProductWithPowerOptions(product) {
    if (product.powerOptions && product.powerOptions.length > 0) {
        return product;
    }
    return {
        ...product,
        powerOptions: [{
            detailId: `${product.id}-${product.powerS}-${product.powerC}-${product.powerAX}`, // Unique ID for this power option
            s: product.powerS,
            c: product.powerC,
            ax: product.powerAX,
            quantity: product.quantity // Total quantity for this specific power option
        }]
    };
}

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

import { ProductService } from '../services/product.service.js';

// Utility to augment products with powerOptions structure
function augmentProductWithPowerOptions(product) {
    if (product.powerOptions && product.powerOptions.length > 0) {
        return product;
    }
    return {
        ...product,
        powerOptions: [{
            detailId: `${product.id}-${product.powerS}-${product.powerC}-${product.powerAX}`, // Unique ID for this power option
            s: product.powerS,
            c: product.powerC,
            ax: product.powerAX,
            quantity: product.quantity // Total quantity for this specific power option
        }]
    };
}

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

    /* New styles for multi-step selection, from discard-inventory-modal */
    .modal-body {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }
    .brand-buttons-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 15px;
        margin-top: 1rem;
    }
    .brand-filter-button {
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        padding: 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1em;
        font-weight: bold;
        text-align: center;
        transition: background-color 0.2s, border-color 0.2s;
    }
    .brand-filter-button:hover {
        background-color: #e0e0e0;
        border-color: #a0a0a0;
    }
    .product-selection-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 1rem;
    }
    .product-selection-list-item {
        background-color: #f9f9f9;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        transition: all 0.2s ease-in-out;
        cursor: pointer;
    }
    .product-selection-list-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .product-info-main {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        color: #333;
        font-size: 1.1em;
    }
    .product-info-detail {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .power-axis-combined {
        font-size: 0.9em;
        color: #666;
    }
    .back-button {
        background-color: #6c757d;
        color: white;
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-bottom: 15px;
        font-size: 0.9em;
        transition: background-color 0.2s;
    }
    .back-button:hover {
        background-color: #5a6268;
    }
    .power-option-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    .power-option-table th, .power-option-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: center;
    }
    .power-option-table th {
        background-color: #f2f2f2;
        cursor: pointer;
    }
    .power-option-table th.active {
        background-color: #007bff;
        color: white;
    }
    .power-option-table tbody tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    .power-option-table tbody tr:hover {
        background-color: #e0e0e0;
    }
    .power-option-table-row.selected {
        border-color: #007bff;
        box-shadow: 0 0 10px rgba(0, 123, 255, 0.2);
        background-color: #e7f3ff;
    }
    .select-quantity-input {
        width: 70px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        text-align: center;
        -moz-appearance: textfield; /* Firefox */
    }
    .select-quantity-input::-webkit-outer-spin-button,
    .select-quantity-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;

export default class ProductSelectionModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this._products = []; // All products with their powerOptions
        this._currentFilterBrand = null; // Currently selected brand for filtering products
        this._currentFilterProduct = null; // Currently selected product for viewing power options
        this._sortBy = null; // 's' or 'c' or 'ax' for power options
        this._sortOrder = 'asc'; // 'asc' or 'desc'
        this._selectedPowerOptionForSale = null; // Stores the final selected power option variant for sale
        this._selectedQuantityForSale = 1; // Stores the quantity for the selected power option

        // Bind event handlers
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this._filterByBrand = this._filterByBrand.bind(this);
        this._showAllBrands = this._showAllBrands.bind(this);
        this._filterByProduct = this._filterByProduct.bind(this);
        this._showAllProductsForBrand = this._showAllProductsForBrand.bind(this);
        this._handlePowerOptionSelection = this._handlePowerOptionSelection.bind(this);
        this._handleQuantityChange = this._handleQuantityChange.bind(this);
        this._handleSort = this._handleSort.bind(this);
        this._handleAddToCart = this._handleAddToCart.bind(this);
        this._handleProductDoubleClick = this._handleProductDoubleClick.bind(this);
    }

    connectedCallback() {
        this._render();
    }

    disconnectedCallback() {
        // No external event listeners to remove
    }

    // Public method to open the modal
    openModal() {
        this.isOpen = true;
        this._products = ProductService.getProducts().map(augmentProductWithPowerOptions); // Re-fetch and augment products
        this._currentFilterBrand = null; // Reset to brand selection view
        this._currentFilterProduct = null;
        this._selectedPowerOptionForSale = null;
        this._selectedQuantityForSale = 1;
        this._sortBy = null;
        this._sortOrder = 'asc';

        const modalOverlay = this.shadowRoot.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.add('open');
        }
        this._render(); // Initial render to show brand selection
    }

    // Public method to close the modal
    closeModal() {
        this.isOpen = false;
        this._selectedPowerOptionForSale = null; // Clear selection on close
        this._selectedQuantityForSale = 1;
        const modalOverlay = this.shadowRoot.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('open');
        }
        document.dispatchEvent(new CustomEvent('closeProductSelectionModal'));
    }

    _filterByBrand(brand) {
        this._currentFilterBrand = brand;
        this._currentFilterProduct = null;
        this._selectedPowerOptionForSale = null;
        this._selectedQuantityForSale = 1;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._render();
    }

    _showAllBrands() {
        this._currentFilterBrand = null;
        this._currentFilterProduct = null;
        this._selectedPowerOptionForSale = null;
        this._selectedQuantityForSale = 1;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._render();
    }

    _filterByProduct(productId) {
        this._currentFilterProduct = this._products.find(p => p.id === productId);
        this._selectedPowerOptionForSale = null;
        this._selectedQuantityForSale = 1;
        this._sortBy = 's'; // Default sort by 's' when viewing power options
        this._sortOrder = 'asc';
        this._render();
    }

    _showAllProductsForBrand() {
        this._currentFilterProduct = null;
        this._selectedPowerOptionForSale = null;
        this._selectedQuantityForSale = 1;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._render();
    }

    _handlePowerOptionSelection(productId, powerOptionKey) {
        const product = this._products.find(p => p.id === productId);
        const powerOption = product?.powerOptions.find(opt => opt.detailId === powerOptionKey);
        
        if (!product || !powerOption) return;

        if (this._selectedPowerOptionForSale && this._selectedPowerOptionForSale.detailId === powerOptionKey) {
            // Deselect if already selected
            this._selectedPowerOptionForSale = null;
            this._selectedQuantityForSale = 1;
        } else {
            // Select new power option
            this._selectedPowerOptionForSale = powerOption;
            this._selectedQuantityForSale = Math.min(1, powerOption.quantity); // Default to 1 or max available
        }
        this._render(); // Re-render to update selection visual and button state
    }

    _handleQuantityChange(powerOptionKey, quantity) {
        if (!this._selectedPowerOptionForSale || this._selectedPowerOptionForSale.detailId !== powerOptionKey) {
            console.warn("Quantity changed for unselected or mismatching power option.");
            return;
        }

        // The product ID for selectedPowerOptionForSale needs to be the original product.id (Firestore ID)
        const originalProduct = this._products.find(p => p.id === this._selectedPowerOptionForSale.detailId.split('-')[0]); 
        const powerOption = originalProduct?.powerOptions.find(opt => opt.detailId === powerOptionKey);
        
        if (!originalProduct || !powerOption) return;

        const numQuantity = parseInt(quantity, 10);
        if (!isNaN(numQuantity) && numQuantity > 0 && numQuantity <= powerOption.quantity) {
            this._selectedQuantityForSale = numQuantity;
        } else {
            alert(`수량은 1 이상 ${powerOption.quantity} 이하로 입력해주세요.`);
            this._selectedQuantityForSale = Math.min(1, powerOption.quantity); // Reset to valid quantity
        }
        this._render(); // Re-render to update input value and button state
    }

    _handleSort(sortBy) {
        if (this._sortBy === sortBy) {
            this._sortOrder = (this._sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            this._sortBy = sortBy;
            this._sortOrder = 'asc';
        }
        this._render();
    }

    _handleAddToCart() {
        if (this._selectedPowerOptionForSale) {
            // Find the full product object that contains this power option
            const originalProduct = this._products.find(p => p.id === this._selectedPowerOptionForSale.detailId.split('-')[0]);
            if (originalProduct) {
                // Combine original product details with selected power option details
                const productToAdd = { 
                    ...originalProduct, 
                    ...this._selectedPowerOptionForSale,
                    // Ensure the quantity is the selected quantity for sale, not the total stock quantity
                    quantity: this._selectedQuantityForSale 
                };
                
                document.dispatchEvent(new CustomEvent('productSelectedForSale', {
                    detail: {
                        product: productToAdd,
                        quantity: this._selectedQuantityForSale
                    }
                }));
                this.closeModal();
            } else {
                alert('제품 정보를 찾을 수 없습니다.');
            }
        } else {
            alert('카트에 추가할 제품 도수를 선택해주세요.');
        }
    }

    _handleProductDoubleClick(event) {
        const row = event.currentTarget;
        const productId = row.dataset.productId;
        const powerOptionKey = row.dataset.detailId; // This is the detailId, not necessarily the productId for `find`
        
        const product = this._products.find(p => p.id === productId); // Find the original product (variant)
        const powerOption = product?.powerOptions.find(opt => opt.detailId === powerOptionKey);

        if (product && powerOption) {
            const productToAdd = { 
                ...product, 
                ...powerOption,
                quantity: Math.min(1, powerOption.quantity) // Double-click adds 1 or max available
            };

            document.dispatchEvent(new CustomEvent('productSelectedForSale', {
                detail: {
                    product: productToAdd,
                    quantity: productToAdd.quantity
                }
            }));
            this.closeModal();
        } else {
            alert('유효한 제품 도수 옵션을 선택해주세요.');
        }
    }

    _sortPowerOptions(powerOptions) {
        if (!this._sortBy) return powerOptions;

        return [...powerOptions].sort((a, b) => {
            let valA = a[this._sortBy];
            let valB = b[this._sortBy];

            valA = (valA === null || valA === undefined || valA === 'N/A') ? (this._sortOrder === 'asc' ? -Infinity : Infinity) : valA;
            valB = (valB === null || valB === undefined || valB === 'N/A') ? (this._sortOrder === 'asc' ? -Infinity : Infinity) : valB;

            if (valA < valB) {
                return this._sortOrder === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return this._sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    _renderBrandSelectionView() {
        const uniqueBrands = [...new Set(this._products.map(p => p.brand))];
        if (uniqueBrands.length === 0) return `<p class="message">등록된 브랜드가 없습니다.</p>`;
        
        return `
            <div class="brand-buttons-grid">
                ${uniqueBrands.map(brand => `
                    <button class="brand-filter-button" data-brand="${brand}">${brand}</button>
                `).join('')}
            </div>
        `;
    }

    _renderProductSelectionView() {
        const productsForBrand = this._products.filter(p => p.brand === this._currentFilterBrand);
        if (productsForBrand.length === 0) return `<p class="message">"${this._currentFilterBrand}" 브랜드의 제품이 없습니다.</p>`;
        
        return `
            <button class="back-button back-to-brands-btn">← 전체 브랜드 보기</button>
            <div class="product-selection-list">
                ${productsForBrand.map(product => `
                    <div class="product-selection-list-item" data-product-id="${product.id}">
                        <div class="product-info-main">
                            <span class="brand-model">${product.brand} - ${product.model}</span>
                            <span class="quantity-display">총 수량: ${product.powerOptions.reduce((sum, opt) => sum + opt.quantity, 0)}</span>
                        </div>
                        <div class="product-info-detail">
                            <span class="power-axis-combined">
                                ${product.powerOptions.map(opt => `S:${(opt.s !== null && opt.s !== undefined) ? (opt.s > 0 ? '+' : '') + opt.s.toFixed(2) : 'N/A'} C:${(opt.c !== null && opt.c !== undefined) ? (opt.c > 0 ? '+' : '') + opt.c.toFixed(2) : 'N/A'} AX:${opt.ax !== null ? opt.ax : 'N/A'}`).join(' / ')}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    _renderPowerOptionSelectionView() {
        const product = this._currentFilterProduct;
        if (!product) return `<p class="message">제품을 선택해주세요.</p>`;

        if (product.powerOptions.length === 0) return `<p class="message">"${product.brand} - ${product.model}" 제품에 도수 정보가 없습니다.</p>`;
        
        const sortedPowerOptions = this._sortPowerOptions(product.powerOptions);

        return `
            <button class="back-button back-to-products-btn">← 제품 목록으로</button>
            <table class="power-option-table">
                <thead>
                    <tr>
                        <th class="${this._sortBy === 's' ? 'active' : ''}" data-sort-by="s">
                            S ${this._sortBy === 's' ? (this._sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th class="${this._sortBy === 'c' ? 'active' : ''}" data-sort-by="c">
                            C ${this._sortBy === 'c' ? (this._sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th>AX</th>
                        <th>수량</th>
                        <th>선택 수량</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedPowerOptions.map(option => {
                        const isSelected = this._selectedPowerOptionForSale && this._selectedPowerOptionForSale.detailId === option.detailId;
                        const quantityToDisplay = isSelected ? this._selectedQuantityForSale : '';
                        return `
                            <tr class="power-option-table-row ${isSelected ? 'selected' : ''}" data-product-id="${product.id}" data-detail-id="${option.detailId}">
                                <td>${(option.s !== null && option.s !== undefined) ? (option.s > 0 ? '+' : '') + option.s.toFixed(2) : 'N/A'}</td>
                                <td>${(option.c !== null && option.c !== undefined) ? (option.c > 0 ? '+' : '') + option.c.toFixed(2) : 'N/A'}</td>
                                <td>${option.ax !== null ? option.ax : 'N/A'}</td>
                                <td>${option.quantity}</td>
                                <td>
                                    <input type="number" min="1" max="${option.quantity}" value="${quantityToDisplay}"
                                           data-product-id="${product.id}" data-detail-id="${option.detailId}" 
                                           class="select-quantity-input" ${isSelected ? '' : 'disabled'}>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }


    _render() {
        this._detachEventListeners(); // Detach existing listeners before re-rendering
        let contentHtml = '';
        let modalTitle = '제품 선택';
        let showAddToCartButton = true;

        if (!this._currentFilterBrand) { // View 1: Brand Selection
            contentHtml = this._renderBrandSelectionView();
            modalTitle += ' - 브랜드 선택';
            showAddToCartButton = false;
        } else if (!this._currentFilterProduct) { // View 2: Product Selection for a specific brand
            contentHtml = this._renderProductSelectionView();
            modalTitle = `제품 선택 - ${this._currentFilterBrand} 제품 선택`;
            showAddToCartButton = false;
        } else { // View 3: Power Option Selection for a specific product
            contentHtml = this._renderPowerOptionSelectionView();
            modalTitle = `제품 선택 - ${this._currentFilterProduct.brand} - ${this._currentFilterProduct.model} 도수 선택`;
            // Add to cart button visibility based on whether a power option is selected
            showAddToCartButton = !!this._selectedPowerOptionForSale; 
        }

        this.shadowRoot.innerHTML = `
            <style>${MODAL_STYLES}</style>
            <div class="modal-overlay ${this.isOpen ? 'open' : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${modalTitle}</h3>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${contentHtml}
                    </div>
                    <div class="modal-actions" style="${showAddToCartButton ? '' : 'display: none;'}">
                        <button class="add-to-cart-button" ${this._selectedPowerOptionForSale && this._selectedQuantityForSale > 0 ? '' : 'disabled'}>선택한 제품 카트에 추가</button>
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector('.close-button').addEventListener('click', this.closeModal);
        this.shadowRoot.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
        
        // Dynamic event listeners based on the current view
        if (!this._currentFilterBrand) { // View 1: Brand Selection
            this.shadowRoot.querySelectorAll('.brand-filter-button').forEach(button => {
                button.addEventListener('click', (e) => this._filterByBrand(e.currentTarget.dataset.brand));
            });
        } else if (!this._currentFilterProduct) { // View 2: Product Selection
            this.shadowRoot.querySelector('.back-button.back-to-brands-btn')?.addEventListener('click', this._showAllBrands);
            this.shadowRoot.querySelectorAll('.product-selection-list-item').forEach(item => {
                item.addEventListener('click', (e) => this._filterByProduct(e.currentTarget.dataset.productId));
            });
        } else { // View 3: Power Option Selection
            this.shadowRoot.querySelector('.back-button.back-to-products-btn')?.addEventListener('click', this._showAllProductsForBrand);
            this.shadowRoot.querySelectorAll('.power-option-table-row').forEach(row => {
                row.addEventListener('click', (e) => {
                    // Prevent row click from affecting input
                    if (e.target.classList.contains('select-quantity-input')) {
                        return;
                    }
                    const productId = row.dataset.productId; // Keep as string
                    const powerOptionKey = row.dataset.detailId;
                    this._handlePowerOptionSelection(productId, powerOptionKey);
                });
                row.addEventListener('dblclick', (e) => {
                    if (e.target.classList.contains('select-quantity-input')) {
                        return;
                    }
                    const productId = row.dataset.productId;
                    const powerOptionKey = row.dataset.detailId;
                    this._handleProductDoubleClick({ currentTarget: row, dataset: { productId, detailId: powerOptionKey } });
                });
            });
            this.shadowRoot.querySelectorAll('.select-quantity-input').forEach(input => {
                input.addEventListener('change', (e) => this._handleQuantityChange(e.target.dataset.detailId, e.target.value));
                input.addEventListener('input', (e) => this._handleQuantityChange(e.target.dataset.detailId, e.target.value));
            });
            this.shadowRoot.querySelectorAll('.power-option-table th[data-sort-by]').forEach(header => {
                header.addEventListener('click', (e) => this._handleSort(e.currentTarget.dataset.sortBy));
            });
        }
        
        // Add to Cart button listener
        const addToCartBtn = this.shadowRoot.querySelector('.add-to-cart-button');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', this._handleAddToCart);
        }
    }
}

customElements.define('product-selection-modal', ProductSelectionModal);