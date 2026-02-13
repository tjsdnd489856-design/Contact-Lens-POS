import { ProductService } from '../services/product.service.js';

// --- Constants ---
const MESSAGES = {
    SELECT_DISCARD_ITEM: '폐기할 제품을 선택해주세요.',
    CONFIRM_DISCARD: '선택한 제품을 폐기하시겠습니까?',
    DISCARD_SUCCESS: '제품이 성공적으로 폐기되었습니다.',
    INVALID_QUANTITY: (max) => `폐기 수량은 0 이상 ${max} 이하로 입력해주세요.`,
    NO_BRANDS_REGISTERED: '등록된 브랜드가 없습니다.',
    NO_PRODUCTS_FOR_BRAND: (brand) => `"${brand}" 브랜드의 제품이 없습니다.`,
    NO_POWER_OPTIONS_FOR_PRODUCT: (brand, model) => `"${brand} - ${model}" 제품에 도수 정보가 없습니다.`,
};

const DISCARD_MODAL_STYLES = `
    :host {
        display: block;
    }
    .discard-container {
        padding: 20px;
    }
    h3 {
        margin-top: 0;
        color: #333;
        text-align: center;
        margin-bottom: 20px;
    }
    .message {
        text-align: center;
        padding: 20px;
        color: #555;
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
    /* Product Selection List Styles */
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
    .product-selection-list-item.selected {
        border-color: #007bff;
        box-shadow: 0 0 10px rgba(0, 123, 255, 0.2);
        background-color: #e7f3ff;
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
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }
    #discard-confirm-btn {
        background-color: #dc3545;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
    }
    #discard-confirm-btn:hover {
        background-color: #c82333;
    }
    #discard-confirm-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
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
    /* New table styles */
    .power-option-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        display: block; /* Necessary for tbody to scroll independently */
    }
    .power-option-table thead, .power-option-table tbody {
        display: table; /* To maintain table semantics */
        width: 100%; /* Important for column alignment */
        table-layout: fixed; /* For consistent column widths */
    }
    .power-option-table th, .power-option-table td {
        width: auto; /* Let table-layout: fixed handle widths */
        white-space: nowrap; /* Prevent wrapping if content is too long */
        border: 1px solid #ddd; /* Ensure borders are present */
        padding: 8px; /* Ensure padding is present */
        text-align: center; /* Ensure text alignment is present */
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
    .discard-quantity-input {
        width: 70px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        text-align: center;
        -moz-appearance: textfield; /* Firefox */
    }
    .discard-quantity-input::-webkit-outer-spin-button,
    .discard-quantity-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .power-options-scroll-container {
        /* This container is for the thead to scroll */
        max-height: 300px; /* This will be overridden by the tbody-scroll, if used */
        overflow-y: visible; /* Let the tbody-scroll handle vertical scrolling */
        border: none; /* Remove border, it will be on table */
        border-radius: 0; /* Remove border-radius */
    }
    .power-option-table-body-scroll {
        max-height: calc(15 * 38px); /* Approximate height for 15 rows (8px padding + default line-height) */
        overflow-y: auto;
        display: block; /* Important for scroll */
        width: 100%;
    }
    .power-option-table thead {
        position: sticky;
        top: 0; /* Stick to the top of the .power-options-scroll-container */
        z-index: 1;
        background-color: #f2f2f2; /* Ensure background color */
    }
`;

// Utility to augment products with powerOptions structure
function augmentProductWithPowerOptions(product) {
    if (product.powerOptions && product.powerOptions.length > 0) {
        return product;
    }
    return {
        ...product,
        powerOptions: [{
            detailId: `${product.powerS}-${product.powerC}-${product.powerAX}`, // S-C-AX combination
            variantId: product.id, // The actual Firestore ID of this variant
            s: product.powerS,
            c: product.powerC,
            ax: product.powerAX,
            quantity: product.quantity // Total quantity for this specific power option
        }]
    };
}

// --- DiscardInventoryModal Component ---
export default class DiscardInventoryModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._products = []; // All products with their powerOptions
        // Stores selections: Map<modelId (brand-model), Map<detailId (S-C-AX), { quantity: number, variantId: number }>>
        this._selectedProductsToDiscard = new Map(); 
        this._currentFilterBrand = null; // Currently selected brand for filtering products
        this._currentFilterProduct = null; // Currently selected product for viewing power options
        this._sortBy = null; // 's' or 'c'
        this._sortOrder = 'asc'; // 'asc' or 'desc'

        // Bind event handlers
        this.closeModal = this.closeModal.bind(this); // New binding
        this._filterByBrand = this._filterByBrand.bind(this);
        this._showAllBrands = this._showAllBrands.bind(this);
        this._filterByBrandAndModel = this._filterByBrandAndModel.bind(this); // New binding
        this._showAllProductsForBrand = this._showAllProductsForBrand.bind(this);
        this._handleDiscardQuantityChange = this._handleDiscardQuantityChange.bind(this);
        this._discardSelectedProducts = this._discardSelectedProducts.bind(this);
        this._handleSort = this._handleSort.bind(this);
        this._handleProductSelectionClick = this._handleProductSelectionClick.bind(this); // Bind new method
        // New bindings for event listeners
        this._handleBrandButtonClick = this._handleBrandButtonClick.bind(this);
        this._handleSortClick = this._handleSortClick.bind(this);
        this._handleDiscardQuantityInputChange = this._handleDiscardQuantityInputChange.bind(this);
        this._goBackToPreviousView = this._goBackToPreviousView.bind(this);
    }

    connectedCallback() {
        this._render();
    }

    /**
     * Sets the products to be displayed in the modal and resets the view state.
     * @param {Array<Object>} products - An array of product objects.
     */
    setProducts(products) {
        this._products = products.map(augmentProductWithPowerOptions);
        this._selectedProductsToDiscard.clear();
        this._currentFilterBrand = null;
        this._currentFilterProduct = null;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._render();
    }

    /**
     * Resets the modal's state and dispatches an event to close the outer modal container.
     */
    closeModal() {
        // Reset internal state
        this._products = ProductService.getProducts().map(augmentProductWithPowerOptions); // Re-fetch and re-augment products
        this._selectedProductsToDiscard.clear();
        this._currentFilterBrand = null;
        this._currentFilterProduct = null;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._render(); // Re-render to show initial state (empty)
        document.dispatchEvent(new CustomEvent('closeDiscardInventoryModal'));
    }

    /**
     * Handles quantity change for a product power option to discard.
     * @param {string} modelId - The ID of the model group (brand-model).
     * @param {string} detailId - The unique key for the power option (S-C-AX).
     * @param {number} variantId - The actual Firestore ID of the variant being discarded.
     * @param {string} quantity - The new quantity as a string.
     * @private
     */
    _handleDiscardQuantityChange(modelId, detailId, variantId, quantity) {
        // Find original product variant by its Firestore ID to get its max quantity
        const originalVariant = this._products.find(p => p.id === variantId);
        const powerOptionFromOriginal = originalVariant?.powerOptions.find(opt => opt.detailId === detailId && opt.variantId === variantId);
        
        if (!originalVariant || !powerOptionFromOriginal) return;

        const numQuantity = parseInt(quantity, 10);
        
        let modelSelections = this._selectedProductsToDiscard.get(modelId);
        if (!modelSelections) {
            modelSelections = new Map();
            this._selectedProductsToDiscard.set(modelId, modelSelections);
        }

        if (!isNaN(numQuantity) && numQuantity >= 0 && numQuantity <= powerOptionFromOriginal.quantity) {
            if (numQuantity > 0) {
                modelSelections.set(detailId, { quantity: numQuantity, variantId: variantId });
            } else {
                modelSelections.delete(detailId);
            }
        } else {
            alert(MESSAGES.INVALID_QUANTITY(powerOptionFromOriginal.quantity));
            modelSelections.delete(detailId); // Reset selection
        }
        
        if (modelSelections.size === 0) {
            this._selectedProductsToDiscard.delete(modelId);
        }
        this._updateRenderedSelectionState(modelId, detailId, variantId, numQuantity);
        this._updateDiscardButtonState();
    }

    /**
     * Updates the visual state of a discarded item in the rendered table.
     * @param {string} modelId - The ID of the model group (brand-model).
     * @param {string} detailId - The key of the power option (S-C-AX).
     * @param {number} variantId - The actual Firestore ID of the variant.
     * @param {number} quantity - The selected quantity.
     * @private
     */
    _updateRenderedSelectionState(modelId, detailId, variantId, quantity) {
        // Use modelId, detailId, and variantId to uniquely identify the row
        const itemElement = this.shadowRoot.querySelector(
            `.power-option-table-row[data-model-id="${modelId}"][data-detail-id="${detailId}"][data-variant-id="${variantId}"]`
        );
        if (itemElement) {
            if (quantity > 0) {
                itemElement.classList.add('selected');
                const inputElement = itemElement.querySelector('.discard-quantity-input');
                if (inputElement) inputElement.value = quantity;
            } else {
                itemElement.classList.remove('selected');
                const inputElement = itemElement.querySelector('.discard-quantity-input');
                if (inputElement) inputElement.value = 0;
            }
        }
    }


    /**
     * Processes the discard action for selected products.
     * @private
     */
    _discardSelectedProducts() {
        if (this._selectedProductsToDiscard.size === 0) {
            alert(MESSAGES.SELECT_DISCARD_ITEM);
            return;
        }

        const confirmation = confirm(MESSAGES.CONFIRM_DISCARD);
        if (confirmation) {
            this._selectedProductsToDiscard.forEach((powerOptionSelections, modelId) => {
                powerOptionSelections.forEach((selection, detailId) => {
                    if (selection.quantity > 0) {
                        ProductService.decreaseStock(selection.variantId, selection.quantity);
                    }
                });
            });
            this._selectedProductsToDiscard.clear();
            // Refresh products and go back to brand selection after discarding
            this.setProducts(ProductService.getProducts()); // Re-fetch all products
            this.closeModal(); // Call the public closeModal method
            alert(MESSAGES.DISCARD_SUCCESS);
        }
    }

    /**
     * Filters products by selected brand.
     * @param {string} brand - The brand name to filter by.
     * @private
     */
    _filterByBrand(brand) {
        console.log('[_filterByBrand] Filtering by brand:', brand);
        this._currentFilterBrand = brand;
        this._currentFilterProduct = null;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._render();
    }

    /**
     * Resets filter to show all brands.
     * @private
     */
    _showAllBrands() {
        console.log('[_showAllBrands] Showing all brands.');
        this._currentFilterBrand = null;
        this._currentFilterProduct = null;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._render();
    }

    /**
     * Handles click on a product selection item in View 2.
     * @param {Event} e - The click event.
     * @private
     */
    _handleProductSelectionClick(e) {
        const brand = e.currentTarget.dataset.brand;
        const model = e.currentTarget.dataset.model;
        console.log('[_handleProductSelectionClick] Clicked brand:', brand, 'model:', model);
        this._filterByBrandAndModel(brand, model);
    }

    /**
     * Filters by specific product brand and model to show its power options.
     * Sets _currentFilterProduct to the first product matching brand and model.
     * @param {string} brand - The brand of the product.
     * @param {string} model - The model of the product.
     * @private
     */
    _filterByBrandAndModel(brand, model) {
        console.log('[_filterByBrandAndModel] Searching for product with brand:', brand, 'model:', model);
        const productsMatchingModel = this._products.filter(p => p.brand === brand && p.model === model);
        
        if (productsMatchingModel.length > 0) {
            const consolidatedPowerOptionsMap = new Map();

            productsMatchingModel.forEach(p => {
                p.powerOptions.forEach(option => {
                    const key = option.detailId; // This is now S-C-AX
                    if (!consolidatedPowerOptionsMap.has(key)) {
                        consolidatedPowerOptionsMap.set(key, { 
                            ...option, 
                            variantId: p.id, // Store the original Firestore ID of this specific variant
                        });
                    } else {
                        const existing = consolidatedPowerOptionsMap.get(key);
                        existing.quantity += option.quantity;
                        // For simplicity, keep the variantId of the first variant encountered for this power option
                        // If multiple variants have same S,C,AX with different Firestore IDs,
                        // this approach uses the variantId from the first one. This is a design choice.
                    }
                });
            });

            this._currentFilterProduct = {
                id: `${brand}-${model}`, // A unique ID for the model group, used as top-level key for _selectedProductsToDiscard
                brand: brand,
                model: model,
                powerOptions: Array.from(consolidatedPowerOptionsMap.values())
            };
            
            console.log('[_filterByBrandAndModel] Found product for model (consolidated):', this._currentFilterProduct);
        } else {
            this._currentFilterProduct = null;
            console.warn('[_filterByBrandAndModel] Product not found for brand:', brand, 'model:', model);
        }
        this._sortBy = 's'; // Default sort by 's' when viewing power options
        this._sortOrder = 'asc';
        this._render();
    }

    /**
     * Resets filter to show all products for the current brand.
     * @private
     */
    _showAllProductsForBrand() {
        console.log('[_showAllProductsForBrand] Showing all products for brand:', this._currentFilterBrand);
        this._currentFilterProduct = null;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._render();
    }

    /**
     * Sorts product power options.
     * @param {Array<Object>} powerOptions - The list of power options to sort.
     * @returns {Array<Object>} Sorted power options.
     * @private
     */
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

    /**
     * Handles sorting when a sortable column header is clicked.
     * @param {string} sortBy - The key to sort by ('s', 'c', 'ax').
     * @private
     */
    _handleSort(sortBy) {
        console.log('[_handleSort] Sorting by:', sortBy, 'Order:', this._sortOrder);
        if (this._sortBy === sortBy) {
            this._sortOrder = (this._sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            this._sortBy = sortBy;
            this._sortOrder = 'asc';
        }
        this._render();
    }

    /**
     * Helper for brand button click event.
     * @param {Event} e - The click event.
     * @private
     */
    _handleBrandButtonClick(e) {
        this._filterByBrand(e.currentTarget.dataset.brand);
    }

    /**
     * Helper for sort column header click event.
     * @param {Event} e - The click event.
     * @private
     */
    _handleSortClick(e) {
        this._handleSort(e.currentTarget.dataset.sortBy);
    }

    /**
     * Helper for discard quantity input change event.
     * @param {Event} e - The input or change event.
     * @private
     */
    _handleDiscardQuantityInputChange(e) {
        const modelId = e.target.dataset.modelId; // The model group ID
        const detailId = e.target.dataset.detailId;
        const variantId = parseInt(e.target.dataset.variantId, 10); // Get actual variant ID from dataset
        const quantity = e.target.value;
        this._handleDiscardQuantityChange(modelId, detailId, variantId, quantity);
    }

    /**
     * Helper for back button click event.
     * @param {Event} e - The click event.
     * @private
     */
    _goBackToPreviousView(e) {
        if (e.currentTarget.classList.contains('back-to-brands-btn')) {
            this._showAllBrands();
        } else if (e.currentTarget.classList.contains('back-to-products-btn')) {
            this._showAllProductsForBrand();
        }
    }


    /**
     * Renders the brand selection view.
     * @returns {string} HTML for the brand selection view.
     * @private
     */
    _renderBrandSelectionView() {
        const uniqueBrands = [...new Set(this._products.map(p => p.brand))];
        console.log('[_renderBrandSelectionView] Unique brands:', uniqueBrands);
        if (uniqueBrands.length === 0) return `<p class="message">${MESSAGES.NO_BRANDS_REGISTERED}</p>`;
        
        return `
            <div class="brand-buttons-grid">
                ${uniqueBrands.map(brand => `
                    <button class="brand-filter-button" data-brand="${brand}">${brand}</button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Renders the product selection view for a specific brand.
     * @returns {string} HTML for the product selection view.
     * @private
     */
    _renderProductSelectionView() {
        const productsForBrand = this._products.filter(p => p.brand === this._currentFilterBrand);
        console.log('[_renderProductSelectionView] Products for brand:', productsForBrand);
        if (productsForBrand.length === 0) return `<p class="message">${MESSAGES.NO_PRODUCTS_FOR_BRAND(this._currentFilterBrand)}</p>`;

        // Group products by model and calculate total quantity
        const groupedProductsMap = productsForBrand.reduce((acc, product) => {
            const key = `${product.brand}-${product.model}`; // Group by brand and model
            if (!acc.has(key)) {
                acc.set(key, {
                    brand: product.brand,
                    model: product.model,
                    // firstProductId is no longer needed here, but keeping it for now if any other logic relies on it
                    // The _handleProductSelectionClick will now use brand and model directly.
                    firstProductId: product.id, 
                    totalQuantity: 0,
                });
            }
            const groupedItem = acc.get(key);
            groupedItem.totalQuantity += product.powerOptions.reduce((sum, opt) => sum + opt.quantity, 0);
            return acc;
        }, new Map());

        const productsToRender = Array.from(groupedProductsMap.values());
        console.log('[_renderProductSelectionView] Products to render (grouped):', productsToRender);
        
        return `
            <button class="back-button back-to-brands-btn">← 전체 브랜드 보기</button>
            <div class="product-selection-list">
                ${productsToRender.map(groupedProduct => `
                    <div class="product-selection-list-item" data-brand="${groupedProduct.brand}" data-model="${groupedProduct.model}">
                        <div class="product-info-main">
                            <span class="brand-model">${groupedProduct.brand} - ${groupedProduct.model}</span>
                            <span class="quantity-display">총 수량: ${groupedProduct.totalQuantity}</span>
                        </div>
                        <!-- Detailed power options are intentionally not displayed here as per user request -->
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Renders the power option selection view for a specific product.
     * @returns {string} HTML for the power option selection view.
     * @private
     */
    _renderPowerOptionSelectionView() {
        const product = this._currentFilterProduct;
        console.log('[_renderPowerOptionSelectionView] Product for power options:', product);
        if (!product) return `<p class="message">제품을 선택해주세요.</p>`;

        if (product.powerOptions.length === 0) return `<p class="message">${MESSAGES.NO_POWER_OPTIONS_FOR_PRODUCT(product.brand, product.model)}</p>`;
        
        const sortedPowerOptions = this._sortPowerOptions(product.powerOptions);
        console.log('[_renderPowerOptionSelectionView] Sorted power options:', sortedPowerOptions);

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
                        <th>폐기 수량</th>
                    </tr>
                </thead>
                <div class="power-option-table-body-scroll">
                    <tbody>
                        ${sortedPowerOptions.map(option => {
                            const modelId = this._currentFilterProduct.id; // The ID of the model group
                            const currentSelectedQty = this._selectedProductsToDiscard.get(modelId)?.get(option.detailId)?.quantity || 0;
                            return `
                                <tr class="power-option-table-row ${currentSelectedQty > 0 ? 'selected' : ''}" 
                                    data-model-id="${modelId}" data-detail-id="${option.detailId}" data-variant-id="${option.variantId}">
                                    <td>${(option.s !== null && option.s !== undefined) ? (option.s > 0 ? '+' : '') + option.s.toFixed(2) : 'N/A'}</td>
                                    <td>${(option.c !== null && option.c !== undefined) ? (option.c > 0 ? '+' : '') + option.c.toFixed(2) : 'N/A'}</td>
                                    <td>${option.ax !== null ? option.ax : 'N/A'}</td>
                                    <td>${option.quantity}</td>
                                    <td>
                                        <input type="number" min="0" max="${option.quantity}" value="${currentSelectedQty}"
                                               data-model-id="${modelId}" data-detail-id="${option.detailId}" data-variant-id="${option.variantId}" class="discard-quantity-input">
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </div>
            </table>
        `;
    }

    /**
     * Renders the component's HTML based on the current view state.
     * @private
     */
    _render() {
        let contentHtml = '';
        let modalTitle = '재고 폐기';

        if (!this._currentFilterBrand) { // View 1: Brand Selection
            contentHtml = this._renderBrandSelectionView();
            modalTitle += ' - 브랜드 선택';
            console.log('[_render] Rendering Brand Selection View');
        } else if (!this._currentFilterProduct) { // View 2: Product Selection for a specific brand
            contentHtml = this._renderProductSelectionView();
            modalTitle = `재고 폐기 - ${this._currentFilterBrand} 제품 선택`;
            console.log('[_render] Rendering Product Selection View for brand:', this._currentFilterBrand);
        } else { // View 3: Power Option Selection for a specific product
            contentHtml = this._renderPowerOptionSelectionView();
            modalTitle = `재고 폐기 - ${this._currentFilterProduct.brand} - ${this._currentFilterProduct.model} 도수 선택`;
            console.log('[_render] Rendering Power Option Selection View for product:', this._currentFilterProduct.model);
        }

        this.shadowRoot.innerHTML = `
            <style>${DISCARD_MODAL_STYLES}</style>
            <div class="discard-container">
                <h3>${modalTitle}</h3>
                ${contentHtml}
                <div class="modal-actions">
                    <button id="discard-confirm-btn">선택 제품 폐기</button>
                </div>
            </div>
        `;
        this._attachEventListeners();
        this._updateDiscardButtonState();
    }

    /**
     * Attaches event listeners based on the current view.
     * @private
     */
    _attachEventListeners() {
        const discardConfirmBtn = this.shadowRoot.getElementById('discard-confirm-btn');
        if (discardConfirmBtn) {
            discardConfirmBtn.removeEventListener('click', this._discardSelectedProducts); // Remove old listener
            discardConfirmBtn.addEventListener('click', this._discardSelectedProducts);
        }

        // Remove previous listeners to prevent duplicates before re-attaching
        const previousBrandButtons = this.shadowRoot.querySelectorAll('.brand-filter-button');
        previousBrandButtons.forEach(btn => btn.removeEventListener('click', this._handleBrandButtonClick));

        const previousProductItems = this.shadowRoot.querySelectorAll('.product-selection-list-item');
        previousProductItems.forEach(item => item.removeEventListener('click', this._handleProductSelectionClick)); // Use bound method

        const previousPowerQuantityInputs = this.shadowRoot.querySelectorAll('.discard-quantity-input');
        previousPowerQuantityInputs.forEach(input => {
            input.removeEventListener('change', this._handleDiscardQuantityInputChange);
            input.removeEventListener('input', this._handleDiscardQuantityInputChange);
        });

        const previousSortHeaders = this.shadowRoot.querySelectorAll('.power-option-table th[data-sort-by]');
        previousSortHeaders.forEach(header => header.removeEventListener('click', this._handleSortClick));

        const previousBackButtons = this.shadowRoot.querySelectorAll('.back-button');
        previousBackButtons.forEach(btn => btn.removeEventListener('click', this._goBackToPreviousView));


        // Attach new listeners based on current view
        if (!this._currentFilterBrand) { // View 1: Brand Selection
            this.shadowRoot.querySelectorAll('.brand-filter-button').forEach(button => {
                button.addEventListener('click', this._handleBrandButtonClick);
            });
        } else if (!this._currentFilterProduct) { // View 2: Product Selection
            this.shadowRoot.querySelector('.back-button.back-to-brands-btn')?.addEventListener('click', this._goBackToPreviousView);
            this.shadowRoot.querySelectorAll('.product-selection-list-item').forEach(item => {
                item.addEventListener('click', this._handleProductSelectionClick); // Use bound method
            });
        } else { // View 3: Power Option Selection
            this.shadowRoot.querySelector('.back-button.back-to-products-btn')?.addEventListener('click', this._goBackToPreviousView);
            this.shadowRoot.querySelectorAll('.power-option-table-row').forEach(row => {
                row.addEventListener('click', (e) => {
                    // Prevent row click from affecting input
                    if (e.target.classList.contains('discard-quantity-input')) {
                        return;
                    }
                    const modelId = row.dataset.modelId;
                    const detailId = row.dataset.detailId;
                    const variantId = parseInt(row.dataset.variantId, 10);
                    const inputElement = row.querySelector('.discard-quantity-input');
                    this._togglePowerOptionSelection(modelId, detailId, variantId, inputElement);
                });
            });
            this.shadowRoot.querySelectorAll('.discard-quantity-input').forEach(input => {
                input.addEventListener('change', this._handleDiscardQuantityInputChange);
                input.addEventListener('input', this._handleDiscardQuantityInputChange);
            });
            this.shadowRoot.querySelectorAll('.power-option-table th[data-sort-by]').forEach(header => {
                header.addEventListener('click', this._handleSortClick);
            });
        }
    }

    /**
     * Toggles the selection state of a power option for discarding.
     * @param {string} modelId - The ID of the model group (brand-model).
     * @param {string} detailId - The unique key for the power option (S-C-AX).
     * @param {number} variantId - The actual Firestore ID of the variant being toggled.
     * @param {HTMLInputElement} inputElement - The input element for quantity.
     * @private
     */
    _togglePowerOptionSelection(modelId, detailId, variantId, inputElement) {
        // Find original product variant by its Firestore ID to get its maximum available quantity.
        const originalVariant = this._products.find(p => p.id === variantId);
        const powerOptionFromOriginal = originalVariant?.powerOptions.find(opt => opt.detailId === detailId && opt.variantId === variantId);
        
        if (!originalVariant || !powerOptionFromOriginal) return;

        let modelSelections = this._selectedProductsToDiscard.get(modelId);
        if (!modelSelections) {
            modelSelections = new Map();
            this._selectedProductsToDiscard.set(modelId, modelSelections);
        }

        const currentSelection = modelSelections.get(detailId);
        const currentSelectedQty = currentSelection?.quantity || 0;
        
        if (currentSelectedQty > 0) {
            // Deselect
            modelSelections.delete(detailId);
            if (modelSelections.size === 0) this._selectedProductsToDiscard.delete(modelId);
            inputElement.closest('tr').classList.remove('selected');
            inputElement.value = 0;
        } else {
            // Select with default 1, or max if quantity is 0
            const quantityToSet = Math.min(1, powerOptionFromOriginal.quantity);
            if (quantityToSet > 0) {
                modelSelections.set(detailId, { quantity: quantityToSet, variantId: variantId });
                inputElement.closest('tr').classList.add('selected');
                inputElement.value = quantityToSet;
            } else {
                alert(MESSAGES.INVALID_QUANTITY(powerOptionFromOriginal.quantity));
            }
        }
        this._updateDiscardButtonState();
    }


    /**
     * Updates the disabled state of the discard confirmation button.
     * @private
     */
    _updateDiscardButtonState() {
        const discardButton = this.shadowRoot.getElementById('discard-confirm-btn');
        if (discardButton) {
            let totalDiscardQuantity = 0;
            this._selectedProductsToDiscard.forEach(modelSelections => {
                modelSelections.forEach(selection => totalDiscardQuantity += selection.quantity);
            });
            discardButton.disabled = totalDiscardQuantity === 0;
        }
    }
}

customElements.define('discard-inventory-modal', DiscardInventoryModal);