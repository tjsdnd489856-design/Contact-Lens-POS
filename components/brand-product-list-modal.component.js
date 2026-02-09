import { ProductService } from '../services/product.service.js';

// --- Constants ---
const MESSAGES = {
    NO_BRANDS: '등록된 브랜드가 없습니다.',
    NO_LENS_TYPES: '해당 브랜드의 렌즈 유형이 없습니다.',
    NO_WEAR_TYPES: '해당 렌즈 유형의 착용 방식이 없습니다.',
    NO_MODELS: '해당 유형의 제품 모델이 없습니다.',
    NO_DETAILS: '선택된 제품의 세부 정보가 없습니다.',
};

const MODAL_STYLES = `
    h3 {
        margin-top: 0;
        color: #333;
        text-align: center;
    }
    .message {
        text-align: center;
        padding: 20px;
        color: #555;
    }
    .selection-list {
        list-style: none;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
    }
    .list-item {
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        padding: 8px;
        border-radius: 5px;
        cursor: pointer;
        text-align: center;
        transition: background-color 0.2s, border-color 0.2s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .list-item:hover {
        background-color: #e0e0e0;
    }
    .back-button {
        background-color: #6c757d;
        color: white;
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-bottom: 15px;
        display: block;
        width: fit-content;
    }
    .back-button:hover {
        background-color: #5a6268;
    }
    .breadcrumb {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.1em;
        margin-bottom: 15px;
    }
    .breadcrumb-item {
        padding: 5px 8px;
        border-radius: 4px;
    }
    .breadcrumb-item.clickable {
        cursor: pointer;
        color: #007bff;
        font-weight: bold;
    }
    .breadcrumb-item.clickable:hover {
        background-color: #e9ecef;
    }
    .breadcrumb-separator {
        margin: 0 5px;
        color: #6c757d;
    }
    .details-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    .details-table th, .details-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    .details-table th {
        background-color: #f2f2f2;
    }
    .details-table tbody tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    .sortable {
        cursor: pointer;
    }
    .sortable:hover {
        background-color: #e0e0e0;
    }
`;

// --- BrandProductListModal Component ---
export default class BrandProductListModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._selectedBrand = null;
        this._selectedLensType = null;
        this._selectedWearType = null;
        this._selectedModel = null;
        this._currentView = 'brands'; // 'brands', 'lensTypes', 'wearTypes', 'models', 'details'
        this._sortBy = null; // 'powerS', 'powerC'
        this._sortDirection = 'asc'; // 'asc', 'desc'
    }

    connectedCallback() {
        this._render();
    }

    /**
     * Sets the brand filter and resets view to appropriate level.
     * @param {string|null} brand - The brand name to filter by, or null to reset all filters.
     */
    setBrand(brand) {
        if (brand === null || brand === '전체') {
            this._resetFilters();
            this._currentView = 'brands';
        } else {
            this._selectedBrand = brand;
            this._selectedLensType = null;
            this._selectedWearType = null;
            this._selectedModel = null;
            this._currentView = 'lensTypes';
        }
        this._resetSort();
        this._render();
    }

    /**
     * Resets all filter selections to their initial state.
     * @private
     */
    _resetFilters() {
        this._selectedBrand = null;
        this._selectedLensType = null;
        this._selectedWearType = null;
        this._selectedModel = null;
    }

    /**
     * Resets the sorting state.
     * @private
     */
    _resetSort() {
        this._sortBy = null;
        this._sortDirection = 'asc';
    }

    /**
     * Gets filtered products based on current selection state.
     * @returns {Array<Object>} Filtered product list.
     * @private
     */
    _getFilteredProducts() {
        let products = ProductService.getProducts();
        if (this._selectedBrand) {
            products = products.filter(p => p.brand === this._selectedBrand);
        }
        if (this._selectedLensType && this._selectedLensType !== 'N/A') {
            products = products.filter(p => p.lensType === this._selectedLensType);
        }
        if (this._selectedWearType && this._selectedWearType !== 'N/A') {
            products = products.filter(p => p.wearType === this._selectedWearType);
        }
        if (this._selectedModel) {
            products = products.filter(p => p.model === this._selectedModel);
        }

        // Apply sorting if active
        if (this._sortBy) {
            products.sort((a, b) => {
                let valA = a[this._sortBy];
                let valB = b[this._sortBy];

                // Handle 'N/A', null, undefined values for sorting
                valA = (valA === null || valA === undefined || valA === 'N/A') ? (this._sortDirection === 'asc' ? -Infinity : Infinity) : valA;
                valB = (valB === null || valB === undefined || valB === 'N/A') ? (this._sortDirection === 'asc' ? -Infinity : Infinity) : valB;

                if (valA < valB) return this._sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return this._sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return products;
    }

    /**
     * Gets unique values for a given key from a product list.
     * @param {Array<Object>} products - List of products.
     * @param {string} key - The property key to get unique values for.
     * @returns {Array<string>} Array of unique values.
     * @private
     */
    _getUniqueValues(products, key) {
        const values = new Set(products.map(p => p[key] || 'N/A'));
        return Array.from(values);
    }

    /**
     * Handles navigation: select brand.
     * @param {string} brand - The selected brand.
     * @private
     */
    _selectBrand(brand) {
        this._selectedBrand = brand;
        this._selectedLensType = null;
        this._selectedWearType = null;
        this._selectedModel = null;
        this._currentView = 'lensTypes';
        this._resetSort();
        this._render();
    }

    /**
     * Handles navigation: select lens type.
     * @param {string} lensType - The selected lens type.
     * @private
     */
    _selectLensType(lensType) {
        this._selectedLensType = lensType;
        this._selectedWearType = null;
        this._selectedModel = null;
        this._currentView = 'wearTypes';
        this._resetSort();
        this._render();
    }

    /**
     * Handles navigation: select wear type.
     * @param {string} wearType - The selected wear type.
     * @private
     */
    _selectWearType(wearType) {
        this._selectedWearType = wearType;
        this._selectedModel = null;
        this._currentView = 'models';
        this._resetSort();
        this._render();
    }

    /**
     * Handles navigation: select model.
     * @param {string} model - The selected model.
     * @private
     */
    _selectModel(model) {
        this._selectedModel = model;
        this._currentView = 'details';
        this._resetSort();
        this._render();
    }

    /**
     * Handles navigation: go back one step in the view hierarchy.
     * @private
     */
    _goBack() {
        if (this._currentView === 'details') {
            this._selectedModel = null;
            this._currentView = 'models';
        } else if (this._currentView === 'models') {
            this._selectedWearType = null;
            this._currentView = 'wearTypes';
        } else if (this._currentView === 'wearTypes') {
            this._selectedLensType = null;
            this._currentView = 'lensTypes';
        } else if (this._currentView === 'lensTypes') {
            this._selectedBrand = null;
            this._currentView = 'brands';
        }
        this._resetSort();
        this._render();
    }

    /**
     * Handles navigation: go back to a specific view in the hierarchy.
     * @param {string} view - The target view ('brands', 'lensTypes', 'wearTypes', 'models').
     * @private
     */
    _goBackToView(view) {
        if (view === 'brands') {
            this._resetFilters();
            this._currentView = 'brands';
        } else if (view === 'lensTypes') {
            this._selectedLensType = null;
            this._selectedWearType = null;
            this._selectedModel = null;
            this._currentView = 'lensTypes';
        } else if (view === 'wearTypes') {
            this._selectedWearType = null;
            this._selectedModel = null;
            this._currentView = 'wearTypes';
        } else if (view === 'models') {
            this._selectedModel = null;
            this._currentView = 'models';
        }
        this._resetSort();
        this._render();
    }

    /**
     * Handles sorting when a sortable column header is clicked.
     * @param {string} sortBy - The key to sort by.
     * @private
     */
    _handleSortClick(sortBy) {
        if (this._sortBy === sortBy) {
            this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this._sortBy = sortBy;
            this._sortDirection = 'asc';
        }
        this._render();
    }

    /**
     * Renders the breadcrumb and title section of the modal.
     * @returns {string} HTML string for the header.
     * @private
     */
    _renderHeader() {
        let titleHtml = '';
        if (this._currentView === 'brands') {
            titleHtml = `<h3>브랜드 선택</h3>`;
        } else if (this._currentView === 'lensTypes') {
            titleHtml = `
                <h3 class="breadcrumb">
                    <span class="breadcrumb-item clickable" data-view="brands">${this._selectedBrand}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item">유형 선택</span>
                </h3>`;
        } else if (this._currentView === 'wearTypes') {
            titleHtml = `
                <h3 class="breadcrumb">
                    <span class="breadcrumb-item clickable" data-view="brands">${this._selectedBrand}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="lensTypes">${this._selectedLensType}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item">착용 방식 선택</span>
                </h3>`;
        } else if (this._currentView === 'models') {
            titleHtml = `
                <h3 class="breadcrumb">
                    <span class="breadcrumb-item clickable" data-view="brands">${this._selectedBrand}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="lensTypes">${this._selectedLensType}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="wearTypes">${this._selectedWearType}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item">모델 선택</span>
                </h3>`;
        } else if (this._currentView === 'details') {
            titleHtml = `
                <h3 class="breadcrumb">
                    <span class="breadcrumb-item clickable" data-view="brands">${this._selectedBrand}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="lensTypes">${this._selectedLensType}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="wearTypes">${this._selectedWearType}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="models">${this._selectedModel}</span>
                </h3>`;
        }
        return titleHtml;
    }

    /**
     * Renders the main content area based on the current view.
     * @returns {string} HTML string for the content area.
     * @private
     */
    _renderContentView() {
        let contentHtml = '';
        let products = this._getFilteredProducts(); // Get filtered products for the current view

        if (this._currentView === 'brands') {
            const brands = this._getUniqueValues(products, 'brand');
            if (brands.length === 0) return `<p class="message">${MESSAGES.NO_BRANDS}</p>`;
            contentHtml = `
                <ul class="selection-list">
                    ${brands.map(brand => `
                        <li data-value="${brand}" class="list-item brand-item">${brand}</li>
                    `).join('')}
                </ul>
            `;
        } else if (this._currentView === 'lensTypes') {
            const lensTypes = this._getUniqueValues(products, 'lensType');
            if (lensTypes.length === 0) return `<p class="message">${MESSAGES.NO_LENS_TYPES}</p>`;
            contentHtml = `
                <ul class="selection-list">
                    ${lensTypes.map(lensType => `
                        <li data-value="${lensType}" class="list-item lensType-item">${lensType}</li>
                    `).join('')}
                </ul>
            `;
        } else if (this._currentView === 'wearTypes') {
            const wearTypes = this._getUniqueValues(products, 'wearType');
            if (wearTypes.length === 0) return `<p class="message">${MESSAGES.NO_WEAR_TYPES}</p>`;
            contentHtml = `
                <ul class="selection-list">
                    ${wearTypes.map(wearType => `
                        <li data-value="${wearType}" class="list-item wearType-item">${wearType}</li>
                    `).join('')}
                </ul>
            `;
        } else if (this._currentView === 'models') {
            const models = this._getUniqueValues(products, 'model');
            if (models.length === 0) return `<p class="message">${MESSAGES.NO_MODELS}</p>`;
            contentHtml = `
                <ul class="selection-list">
                    ${models.map(model => `
                        <li data-value="${model}" class="list-item model-item">${model}</li>
                    `).join('')}
                </ul>
            `;
        } else if (this._currentView === 'details') {
            if (products.length === 0) return `<p class="message">${MESSAGES.NO_DETAILS}</p>`;
            
            const getSortIndicator = (column) => {
                if (this._sortBy === column) {
                    return this._sortDirection === 'asc' ? ' ▲' : ' ▼';
                }
                return '';
            };

            const formatPower = (power) => {
                return (power !== null && power !== undefined) ? (power > 0 ? '+' : '') + power.toFixed(2) : 'N/A';
            }

            const tableBodyHtml = products.map(product => `
                <tr>
                    <td>${formatPower(product.powerS)}</td>
                    <td>${formatPower(product.powerC)}</td>
                    <td>${product.powerAX !== null ? product.powerAX : 'N/A'}</td>
                    <td>${product.quantity}</td>
                    <td>${product.expirationDate}</td>
                </tr>
            `).join('');

            contentHtml = `
                <table class="details-table">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort-by="powerS">S ${getSortIndicator('powerS')}</th>
                            <th class="sortable" data-sort-by="powerC">C ${getSortIndicator('powerC')}</th>
                            <th>AX</th>
                            <th>수량</th>
                            <th>유통기한</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableBodyHtml}
                    </tbody>
                </table>
            `;
        }
        return contentHtml;
    }

    /**
     * Renders the modal content based on the current state.
     * @private
     */
    _render() {
        const showBackButton = this._currentView !== 'brands';

        this.shadowRoot.innerHTML = `
            <style>${MODAL_STYLES}</style>
            <div>
                ${showBackButton ? '<button class="back-button">뒤로가기</button>' : ''}
                ${this._renderHeader()}
                ${this._renderContentView()}
            </div>
        `;

        // Attach event listeners for selection, breadcrumb and back button
        this._attachEventListeners();
    }

    /**
     * Attaches event listeners to dynamically rendered elements.
     * @private
     */
    _attachEventListeners() {
        // Selection list items
        if (this._currentView === 'brands') {
            this.shadowRoot.querySelectorAll('.brand-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectBrand(e.target.dataset.value));
            });
        } else if (this._currentView === 'lensTypes') {
            this.shadowRoot.querySelectorAll('.lensType-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectLensType(e.target.dataset.value));
            });
        } else if (this._currentView === 'wearTypes') {
            this.shadowRoot.querySelectorAll('.wearType-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectWearType(e.target.dataset.value));
            });
        } else if (this._currentView === 'models') {
            this.shadowRoot.querySelectorAll('.model-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectModel(e.target.dataset.value));
            });
        } else if (this._currentView === 'details') {
            this.shadowRoot.querySelectorAll('.details-table th.sortable').forEach(header => {
                header.addEventListener('click', (e) => this._handleSortClick(e.currentTarget.dataset.sortBy));
            });
        }

        // Back button
        const backButton = this.shadowRoot.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', this._goBack);
        }

        // Breadcrumb items
        this.shadowRoot.querySelectorAll('.breadcrumb-item.clickable').forEach(item => {
            item.addEventListener('click', (e) => this._goBackToView(e.target.dataset.view));
        });
    }
}

customElements.define('brand-product-list-modal', BrandProductListModal);