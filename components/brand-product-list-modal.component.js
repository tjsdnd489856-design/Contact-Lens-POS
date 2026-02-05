import { ProductService } from '../services/product.service.js';

export default class BrandProductListModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._selectedBrand = null;
        this._selectedLensType = null;
        this._selectedModel = null;
        this._currentView = 'brands'; // 'brands', 'lensTypes', 'models', 'details'
        this._sortBy = null; // 'powerS', 'powerC'
        this._sortDirection = 'asc'; // 'asc', 'desc'

        this._goBack = this._goBack.bind(this);
        this._goBackToView = this._goBackToView.bind(this);
        this._handleSortClick = this._handleSortClick.bind(this);
    }

    setBrand(brand) {
        if (brand === null) {
            this._selectedBrand = null;
            this._selectedLensType = null;
            this._selectedModel = null;
            this._currentView = 'brands';
        } else {
            this._selectedBrand = brand;
            this._selectedLensType = null;
            this._selectedModel = null;
            this._currentView = 'lensTypes'; // Start directly at lens types for a selected brand
        }
        // Reset sort state when brand changes
        this._sortBy = null;
        this._sortDirection = 'asc';
        this._render();
    }

    _getProductsData() {
        let products = ProductService.getProducts();
        // Filter by selected brand, lensType, model
        if (this._selectedBrand) {
            products = products.filter(p => p.brand === this._selectedBrand);
            if (this._selectedLensType && this._selectedLensType !== 'N/A') {
                products = products.filter(p => p.lensType === this._selectedLensType);
                if (this._selectedModel) {
                    products = products.filter(p => p.model === this._selectedModel);
                }
            }
        }
        return products;
    }

    _getUniqueBrands() {
        const products = ProductService.getProducts();
        const brands = new Set(products.map(p => p.brand));
        return Array.from(brands);
    }

    _getUniqueLensTypes() {
        // Filter products first by selected brand
        const products = this._getProductsData().filter(p => p.brand === this._selectedBrand);
        const lensTypes = new Set(products.map(p => p.lensType || 'N/A'));
        return Array.from(lensTypes);
    }

    _getUniqueModels() {
        // Filter products by selected brand and lensType
        const products = this._getProductsData().filter(p => p.brand === this._selectedBrand && (p.lensType === this._selectedLensType || this._selectedLensType === 'N/A'));
        const models = new Set(products.map(p => p.model));
        return Array.from(models);
    }

    _getDetailedProducts() {
        let products = this._getProductsData();
        
        // Apply sorting if active
        if (this._sortBy) {
            products.sort((a, b) => {
                let valA = a[this._sortBy];
                let valB = b[this._sortBy];

                // Handle 'N/A' or undefined values for sorting
                valA = (valA === null || valA === undefined || valA === 'N/A') ? (this._sortDirection === 'asc' ? -Infinity : Infinity) : valA;
                valB = (valB === null || valB === undefined || valB === 'N/A') ? (this._sortDirection === 'asc' ? -Infinity : Infinity) : valB;

                if (valA < valB) {
                    return this._sortDirection === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return this._sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return products;
    }

    _selectBrand(brand) {
        this._selectedBrand = brand;
        this._selectedLensType = null;
        this._selectedModel = null;
        this._currentView = 'lensTypes';
        this._sortBy = null; // Reset sort
        this._render();
    }

    _selectLensType(lensType) {
        this._selectedLensType = lensType;
        this._selectedModel = null;
        this._currentView = 'models';
        this._sortBy = null; // Reset sort
        this._render();
    }

    _selectModel(model) {
        this._selectedModel = model;
        this._currentView = 'details';
        this._sortBy = null; // Reset sort
        this._render();
    }

    _goBack() {
        if (this._currentView === 'details') {
            this._selectedModel = null;
            this._currentView = 'models';
        } else if (this._currentView === 'models') {
            this._selectedLensType = null;
            this._currentView = 'lensTypes';
        } else if (this._currentView === 'lensTypes') {
            this._selectedBrand = null;
            this._currentView = 'brands';
        }
        this._sortBy = null; // Reset sort
        this._render();
    }

    _goBackToView(view) {
        if (view === 'brands') {
            this._selectedBrand = null;
            this._selectedLensType = null;
            this._selectedModel = null;
            this._currentView = 'brands';
        } else if (view === 'lensTypes') {
            this._selectedLensType = null;
            this._selectedModel = null;
            this._currentView = 'lensTypes';
        } else if (view === 'models') {
            this._selectedModel = null;
            this._currentView = 'models';
        }
        this._sortBy = null; // Reset sort
        this._render();
    }

    _handleSortClick(sortBy) {
        if (this._sortBy === sortBy) {
            this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this._sortBy = sortBy;
            this._sortDirection = 'asc'; // Default to asc when changing sort column
        }
        this._render();
    }

    _renderBrands() {
        const brands = this._getUniqueBrands();
        if (brands.length === 0) {
            return '<p class="message">등록된 브랜드가 없습니다.</p>';
        }
        return `
            <ul class="selection-list">
                ${brands.map(brand => `
                    <li data-value="${brand}" class="list-item brand-item">${brand}</li>
                `).join('')}
            </ul>
        `;
    }

    _renderLensTypes() {
        const lensTypes = this._getUniqueLensTypes();
        if (lensTypes.length === 0) {
            return '<p class="message">해당 브랜드의 렌즈 유형이 없습니다.</p>';
        }
        return `
            <ul class="selection-list">
                ${lensTypes.map(lensType => `
                    <li data-value="${lensType}" class="list-item lensType-item">${lensType}</li>
                `).join('')}
            </ul>
        `;
    }

    _renderModels() {
        const models = this._getUniqueModels();
        if (models.length === 0) {
            return '<p class="message">해당 유형의 제품 모델이 없습니다.</p>';
        }
        return `
            <ul class="selection-list">
                ${models.map(model => `
                    <li data-value="${model}" class="list-item model-item">${model}</li>
                `).join('')}
            </ul>
        `;
    }

    _renderDetails() {
        const products = this._getDetailedProducts();
        if (products.length === 0) {
            return '<p class="message">선택된 제품의 세부 정보가 없습니다.</p>';
        }

        const getSortIndicator = (column) => {
            if (this._sortBy === column) {
                return this._sortDirection === 'asc' ? ' ▲' : ' ▼';
            }
            return '';
        };

        const tableBodyHtml = products.map(product => `
            <tr>
                <td>
                    S:${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}
                    C:${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}
                    ${product.powerAX !== null ? `AX:${product.powerAX}` : ''}
                </td>
                <td>${product.quantity}</td>
                <td>${product.expirationDate}</td>
            </tr>
        `).join('');

        return `
            <table class="details-table">
                <thead>
                    <tr>
                        <th class="sortable" data-sort-by="powerS">도수 S ${getSortIndicator('powerS')}</th>
                        <th class="sortable" data-sort-by="powerC">도수 C ${getSortIndicator('powerC')}</th>
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

    _render() {
        let contentHtml = '';
        let titleHtml = '';
        let showBackButton = false;

        if (this._currentView === 'brands') {
            titleHtml = `<h3>브랜드 선택</h3>`;
        } else if (this._currentView === 'lensTypes') {
            titleHtml = `
                <h3 class="breadcrumb">
                    <span class="breadcrumb-item clickable" data-view="brands">${this._selectedBrand}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item">유형 선택</span>
                </h3>`;
            showBackButton = true;
        } else if (this._currentView === 'models') {
            titleHtml = `
                <h3 class="breadcrumb">
                    <span class="breadcrumb-item clickable" data-view="brands">${this._selectedBrand}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="lensTypes">${this._selectedLensType}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item">모델 선택</span>
                </h3>`;
            showBackButton = true;
        } else if (this._currentView === 'details') {
            titleHtml = `
                <h3 class="breadcrumb">
                    <span class="breadcrumb-item clickable" data-view="brands">${this._selectedBrand}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="lensTypes">${this._selectedLensType}</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item clickable" data-view="models">${this._selectedModel}</span>
                </h3>`; // Removed "세부 정보" suffix
            showBackButton = true;
        }

        if (this._currentView === 'brands') {
            contentHtml = this._renderBrands();
        } else if (this._currentView === 'lensTypes') {
            contentHtml = this._renderLensTypes();
        } else if (this._currentView === 'models') {
            contentHtml = this._renderModels();
        } else if (this._currentView === 'details') {
            contentHtml = this._renderDetails();
        }

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
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
                    white-space: nowrap; /* Prevent text wrapping */
                    overflow: hidden;    /* Hide overflowed text */
                    text-overflow: ellipsis; /* Show ellipsis for overflowed text */
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
            </style>
            <div>
                ${showBackButton ? '<button class="back-button">뒤로가기</button>' : ''}
                ${titleHtml}
                ${contentHtml}
            </div>
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Attach event listeners for selection, breadcrumb and back button
        if (this._currentView === 'brands') {
            this.shadowRoot.querySelectorAll('.brand-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectBrand(e.target.dataset.value));
            });
        } else if (this._currentView === 'lensTypes') {
            this.shadowRoot.querySelectorAll('.lensType-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectLensType(e.target.dataset.value));
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

        if (showBackButton) {
            this.shadowRoot.querySelector('.back-button').addEventListener('click', this._goBack);
        }

        this.shadowRoot.querySelectorAll('.breadcrumb-item.clickable').forEach(item => {
            item.addEventListener('click', (e) => this._goBackToView(e.target.dataset.view));
        });
    }
}

customElements.define('brand-product-list-modal', BrandProductListModal);